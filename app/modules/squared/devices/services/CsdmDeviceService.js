(function () {
  'use strict';

  /* @ngInject  */
  function CsdmDeviceService($http, $log, Authinfo, CsdmConfigService, CsdmCacheUpdater, CsdmConverter, CsdmCacheFactory) {
    var devicesUrl = CsdmConfigService.getUrl() + '/organization/' + Authinfo.getOrgId() + '/devices?checkOnline=true';

    var deviceCache = CsdmCacheFactory.create({
      remove: function (url) {
        return $http.delete(url);
      },
      update: function (url, obj) {
        return $http.patch(url, obj).then(function (res) {
          // return CsdmConverter.convertDevice(res.data);
          // todo: hackorama - API is fubar
          var device = _.clone(deviceCache.list()[url]);
          if (obj.description) {
            try {
              device.tags = JSON.parse(obj.description);
            } catch (e) {
              device.tags = [];
            }
          }
          if (obj.name) {
            device.displayName = obj.name;
          }
          return device;
        });
      },
      get: function (url) {
        return $http.get(url).then(function (res) {
          return CsdmConverter.convertDevice(res.data);
        });
      },
      fetch: function () {
        return $http.get(devicesUrl).then(function (res) {
          return CsdmConverter.convertDevices(res.data);
        });
      }
    });

    function getDeviceList() {
      return deviceCache.list();
    }

    function getDevice(deviceUrl) {
      return deviceCache.get(deviceUrl);
    }

    function updateDeviceName(deviceUrl, newName) {
      return deviceCache.update(deviceUrl, {
        name: newName
      });
    }

    function updateTags(url, tags) {
      deviceCache.list()[url].tags = tags; // update ui asap
      deviceCache.list()[url].tagString = tags.join(', '); // update ui asap
      return deviceCache.update(url, {
        description: JSON.stringify(tags || [])
      });
    }

    function deleteDevice(deviceUrl) {
      return deviceCache.remove(deviceUrl);
    }

    function notifyDevice(deviceUrl, message, callback) {
      return $http.post(deviceUrl + '/notify', message);
    }

    function uploadLogs(deviceUrl, feedbackId, email) {
      return notifyDevice(deviceUrl, {
        command: "logUpload",
        eventType: "room.request_logs",
        feedbackId: feedbackId,
        email: email
      });
    }

    return {
      on: deviceCache.on,
      getDevice: getDevice,
      uploadLogs: uploadLogs,
      updateTags: updateTags,
      deleteDevice: deleteDevice,
      getDeviceList: getDeviceList,
      updateDeviceName: updateDeviceName
    };
  }

  angular
    .module('Squared')
    .service('CsdmDeviceService', CsdmDeviceService);

})();
