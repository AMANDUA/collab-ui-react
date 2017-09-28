'use strict';

describe('Controller:MediaReportsController', function () {
  beforeEach(angular.mock.module('Mediafusion'));

  var controller, $scope, httpMock, $stateParams, $q, $translate, $timeout, $interval, Log, Config, MediaClusterServiceV2, Notification, MeetingLocationAdoptionGraphService, ClientTypeAdoptionGraphService, UtilizationResourceGraphService, ParticipantDistributionResourceGraphService, MediaReportsService, MediaReportsDummyGraphService, AvailabilityResourceGraphService, CallVolumeResourceGraphService, MediaSneekPeekResourceService;

  var callVolumeData = getJSONFixture('mediafusion/json/metrics-graph-report/callVolumeData.json');
  var clusteravailabilityData = getJSONFixture('mediafusion/json/metrics-graph-report/availabilityResourceData.json');
  var callVolumeGraphData = getJSONFixture('mediafusion/json/metrics-graph-report/callVolumeGraphData.json');
  var utilizationGraphData = getJSONFixture('mediafusion/json/metrics-graph-report/UtilizationGraphData.json');
  var participantDistributionGraphData = getJSONFixture('mediafusion/json/metrics-graph-report/ParticipantDistributionGraphData.json');
  var clientTypeData = getJSONFixture('mediafusion/json/metrics-graph-report/clientTypeGraphData.json');
  var clientTypeCountData = getJSONFixture('mediafusion/json/metrics-graph-report/clientTypeCountData.json');
  var meetingLocationData = getJSONFixture('mediafusion/json/metrics-graph-report/meetingLocationGraphData.json');
  var participantChangedata = {
    data: {
      orgId: '11111111-2222-3333-a444-111111111bac',
      dataProvider: [{
        name: 'participant_change',
        value: 2,
      }],
    },
  };

  var timeOptions = [{
    value: 0,
    label: 'mediaFusion.metrics.last4Hours',
  }, {
    value: 1,
    label: 'mediaFusion.metrics.today',
  }, {
    value: 2,
    label: 'mediaFusion.metrics.week',
  }, {
    value: 3,
    label: 'mediaFusion.metrics.month',
  }, {
    value: 4,
    label: 'mediaFusion.metrics.threeMonths',
  }];

  var allClusters = 'mediaFusion.metrics.allclusters';

  beforeEach(inject(function ($rootScope, $controller, _$httpBackend_, _$stateParams_, _$timeout_, _$translate_, _MediaClusterServiceV2_, _$q_, _MeetingLocationAdoptionGraphService_, _ClientTypeAdoptionGraphService_, _UtilizationResourceGraphService_, _ParticipantDistributionResourceGraphService_, _Notification_, _MediaReportsDummyGraphService_, _MediaReportsService_, _$interval_, _Log_, _Config_, _AvailabilityResourceGraphService_, _CallVolumeResourceGraphService_, _MediaSneekPeekResourceService_) {
    $scope = $rootScope.$new();

    $stateParams = _$stateParams_;
    $timeout = _$timeout_;
    $translate = _$translate_;
    MediaClusterServiceV2 = _MediaClusterServiceV2_;
    $q = _$q_;
    httpMock = _$httpBackend_;
    Log = _Log_;
    Config = _Config_;

    MediaReportsDummyGraphService = _MediaReportsDummyGraphService_;
    Notification = _Notification_;
    UtilizationResourceGraphService = _UtilizationResourceGraphService_;
    ParticipantDistributionResourceGraphService = _ParticipantDistributionResourceGraphService_;
    MediaReportsService = _MediaReportsService_;
    AvailabilityResourceGraphService = _AvailabilityResourceGraphService_;
    CallVolumeResourceGraphService = _CallVolumeResourceGraphService_;
    MediaSneekPeekResourceService = _MediaSneekPeekResourceService_;
    ClientTypeAdoptionGraphService = _ClientTypeAdoptionGraphService_;
    MeetingLocationAdoptionGraphService = _MeetingLocationAdoptionGraphService_;
    $interval = _$interval_;
    Log = _Log_;
    Config = _Config_;

    spyOn(CallVolumeResourceGraphService, 'setCallVolumeGraph').and.returnValue({
      dataProvider: callVolumeData,
    });
    spyOn(AvailabilityResourceGraphService, 'setAvailabilityGraph').and.returnValue({
      dataProvider: clusteravailabilityData,
    });
    spyOn(UtilizationResourceGraphService, 'setUtilizationGraph').and.returnValue({
      dataProvider: utilizationGraphData,
    });
    spyOn(ParticipantDistributionResourceGraphService, 'setParticipantDistributionGraph').and.returnValue({
      dataProvider: participantDistributionGraphData,
    });
    spyOn(ClientTypeAdoptionGraphService, 'setClientTypeGraph').and.returnValue({
      dataProvider: clientTypeData,
    });
    httpMock.when('GET', /^\w+.*/).respond({});

    controller = $controller('MediaReportsController', {
      $scope: $scope,
      $stateParams: $stateParams,
      $timeout: $timeout,
      $translate: $translate,
      httpMock: httpMock,
      MediaClusterServiceV2: MediaClusterServiceV2,
      $q: $q,
      MediaReportsDummyGraphService: MediaReportsDummyGraphService,
      UtilizationResourceGraphService: UtilizationResourceGraphService,
      ParticipantDistributionResourceGraphService: ParticipantDistributionResourceGraphService,
      MediaReportsService: MediaReportsService,
      AvailabilityResourceGraphService: AvailabilityResourceGraphService,
      CallVolumeResourceGraphService: CallVolumeResourceGraphService,
      MediaSneekPeekResourceService: MediaSneekPeekResourceService,
      ClientTypeAdoptionGraphService: ClientTypeAdoptionGraphService,
      MeetingLocationAdoptionGraphService: MeetingLocationAdoptionGraphService,
      Notification: Notification,
      $interval: $interval,
      Log: Log,
      Config: Config,
      hasHmsTwoDotFiveFeatureToggle: false,
    });
  }));
  it('controller should be defined', function () {
    expect(controller).toBeDefined();
  });

  describe('Initializing Controller', function () {
    it('should be created successfully and all expected calls completed', function () {
      expect(controller).toBeDefined();
      spyOn(MediaReportsService, 'getCallVolumeData').and.returnValue($q.resolve(callVolumeGraphData));
      spyOn(MediaReportsService, 'getAvailabilityData').and.returnValue($q.resolve(clusteravailabilityData));
      spyOn(MediaReportsService, 'getUtilizationData').and.returnValue($q.resolve(utilizationGraphData));
      spyOn(MediaReportsService, 'getParticipantDistributionData').and.returnValue($q.resolve(participantDistributionGraphData));
      $timeout(function () {
        expect(MediaReportsService.getCallVolumeData).toHaveBeenCalledWith(timeOptions[0]);
        expect(MediaReportsService.getAvailabilityData).toHaveBeenCalledWith(timeOptions[0]);
        expect(MediaReportsService.getUtilizationData).toHaveBeenCalledWith(timeOptions[0]);
        expect(MediaReportsService.getParticipantDistributionData).toHaveBeenCalledWith(timeOptions[0]);

        expect(CallVolumeResourceGraphService.setCallVolumeGraph).toHaveBeenCalled();
        expect(AvailabilityResourceGraphService.setAvailabilityGraph).toHaveBeenCalled();
        expect(UtilizationResourceGraphService.setUtilizationGraph).toHaveBeenCalled();
        expect(ParticipantDistributionResourceGraphService.setParticipantDistributionGraph).toHaveBeenCalled();
      }, 30);
    });
  });

  describe('filter changes', function () {
    it('should set all page variables', function () {
      expect(controller.timeOptions).toEqual(timeOptions);
      expect(controller.timeSelected).toEqual(timeOptions[1]);
    });
    it('All graphs should update on cluster filter changes', function () {
      controller.clusterSelected = allClusters;
      spyOn(MediaReportsService, 'getCallVolumeData').and.returnValue($q.resolve(callVolumeGraphData));
      spyOn(MediaReportsService, 'getAvailabilityData').and.returnValue($q.resolve(clusteravailabilityData));
      spyOn(MediaReportsService, 'getUtilizationData').and.returnValue($q.resolve(utilizationGraphData));
      spyOn(MediaReportsService, 'getParticipantDistributionData').and.returnValue($q.resolve(participantDistributionGraphData));
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.clusterUpdate();
      httpMock.flush();
      expect(MediaReportsService.getCallVolumeData).toHaveBeenCalledWith(timeOptions[1], controller.clusterSelected);
      expect(MediaReportsService.getAvailabilityData).toHaveBeenCalledWith(timeOptions[1], controller.clusterSelected);
      expect(MediaReportsService.getUtilizationData).toHaveBeenCalledWith(timeOptions[1], controller.clusterSelected);
      expect(MediaReportsService.getParticipantDistributionData).toHaveBeenCalledWith(timeOptions[1], controller.clusterSelected);
      expect(MediaReportsService.getOverflowIndicator).toHaveBeenCalledWith(timeOptions[1], controller.clusterSelected);
    });
  });

  describe('isRefresh', function () {
    it('should return true when sent "refresh"', function () {
      expect(controller.isRefresh('refresh')).toBeTruthy();
    });
    it('should return false when sent "set" or "empty"', function () {
      expect(controller.isRefresh('set')).toBeFalsy();
      expect(controller.isRefresh('empty')).toBeFalsy();
    });
  });

  describe('isEmpty', function () {
    it('should return true when sent "empty"', function () {
      expect(controller.isEmpty('empty')).toBeTruthy();
    });
    it('should return false when sent "set" or "refresh"', function () {
      expect(controller.isEmpty('set')).toBeFalsy();
      expect(controller.isEmpty('refresh')).toBeFalsy();
    });
  });

  describe('loadResourceDatas when changeTabs called', function () {
    it('loadResourceDatas should call all services', function () {
      expect(controller).toBeDefined();
      spyOn(MediaReportsService, 'getTotalCallsData').and.callThrough();
      spyOn(MediaReportsService, 'getClusterAvailabilityData').and.callThrough();
      spyOn(MediaReportsService, 'getClusterAvailabilityTooltip').and.callThrough();
      spyOn(MediaReportsService, 'getUtilizationData').and.callThrough();
      spyOn(MediaReportsService, 'getParticipantDistributionData').and.callThrough();
      spyOn(MediaReportsService, 'getAvailabilityData').and.callThrough();
      spyOn(MediaReportsService, 'getCallVolumeData').and.callThrough();
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.changeTabs(false, true);
      httpMock.flush();
      expect(MediaReportsService.getTotalCallsData).toHaveBeenCalled();
      expect(MediaReportsService.getClusterAvailabilityData).toHaveBeenCalled();
      expect(MediaReportsService.getClusterAvailabilityTooltip).not.toHaveBeenCalled();
      expect(MediaReportsService.getUtilizationData).toHaveBeenCalled();
      expect(MediaReportsService.getParticipantDistributionData).toHaveBeenCalled();
      expect(MediaReportsService.getAvailabilityData).toHaveBeenCalled();
      expect(MediaReportsService.getCallVolumeData).toHaveBeenCalled();
      expect(MediaReportsService.getOverflowIndicator).toHaveBeenCalled();
      expect(controller.clusterUnavailablityFlag).toBeTruthy();
    });

    it('setTotalCallsData should invoke getTotalCallsData', function () {
      var response = {
        data: {
          callsOnPremise: 20,
          callsRedirect: 30,
        },
      };
      spyOn(MediaReportsService, 'getTotalCallsData').and.returnValue($q.resolve(response));
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.setTotalCallsData();
      httpMock.verifyNoOutstandingExpectation();
      expect(MediaReportsService.getTotalCallsData).toHaveBeenCalled();
      expect(MediaReportsService.getOverflowIndicator).toHaveBeenCalled();
      expect(controller.onprem).toBe(20);
      expect(controller.cloudOverflow).toBe(30);
      expect(controller.total).toBe(50);
      expect(controller.second_card_value).toBe('30');
      expect(controller.cardIndicator).toBe(controller.increasedBy + ' ' + '2');
      expect(controller.overflowPercentage).toBe(60);
    });

    it('setClientTypeCard should invoke getClienTypeCardData', function () {
      spyOn(MediaReportsService, 'getClientTypeCardData').and.returnValue($q.resolve(clientTypeCountData));
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.setClientTypeCard();
      httpMock.flush();
      expect(MediaReportsService.getClientTypeCardData).toHaveBeenCalled();
    });

    it('setTotalCallsPie should invoke getTotalCallsData', function () {
      var response = {
        data: {
          cloudCalls: 30,
          callsOverflow: 40,
          callsOnPremise: 20,
        },
      };
      spyOn(MediaReportsService, 'getTotalCallsData').and.returnValue($q.resolve(response));
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.setTotalCallsPie();
      httpMock.flush();
      expect(MediaReportsService.getTotalCallsData).toHaveBeenCalled();
      expect(MediaReportsService.getOverflowIndicator).toHaveBeenCalled();
      expect(controller.totalParticipantschartOptions.noData).toBeFalsy();
    });

    it('setMeetingLocationCard should invoke getMeetingLocationCardData', function () {
      spyOn(MediaReportsService, 'getMeetingLocationCardData').and.returnValue($q.resolve(meetingLocationData));
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.setMeetingLocationCard();
      httpMock.flush();
      expect(MediaReportsService.getMeetingLocationCardData).toHaveBeenCalled();
    });

    it('setClusterAvailability should set the clusterAvailability', function () {
      var response = {
        data: {
          availabilityPercent: 20,
        },
      };
      spyOn(MediaReportsService, 'getClusterAvailabilityData').and.returnValue($q.resolve(response));
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.setClusterAvailability();
      httpMock.flush();
      expect(MediaReportsService.getClusterAvailabilityData).toHaveBeenCalled();
      expect(controller.clusterAvailability).toBeDefined();
    });

    it('setSneekPeekData should call MediaReportsService and MediaSneekPeekResourceService', function () {
      spyOn(MediaReportsService, 'getClusterAvailabilityTooltip').and.callThrough();
      spyOn(MediaSneekPeekResourceService, 'getClusterAvailabilitySneekPeekValues').and.returnValue({
        values: ['dummyCluster'],
      });
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.setSneekPeekData();
      httpMock.flush();
      expect(MediaReportsService.getClusterAvailabilityTooltip).toHaveBeenCalled();
      expect(MediaSneekPeekResourceService.getClusterAvailabilitySneekPeekValues).toHaveBeenCalled();
    });

    it('should call dummysetUtilizationData for setUtilizationData when there is no data', function () {
      spyOn(MediaReportsService, 'getUtilizationData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyLineChartData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyUtilizationGraph').and.callThrough();
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.changeTabs(false, true);
      httpMock.flush();
      expect(MediaReportsService.getUtilizationData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyLineChartData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyUtilizationGraph).toHaveBeenCalled();
      expect(UtilizationResourceGraphService.setUtilizationGraph).toHaveBeenCalled();
    });

    it('should call dummysetParticipantDistribution for setDummyParticipantDistribution when there is no data', function () {
      spyOn(MediaReportsService, 'getParticipantDistributionData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyLineChartData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyParticipantDistributionGraph').and.callThrough();
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.changeTabs(false, true);
      httpMock.flush();
      expect(MediaReportsService.getParticipantDistributionData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyLineChartData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyParticipantDistributionGraph).toHaveBeenCalled();
      expect(ParticipantDistributionResourceGraphService.setParticipantDistributionGraph).toHaveBeenCalled();
    });

    xit('should call dummysetClientType for setDummyClientType when there is no data', function () {
      spyOn(MediaReportsService, 'getClientTypeData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyLineChartData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyClientTypeGraph').and.callThrough();
      controller.changeTabs(true, false);
      httpMock.flush();
      expect(MediaReportsService.getClientTypeData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyLineChartData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyClientTypeGraph).toHaveBeenCalled();
      expect(ClientTypeAdoptionGraphService.setClientTypeGraph).toHaveBeenCalled();
    });

    xit('should call dummysetDummyMeetingLocation for setDummyMeetingLocation when there is no data', function () {
      spyOn(MediaReportsService, 'getMeetingLocationData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyLineChartData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyMeetingLocationGraph').and.callThrough();
      controller.changeTabs(true, false);
      httpMock.flush();
      expect(MediaReportsService.getMeetingLocationData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyLineChartData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyMeetingLocationGraph).toHaveBeenCalled();
      expect(MeetingLocationAdoptionGraphService.setMeetingLocationGraph).toHaveBeenCalled();
    });

    it('it should call dummysetAvailabilityData for setAvailabilityData when response has no data', function () {
      spyOn(MediaReportsService, 'getAvailabilityData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyAvailabilityData').and.callThrough();
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.changeTabs(false, true);
      httpMock.flush();
      expect(MediaReportsService.getAvailabilityData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyAvailabilityData).toHaveBeenCalled();
      expect(AvailabilityResourceGraphService.setAvailabilityGraph).toHaveBeenCalled();
    });

    it('it should call dummysetCallVolumeData for setCallVolumeData when there is no data', function () {
      spyOn(MediaReportsService, 'getCallVolumeData').and.callThrough();
      spyOn(MediaReportsDummyGraphService, 'dummyCallVolumeData').and.callThrough();
      spyOn(MediaReportsService, 'getOverflowIndicator').and.returnValue($q.resolve(participantChangedata));
      controller.changeTabs(false, true);
      httpMock.flush();
      expect(MediaReportsService.getCallVolumeData).toHaveBeenCalled();
      expect(MediaReportsDummyGraphService.dummyCallVolumeData).toHaveBeenCalled();
      expect(CallVolumeResourceGraphService.setCallVolumeGraph).toHaveBeenCalled();
    });
  });
});
