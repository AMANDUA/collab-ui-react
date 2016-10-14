(function () {
  'use strict';

  angular
    .module('Core')
    .service('DeviceUsageMockData', DeviceUsageMockData);

  /* @ngInject */
  function DeviceUsageMockData($log) {

    var cachedRawData;

    var maxCallsPrDay = 10;
    var maxPairedCallsPrDay = 5;
    var existingUniqueDeviceIds = createSetOfUniqueDeviceIds(100);

    var service = {
      getRawData: getRawData
    };
    return service;


    function secondsFromDays(days) {
      return days * 60 * 60;
    }

    function deviceDaySample(date, accountId, deviceCategory) {
      return {
        'callCount': _.random(1, maxCallsPrDay),
        'date': date,
        'accountId': accountId,
        'pairedCount': _.random(0, maxPairedCallsPrDay),
        'deviceCategory': deviceCategory,
        'totalDuration': secondsFromDays(_.random(1, 24))
      };
    }

    function createSamples(no, unit) {
      var now = moment();
      var start = moment(now).subtract(no, unit);
      var allSamples = assembleRawData(start, now);
      $log.warn("Created ", allSamples.length, " device usage mock samples.");
      $log.warn("start date:", start);
      $log.warn("end date:", now);
      return allSamples;
    }

    function getRawData(startDate, endDate) {
      if (_.isEmpty(cachedRawData)) {
        cachedRawData = createSamples(6, "months");
        $log.warn("cachedData", cachedRawData);
      }

      startDate = moment(startDate, "YYYYMMDD");
      endDate = moment(endDate, "YYYYMMDD");

      var rawDataWithinRange = _.filter(cachedRawData, function (sample) {
        var registeredDate = moment(sample.date, "YYYYMMDD");
        return ((registeredDate.isBefore(endDate) && registeredDate.isAfter(startDate)) || registeredDate.isSame(endDate) || registeredDate.isSame(startDate));
      });
      $log.warn("After range filtering", rawDataWithinRange);

      return _.cloneDeep(rawDataWithinRange);
    }

    function assembleRawData(startDate, endDate) {
      var data = [];
      var start = moment(startDate);
      var end = moment(endDate);
      while (start.isBefore(end)) {
        var time = start.format('YYYYMMDD');
        var noOfActiveDevicesToday = _.random(0, existingUniqueDeviceIds.length - 1);
        for (var i = 0; i < noOfActiveDevicesToday; i++) {
          var accountId = existingUniqueDeviceIds[i];
          data.push(deviceDaySample(time, accountId, "ce"));
          data.push(deviceDaySample(time, accountId, "darling"));
        }
        start.add(1, "days");
      }
      return data;
    }

    function createSetOfUniqueDeviceIds(noOfUniqueDevices) {
      var devices = [];
      _.times(noOfUniqueDevices, function (index) {
        devices.push("1111-" + index);
      });
      return devices;
    }
  }
}());
