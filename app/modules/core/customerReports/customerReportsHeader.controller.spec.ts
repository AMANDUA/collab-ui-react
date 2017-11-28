describe('Controller: Customer Reports Ctrl', function () {
  let WebexReportService: any;

  let headerTabs: any = [{
    title: 'reportsPage.careTab',
    state: 'reports.care',
  }, {
    title: 'reportsPage.sparkReports',
    state: 'reports.spark',
  }, {
    title: 'reportsPage.webex',
    state: 'reports.webex',
  }, {
    title: 'mediaFusion.report.title',
    state: 'reports.media',
  }, {
    title: 'reportsPage.usageReports.usageReportTitle',
    state: 'reports.device-usage',
  }];

  const propackTabs: any = [{
    title: 'reportsPage.sparkReports',
    state: 'reports.sparkMetrics',
  }, {
    title: 'reportsPage.webexMetrics.title',
    state: 'reports.webex-metrics',
  }];

  afterAll(function () {
    headerTabs = undefined;
  });

  afterEach(function () {
    WebexReportService = undefined;
  });

  beforeEach(function () {
    this.initModules('Core', 'Huron', 'Sunlight', 'Mediafusion', 'WebExApp');
    this.injectDependencies('$controller',
                            '$scope',
                            '$state',
                            '$q',
                            'Authinfo',
                            'FeatureToggleService',
                            'ProPackService',
                            'WebexMetricsService',
                            'MediaServiceActivationV2');

    spyOn(this.$state, 'go');
    spyOn(this.Authinfo, 'isCare').and.returnValue(true);
    spyOn(this.Authinfo, 'getConferenceServicesWithoutSiteUrl').and.returnValue([{
      license: 'url',
    }]);

    WebexReportService = {
      initReportsObject: function () {},
    };

  });

  describe('when all featuretoggles return false and there are no webex sites', function () {
    beforeEach(function () {
      spyOn(this.FeatureToggleService, 'atlasMediaServiceMetricsMilestoneOneGetStatus').and.returnValue(this.$q.resolve(false));
      spyOn(this.FeatureToggleService, 'atlasMediaServiceMetricsMilestoneTwoGetStatus').and.returnValue(this.$q.resolve(false));
      spyOn(this.MediaServiceActivationV2, 'getMediaServiceState').and.returnValue(this.$q.resolve(false));
      spyOn(this.FeatureToggleService, 'webexMetricsGetStatus').and.returnValue(this.$q.resolve(false));
      spyOn(this.ProPackService, 'hasProPackEnabled').and.returnValue(this.$q.resolve(false));
      spyOn(this.WebexMetricsService, 'hasClassicEnabled').and.returnValue(this.$q.resolve([false]));
      spyOn(this.WebexMetricsService, 'checkWebexAccessiblity').and.returnValue(this.$q.resolve([true]));

      this.controller = this.$controller('CustomerReportsHeaderCtrl', {
        $q: this.$q,
        WebexReportService: WebexReportService,
        WebexMetricsService: this.WebexMetricsService,
        FeatureToggleService: this.FeatureToggleService,
        ProPackService: this.ProPackService,
      });

      this.$scope.$apply();
    });

    it('should only display spark and care reports tab', function () {
      expect(this.controller.headerTabs).toContain(headerTabs[0], headerTabs[1]);
      expect(this.controller.headerTabs).toContain(headerTabs[2], headerTabs[4]);
    });

  });

  describe('when all featuretoggles return true and there are webex sites', function () {
    beforeEach(function () {
      spyOn(this.FeatureToggleService, 'atlasMediaServiceMetricsMilestoneOneGetStatus').and.returnValue(this.$q.resolve(true));
      spyOn(this.FeatureToggleService, 'atlasMediaServiceMetricsMilestoneTwoGetStatus').and.returnValue(this.$q.resolve(true));
      spyOn(this.MediaServiceActivationV2, 'getMediaServiceState').and.returnValue(this.$q.resolve(true));
      spyOn(this.FeatureToggleService, 'webexMetricsGetStatus').and.returnValue(this.$q.resolve(true));
      spyOn(this.ProPackService, 'hasProPackEnabled').and.returnValue(this.$q.resolve(true));
      spyOn(this.WebexMetricsService, 'hasClassicEnabled').and.returnValue(this.$q.resolve([true]));
      spyOn(this.WebexMetricsService, 'checkWebexAccessiblity').and.returnValue(this.$q.resolve([true]));

      this.controller = this.$controller('CustomerReportsHeaderCtrl', {
        $q: this.$q,
        WebexReportService: WebexReportService,
        WebexMetricsService: this.WebexMetricsService,
        FeatureToggleService: this.FeatureToggleService,
        ProPackService: this.ProPackService,
      });

      this.$scope.$apply();
    });

    it('should display all reports tabs', function () {
      expect(this.controller.headerTabs).toContain(headerTabs[0]);
      expect(this.controller.headerTabs).toContain(headerTabs[3], headerTabs[4]);
      expect(this.controller.headerTabs).toContain(propackTabs[0], propackTabs[1]);
    });
  });
});
