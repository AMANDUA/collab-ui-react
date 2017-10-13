import { CsdmHubFactory, CsdmPollerFactory } from 'modules/squared/devices/services/CsdmPoller';
import { HybridServicesI18NService } from 'modules/hercules/services/hybrid-services-i18n.service';
import { HybridServiceId } from 'modules/hercules/hybrid-services.types';

export interface IStatusSummary {
  serviceId: HybridServiceId | null;
  activated: number;
  notActivated: number;
  error: number;
  total: number;
}

export interface IUserProps {
  userId: string;
  resourceGroups: {
    'cmc'?: string,
    'squared-fusion-cal'?: string,
    'squared-fusion-uc'?: string,
    'squared-fusion-ec'?: string,
    'spark-hybrid-impinterop'?: string,
  };
}

export interface IUserStatusWithExtendedMessages extends IUserStatus {
  messages: IMessageExtended[];
  hasWarnings?: boolean;
}

type UserStatus = 'activated' | 'notActivated' | 'error';

interface IUserStatus {
  connectorId?: string;
  clusterId?: string;
  entitled: boolean;
  lastStateChange: string;
  lastStatusUpdate: string;
  messages: IMessage[];
  orgId: string;
  resourceGroupId?: string;
  serviceId: HybridServiceId;
  state: UserStatus;
  userId: string;
}

export interface IMessage {
  description: string;
  key: string;
  replacementValues?: IReplacementValue[];
  severity: 'warning' | 'info' | 'error';
  title?: string;
}

interface IMessageExtended extends IMessage {
  iconClass: string;
}

interface IJournalEntry {
  time: string;
  entry: {
    type: string;
    payload: {
      orgId: string;
      userId: string;
      serviceId: HybridServiceId;
      state?: string;
      description?: string;
      descriptionKey?: string;
      lastStateChange?: string;
      lastStatusUpdate?: string;
      messages: IMessage[];
      resourceGroupId?: string;
      userType: string;
    },
    context: {
      userType: string;
      userId: string;
      trackingRoot: string;
    };
  };
}

interface IUSSOrg {
  id: string;
  sipDomain: string;
}

interface IUserStatusesResponse {
  userStatuses: IUserStatus[];
  paging: {
    count: number;
    limit?: number;
    next?: string;
    pages?: number;
  };
}

interface IUserJournalResponse {
  entries: IJournalEntry[];
  paging: {
    count: number;
    limit?: number;
    next?: string;
    pages?: number;
  };
}

interface IUserPropsSummary {
  userCountByResourceGroup: {
    numberOfUsers: number;
    resourceGroupId: string;
    validAsOf: string;
  }[];
}

// Will it always be the same as IAlarmReplacementValues in hybrid-services.types.ts?
interface IReplacementValue {
  key: string;
  value: string; // TODO: Could it really be a number if type === 'timestamp'?
  type?: string;
}

export class USSService {
  private cachedUserStatusSummary: IStatusSummary[] = [];
  private USSUrl = `${this.UrlConfig.getUssUrl()}uss/api/v1`;
  private hub = this.CsdmHubFactory.create();

  public subscribeStatusesSummary: Function;

  /* @ngInject */
  constructor(
    private $http: ng.IHttpService,
    private $translate: ng.translate.ITranslateService,
    private Authinfo,
    private CsdmHubFactory: CsdmHubFactory,
    private CsdmPoller: CsdmPollerFactory,
    private HybridServicesI18NService: HybridServicesI18NService,
    private UrlConfig,
  ) {
    this.extractAndTweakUserStatuses = this.extractAndTweakUserStatuses.bind(this);
    this.extractData = this.extractData.bind(this);
    this.extractJournalEntries = this.extractJournalEntries.bind(this);
    this.fetchStatusesSummary = this.fetchStatusesSummary.bind(this);
    this.hub.on = this.hub.on.bind(this);
    this.subscribeStatusesSummary = this.hub.on;

    this.CsdmPoller.create(this.fetchStatusesSummary, this.hub);
  }

  public decorateWithStatus(status: any): 'unknown' | 'not_entitled' | 'error' | 'pending_activation' | 'activated' {
    if (!status) {
      return 'unknown';
    }
    if (!status.entitled) {
      return 'not_entitled';
    }
    switch (status.state) {
      case 'error':
        return 'error';
      case 'deactivated':
      case 'notActivated':
        return 'pending_activation';
      case 'activated':
        return 'activated';
      default:
        return 'unknown';
    }
  }

  public extractSummaryForAService(servicesId: HybridServiceId[]): IStatusSummary[] {
    return _.filter(this.getStatusesSummary(), (summary) => {
      return _.includes(servicesId, summary.serviceId);
    });
  }

  public getAllStatuses(serviceId: HybridServiceId, state?: UserStatus): ng.IPromise<IUserStatusWithExtendedMessages[]> {
    return this.recursivelyReadStatuses(`${this.USSUrl}/orgs/${this.Authinfo.getOrgId()}/userStatuses?includeMessages=true&${this.statusesParameterRequestString(serviceId, state, 10000)}`)
      .then(this.extractAndTweakUserStatuses);
  }

  public getAllUserProps(orgId?: string): ng.IPromise<IUserProps[]> {
    return this.$http
      .get<IUserProps[]>(`${this.USSUrl}/orgs/${(orgId || this.Authinfo.getOrgId())}/userProps`)
      .then(this.extractUserProps);
  }

  public getOrg(orgId: string): ng.IPromise<IUSSOrg> {
    return this.$http
      .get<IUSSOrg>(`${this.USSUrl}/orgs/${orgId}`)
      .then(this.extractData);
  }

  public getStatusesForUser(userId: string, orgId?: string): ng.IPromise<IUserStatusWithExtendedMessages[]> {
    return this.$http
      .get<IUserStatusesResponse>(`${this.USSUrl}/orgs/${(orgId || this.Authinfo.getOrgId())}/userStatuses?includeMessages=true&entitled=true&userId=${userId}`)
      .then(this.extractAndTweakUserStatuses);
  }

  public getStatusesSummary(): IStatusSummary[] {
    return this.cachedUserStatusSummary;
  }

  public getUserJournal(userId: string, orgId?: string, limit?: number, serviceId?: HybridServiceId): ng.IPromise<IJournalEntry[]> {
    return this.$http
      .get<IUserJournalResponse>(`${this.USSUrl}/orgs/${(orgId || this.Authinfo.getOrgId())}/userJournal/${userId}${(limit ? `?limit=${limit}` : '')}${(serviceId ? `&serviceId=${serviceId}` : '')}`)
      .then(this.extractJournalEntries);
  }

  public getUserProps(userId: string, orgId?: string): ng.IPromise<IUserProps> {
    return this.$http
      .get<IUserProps>(`${this.USSUrl}/orgs/${(orgId || this.Authinfo.getOrgId())}/userProps/${userId}`)
      .then(this.extractData);
  }

  public getUserPropsSummary(orgId?: string): ng.IPromise<IUserPropsSummary> {
    return this.$http
      .get<IUserPropsSummary>(`${this.USSUrl}/orgs/${(orgId || this.Authinfo.getOrgId())}/userProps/summary`)
      .then(this.extractData);
  }

  public invalidateHybridUserCache = (): ng.IPromise<''> => {
    return this.$http.post<''>(`${this.USSUrl}/internals/actions/invalidateUser/invoke`, null)
      .then(this.extractData);
  }

  public refreshEntitlementsForUser(userId: string, orgId?: string): ng.IPromise<''> {
    return this.$http
      .post<''>(`${this.USSUrl}/userStatuses/actions/refreshEntitlementsForUser/invoke?orgId=${(orgId || this.Authinfo.getOrgId())}&userId=${userId}`, null)
      .then(this.extractData);
  }

  public removeAllUsersFromResourceGroup(resourceGroupId: string): ng.IPromise<''> {
    return this.$http
      .post<''>(`${this.USSUrl}/orgs/${this.Authinfo.getOrgId()}/actions/removeAllUsersFromResourceGroup/invoke?resourceGroupId=${resourceGroupId}`, null)
      .then(this.extractData);
  }

  public updateBulkUserProps(props: IUserProps[], orgId?: string): ng.IPromise<''> {
    return this.$http
      .post<''>(`${this.USSUrl}/orgs/${(orgId || this.Authinfo.getOrgId())}/userProps`, { userProps: props })
      .then(this.extractData);
  }

  public updateOrg(org: IUSSOrg): ng.IPromise<IUSSOrg> {
    return this.$http
      .patch<IUSSOrg>(`${this.USSUrl}/orgs/${org.id}`, org)
      .then(this.extractData);
  }

  public getStatusSeverity(status: string): -1 | 0 | 1 | 2 | 3 {
    switch (status) {
      case 'not_entitled':
        return 0;
      case 'activated':
        return 1;
      case 'pending_activation':
        return 2;
      case 'error':
        return 3;
      default:
        return -1;
    }
  }

  private convertToTranslateReplacements(messageReplacementValues: IReplacementValue[] | undefined): object {
    if (!messageReplacementValues) {
      return {};
    }
    return _.reduce(messageReplacementValues, (translateReplacements, replacementValue) => {
      translateReplacements[replacementValue.key] = replacementValue.type === 'timestamp' ? this.HybridServicesI18NService.getLocalTimestamp(replacementValue.value) : replacementValue.value;
      return translateReplacements;
    }, {});
  }

  private fetchStatusesSummary(): ng.IPromise<void> {
    return this.$http
      .get(`${this.USSUrl}/orgs/${this.Authinfo.getOrgId()}/userStatuses/summary`)
      .then((res) => {
        const summary: IStatusSummary[] = _.get(res, 'data.summary', []);
        // The server returns *nothing* for call and calendar
        // but we want to show that there are 0 users so let's populate
        // the data with defaults
        const emptySummary: IStatusSummary = {
          serviceId: null,
          activated: 0,
          notActivated: 0,
          error: 0,
          total: 0,
        };
        _.forEach(['squared-fusion-cal', 'squared-fusion-uc'] as HybridServiceId[], (serviceId) => {
          const found = _.find(summary, { serviceId: serviceId });
          if (!found) {
            const newSummary = _.cloneDeep(emptySummary);
            newSummary.serviceId = serviceId;
            summary.push(newSummary);
          }
        });
        this.cachedUserStatusSummary = summary;
      });
  }

  // From how this method is used, `any` should be `ng.IHttpResponse<any> | IUserStatus[]`
  private extractAndTweakUserStatuses(res: any): IUserStatusWithExtendedMessages[] {
    const userStatuses: IUserStatus[] = res.data ? res.data.userStatuses : res;
    const result = _.chain(userStatuses)
      .map((userStatus) => {
        userStatus.messages = this.sortAndTweakUserMessages(userStatus.messages);
        return userStatus;
      })
      .value();
    return result as IUserStatusWithExtendedMessages[];
  }

  private extractData<T>(res: ng.IHttpResponse<T>): T {
    return res.data;
  }

  private extractJournalEntries(res: ng.IHttpResponse<any>): IJournalEntry[] {
    const entries: IJournalEntry[] = res.data.entries || [];
    const result = _.chain(entries)
      .map((entry) => {
        if (entry.entry.payload) {
          entry.entry.payload.messages = this.sortAndTweakUserMessages(entry.entry.payload.messages);
        }
        return entry;
      })
      .value();
    return result;
  }

  private extractUserProps(res: ng.IHttpResponse<any>): IUserProps[] {
    return res.data.userProps;
  }

  private getMessageIconClass(severity: string): 'icon-error' | 'icon-warning' | 'icon-info' {
    switch (severity) {
      case 'error':
        return 'icon-error';
      case 'warning':
        return 'icon-warning';
      default:
        return 'icon-info';
    }
  }

  private getMessageSortOrder(severity: string): 0 | 1 | 2 {
    switch (severity) {
      case 'error':
        return 0;
      case 'warning':
        return 1;
      default:
        return 2;
    }
  }

  private recursivelyReadStatuses(statusesUrl: string): ng.IPromise<IUserStatus[]> {
    return this.$http
      .get<IUserStatusesResponse>(statusesUrl)
      .then(this.extractData)
      .then((response) => {
        if (response.paging && response.paging.next) {
          return this.recursivelyReadStatuses(response.paging.next)
            .then((statuses) => response.userStatuses.concat(statuses));
        } else {
          return response.userStatuses;
        }
      });
  }

  private sortAndTweakUserMessages(messages: IMessage[]): IMessageExtended[] {
    if (_.size(messages) > 0) {
      const result = _.chain(messages)
        .sortBy((message) => this.getMessageSortOrder(message.severity))
        .map((message) => {
          const translateReplacements = this.convertToTranslateReplacements(message.replacementValues);
          const extendedMessage: IMessageExtended = _.extend({}, message, {
            title: this.translateWithFallback(message.key + '.title', message.title || '', translateReplacements),
            description: this.translateWithFallback(message.key + '.description', message.description, translateReplacements),
            iconClass: this.getMessageIconClass(message.severity),
          });
          return extendedMessage;
        })
        .value();
      return result;
    }
    return [];
  }

  private statusesParameterRequestString(serviceId: HybridServiceId, status?: UserStatus, limit?: number): string {
    const statefilter = status ? `&state=${status}` : '';
    return `serviceId=${serviceId}${statefilter}&limit=${limit}&entitled=true`;
  }

  private translateWithFallback(messageKey: string, fallback: string, translateReplacements: object): string {
    const translationKey = `hercules.userStatusMessages.${messageKey}`;
    const translation = this.$translate.instant(translationKey, translateReplacements);
    return _.includes(translation, translationKey) ? fallback : translation;
  }
}

export default angular
  .module('hercules.uss', [
    require('modules/core/config/urlConfig'),
    require('modules/core/scripts/services/authinfo'),
    require('modules/hercules/services/hybrid-services-i18n.service').default,
    require('modules/squared/devices/services/CsdmPoller'),
  ])
  .service('USSService', USSService)
  .name;
