(function () {
  'use strict';

  angular.module('Hercules')
    .controller('MediafusionEnterHostnameController', MediafusionEnterHostnameController);

  /* @ngInject */
  function MediafusionEnterHostnameController($stateParams, $translate) {
    var vm = this;
    vm.hostname = '';
    vm.next = next;
    vm.canGoNext = canGoNext;
    vm.handleKeypress = handleKeypress;
    vm.minlength = 3;
    vm.validationMessages = {
      required: $translate.instant('common.invalidRequired'),
      minlength: $translate.instant('common.invalidMinLength', {
        min: vm.minlength,
      }),
    };

    ///////////////

    function next() {
      $stateParams.wizard.next({
        mediafusion: {
          hostname: vm.hostname,
        },
      });
    }

    function canGoNext() {
      return isValidHostname(vm.hostname);
    }

    function handleKeypress(event) {
      if (event.keyCode === 13 && canGoNext()) {
        next();
      }
    }

    function isValidHostname(hostname) {
      return hostname && hostname.length >= 3;
    }
  }
})();
