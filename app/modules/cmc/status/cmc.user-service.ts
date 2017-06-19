import { ICmcUserStatusInfoResponse, ICmcUserStatus } from './../cmc.interface';
import * as moment from 'moment';

export class CmcUserService {

  /* @ngInject */
  constructor(
    private $log: ng.ILogService,
    private $q: ng.IQService,
    private Authinfo,
    private Config,
    private UrlConfig,
    private $http: ng.IHttpService,
    private $translate,
  ) {
  }

  public getUsersWithCmcButMissingAware(limit: number): ng.IPromise<ICmcUserStatusInfoResponse> {
    return this.$q.all([
      this.getUsersWithEntitlement(this.Config.entitlements.cmc, limit),
      this.getUsersWithEntitlement(this.Config.entitlements.fusion_uc, limit),
    ])
      .then((results: ICmcUserStatusInfoResponse[]) => {

        const cmcUsers: ICmcUserStatus[] = results[ 0 ].userStatuses;
        const awareUsers: ICmcUserStatus[] = results[ 1 ].userStatuses;

        _.each(cmcUsers, (cmcUser) => {
          if (cmcUser.lastStatusUpdate) {
            cmcUser.lastStatusUpdate = moment(cmcUser.lastStatusUpdate).format('LLLL (UTC)');
          }
          const hasAware = _.find(awareUsers, function(u) {
            return u.userId === cmcUser.userId;
          });

          if (hasAware) {
            cmcUser.state = '';
          } else  {
            cmcUser.state = this.$translate.instant('cmc.statusPage.callServiceAwareNotEntitled');
          }

        });
        this.$log.info('user list after checking call aware status :', cmcUsers);
        return results[ 0 ];
      });

  }

  public getUsersWithEntitlement(serviceId: String, limit: number): ng.IPromise<ICmcUserStatusInfoResponse> {
    const ussUrl: string = this.UrlConfig.getUssUrl() + 'uss/api/v1/orgs/' + this.Authinfo.getOrgId() + '/userStatuses?limit=' + limit + '&entitled=true&serviceId=' + serviceId;
    this.$log.info(serviceId);
    return this.$http.get(ussUrl).then((result) => {
      this.$log.info('USS result:', result);
      const response: ICmcUserStatusInfoResponse = <ICmcUserStatusInfoResponse>(result.data);
      return response;
    });
  }

  public insertUserDisplayNames(userData) {
    const ids = _.map(userData, 'userId');
    this.$log.info('ids:', ids);
    const urlBase: string = this.UrlConfig.getScimUrl(this.Authinfo.getOrgId());
    const url: string = urlBase + '?filter=id+eq+' + ids.join("+or+id+eq+");
    return this.$http.get(url).then( (result: any) => {
      _.each(result.data.Resources, (resolvedUser) => {
        const res: any = _.find(userData, { userId: resolvedUser.id });
        if (res) {
          res.displayName = resolvedUser.displayName;
          res.userName = resolvedUser.userName;
          const mobile: any = _.find(resolvedUser.phoneNumbers, { type: 'mobile' });
          if (mobile) {
            this.$log.warn("mobile", mobile);
            res.mobileNumber = mobile.value;
          }
        }
      });
      this.$log.info('userData:', userData);
      return userData;
    });
  }

}
