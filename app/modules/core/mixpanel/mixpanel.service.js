/* global mixpanel */

(function () {
  'use strict';

  angular
    .module('Core')
    .service('Mixpanel', Mixpanel);

  /* @ngInject */
  function Mixpanel($q, Config, Orgservice) {

    var service = {
      _track: _track,
      trackEvent: trackEvent,
      getTestOrg: getTestOrg
    };

    var isTestOrgPromise = null;

    return service;

    function _track(eventName, properties) {
      mixpanel.track(eventName, properties);
    }

    /**
     *  Saves mixpanel data in production
     */
    function trackEvent(eventName, properties) {
      if (Config.isE2E()) {
        return;
      }

      if (Config.isProd()) {
        service._track(eventName, _.assign({
          env: 'Prod'
        }, properties || {}));
      } else {
        getTestOrg().then(function (isTestOrg) {
          if (isTestOrg) {
            service._track(eventName, _.assign({
              env: 'Test'
            }, properties || {}));
          }
        });
      }

    }

    function getTestOrg() {
      if (!isTestOrgPromise) {
        isTestOrgPromise = $q(function (resolve, reject) {
          Orgservice.getOrg(function (response) {
            resolve(response.isTestOrg);
          });
        });
      }
      return isTestOrgPromise;
    }
  }

})();