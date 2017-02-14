(function () {
  'use strict';

  module.exports = FeatureToggleService;

  /* @ngInject */
  function FeatureToggleService($http, $q, $resource, $rootScope, $state, Authinfo, HuronConfig, UrlConfig, Orgservice) {
    var features = require('./features.config');

    var toggles = {};

    // returns huron feature toggle value for the given user or user's org
    var huronUserResource;

    // returns huron feature toggle value for the given customer; must be full admin or partner admin for the customer
    var huronCustomerResource;

    var orgResource = $resource(UrlConfig.getFeatureUrl() + '/features/rules/:id', {
      id: '@id'
    },
      {
        get: {
          method: 'GET',
          cache: true
        },
        refresh: {
          method: 'GET',
          cache: false
        }
      });

    var userResource = $resource(UrlConfig.getFeatureUrl() + '/features/users/:id', {
      id: '@id'
    },
      {
        get: {
          method: 'GET',
          cache: true
        }
      });

    var dirSyncConfigurationResource = $resource(UrlConfig.getAdminServiceUrl() + 'organization/:customerId/dirsync', {
      customerId: '@customerId'
    });

    var service = {
      getUrl: getUrl,
      getFeatureForUser: getFeatureForUser,
      getFeaturesForUser: getFeaturesForUser,
      getFeatureForOrg: getFeatureForOrg,
      getFeaturesForOrg: getFeaturesForOrg,
      setFeatureToggles: setFeatureToggles,
      generateFeatureToggleRule: generateFeatureToggleRule,
      stateSupportsFeature: stateSupportsFeature,
      supports: supports,
      supportsDirSync: supportsDirSync,
      features: features
    };

    init();

    return service;

    function init() {
      setHuronUserResource(HuronConfig.getMinervaUrl());
      setHuronCustomerResource(HuronConfig.getMinervaUrl());
      // setup listener
      $rootScope.$on('COMPASS_BASE_DOMAIN_CHANGED', function () {
        setHuronUserResource(HuronConfig.getMinervaUrl());
        setHuronCustomerResource(HuronConfig.getMinervaUrl());
      });
      return _.reduce(features, function (status, feature, key) {
        status[key + 'GetStatus'] = function () {
          return supports(features[key]);
        };
        return status;
      }, service);
    }

    function getFeatureForUser(id, feature) {
      return getFeature(true, id, feature);
    }

    function getFeaturesForUser(id) {
      return getFeatures(true, id);
    }

    function getFeatureForOrg(id, feature) {
      return getFeature(false, id, feature);
    }

    function getFeaturesForOrg(id, clearCache) {
      return getFeatures(false, id, clearCache);
    }

    function getUrl(isUser) {
      return isUser ? userResource : orgResource;
    }

    function getFeatures(isUser, id, clearCache) {
      if (!id) {
        return $q.reject('id is undefined');
      }
      clearCache = clearCache || false;
      var info = {
        id: id
      };
      var url = getUrl(isUser);

      var response;
      if (!isUser && clearCache) {
        response = url.refresh(info);
      } else {
        response = url.get(info);
      }

      return response.$promise.then(function (response) {
        if (isUser) {
          _.forEach(response.developer, fixVal);
          _.forEach(response.entitlement, fixVal);
          _.forEach(response.user, fixVal);
        } else {
          _.forEach(response.featureToggles, fixVal);
        }
        return response;
      });
    }

    function getHuronToggle(feature) {
      if (Authinfo.isSquaredUC()) {
        if (Authinfo.isCustomerLaunchedFromPartner()) {
          return getHuronToggleForCustomer(Authinfo.getOrgId(), feature);
        }

        return getHuronToggleForUser(Authinfo.getUserId(), feature);
      }

      return $q.resolve(false);
    }

    function getHuronToggleForUser(userId, feature) {
      return huronUserResource.get({
        userId: userId,
        featureName: feature
      }).$promise.then(function (data) {
        toggles[feature] = data.val;
        return data.val;
      }).catch(function () {
        return false;
      });
    }


    function getHuronToggleForCustomer(customerId, feature) {
      return huronCustomerResource.get({
        customerId: customerId,
        featureName: feature
      }).$promise.then(function (data) {
        toggles[feature] = data.val;
        return data.val;
      }).catch(function () {
        return false;
      });
    }

    function getFeature(isUser, id, feature) {
      if (!feature) {
        return $q.reject('feature is undefined');
      }

      var atlasToggle = getFeatures(isUser, id).then(function (features) {
        // find the toggle, then get the val, default to false
        return _.get(_.find(features.developer, {
          key: feature
        }), 'val', false);
      }).catch(function () {
        return false;
      });

      return atlasToggle.then(function (toggle) {
        if (!toggle) {
          return getHuronToggle(feature);
        } else {
          return toggle;
        }
      });
    }

    function stateSupportsFeature(feature) {
      return supports(feature).then(shouldFeatureAllowState);
    }

    function shouldFeatureAllowState(isSupported) {
      if (!isSupported) {
        if (currentlyInState()) {
          return $q.reject('Requested feature is not supported by requested state');
        } else {
          $state.go('login');
        }
      }
      return isSupported;
    }

    function currentlyInState() {
      return !!$state.$current.name;
    }

    function supports(feature) {
      return $q(function (resolve) {
        if (feature === features.dirSync) {
          supportsDirSync().then(function (enabled) {
            resolve(enabled);
          });
        } else if (!_.isUndefined(toggles[feature])) {
          resolve(toggles[feature]);
        } else {
          $http.get(UrlConfig.getScimUrl(Authinfo.getOrgId()) + '/me', {
            cache: true,
          }).then(function (response) {
            return getFeatureForUser(_.get(response, 'data.id'), feature)
              .then(function (result) {
                if (!result) {
                  return getHuronToggle(feature);
                } else {
                  return result;
                }
              }).then(function (toggleValue) {
                toggles[feature] = toggleValue;
                resolve(toggleValue);
              });
          }).catch(function () {
            return false;
          });
        }
      });
    }

    function supportsDirSync() {
      return dirSyncConfigurationResource.get({
        customerId: Authinfo.getOrgId()
      }).$promise.then(function (response) {
        return response.serviceMode === 'ENABLED';
      }).catch(function (response) {
        Orgservice.getOrgCacheOption(function (data) {
          if (data.success) {
            return data.dirsyncEnabled;
          } else {
            return $q.reject(response);
          }
        }, null,
          {
            cache: false
          });
      });
    }

    function setFeatureToggles(isUser, listOfFeatureToggleRules) {
      if (isUser) {
        return $q.reject('User level toggles are not changeable in the web app');
      }

      var usingId = isUser ? undefined : '';

      return getUrl(isUser).save({
        id: usingId
      }, listOfFeatureToggleRules).$promise;
    }

    /**
     * Feature toggle rules will set feature toggles for organizations
     * @param  {uuid} orgId
     * @param  {string} key   one of the FeatureToggleService.features
     * @param  {any} val      false to turn off, otherwise any value
     * @return {object}       the object that the backend expects
     */
    function generateFeatureToggleRule(orgId, key, val) {
      return {
        val: val,
        key: key,
        orgId: orgId,
        group: 'ORG',
        mutable: true,
      };
    }

    /**
     * convenience fn to change val:['true'|'false'] to val:[true|false]
     * @param  {object} feature feature from service
     * @return {object}         feature with swap
     */
    function fixVal(feature) {
      var val = feature.val;
      if (val === 'true') {
        feature.val = true;
      } else if (val === 'false') {
        feature.val = false;
      }
    }

    function setHuronUserResource() {
      huronUserResource = $resource(HuronConfig.getMinervaUrl() + '/features/users/:userId/developer/:featureName', {
        userId: '@userId',
        featureName: '@featureName'
      },
        {
          get: {
            method: 'GET',
            cache: true
          }
        });
    }

    function setHuronCustomerResource() {
      huronCustomerResource = $resource(HuronConfig.getMinervaUrl() + '/features/customers/:customerId/developer/:featureName', {
        customerId: '@customerId',
        featureName: '@featureName'
      },
        {
          get: {
            method: 'GET',
            cache: true
          }
        });
    }

  }

})();
