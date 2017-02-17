(function () {
  'use strict';

  module.exports = angular
    .module('core.storage', [])
    .service('Storage', Storage)
    .name;

  /* @ngInject */
  function Storage($window, $log) {
    function getLocalStorage() {
      try {
        return $window.localStorage;
      } catch (e) {
        $log.error(e);
      }
    }
    return {
      put: function (key, value) {
        if (value) {
          getLocalStorage().setItem(key, value);
        }
      },
      putObject: function (key, object) {
        if (object) {
          getLocalStorage().setItem(key, JSON.stringify(object));
        }
      },
      get: function (key) {
        return getLocalStorage().getItem(key);
      },
      getObject: function (key) {
        return JSON.parse(getLocalStorage().getItem(key));
      },
      pop: function (key) {
        var value = this.get(key);
        this.remove(key);
        return value;
      },
      popObject: function (key) {
        var object = this.getObject(key);
        this.remove(key);
        return object;
      },
      remove: function (key) {
        getLocalStorage().removeItem(key);
      },
      clear: function () {
        getLocalStorage().clear();
      }
    };
  }
})();
