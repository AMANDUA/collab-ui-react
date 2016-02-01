(function () {
  'use strict';

  /*ngInject*/
  function HelpdeskHuronService(HelpdeskService, $http, Config, $q, HelpdeskMockData, DeviceService, UserServiceCommonV2, HuronConfig, UserEndpointService, SipEndpointService) {

    function getDevices(userId, orgId) {
      if (HelpdeskService.useMock()) {
        return deferredResolve(massageDevices(HelpdeskMockData.huronDevicesForUser));
      }
      return UserEndpointService.query({
          customerId: orgId,
          userId: userId
        }).$promise
        .then(function (devices) {
          var deviceList = [];
          for (var i = 0; i < devices.length; i++) {
            var device = {
              uuid: devices[i].endpoint.uuid,
              name: devices[i].endpoint.name,
              deviceStatus: {}
            };

            deviceList.push(device);

            SipEndpointService.get({
              customerId: orgId,
              sipEndpointId: device.uuid,
              status: true
            }).$promise.then(function (endpoint) {
              this.model = endpoint.model;
              this.description = endpoint.description;
              if (endpoint.registrationStatus && angular.lowercase(endpoint.registrationStatus) === 'registered') {
                this.deviceStatus.status = 'Online';
              } else {
                this.deviceStatus.status = 'Offline';
              }
              massageDevice(this);
            }.bind(device));
          }
          return deviceList;
        });
    }

    function getDevice(orgId, deviceId) {
      if (HelpdeskService.useMock()) {
        return deferredResolve(massageDevice(HelpdeskMockData.huronDevice));
      }
      return $http.get(HuronConfig.getCmiUrl() + '/voice/customers/' + orgId + '/sipendpoints/' + deviceId + '?status=true').then(extractDevice);
    }

    function getUserNumbers(userId, orgId) {
      if (HelpdeskService.useMock()) {
        return deferredResolve(extractNumbers(HelpdeskMockData.huronUserNumbers));
      }
      return UserServiceCommonV2.get({
        customerId: orgId,
        userId: userId
      }).$promise.then(extractNumbers);
    }

    function searchDevices(searchString, orgId, limit) {
      if (HelpdeskService.useMock()) {
        return deferredResolve(extractDevices(HelpdeskMockData.huronDeviceSearchResult));
      }
      return $http
        .get(HuronConfig.getCmiUrl() + '/voice/customers/' + orgId + '/sipendpoints?name=' + encodeURIComponent('%' + searchString + '%') + '&limit=' + limit)
        .then(extractDevices);
    }

    function setOwnerUserOnDeviceSearchResults(deviceSearchResults) {
      _.each(deviceSearchResults, function (device) {
        if (device.isHuronDevice && !device.user) {
          HelpdeskService.getUser(device.organization.id, device.ownerUser.uuid).then(function (user) {
            device.user = user;
          }, angular.noop);
        }
      });
    }

    function extractNumbers(res) {
      return res.data ? res.data.numbers : res.numbers;
    }

    function extractDevices(res) {
      return massageDevices(res.data || res);
    }

    function extractDevice(res) {
      return massageDevice(res.data || res);
    }

    function massageDevices(devices) {
      _.each(devices, massageDevice);
      return devices;
    }

    function massageDevice(device) {
      device.displayName = device.name;
      device.isHuronDevice = true;
      device.image = device.model ? 'images/devices/' + (device.model.trim().replace(/ /g, '_') + '.png').toLowerCase() : 'images/devices-hi/unknown.png';
      if (!device.deviceStatus) {
        if (device.registrationStatus) {
          device.deviceStatus = {
            status: angular.lowercase(device.registrationStatus) === 'registered' ? 'Online' : 'Offline'
          };
        } else {
          device.deviceStatus = {
            status: 'Unknown'
          };
        }
      } else if (!device.deviceStatus.status) {
        device.deviceStatus.status = 'Unknown';
      }
      device.deviceStatus.statusKey = 'common.' + angular.lowercase(device.deviceStatus.status);
      switch (device.deviceStatus.status) {
      case "Online":
        device.deviceStatus.cssColorClass = 'helpdesk-green';
        break;
      case "Unknown":
        device.deviceStatus.cssColorClass = 'helpdesk-grey';
        break;
      default:
        device.deviceStatus.cssColorClass = 'helpdesk-red';
      }
      return device;
    }

    function deferredResolve(resolved) {
      var deferred = $q.defer();
      deferred.resolve(resolved);
      return deferred.promise;
    }

    return {
      getDevices: getDevices,
      getUserNumbers: getUserNumbers,
      searchDevices: searchDevices,
      getDevice: getDevice,
      setOwnerUserOnDeviceSearchResults: setOwnerUserOnDeviceSearchResults
    };
  }

  angular.module('Squared')
    .service('HelpdeskHuronService', HelpdeskHuronService);
}());