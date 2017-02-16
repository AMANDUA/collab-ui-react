(function () {
  'use strict';

  module.exports = angular
    .module('core.sessionstorage', [])
    .service('SessionStorage', SessionStorage)
    .name;

  /* @ngInject */
  function SessionStorage($window) {
    return {
      put: function (key, value) {
        if (value) {
          $window.sessionStorage.setItem(key, value);
        }
      },
      putObject: function (key, object) {
        if (object) {
          $window.sessionStorage.setItem(key, JSON.stringify(object));
        }
      },
      get: function (key) {
        return $window.sessionStorage.getItem(key);
      },
      getObject: function (key) {
        return JSON.parse($window.sessionStorage.getItem(key));
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
        $window.sessionStorage.removeItem(key);
      },
      clear: function () {
        $window.sessionStorage.clear();
      }
    };
  }

})();
