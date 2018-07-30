import { IApplicationAdoptedUsers, IApplicationUsage, IApplicationUsageList, ICustomPolicy, IGlobalPolicy, IIntegrationsManagementService, IListOptions, IUserInfo, PolicyAction, PolicyType, UserQueryType } from './integrations-management.types';
import { Notification } from 'modules/core/notifications';

export class IntegrationsManagementService implements IIntegrationsManagementService {

  private readonly USER_CHUNK_SIZE = 40;

  /* @ngInject */
  constructor(
    private $http: ng.IHttpService,
    private $q: ng.IQService,
    private Authinfo,
    private Notification: Notification,
    private UrlConfig,
  ) { }

  public listIntegrations(options: IListOptions = {}): ng.IPromise<IApplicationUsage[]> {
    return this.$http.get<IApplicationUsageList>(this.applicationUsageUrl, {
      params: {
        orgId: this.orgId,
        ...options,
      },
    }).then(response => response.data.items);
  }

  public getIntegration(appId: string): ng.IPromise<IApplicationUsage> {
    return this.$http.get<IApplicationUsage>(this.applicationUsageUrl, {
      params: {
        appId: appId,
        orgId: this.orgId,
      },
    }).then(response => response.data);
  }

  public getGlobalAccessPolicy(): ng.IPromise<IGlobalPolicy | undefined> {
    return this.$http.get<IGlobalPolicy>(this.policiesUrl, {
      params: {
        orgId: this.orgId,
        type: PolicyType.DEFAULT,
      },
    }).then(response => response.data); // TODO(brspence): confirm behavior of API if not found
  }

  public createGlobalAccessPolicy(action: PolicyAction): ng.IPromise<void> {
    return this.$http.post<void>(this.policiesUrl, {
      action,
      orgId: this.orgId,
      type: PolicyType.DEFAULT,
    }).then(response => response.data);
  }

  public updateGlobalAccessPolicy(id: string, action: PolicyAction): ng.IPromise<void> {
    return this.$http.put<void>(`${this.policiesUrl}/${encodeURIComponent(id)}`, {
      action,
      orgId: this.orgId,
    }).then(response => response.data);
  }

  public getCustomPolicy(id: string): ng.IPromise<ICustomPolicy> {
    return this.$http.get<ICustomPolicy>(`${this.policiesUrl}/${encodeURIComponent(id)}`)
      .then(response => response.data);
  }

  public createCustomPolicy(appId: string, action: PolicyAction, userIds?: string[]): ng.IPromise<void> {
    return this.$http.post<void>(this.policiesUrl, {
      action,
      appId,
      orgId: this.orgId,
      personIds: userIds,
      type: PolicyType.CUSTOM,
    }).then(response => response.data);
  }

  public updateCustomPolicy(id: string, appId: string, action: PolicyAction, userIds?: string[]): ng.IPromise<void> {
    return this.$http.put<void>(`${this.policiesUrl}/${encodeURIComponent(id)}`, {
      action,
      appId,
      orgId: this.orgId,
      personIds: userIds,
      type: PolicyType.CUSTOM,
    }).then(response => response.data);
  }

  public deleteCustomPolicy(id: string): ng.IPromise<void> {
    return this.$http.delete<void>(`${this.policiesUrl}/${encodeURIComponent(id)}`) // TODO(brspence): confirm no payload needed
      .then(response => response.data);
  }

  public hasCustomPolicyByAction(_action: PolicyAction): ng.IPromise<boolean> {
    // TODO(brspence): confirm API to query - application/usage or policies
    throw new Error('Method not implemented.');
  }

  public revokeTokensForIntegration(clientId: string): ng.IPromise<void> {
    return this.$http.post<void>(this.revokeTokensUrl, {
      clientIds: [clientId],
    }).then(response => response.data);
  }

  public listAdoptedUsersForIntegration(clientId: string): ng.IPromise<string[]> {
    return this.$http.get<IApplicationAdoptedUsers>(this.getAdoptedUsersUrl(clientId))
      .then(response => response.data.emails);
  }

  private get orgId(): string {
    return this.Authinfo.getOrgId();
  }

  private get applicationUsageUrl(): string {
    return `${this.UrlConfig.getHydraServiceUrl()}/applications/usage`;
  }

  private get policiesUrl(): string {
    return `${this.UrlConfig.getHydraServiceUrl()}/policies`;
  }

  private get revokeTokensUrl() {
    return `${this.UrlConfig.getOAuth2Url()}${encodeURIComponent(this.orgId)}/actions/revokeTokens`;
  }

  private getAdoptedUsersUrl(clientId: string) {
    return `${this.UrlConfig.getOAuth2Url()}${encodeURIComponent(this.orgId)}/adoptedUsers/${encodeURIComponent(clientId)}`;
  }

  public getUsers(searchType: UserQueryType, uidOrEmail: string[] | string): ng.IPromise<IUserInfo[]> {
    let filter;
    if (_.isArray(uidOrEmail)) {
      filter = uidOrEmail.join(`" or ${searchType} eq "`);
    } else {
      filter = uidOrEmail;
    }
    filter = `${searchType} eq "${filter}"`;
    const url = this.UrlConfig.getScimUrl(this.Authinfo.getOrgId());
    return this.$http.get(url, {
      params: {
        attributes: 'userName,id',
        filter: filter,
      },
    },
    ).then((reply) => {
      const users = _.get(reply.data, 'Resources', []) as IUserInfo[];
      return _.map(users, user => {
        return {
          username: _.get(user, 'userName'),
          id: _.get(user, 'id'),
        } as IUserInfo;
      });
    });
  }

  public getUsersBulk(searchType: UserQueryType, emailsOrIdsArray: string[]): IPromise<IUserInfo[]> {
    let result: IUserInfo[] = [];
    let isErrorNotified = false;
    const emailsOrIdsChunked = _.chunk(emailsOrIdsArray, this.USER_CHUNK_SIZE);
    const getUsersInChunkPromiseArr = _.map(emailsOrIdsChunked, (emailsOrIdsChunk: string[]) => {
      return this.getUsers(searchType, emailsOrIdsChunk)
        .then((userInfos: IUserInfo[]) => {
          result = _.concat(result, userInfos);
        })
        .catch((error) => {
          if (!isErrorNotified) {
            //agendel: to avoid multiple error notifications in case of connection failure etc. - only display error once.
            isErrorNotified = true;
            //algendel todo: copy for user retrieval error.
            this.Notification.errorResponse(error, 'integrations.overview.userRetrievalError');
          }
        });
    });
    return this.$q.all(getUsersInChunkPromiseArr).then(() => {
      return result;
    });
  }

}
