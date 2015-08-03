'use strict';

describe('Service: Partner Reports Service', function () {
  var $httpBackend, PartnerReportService, Config, Notification;
  var managedOrgsUrl, activeUsersDetailedUrl, mostActiveUsersUrl, mediaQualityUrl, callMetricsUrl, registeredEndpointsUrl;

  beforeEach(module('Core'));

  var dateFormat = "MMM DD, YYYY";
  var timeFilter = {
    value: 0
  };

  var customers = getJSONFixture('core/json/partnerReports/customerResponse.json');
  var activeUserDetailedData = getJSONFixture('core/json/partnerReports/activeUserDetailedResponse.json');
  var mostActiveUserData = getJSONFixture('core/json/partnerReports/mostActiveUserResponse.json');
  var customerData = {
    'organizations': getJSONFixture('core/json/partnerReports/customerResponse.json')
  };
  var mediaQualityGraphData = getJSONFixture('core/json/partnerReports/mediaQualityGraphData.json');
  var callMetricsData = getJSONFixture('core/json/partnerReports/callMetricsData.json');
  var registeredEndpointsData = getJSONFixture('core/json/partnerReports/registeredEndpointData.json');

  var error = {
    message: 'error'
  };
  var customer = {
    value: customers[0].customerOrgId,
    label: customers[0].customerName
  };
  var nullCustomer = {
    value: 0,
    label: ""
  };
  var customerDatapoint = {
    modifiedDate: "Apr 10, 2015",
    totalRegisteredUsers: 14,
    activeUsers: 14,
    percentage: 100
  };
  var customerPopulation = {
    customerName: 'Test Org One',
    customerId: 'a7cba512-7b62-4f0a-a869-725b413680e4',
    percentage: 99
  };
  var zeroPopulation = {
    customerName: 'Test Org One',
    customerId: 'a7cba512-7b62-4f0a-a869-725b413680e4',
    percentage: 0
  };
  var customerTableDataPoint = {
    details: {
      numCalls: '5',
      totalActivity: '14',
      userId: '4a0a7af3-5924-420d-9ec0-dcfccbe607cf',
      userName: 'havard.nigardsoy@vijugroup.com'
    },
    orgName: 'Test Org One',
    numCalls: 5,
    totalActivity: 14,
    userId: '4a0a7af3-5924-420d-9ec0-dcfccbe607cf',
    userName: 'havard.nigardsoy@vijugroup.com'
  };
  var posEndpointResponse = [{
    orgId: '6f631c7b-04e5-4dfe-b359-47d5fa9f4837',
    deviceRegistrationCountTrend: '4',
    yesterdaysDeviceRegistrationCount: '2',
    registeredDevicesTrend: '+5',
    yesterdaysRegisteredDevices: '2',
    maxRegisteredDevices: '3',
    minRegisteredDevices: '2',
    customer: 'Test Org One',
    direction: 'positive'
  }];
  var negEndpointResponse = [{
    orgId: '6f631c7b-04e5-4dfe-b359-47d5fa9f4837',
    deviceRegistrationCountTrend: '-4',
    yesterdaysDeviceRegistrationCount: '2',
    registeredDevicesTrend: '-5',
    yesterdaysRegisteredDevices: '2',
    maxRegisteredDevices: '3',
    minRegisteredDevices: '2',
    customer: 'Test Org One',
    direction: 'negative'
  }];
  var qualityResponse = {
    totalCount: 200,
    goodQualityCount: 194,
    fairQualityCount: 5,
    poorQualityCount: 1,
    date: '2015-07-30T00:00:00-05:00',
    modifiedDate: 'Jul 30, 2015'
  };

  var Authinfo = {
    getOrgId: jasmine.createSpy('getOrgId').and.returnValue('1')
  };

  beforeEach(module(function ($provide) {
    $provide.value("Authinfo", Authinfo);
  }));

  beforeEach(inject(function (_$httpBackend_, _PartnerReportService_, _Config_, _Notification_) {
    $httpBackend = _$httpBackend_;
    PartnerReportService = _PartnerReportService_;
    Config = _Config_;
    Notification = _Notification_;

    spyOn(Notification, 'notify');

    managedOrgsUrl = Config.getAdminServiceUrl() + 'organizations/' + Authinfo.getOrgId() + '/managedOrgs';

    var baseUrl = Config.getAdminServiceUrl() + 'organization/' + Authinfo.getOrgId() + '/reports/';
    activeUsersDetailedUrl = baseUrl + 'detailed/managedOrgs/activeUsers?&intervalCount=1&intervalType=week&spanCount=1&spanType=day&cache=true';
    mostActiveUsersUrl = baseUrl + 'topn/managedOrgs/activeUsers?&intervalCount=7&intervalType=day&spanCount=7&spanType=day&cache=true&orgId=';
    mediaQualityUrl = baseUrl + 'detailed/managedOrgs/callQuality?&intervalCount=1&intervalType=week&spanCount=1&spanType=day&cache=true&orgId=';
    callMetricsUrl = baseUrl + 'detailed/managedOrgs/callMetrics?&intervalCount=7&intervalType=day&spanCount=7&spanType=day&cache=true&orgId=';
    registeredEndpointsUrl = baseUrl + 'trend/managedOrgs/registeredEndpoints?&intervalCount=1&intervalType=week&spanCount=1&spanType=day&cache=true&orgId=';
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should exist', function () {
    expect(PartnerReportService).toBeDefined();
  });

  describe('Active User Services', function () {
    describe('should getOverallActiveUserData', function () {
      beforeEach(function () {
        $httpBackend.whenGET(activeUsersDetailedUrl).respond(activeUserDetailedData);
      });

      it('just the detailed data', function () {
        PartnerReportService.getOverallActiveUserData(timeFilter).then(function (response) {
          expect(response).toBe(undefined);
        });
        $httpBackend.flush();
      });
    });

    describe('should getActiveUserData', function () {
      beforeEach(function () {
        $httpBackend.whenGET(mostActiveUsersUrl + customers[0].customerOrgId).respond(mostActiveUserData);
        $httpBackend.whenGET(activeUsersDetailedUrl).respond(activeUserDetailedData);
      });

      it('for an existing customer', function () {
        PartnerReportService.getActiveUserData(customer, timeFilter).then(function (response) {
          expect(response.graphData[0].modifiedDate).toEqual(customerDatapoint.modifiedDate);
          expect(response.graphData[0].totalRegisteredUsers).toEqual(customerDatapoint.totalRegisteredUsers);
          expect(response.graphData[0].activeUsers).toEqual(customerDatapoint.activeUsers);
          expect(response.graphData[0].percentage).toEqual(customerDatapoint.percentage);

          expect(response.tableData[0]).toEqual(customerTableDataPoint);
          expect(response.populationGraph[0]).toEqual(customerPopulation);
          expect(response.overallPopulation).toEqual(99);
        });
        $httpBackend.flush();
      });
    });

    describe('should notify an error for getActiveUserData', function () {
      it('and return empty table data', function () {
        $httpBackend.whenGET(mostActiveUsersUrl + customers[0].customerOrgId).respond(500, error);
        $httpBackend.whenGET(activeUsersDetailedUrl).respond(activeUserDetailedData);

        PartnerReportService.getActiveUserData(customer, timeFilter).then(function (response) {
          expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');

          expect(response.graphData[0].modifiedDate).toEqual(customerDatapoint.modifiedDate);
          expect(response.graphData[0].totalRegisteredUsers).toEqual(customerDatapoint.totalRegisteredUsers);
          expect(response.graphData[0].activeUsers).toEqual(customerDatapoint.activeUsers);
          expect(response.graphData[0].percentage).toEqual(customerDatapoint.percentage);

          expect(response.tableData).toEqual([]);
          expect(response.populationGraph[0]).toEqual(customerPopulation);
          expect(response.overallPopulation).toEqual(99);
        });
        $httpBackend.flush();
      });

      it('and return empty graph data', function () {
        $httpBackend.whenGET(mostActiveUsersUrl + customers[0].customerOrgId).respond(mostActiveUserData);
        $httpBackend.whenGET(activeUsersDetailedUrl).respond(500, error);

        PartnerReportService.getActiveUserData(customer, timeFilter).then(function (response) {
          expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
          expect(response.graphData).toEqual([]);
          expect(response.tableData[0]).toEqual(customerTableDataPoint);
          expect(response.populationGraph[0]).toEqual(zeroPopulation);
          expect(response.overallPopulation).toEqual(0);
        });
        $httpBackend.flush();
      });

      it('and return empty graph and table data', function () {
        $httpBackend.whenGET(activeUsersDetailedUrl).respond(500, error);

        PartnerReportService.getActiveUserData(nullCustomer, timeFilter).then(function (response) {
          expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
          expect(response.graphData).toEqual([]);
          expect(response.tableData).toEqual([]);
          expect(response.populationGraph).toEqual([]);
          expect(response.overallPopulation).toEqual(0);
        });
        $httpBackend.flush();
      });
    });
  });

  describe('Helper Services', function () {
    it('getCustomerList should return a list of customers', function () {
      $httpBackend.whenGET(managedOrgsUrl).respond(customerData);
      PartnerReportService.getCustomerList().then(function (list) {
        expect(list).toEqual(customers);
      });
      $httpBackend.flush();
    });

    it('getCustomerList should flag an error when managedOrgs does not return data', function () {
      $httpBackend.whenGET(managedOrgsUrl).respond(500, error);
      PartnerReportService.getCustomerList().then(function (list) {
        expect(list).toEqual([]);
      });
      $httpBackend.flush();
    });

    it('getMostRecentUpdate should return the most recent update', function () {
      $httpBackend.whenGET(mostActiveUsersUrl + customers[0].customerOrgId).respond(mostActiveUserData);
      $httpBackend.whenGET(activeUsersDetailedUrl).respond(activeUserDetailedData);

      PartnerReportService.getActiveUserData(customer, timeFilter).then(function (response) {
        expect(PartnerReportService.getMostRecentUpdate()).toEqual(moment(mostActiveUserData.date).format(dateFormat));
      });
      $httpBackend.flush();
    });
  });

  describe('Media Quality Services', function () {
    it('should get MediaQuality Metrics', function () {
      $httpBackend.whenGET(mediaQualityUrl + customers[0].customerOrgId).respond(mediaQualityGraphData);
      PartnerReportService.getMediaQualityMetrics(customer, timeFilter).then(function (data) {
        expect(data[6].totalCount).toBe(qualityResponse.totalCount);
        expect(data[6].goodQualityCount).toEqual(qualityResponse.goodQualityCount);
        expect(data[6].fairQualityCount).toEqual(qualityResponse.fairQualityCount);
        expect(data[6].poorQualityCount).toEqual(qualityResponse.poorQualityCount);

        expect(data[0].totalCount).toBe(0);
        expect(data[0].goodQualityCount).toBe(0);
        expect(data[0].fairQualityCount).toBe(0);
        expect(data[0].poorQualityCount).toBe(0);
      });
      $httpBackend.flush();
    });

    it('should get empty array for GET failure', function () {
      $httpBackend.whenGET(mediaQualityUrl + customers[0].customerOrgId).respond(500, error);
      PartnerReportService.getMediaQualityMetrics(customer, timeFilter).then(function (data) {
        expect(data).toEqual([]);
      });
      $httpBackend.flush();
    });
  });

  describe('Call Metrics Services', function () {
    it('should get Call Metrics', function () {
      $httpBackend.whenGET(callMetricsUrl + customers[0].customerOrgId).respond(callMetricsData);
      PartnerReportService.getCallMetricsData(customer, timeFilter).then(function (data) {
        expect(data.dataProvider.length).toBe(2);
      });
      $httpBackend.flush();
    });

    it('should get empty array for GET failure', function () {
      $httpBackend.whenGET(callMetricsUrl + customers[0].customerOrgId).respond(500, error);
      PartnerReportService.getCallMetricsData(customer, timeFilter).then(function (data) {
        expect(data).toEqual([]);
      });
      $httpBackend.flush();
    });
  });

  describe('Registered Endpoint Service', function () {
    it('should get registered endpoints for a customer with positive response', function () {
      $httpBackend.whenGET(registeredEndpointsUrl + customers[0].customerOrgId).respond({
        data: [registeredEndpointsData.data[0]]
      });
      PartnerReportService.getRegisteredEndpoints(customer, timeFilter).then(function (response) {
        expect(response).toEqual(posEndpointResponse);
      });
      $httpBackend.flush();
    });

    it('should get registered endpoints for a customer with negative response', function () {
      $httpBackend.whenGET(registeredEndpointsUrl + customers[0].customerOrgId).respond({
        data: [registeredEndpointsData.data[1]]
      });
      PartnerReportService.getRegisteredEndpoints(customer, timeFilter).then(function (response) {
        expect(response).toEqual(negEndpointResponse);
      });
      $httpBackend.flush();
    });

    it('should return an empty array on error response', function () {
      $httpBackend.whenGET(registeredEndpointsUrl + customers[0].customerOrgId).respond(500);
      PartnerReportService.getRegisteredEndpoints(customer, timeFilter).then(function (response) {
        expect(response).toEqual([]);
      });
      $httpBackend.flush();
    });
  });
});
