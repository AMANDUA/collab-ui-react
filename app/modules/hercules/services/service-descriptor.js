'use strict';

angular.module('Hercules')
  .service('ServiceDescriptor', ['$http', 'ConfigService', 'XhrNotificationService',
    function ServiceDescriptor($http, config, notification) {
      var services = function (callback) {
        $http
          .get(config.getUrl() + '/fusion_entitlements_status')
          .success(function (data) {
            var services = _.filter(data.fusion_services || [], function (service) {
              return service.connector_type != 'c_mgmt' && service.enabled;
            });
            callback(null, services);
          })
          .error(function () {
            callback(arguments);
          });
      };

      var allEntitledServices = function (callback) {
        $http
          .get(config.getUrl() + '/fusion_entitlements_status')
          .success(function (data) {
            var services = _.filter(data.fusion_services || [], function (service) {
              return service.connector_type != 'c_mgmt' && service.connector_type != 'mf_mgmt';
            });
            callback(null, services);
          })
          .error(function () {
            callback(arguments);
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
          .put(config.getUrl() + '/services/' + serviceId, {
            enabled: enabled
          })
          .success(function () {
            callback(null);
          })
          .error(function () {
            callback(arguments);
          });
      };

      return {
        services: services,
        allEntitledServices: allEntitledServices,
        isFusionEnabled: isFusionEnabled,
        setServiceEnabled: setServiceEnabled
      };

    }
  ]);
