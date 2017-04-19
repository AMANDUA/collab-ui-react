export interface IFmsOrgSettings {
  expresswayClusterReleaseChannel: string;
}

export class FmsOrgSettings {
  /* @ngInject */
  constructor(
    private $http: ng.IHttpService,
    private Authinfo,
    private UrlConfig,
  ) {}

  public get(orgId?: string): ng.IPromise<IFmsOrgSettings> {
    const url = `${this.UrlConfig.getHerculesUrlV2()}/organizations/${orgId || this.Authinfo.getOrgId()}/settings`;
    return this.$http.get<IFmsOrgSettings>(url)
      .then(this.extractDataFromResponse);
  }

  public set(data: IFmsOrgSettings, orgId?: string): ng.IPromise<IFmsOrgSettings> {
    const url = `${this.UrlConfig.getHerculesUrlV2()}/organizations/${orgId || this.Authinfo.getOrgId()}/settings`;
    return this.$http.patch(url, data)
      .then(this.extractDataFromResponse);
  }

  private extractDataFromResponse<T>(response: ng.IHttpPromiseCallbackArg<T>): T {
    return _.get<T>(response, 'data');
  }
}

export default angular
  .module('Hercules')
  .service('FmsOrgSettings', FmsOrgSettings)
  .name;
