(function () {
  'use strict';

  angular
    .module('Hercules')
    .service('ServiceDescriptor', ServiceDescriptor);

  /* @ngInject */
  function ServiceDescriptor($http, $q, UrlConfig, Authinfo, Orgservice) {
    var services = function (callback, includeStatus) {
      $http
        .get(UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/services' + (includeStatus ? '?fields=status' : ''))
        .success(function (data) {
          callback(null, data.items || []);
        })
        .error(function () {
          callback(arguments);
        });
    };

    function getServices() {
      return $http.get(UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/services')
        .then(function (response) {
          return response.data.items || [];
        });
    }

    function extractData(res) {
      return res.data.items;
    }

    var servicesInOrg = function (orgId, includeStatus) {
      return $http
        .get(UrlConfig.getHerculesUrl() + '/organizations/' + orgId + '/services' + (includeStatus ? '?fields=status' : ''))
        .then(extractData);
    };

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

    var getEmailSubscribers = function (serviceId, callback) {
      $http
        .get(UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/services')
        .success(function (data) {
          var service = _.find(data.items, {
            id: serviceId
          });
          if (service === undefined) {
            callback(false);
          } else {
            callback(null, service.emailSubscribers);
          }
        })
        .error(function () {
          callback(arguments);
        });
    };

    var setEmailSubscribers = function (serviceId, emailSubscribers, callback) {
      $http
        .patch(UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/services/' + serviceId, {
          emailSubscribers: emailSubscribers
        })
        .then(function (res) {
          callback(res.status);
        });
    };

    var getDisableEmailSendingToUser = function () {
      return $q(function (resolve, reject) {
        Orgservice.getOrg(function (data, status) {
          if (data.success) {
            var settings = data.orgSettings;
            if (!_.isEmpty(settings)) {
              resolve({
                'calSvcDisableEmailSendingToEndUser': settings.calSvcDisableEmailSendingToEndUser
              });
            } else {
              reject();
            }
          } else {
            reject();
          }
        }, Authinfo.getOrgId(), true);
      });
    };

    var setDisableEmailSendingToUser = function (calSvcDisableEmailSendingToEndUser, callback) {
      var settings = {
        'calSvcDisableEmailSendingToEndUser': (calSvcDisableEmailSendingToEndUser ? true : false)
      };

      Orgservice.setOrgSettings(Authinfo.getOrgId(), settings)
        .then(function () {
          callback(null);
        })
        .catch(function () {
          callback("error in setting disable email sending for Org.");
        });
    };

    var setServiceEnabled = function (serviceId, enabled, callback) {
      $http
        .patch(UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/services/' + serviceId, {
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
        .get(UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/services')
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

    var acknowledgeService = function (serviceId) {
      return $http
        .patch(UrlConfig.getHerculesUrl() + '/organizations/' + Authinfo.getOrgId() + '/services/' + serviceId, {
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
      acknowledgeService: acknowledgeService,
      getServices: getServices,
      servicesInOrg: servicesInOrg,
      getEmailSubscribers: getEmailSubscribers,
      setEmailSubscribers: setEmailSubscribers,
      getDisableEmailSendingToUser: getDisableEmailSendingToUser,
      setDisableEmailSendingToUser: setDisableEmailSendingToUser
    };
  }
}());
