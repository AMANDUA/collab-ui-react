import ILogService = angular.ILogService;
class CustomerReportsHeaderCtrl {
  /* @ngInject */
  constructor(
    private $q: ng.IQService,
    private Authinfo,
    private FeatureToggleService,
    private MediaServiceActivationV2,
    private WebExApiGatewayService,
    private ITProPackService,
  ) {
    if (Authinfo.isCare()) {
      this.headerTabs.push({
        title: 'reportsPage.careTab',
        state: 'reports.care',
      });
    }
    this.$q.all(this.promises).then((features: any): void => {
      if (features.isMfEnabled) {
        if (features.mf) {
          this.headerTabs.push({
            title: 'mediaFusion.report.title',
            state: 'reports.media',
          });
        } else if (features.mfMilestoneTwo) {
          this.headerTabs.push({
            title: 'mediaFusion.report.title',
            state: 'reports.mediaservice',
          });
        } else {
          this.headerTabs.push({
            title: 'mediaFusion.report.title',
            state: 'reports.metrics',
          });
        }
      }
      this.headerTabs.push({
        title: 'reportsPage.usageReports.usageReportTitle',
        state: 'reports.device-usage',
      });
      if (features.webexMetrics) {
        this.headerTabs.push({
          title: 'reportsPage.webexMetrics.title',
          state: 'reports.webex-metrics',
        });
      }
    });
    this.checkWebex();
  }

  public headerTabs = [{
    title: 'reportsPage.sparkReports',
    state: 'reports.spark',
  }];

  private webex: boolean = false;
  private promises: any = {
    mf: this.FeatureToggleService.atlasMediaServiceMetricsMilestoneOneGetStatus(),
    mfMilestoneTwo: this.FeatureToggleService.atlasMediaServiceMetricsMilestoneTwoGetStatus(),
    isMfEnabled: this.MediaServiceActivationV2.getMediaServiceState(),
    webexMetrics: this.ITProPackService.hasITProPackEnabled(),
  };

  private checkWebex (): void {
    let webexSiteUrls = this.getUniqueWebexSiteUrls(); // strip off any duplicate webexSiteUrl to prevent unnecessary XML API calls

    webexSiteUrls.forEach((url: string): void => {
      this.WebExApiGatewayService.siteFunctions(url).then((result: any): void => {
        if (result.isAdminReportEnabled && result.isIframeSupported) {
          if (!this.webex) {
            this.headerTabs.push({
              title: 'reportsPage.webex',
              state: 'reports.webex',
            });
            this.webex = true;
          }
        }
      }).catch(_.noop);
    });
  }

  private getUniqueWebexSiteUrls() {
    let conferenceServices: Array<any> = this.Authinfo.getConferenceServicesWithoutSiteUrl() || [];
    let webexSiteUrls: Array<any> = [];

    conferenceServices.forEach((conferenceService: any): void => {
      webexSiteUrls.push(conferenceService.license.siteUrl);
    });

    return webexSiteUrls.filter((value: any, index: number, self: any): boolean => {
      return self.indexOf(value) === index;
    });
  }
}

angular
  .module('Core')
  .controller('CustomerReportsHeaderCtrl', CustomerReportsHeaderCtrl);
