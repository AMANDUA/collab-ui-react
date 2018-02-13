import { IACWebexSiteinfoResponse, IACWebexSiteError } from './account-linking.interface';

export class LinkedSitesWebExService {

  private readonly webexSimUrl: string = 'http://localhost:3000';
  private readonly ciSiteLinkingPath: string = '/wbxadmin/api/v1/sites/thissite/cilinking';
  private readonly ciAccountSyncPath: string = '/wbxadmin/api/v1/sites/thissite/cilinking/userlinkingstatus';
  private readonly domainsPath: string = '/wbxadmin/api/v1/sites/thissite/useremaildomains';
  private readonly useSimulator: boolean = false; // NB do not check in as true

  // TODO Remove this whitelist when no longer needed
  private readonly dmzSites: string[] = [
    'sqsitedemo.webex.com',
    'sqe2e06.webex.com',
    'sqe2e07.webex.com',
    'sqe2e08.webex.com',
    'sqe2e09.webex.com',
    'sqe2e10.webex.com',
    'sqe2e11.webex.com',
    'sqe2e12.webex.com',
    'sqe2e13.webex.com',
    'sqe2e14.webex.com',
    'sqe2e15.webex.com',
    'sqe2e16.webex.com',
  ];

  /* @ngInject */
  constructor(private $log: ng.ILogService,
              private $http: ng.IHttpService,
              private $timeout: ng.ITimeoutService,
              private $q: ng.IQService,
              private WebExUtilsFact,
              private WebExXmlApiFact) {
  }

  public getTicket(siteUrl: string): ng.IPromise<any> {
    // TODO Add .dmz on site url
    this.$log.debug('getTicket', siteUrl);
    return this.WebExXmlApiFact.getSessionTicket(siteUrl, this.WebExUtilsFact.getSiteName(siteUrl))
      .catch((error) => {
        this.$log.debug('GetTicket failed:', error);
        throw error;
      });
  }

  public getCiSiteLinking(siteUrl: string): ng.IPromise<any> {
    return this.getTicket(siteUrl).then((ticket: string) => {
      let urlToUse = this.useSimulator ? this.webexSimUrl : this.getSiteApiUrl(siteUrl);
      urlToUse += this.ciSiteLinkingPath;
      this.$log.debug('WebeEx API url', urlToUse);
      return this.$http.get(urlToUse, {
        headers: { Authorization: 'Ticket ' + ticket },
      }).then((response) => {
        this.$log.debug('getCiSiteLinking', response);
        return response.data;
      }).catch ((error) => {
        this.$log.debug('getCiSiteLinking', error);
        throw error;
      });
    });
  }

  public setCiSiteLinking(siteUrl: string, mode: string): ng.IPromise<IACWebexSiteinfoResponse | IACWebexSiteError> {
    return this.getTicket(siteUrl).then((ticket: string) => {
      let urlToUse = this.useSimulator ? this.webexSimUrl : this.getSiteApiUrl(siteUrl);
      urlToUse += this.ciSiteLinkingPath;
      this.$log.debug('WebeEx API url', urlToUse);

      return this.$http.patch(urlToUse, {
        accountLinkingMode: mode,
      }, {
        headers: { Authorization: 'Ticket ' + ticket },
      }).then((response) => {
        this.$log.debug('setCiSiteLinking', response);
        return <IACWebexSiteinfoResponse> response.data;
      }, (error) => {
        this.$log.error('setCiSiteLinking error:', error);
        throw error;
      });
    });
  }

  public setLinkAllUsers(siteUrl: string, linkAllUsers: string): ng.IPromise<IACWebexSiteinfoResponse | IACWebexSiteError> {
    return this.getTicket(siteUrl).then((ticket: string) => {
      let urlToUse = this.useSimulator ? this.webexSimUrl : this.getSiteApiUrl(siteUrl);
      urlToUse += this.ciSiteLinkingPath;
      this.$log.debug('WebeEx API url', urlToUse);

      return this.$http.patch(urlToUse, {
        linkAllUsers: linkAllUsers,
      }, {
        headers: { Authorization: 'Ticket ' + ticket },
      }).then((response) => {
        this.$log.debug('setLinkAllUsers', response);
        return <IACWebexSiteinfoResponse> response.data;
      }, (error) => {
        this.$log.error('setLinkAllUsers error:', error);
        throw error;
      });
    });
  }

  public getCiAccountSync(siteUrl: string): ng.IPromise<any> {
    this.$log.debug('webex.service getCiAccountSync');
    return this.getTicket(siteUrl).then((ticket: string) => {
      this.$log.debug('webex.service ticket:', ticket);
      let urlToUse = this.useSimulator ? this.webexSimUrl : this.getSiteApiUrl(siteUrl);
      urlToUse += this.ciAccountSyncPath;
      return this.$http.get(urlToUse, {
        headers: { Authorization: 'Ticket ' + ticket },
      }).then((response) => {
        this.$log.debug('getCiAccountSync', response);
        return response.data;
      }).catch((error) => {
        this.$log.error('getCiAccountSync error:', error);
        throw error;
      });
    });
  }

  public getDomainsWithRetry(siteUrl: string): ng.IPromise<any> {
    const deferred = this.$q.defer();
    const self = this;
    function doQuery() {
      self.getDomains(siteUrl).then((data) => {
        if (data && !data.retry) {
          self.$log.debug('doQuery resolve', data);
          deferred.resolve(data);
        } else {
          self.$log.debug('doQuery retry');
          self.$timeout(() => {
            doQuery();
          }, 5000);
        }
      });
    }
    doQuery();
    return deferred.promise;
  }
  private getDomains(siteUrl: string): ng.IPromise<any> {
    return this.getTicket(siteUrl).then((ticket: string) => {
      let urlToUse = this.useSimulator ? this.webexSimUrl : this.getSiteApiUrl(siteUrl);
      urlToUse += this.domainsPath;
      this.$log.debug('WebeEx API url', urlToUse);
      return this.$http.get(urlToUse + '?limit=20', {
        headers: { Authorization: 'Ticket ' + ticket },
      }).then((response) => {
        this.$log.debug('LinkedSitesWebExService.getDomains', response);
        // Check if it is a 202 status, why is Retry-After header not present ?
        if (response.status === 202) {
          return { retry: true };
        } else {
          return response.data;
        }
      }).catch((error) => {
        this.$log.debug('getDomains error:', error);
        throw error;
      });
    });
  }

  // TODO Should only be used for webex sites in dmz
  private patchSiteForDevEnv(siteApiHost: string): string {
    if (_.includes(this.dmzSites, siteApiHost)) {
      this.$log.debug('siteApiHost', siteApiHost);
      const pos: number = siteApiHost.indexOf('.');
      return [siteApiHost.slice(0, pos), '.dmz', siteApiHost.slice(pos)].join('');
    } else {
      return siteApiHost;
    }
  }

  private getSiteApiUrl(siteUrl: string) {
    const apiHost: string = this.WebExUtilsFact.getSiteName(siteUrl) + '.webex.com';
    this.$log.debug('apiUrl', this.patchSiteForDevEnv(apiHost));
    // TODO: WebEx test sites are currently within a DMZ.
    //       We need to hack the "correct" address with a .dmz.
    //       To be removed when there are sites available outside the .dmz.
    //
    // return 'https://' + this.WebExUtilsFact.getSiteName(siteUrl) + '.webex.com';
    return 'https://' + this.patchSiteForDevEnv(apiHost);
  }
}
