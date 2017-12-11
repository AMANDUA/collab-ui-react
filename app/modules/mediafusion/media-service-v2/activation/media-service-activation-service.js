(function () {
  'use strict';

  angular.module('Mediafusion')
    .service('MediaServiceActivationV2', MediaServiceActivationV2);

  /* @ngInject */
  function MediaServiceActivationV2($http, UrlConfig, Authinfo, Notification, $q, HybridServicesClusterService, ServiceDescriptorService, Orgservice, $timeout) {
    var vm = this;
    vm.mediaServiceId = 'squared-fusion-media';


    var getUserIdentityOrgToMediaAgentOrgMapping = function () {
      var url = UrlConfig.getCalliopeUrl() + '/identity2agent/' + Authinfo.getOrgId();
      return $http.get(url);
    };

    var setUserIdentityOrgToMediaAgentOrgMapping = function (mediaAgentOrgIdsArray) {
      var url = UrlConfig.getCalliopeUrl() + '/identity2agent';
      return $http
        .put(url, {
          identityOrgId: Authinfo.getOrgId(),
          mediaAgentOrgIds: mediaAgentOrgIdsArray,
        });
    };

    var deleteUserIdentityOrgToMediaAgentOrgMapping = function () {
      var url = UrlConfig.getCalliopeUrl() + '/identity2agent/' + Authinfo.getOrgId();
      return $http.delete(url);
    };

    function recoverProm(errorResponse) {
      Notification.errorWithTrackingId(errorResponse, 'mediaFusion.mediaNetworkFailure');
      return undefined;
    }

    function enableMediaServiceEntitlements() {
      return [enableRhesosEntitlement().catch(recoverProm), enableCallServiceEntitlement().catch(recoverProm)];
    }

    function enableMediaService(serviceId) {
      ServiceDescriptorService.enableService(serviceId).then('', function () {
        Notification.error('mediaFusion.mediaServiceActivationFailure');
      });
      setisMediaServiceEnabled(true);
      enableOrpheusForMediaFusion();
      setOrgSettingsForDevOps();
    }

    var enableOrpheusForMediaFusion = function () {
      getUserIdentityOrgToMediaAgentOrgMapping().then(
        function success(response) {
          var mediaAgentOrgIdsArray = [];
          var orgId = Authinfo.getOrgId();
          var updateMediaAgentOrgId = false;
          mediaAgentOrgIdsArray = response.data.mediaAgentOrgIds;

          // See if org id is already mapped to user org id
          if (mediaAgentOrgIdsArray.indexOf(orgId) == -1) {
            mediaAgentOrgIdsArray.push(orgId);
            updateMediaAgentOrgId = true;
          }
          // See if 'squared' org id is already mapped to user org id
          if (mediaAgentOrgIdsArray.indexOf('squared') == -1) {
            mediaAgentOrgIdsArray.push('squared');
            updateMediaAgentOrgId = true;
          }

          if (updateMediaAgentOrgId) {
            addUserIdentityToMediaAgentOrgMapping(mediaAgentOrgIdsArray);
          }
        },

        function error() {
          // Unable to find identityOrgId, add identityOrgId -> mediaAgentOrgId mapping
          var mediaAgentOrgIdsArray = [];
          mediaAgentOrgIdsArray.push(Authinfo.getOrgId());
          mediaAgentOrgIdsArray.push('squared');
          addUserIdentityToMediaAgentOrgMapping(mediaAgentOrgIdsArray);
        });
    };

    var addUserIdentityToMediaAgentOrgMapping = function (mediaAgentOrgIdsArray) {
      setUserIdentityOrgToMediaAgentOrgMapping(mediaAgentOrgIdsArray).then(
        function success() {},
        function error() {
          $timeout(function () {
            setUserIdentityOrgToMediaAgentOrgMapping(mediaAgentOrgIdsArray).then(
              function success() {},
              function error(errorResponse) {
                logUserIdentityOrgToMediaAgentOrgMapping(errorResponse);
                Notification.errorWithTrackingId(errorResponse, 'mediaFusion.mediaMicroserviceFailure');
              });
          }, 20000);
        });
    };


    var getMediaServiceState = function () {
      var isMediaService = $q.defer();
      if (!_.isUndefined(vm.isMediaServiceEnabled)) {
        isMediaService.resolve(vm.isMediaServiceEnabled);
      } else {
        HybridServicesClusterService.serviceIsSetUp(vm.mediaServiceId).then(function (enabled) {
          if (enabled) {
            vm.isMediaServiceEnabled = enabled;
          }
          isMediaService.resolve(vm.isMediaServiceEnabled);
        });
      }
      return isMediaService.promise;
    };

    var setisMediaServiceEnabled = function (value) {
      vm.isMediaServiceEnabled = value;
    };

    var disableOrpheusForMediaFusion = function () {
      getUserIdentityOrgToMediaAgentOrgMapping().then(
        function success(response) {
          var mediaAgentOrgIdsArray = [];
          var orgId = Authinfo.getOrgId();
          mediaAgentOrgIdsArray = response.data.mediaAgentOrgIds;

          var index = mediaAgentOrgIdsArray.indexOf(orgId);
          mediaAgentOrgIdsArray.splice(index, 1);

          index = mediaAgentOrgIdsArray.indexOf('squared');
          mediaAgentOrgIdsArray.splice(index, 1);

          if (mediaAgentOrgIdsArray.length > 0) {
            setUserIdentityOrgToMediaAgentOrgMapping(mediaAgentOrgIdsArray).then(
              function success() {},
              function error(errorResponse) {
                Notification.errorWithTrackingId(errorResponse, 'mediaFusion.mediaMicroserviceFailure');
              });
          } else {
            deleteUserIdentityOrgToMediaAgentOrgMapping(mediaAgentOrgIdsArray).then(
              function success() {},
              function error(errorResponse) {
                Notification.errorWithTrackingId(errorResponse, 'mediaFusion.mediaMicroserviceFailure');
              });
          }
        });
    };

    var deactivateHybridMedia = function () {
      var url = UrlConfig.getAthenaServiceUrl() + '/organizations/' + Authinfo.getOrgId() + '/deactivate_hybrid_media';
      return $http.delete(url);
    };

    var enableRhesosEntitlement = function () {
      var url = UrlConfig.getAdminServiceUrl() + 'organizations/' + Authinfo.getOrgId() + '/services/rhesos';
      return $http.post(url);
    };

    var enableCallServiceEntitlement = function () {
      var payload = {
        selfSubscribe: true,
        roles: ['Spark_CallService'],
      };
      var url = UrlConfig.getAdminServiceUrl() + 'organizations/' + Authinfo.getOrgId() + '/services/spark';
      return $http.post(url, payload);
    };

    var setOrgSettingsForDevOps = function () {
      var settings = {
        isMediaFusionEnabled: true,
        mediaFusionEnabledAt: moment().utc(),
      };
      Orgservice.setOrgSettings(Authinfo.getOrgId(), settings);
      var payload = {
        isMediaFusionEnabled: true,
        updatedTime: moment().utc(),
      };
      var url = UrlConfig.getAthenaServiceUrl() + '/devops/organizations/' + Authinfo.getOrgId() + '/hms_org_activation';
      $http.post(url, payload);
    };

    var disableMFOrgSettingsForDevOps = function () {
      var settings = {
        isMediaFusionEnabled: false,
      };
      Orgservice.setOrgSettings(Authinfo.getOrgId(), settings);
      var payload = {
        isMediaFusionEnabled: false,
        updatedTime: moment().utc(),
      };
      var url = UrlConfig.getAthenaServiceUrl() + '/devops/organizations/' + Authinfo.getOrgId() + '/hms_org_activation';
      $http.post(url, payload);
    };

    var logUserIdentityOrgToMediaAgentOrgMapping = function (response) {
      var status = response.status;
      var statusText = response.statusText;
      var message = 'statusCode: ' + status + ', statusText: ' + statusText;
      var headers = _.get(response, 'headers');
      var trackingId = _.isFunction(headers) && headers('TrackingID'); // exposed via CORS headers
      if (!trackingId) {
        trackingId = _.get(response, 'data.trackingId'); // for CCATG API spec
      }
      if (!trackingId) {
        trackingId = _.get(response, 'data.error.trackingId'); // fallback to old data structure
      }
      if (!trackingId) {
        trackingId = _.get(response, 'config.headers.TrackingID'); // fallback for when request could not be made
      }
      var payload = {
        serviceName: 'Orpheus',
        message: message,
        trackingId: trackingId,
      };
      var url = UrlConfig.getAthenaServiceUrl() + '/devops/organizations/' + Authinfo.getOrgId() + '/log_message';
      return $http.post(url, payload);
    };

    return {
      setisMediaServiceEnabled: setisMediaServiceEnabled,
      getMediaServiceState: getMediaServiceState,
      getUserIdentityOrgToMediaAgentOrgMapping: getUserIdentityOrgToMediaAgentOrgMapping,
      setUserIdentityOrgToMediaAgentOrgMapping: setUserIdentityOrgToMediaAgentOrgMapping,
      deleteUserIdentityOrgToMediaAgentOrgMapping: deleteUserIdentityOrgToMediaAgentOrgMapping,
      enableMediaService: enableMediaService,
      disableOrpheusForMediaFusion: disableOrpheusForMediaFusion,
      deactivateHybridMedia: deactivateHybridMedia,
      disableMFOrgSettingsForDevOps: disableMFOrgSettingsForDevOps,
      enableMediaServiceEntitlements: enableMediaServiceEntitlements,
    };
  }
})();
