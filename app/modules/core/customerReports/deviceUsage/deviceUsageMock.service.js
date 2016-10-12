(function () {
  'use strict';

  angular
    .module('Core')
    .service('DeviceUsageMockService', DeviceUsageMockService);

  /* @ngInject */
  function DeviceUsageMockService($q) {

    var cachedData;
    var deviceCategory = "ce";

    function deviceDaySample(time, accountId) {
      return {
        'callCount': _.random(1, 20),
        'date': time,
        'accountId': accountId,
        'pairedCount': _.random(0, 10),
        'deviceCategory': deviceCategory,
        'totalDuration': _.random(1, 24) * 60 * 60 // 1 to 24 hours returned in seconds
      };
    }

    var existingUniqueDeviceIds = createSetOfUniqueDeviceIds(1000);

    function getCachedData(startDate, endDate) {
      if (_.isEmpty(cachedData)) {
        return getData(startDate, endDate);
      } else {
        return $q.when(_.cloneDeep(cachedData));
      }
    }


    function getData(startDate, endDate) {
      var data = [];
      var start = moment(startDate);
      var end = moment(endDate);
      while (start.isBefore(end)) {
        var time = start.format('YYYYMMDD');
        var noOfActiveDevicesToday = _.random(0, existingUniqueDeviceIds.length - 1);
        for (var i = 0; i < noOfActiveDevicesToday; i++) {
          var accountId = existingUniqueDeviceIds[i];
          data.push(deviceDaySample(time, accountId));
        }
        start.add(1, "days");
      }
      cachedData = data;
      return $q.when(data);
    }

    function createSetOfUniqueDeviceIds(noOfUniqueDevices) {
      var devices = [];
      _.times(noOfUniqueDevices, function (index) {
        devices.push("1111-" + index);
      });
      return devices;
    }

    return {
      getData: getData,
      getCachedData: getCachedData
    };
  }
}());
