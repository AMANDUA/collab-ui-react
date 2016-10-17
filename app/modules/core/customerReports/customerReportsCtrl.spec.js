'use strict';

describe('Controller: Customer Reports Ctrl', function () {
  var controller, $scope, WebexReportService, WebExApiGatewayService, Userservice;
  var activeUsersSort = ['userName', 'numCalls', 'sparkMessages', 'totalActivity'];

  var dummyData = getJSONFixture('core/json/partnerReports/dummyReportData.json');
  var activeData = getJSONFixture('core/json/customerReports/activeUser.json');
  var ctrlData = getJSONFixture('core/json/partnerReports/ctrl.json');
  var roomData = getJSONFixture('core/json/customerReports/roomData.json');
  var fileData = getJSONFixture('core/json/customerReports/fileData.json');
  var mediaData = getJSONFixture('core/json/customerReports/mediaQuality.json');
  var metricsData = getJSONFixture('core/json/customerReports/callMetrics.json');
  var devicesJson = getJSONFixture('core/json/customerReports/devices.json');

  var avgRoomsCard = _.cloneDeep(ctrlData.avgRoomsOptions);
  var filesSharedCard = _.cloneDeep(ctrlData.filesSharedOptions);
  avgRoomsCard.table = undefined;
  filesSharedCard.table = undefined;

  var mediaOptions = [{
    value: 0,
    label: 'reportsPage.allCalls'
  }, {
    value: 1,
    label: 'reportsPage.audioCalls'
  }, {
    value: 2,
    label: 'reportsPage.videoCalls'
  }];

  var headerTabs = [{
    title: 'mediaFusion.page_title',
    state: 'reports-metrics'
  }, {
    title: 'reportsPage.sparkReports',
    state: 'reports'
  }, {
    title: 'reportsPage.careTab',
    state: 'reports.care'
  }];
  var timeOptions = [{
    value: 0,
    label: 'reportsPage.week',
    description: 'reportsPage.week2'
  }, {
    value: 1,
    label: 'reportsPage.month',
    description: 'reportsPage.month2'
  }, {
    value: 2,
    label: 'reportsPage.threeMonths',
    description: 'reportsPage.threeMonths2'
  }];

  beforeEach(function () {
    this.initModules('Core', 'Huron', 'Sunlight', 'Mediafusion');
    this.injectDependencies('$rootScope',
                            '$state',
                            '$timeout',
                            '$q',
                            '$httpBackend',
                            '$controller',
                            'Authinfo',
                            'CustomerGraphService',
                            'CustomerReportService',
                            'DummyCustomerReportService',
                            'FeatureToggleService',
                            'MediaServiceActivationV2');
    $scope = this.$rootScope.$new();

    this.$httpBackend.whenGET('https://identity.webex.com/identity/scim/null/v1/Users/me').respond(200, {});
    spyOn(this.$state, 'go');
    spyOn(this.Authinfo, 'isCare').and.returnValue(true);

    spyOn(this.CustomerGraphService, 'setActiveUsersGraph').and.returnValue({
      'dataProvider': _.cloneDeep(dummyData.activeUser.one)
    });
    spyOn(this.CustomerGraphService, 'setAvgRoomsGraph').and.returnValue({
      'dataProvider': _.cloneDeep(roomData.response)
    });
    spyOn(this.CustomerGraphService, 'setFilesSharedGraph').and.returnValue({
      'dataProvider': _.cloneDeep(fileData.response)
    });
    spyOn(this.CustomerGraphService, 'setMediaQualityGraph').and.returnValue({
      'dataProvider': _.cloneDeep(mediaData.response)
    });
    spyOn(this.CustomerGraphService, 'setMetricsGraph').and.returnValue({
      'dataProvider': _.cloneDeep(metricsData.response.dataProvider)
    });
    spyOn(this.CustomerGraphService, 'setDeviceGraph').and.returnValue({
      'dataProvider': _.cloneDeep(devicesJson.response.graphData)
    });

    spyOn(this.CustomerReportService, 'getActiveUserData').and.returnValue(this.$q.when(_.cloneDeep(activeData.activeResponse)));
    spyOn(this.CustomerReportService, 'getMostActiveUserData').and.returnValue(this.$q.when({
      tableData: _.cloneDeep(activeData.mostActiveResponse),
      error: false
    }));
    spyOn(this.CustomerReportService, 'getAvgRoomData').and.returnValue(this.$q.when(_.cloneDeep(roomData.response)));
    spyOn(this.CustomerReportService, 'getFilesSharedData').and.returnValue(this.$q.when(_.cloneDeep(fileData.response)));
    spyOn(this.CustomerReportService, 'getMediaQualityData').and.returnValue(this.$q.when(_.cloneDeep(mediaData.response)));
    spyOn(this.CustomerReportService, 'getCallMetricsData').and.returnValue(this.$q.when(_.cloneDeep(metricsData.response)));
    spyOn(this.CustomerReportService, 'getDeviceData').and.returnValue(this.$q.when(_.cloneDeep(devicesJson.response)));

    var dummyMetrics = _.cloneDeep(metricsData.response);
    dummyMetrics.dummy = true;

    spyOn(this.DummyCustomerReportService, 'dummyActiveUserData').and.returnValue(dummyData.activeUser.one);
    spyOn(this.DummyCustomerReportService, 'dummyAvgRoomData').and.returnValue(dummyData.avgRooms.one);
    spyOn(this.DummyCustomerReportService, 'dummyFilesSharedData').and.returnValue(dummyData.filesShared.one);
    spyOn(this.DummyCustomerReportService, 'dummyMediaData').and.returnValue(dummyData.mediaQuality.one);
    spyOn(this.DummyCustomerReportService, 'dummyMetricsData').and.returnValue(dummyMetrics);
    spyOn(this.DummyCustomerReportService, 'dummyDeviceData').and.returnValue(_.cloneDeep(devicesJson.dummyData));

    spyOn(this.FeatureToggleService, 'atlasMediaServiceMetricsGetStatus').and.returnValue(this.$q.when(true));
    spyOn(this.FeatureToggleService, 'atlasCareTrialsGetStatus').and.returnValue(this.$q.when(true));
    spyOn(this.MediaServiceActivationV2, 'getMediaServiceState').and.returnValue(this.$q.resolve(true));

    // Webex Requirements
    WebexReportService = {
      initReportsObject: function () {}
    };

    WebExApiGatewayService = {
      siteFunctions: function (url) {
        var defer = this.$q.defer();
        defer.resolve({
          siteUrl: url
        });
        return defer.promise;
      }
    };

    Userservice = {
      getUser: function (user) {
        expect(user).toBe('me');
      }
    };

    controller = this.$controller('CustomerReportsCtrl', {
      $state: this.$state,
      $q: this.$q,
      CustomerReportService: this.CustomerReportService,
      DummyCustomerReportService: this.DummyCustomerReportService,
      CustomerGraphService: this.CustomerGraphService,
      WebexReportService: WebexReportService,
      WebExApiGatewayService: WebExApiGatewayService,
      Userservice: Userservice,
      FeatureToggleService: this.FeatureToggleService,
      MediaServiceActivationV2: this.MediaServiceActivationV2
    });

    $scope.$apply();
    this.$httpBackend.flush();
    this.$timeout.flush();
  });

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('Initializing Controller', function () {
    it('should be created successfully and all expected calls completed', function () {
      expect(this.DummyCustomerReportService.dummyActiveUserData).toHaveBeenCalledWith(timeOptions[0], false);
      expect(this.DummyCustomerReportService.dummyAvgRoomData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.DummyCustomerReportService.dummyFilesSharedData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.DummyCustomerReportService.dummyMediaData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.DummyCustomerReportService.dummyMetricsData).toHaveBeenCalled();
      expect(this.DummyCustomerReportService.dummyDeviceData).toHaveBeenCalledWith(timeOptions[0]);

      expect(this.CustomerReportService.getActiveUserData).toHaveBeenCalledWith(timeOptions[0], false);
      expect(this.CustomerReportService.getMostActiveUserData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.CustomerReportService.getAvgRoomData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.CustomerReportService.getFilesSharedData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.CustomerReportService.getMediaQualityData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.CustomerReportService.getCallMetricsData).toHaveBeenCalledWith(timeOptions[0]);
      expect(this.CustomerReportService.getDeviceData).toHaveBeenCalledWith(timeOptions[0]);

      expect(this.CustomerGraphService.setActiveUsersGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setAvgRoomsGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setFilesSharedGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setMediaQualityGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setMetricsGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setDeviceGraph).toHaveBeenCalled();
    });

    it('should set all page variables', function () {
      expect(controller.showWebexTab).toBeFalsy();

      expect(controller.pageTitle).toEqual('reportsPage.pageTitle');
      expect(controller.ALL).toEqual(ctrlData.ALL);
      expect(controller.ENGAGEMENT).toEqual(ctrlData.ENGAGEMENT);
      expect(controller.QUALITY).toEqual(ctrlData.QUALITY);
      expect(controller.displayEngagement).toBeTruthy();
      expect(controller.displayQuality).toBeTruthy();

      expect(controller.activeUserStatus).toEqual(ctrlData.SET);
      expect(controller.showMostActiveUsers).toBeFalsy();
      expect(controller.displayMostActive).toBeFalsy();
      expect(controller.mostActiveUsers).toEqual(_.cloneDeep(activeData.mostActiveResponse));
      expect(controller.searchField).toEqual('');
      expect(controller.activeUserReverse).toBeTruthy();
      expect(controller.activeUsersTotalPages).toEqual(0);
      expect(controller.activeUserCurrentPage).toEqual(1);
      expect(controller.activeUserPredicate).toEqual(activeUsersSort[3]);
      expect(controller.activeButton).toEqual([1, 2, 3]);

      expect(controller.metricStatus).toEqual(ctrlData.SET);
      expect(controller.metrics).toEqual(_.cloneDeep(metricsData.response.displayData));

      expect(controller.mediaQualityStatus).toEqual(ctrlData.SET);
      expect(controller.mediaOptions).toEqual(mediaOptions);
      expect(controller.mediaSelected).toEqual(mediaOptions[0]);

      expect(controller.deviceStatus).toEqual(ctrlData.SET);
      expect(controller.selectedDevice).toEqual(controller.deviceFilter[0]);
      _.forEach(_.cloneDeep(devicesJson.response.filterArray), function (filter) {
        expect(controller.deviceFilter).toContain(filter);
      });

      var reportFilter = _.cloneDeep(ctrlData.reportFilter);
      _.forEach(controller.filterArray, function (filter, index) {
        expect(filter.label).toEqual(reportFilter[index].label);
        expect(filter.id).toEqual(reportFilter[index].id);
        expect(filter.selected).toEqual(reportFilter[index].selected);
      });

      expect(controller.avgRoomOptions).toEqual(avgRoomsCard);
      expect(controller.filesSharedOptions).toEqual(filesSharedCard);

      expect(controller.headerTabs).toEqual(headerTabs);
      expect(controller.timeOptions).toEqual(timeOptions);
      expect(controller.timeSelected).toEqual(timeOptions[0]);
    });
  });

  describe('filter changes', function () {
    it('All graphs should update on time filter changes', function () {
      controller.timeSelected = timeOptions[1];
      controller.timeUpdate();
      expect(controller.timeSelected).toEqual(timeOptions[1]);

      expect(this.DummyCustomerReportService.dummyActiveUserData).toHaveBeenCalledWith(timeOptions[1], false);
      expect(this.DummyCustomerReportService.dummyAvgRoomData).toHaveBeenCalledWith(timeOptions[1]);
      expect(this.DummyCustomerReportService.dummyFilesSharedData).toHaveBeenCalledWith(timeOptions[1]);
      expect(this.DummyCustomerReportService.dummyMediaData).toHaveBeenCalledWith(timeOptions[1]);
      expect(this.DummyCustomerReportService.dummyMetricsData).toHaveBeenCalled();
      expect(this.DummyCustomerReportService.dummyDeviceData).toHaveBeenCalledWith(timeOptions[1]);

      expect(this.CustomerReportService.getActiveUserData).toHaveBeenCalledWith(timeOptions[1], false);
      expect(this.CustomerReportService.getAvgRoomData).toHaveBeenCalledWith(timeOptions[1]);
      expect(this.CustomerReportService.getFilesSharedData).toHaveBeenCalledWith(timeOptions[1]);
      expect(this.CustomerReportService.getMediaQualityData).toHaveBeenCalledWith(timeOptions[1]);
      expect(this.CustomerReportService.getCallMetricsData).toHaveBeenCalledWith(timeOptions[1]);
      expect(this.CustomerReportService.getDeviceData).toHaveBeenCalledWith(timeOptions[1]);

      expect(this.CustomerGraphService.setActiveUsersGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setAvgRoomsGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setFilesSharedGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setMediaQualityGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setMetricsGraph).toHaveBeenCalled();
      expect(this.CustomerGraphService.setDeviceGraph).toHaveBeenCalled();
    });

    it('should update the media graph on mediaUpdate', function () {
      controller.timeSelected = timeOptions[2];
      expect(this.CustomerGraphService.setMediaQualityGraph).toHaveBeenCalledTimes(2);
      controller.mediaUpdate();
      expect(this.CustomerGraphService.setMediaQualityGraph).toHaveBeenCalledTimes(3);
    });

    it('should update the registered device graph on deviceUpdated', function () {
      expect(this.CustomerGraphService.setDeviceGraph).toHaveBeenCalledTimes(2);
      controller.deviceUpdate();
      expect(this.CustomerGraphService.setDeviceGraph).toHaveBeenCalledTimes(3);
    });
  });

  describe('helper functions', function () {
    it('getDescription, getAltDescription, getAltHeader, and getHeader should return translated strings', function () {
      expect(controller.getDescription('text')).toEqual('text');
      expect(controller.getAltDescription('text')).toEqual('text');
      expect(controller.getHeader('text')).toEqual('text');
      expect(controller.getAltHeader('text')).toEqual('text');
    });

    it('goToUsersTab should send the customer to the users tab', function () {
      controller.goToUsersTab();
      expect(this.$state.go).toHaveBeenCalled();
    });

    it('resetCards should alter the visible filterArray[x].toggle based on filters', function () {
      controller.filterArray[1].toggle(ctrlData.ENGAGEMENT);
      expect(controller.displayEngagement).toBeTruthy();
      expect(controller.displayQuality).toBeFalsy();

      controller.filterArray[2].toggle(ctrlData.QUALITY);
      expect(controller.displayEngagement).toBeFalsy();
      expect(controller.displayQuality).toBeTruthy();

      controller.filterArray[0].toggle(ctrlData.ALL);
      expect(controller.displayEngagement).toBeTruthy();
      expect(controller.displayQuality).toBeTruthy();
    });

    it('searchMostActive should return a list of users based on mostActiveUsers and the searchField', function () {
      expect(controller.searchMostActive()).toEqual(_.cloneDeep(activeData.mostActiveResponse));
      controller.searchField = 'le';
      expect(controller.searchMostActive()).toEqual([_.cloneDeep(activeData.mostActiveResponse)[0], _.cloneDeep(activeData.mostActiveResponse)[11]]);
    });

    it('mostActiveUserSwitch should toggle the state for showMostActiveUsers', function () {
      expect(controller.showMostActiveUsers).toBeFalsy();
      controller.mostActiveUserSwitch();
      expect(controller.showMostActiveUsers).toBeTruthy();
      controller.mostActiveUserSwitch();
      expect(controller.showMostActiveUsers).toBeFalsy();
    });

    it('activePage should return true when called with the same value as activeUserCurrentPage', function () {
      controller.activeUserCurrentPage = 1;
      expect(controller.activePage(controller.activeUserCurrentPage)).toBeTruthy();
    });

    it('activePage should return false when called with a different value as activeUserCurrentPage', function () {
      expect(controller.activePage(7)).toBeFalsy();
    });

    it('changePage should change the value of activeUserCurrentPage', function () {
      controller.changePage(3);
      expect(controller.activeUserCurrentPage).toEqual(3);
    });

    it('isRefresh should return true when sent "refresh" and false for all other options', function () {
      expect(controller.isRefresh(ctrlData.REFRESH)).toBeTruthy();

      expect(controller.isRefresh(ctrlData.SET)).toBeFalsy();
      expect(controller.isRefresh(ctrlData.EMPTY)).toBeFalsy();
      expect(controller.isRefresh(ctrlData.ERROR)).toBeFalsy();
    });

    it('isEmpty should return true when sent "empty" and false for all other options', function () {
      expect(controller.isEmpty(ctrlData.EMPTY)).toBeTruthy();

      expect(controller.isEmpty(ctrlData.SET)).toBeFalsy();
      expect(controller.isEmpty(ctrlData.REFRESH)).toBeFalsy();
      expect(controller.isEmpty(ctrlData.ERROR)).toBeFalsy();
    });

    it('isError should return true when sent "error" and false for all other options', function () {
      expect(controller.isError(ctrlData.ERROR)).toBeTruthy();

      expect(controller.isError(ctrlData.SET)).toBeFalsy();
      expect(controller.isError(ctrlData.REFRESH)).toBeFalsy();
      expect(controller.isError(ctrlData.EMPTY)).toBeFalsy();
    });

    it('mostActiveSort should sort by userName', function () {
      controller.mostActiveSort(0);
      expect(controller.activeUserPredicate).toBe(activeUsersSort[0]);
      expect(controller.activeUserReverse).toBeFalsy();
    });

    it('mostActiveSort should sort by calls', function () {
      controller.mostActiveSort(1);
      expect(controller.activeUserPredicate).toBe(activeUsersSort[1]);
      expect(controller.activeUserReverse).toBeTruthy();
    });

    it('mostActiveSort should sort by posts', function () {
      controller.mostActiveSort(2);
      expect(controller.activeUserPredicate).toBe(activeUsersSort[2]);
      expect(controller.activeUserReverse).toBeTruthy();
    });

    it('pageForward should change carousel button numbers', function () {
      controller.activeUsersTotalPages = 4;
      controller.activeUserCurrentPage = 1;

      controller.pageForward();
      expect(controller.activeButton[0]).toBe(1);
      expect(controller.activeButton[1]).toBe(2);
      expect(controller.activeButton[2]).toBe(3);
      expect(controller.activeUserCurrentPage).toBe(2);

      controller.pageForward();
      expect(controller.activeButton[0]).toBe(2);
      expect(controller.activeButton[1]).toBe(3);
      expect(controller.activeButton[2]).toBe(4);
      expect(controller.activeUserCurrentPage).toBe(3);
    });

    it('pageBackward should change carousel button numbers', function () {
      controller.activeUsersTotalPages = 4;
      controller.activeButton[0] = 2;
      controller.activeButton[1] = 3;
      controller.activeButton[2] = 4;
      controller.activeUserCurrentPage = 3;

      controller.pageBackward();
      expect(controller.activeButton[0]).toBe(1);
      expect(controller.activeButton[1]).toBe(2);
      expect(controller.activeButton[2]).toBe(3);
      expect(controller.activeUserCurrentPage).toBe(2);

      controller.pageBackward();
      expect(controller.activeButton[0]).toBe(1);
      expect(controller.activeButton[1]).toBe(2);
      expect(controller.activeButton[2]).toBe(3);
      expect(controller.activeUserCurrentPage).toBe(1);
    });
  });

  describe('webex tests', function () {
    it('should show spark tab but not webex tab', function () {
      expect(controller.tab).not.toBeDefined();
    });

    it('should not have anything in the dropdown for webex reports', function () {
      expect(controller.webexOptions.length).toBe(0);
    });
  });
});
