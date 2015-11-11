'use strict';

angular.module('Hercules')
  .service('ServiceDescriptor', ['$http', 'ConfigService', 'Authinfo',
    function ServiceDescriptor($http, config, Authinfo) {
      var services = function (callback) {
        $http
          .get(config.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/services')
          .success(function (data) {
            callback(null, data.items || []);
          })
          .error(function () {
            callback(arguments);
          });
      };

      function getServices() {
        return $http.get(config.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/services')
          .then(function (response) {
            return response.data.items || [];
          });
      }

      var filterEnabledServices = function (services) {
        return _.filter(services, function (service) {
          return service.id != 'squared-fusion-mgmt' && service.enabled;
        });
      };

      var filterAllExceptManagement = function (services) {
        return _.filter(services, function (service) {
          return service.id === 'squared-fusion-cal' || service.id === 'squared-fusion-uc';
        });
      };

      var isFusionEnabled = function (callback) {
        services(function (error, services) {
          if (error) {
            callback(false);
          } else {
            callback(services.length > 0);
          }
        });
      };

      var setServiceEnabled = function (serviceId, enabled, callback) {
        $http
          .patch(config.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/services/' + serviceId, {
            enabled: enabled
          })
          .success(function () {
            callback(null);
          })
          .error(function () {
            callback(arguments);
          });
      };

      var isServiceEnabled = function (serviceId, callback) {
        $http
          .get(config.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/services')
          .success(function (data) {
            var service = _.find(data.items, {
              id: serviceId
            });
            if (service === undefined) {
              callback(false);
            } else {
              callback(null, service.enabled);
            }
          })
          .error(function () {
            callback(arguments);
          });
      };

      var serviceIcon = function (serviceId) {
        if (!serviceId) {
          return 'icon icon-circle-question';
        }
        switch (serviceId) {
        case 'squared-fusion-cal':
          return 'icon icon-circle-calendar';
        case 'squared-fusion-uc':
          return 'icon icon-circle-call';
        case 'squared-fusion-media':
          return 'icon icon-circle-telepresence';
        case 'contact-center-context':
          return 'icon icon-circle-world';
        default:
          return 'icon icon-circle-question';
        }
      };

      var acknowledgeService = function (serviceId) {
        return $http
          .patch(config.getUrl() + '/organizations/' + Authinfo.getOrgId() + '/services/' + serviceId, {
            acknowledged: true
          });
      };

      return {
        services: services,
        filterEnabledServices: filterEnabledServices,
        filterAllExceptManagement: filterAllExceptManagement,
        isFusionEnabled: isFusionEnabled,
        isServiceEnabled: isServiceEnabled,
        setServiceEnabled: setServiceEnabled,
        serviceIcon: serviceIcon,
        acknowledgeService: acknowledgeService,
        getServices: getServices
      };

    }
  ]);
