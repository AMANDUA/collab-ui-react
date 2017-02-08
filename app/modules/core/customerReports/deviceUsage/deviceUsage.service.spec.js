'use strict';

describe('DeviceUsageService', function () {

  beforeEach(angular.mock.module('Core'));

  var DeviceUsageService;
  var $httpBackend;
  var now = moment('2016-10-27T00:00:00.000Z').toDate(); // Fri, Oct, 2016

  // TODO: Swap when production ready
  //var urlBase = 'https://atlas-integration.wbx2.com/admin/api/v1/organization';
  var urlBase = 'http://berserk.rd.cisco.com:8080/atlas-server/admin/api/v1/organization';

  var baseOrgUrl = urlBase + '/null/reports/device'; // orgid not relevant for test

  afterEach(function () {
    DeviceUsageService = undefined;
  });

  beforeEach(inject(function (_$httpBackend_, _DeviceUsageService_) {
    DeviceUsageService = _DeviceUsageService_;
    $httpBackend = _$httpBackend_;
    jasmine.clock().install();
    var baseTime = now;
    jasmine.clock().mockDate(baseTime);
  }));

  afterEach(function () {
    jasmine.clock().uninstall();
  });

  describe('get usage data', function () {

    var usageDataResponse;
    var availableDataResponse;

    beforeEach(function () {
      var usageDataResponseDay1 = [
        {
          "date": "2016-10-28T00:00:00.000Z",
          "accountId": "*",
          "category": "ce",
          "model": "SX20",
          "countryCode": "*",
          "callCount": 6,
          "callDuration": 2500
        },
        {
          "date": "2016-10-28T00:00:00.000Z",
          "accountId": "*",
          "category": "ce",
          "model": "MX700",
          "countryCode": "*",
          "callCount": 5,
          "callDuration": 1000
        }
      ];

      var usageDataResponseDay2 = [
        {
          "date": "2016-10-27T00:00:00.000Z",
          "accountId": "*",
          "category": "ce",
          "model": "SX20",
          "countryCode": "*",
          "callCount": 4,
          "callDuration": 500
        }, {
          "date": "2016-10-27T00:00:00.000Z",
          "accountId": "*",
          "category": "SparkBoard",
          "model": "SparkBoard 55",
          "countryCode": "*",
          "callCount": 2,
          "callDuration": 1000
        }
      ];

      //var usageDataResponseDay3 = undefined; // missing data

      var usageDataResponseDay4 = [
        {
          "date": "2016-10-25T00:00:00.000Z",
          "accountId": "*",
          "category": "ce",
          "model": "SX20",
          "countryCode": "*",
          "callCount": 2,
          "callDuration": 500
        },
        {
          "date": "2016-10-25T00:00:00.000Z",
          "accountId": "*",
          "category": "SparkBoard",
          "model": "SparkBoard 55",
          "countryCode": "*",
          // "callCount": 0, // missing callCount same as 0
          // "callDuration": 500  // missing callDuration same as 0
        }
      ];

      usageDataResponse = usageDataResponseDay4
        //.concat(usageDataResponseDay3) // missing
        .concat(usageDataResponseDay2)
        .concat(usageDataResponseDay1);


      availableDataResponse = [
        {
          "date": "2016-10-25T00:00:00.000Z",
          "available": true
        }, {
          "date": "2016-10-26T00:00:00.000Z",
          "available": false
        }, {
          "date": "2017-10-27T00:00:00.000Z",
          "available": true
        }, {
          "date": "2017-10-28T00:00:00.000Z",
          "available": true
        }
      ];

    });

    it('reduces data to calculated totals pr day', function () {

      var expectedResult = [{
        callCount: 2,
        totalDuration: 500,
        totalDurationY: '0.14',
        time: '2016-10-25'
      }, {
        callCount: 6,
        totalDuration: 1500,
        totalDurationY: '0.42',
        time: '2016-10-27'
      }, {
        callCount: 11,
        totalDuration: 3500,
        totalDurationY: '0.97',
        time: '2016-10-28'
      }];

      var result = DeviceUsageService.reduceAllData(usageDataResponse, 'day');
      expect(result).toEqual(expectedResult);
    });

    it('replaces missing days with data indicating zero use', function () {
      var usageRequest = baseOrgUrl + '/usage?interval=day&from=2010-10-25&to=2016-10-28&categories=cs,SparkBoard&models=__';
      $httpBackend
        .when('GET', usageRequest)
        .respond({ items: usageDataResponse });

      var availabilityRequest = baseOrgUrl + '/data_availability?interval=day&from=2010-10-25&to=2016-10-28';
      $httpBackend
        .when('GET', availabilityRequest)
        .respond({ items: availableDataResponse });

      var expectedResult = [{
        callCount: 2,
        totalDuration: 500,
        totalDurationY: '0.14',
        time: '2016-10-25'
      }, {
        callCount: 0,
        totalDuration: 0,
        totalDurationY: '0.00',
        time: '2016-10-26'
      }, {
        callCount: 6,
        totalDuration: 1500,
        totalDurationY: '0.42',
        time: '2016-10-27'
      }, {
        callCount: 11,
        totalDuration: 3500,
        totalDurationY: '0.97',
        time: '2016-10-28'
      }];

      var dataResponse;

      DeviceUsageService.getDataForRange("2010-10-25", "2016-10-28", 'day', ['cs', 'SparkBoard'], [], 'local').then(function (result) {
        dataResponse = result;
      });
      $httpBackend.flush();
      expect(dataResponse.reportItems).toEqual(expectedResult);
      expect(dataResponse.missingDays).toEqual({ missingDays: true, count: 1 });

    });
  });
});
