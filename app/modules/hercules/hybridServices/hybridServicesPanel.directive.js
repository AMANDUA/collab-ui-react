(function () {
  'use strict';

  angular
    .module('Hercules')
    .directive('hybridServicesPanel', hybridServicesPanel);

  /* @ngInject */
  function hybridServicesPanel() {
    var directive = {
      restrict: 'E',
      scope: {
        'updateEntitlements': '&bindEntitlements'
      },
      bindToController: true,
      controllerAs: 'vm',
      controller: Controller,
      templateUrl: 'modules/hercules/hybridServices/hybridServicesPanel.tpl.html'
    };

    return directive;
  }

  /* @ngInject */
  function Controller(HybridService) {
    var vm = this;

    vm.isEnabled = false;
    vm.extensions = [];
    vm.entitlements = [];
    vm.setEntitlements = setEntitlements;

    init();

    ////////////////

    function init() {
      HybridService.getEntitledExtensions()
        .then(function (extensions) {
          vm.isEnabled = _.some(extensions, {
            'enabled': true
          });
          vm.extensions = extensions || [];
        });
    }

    function setEntitlements() {
      // US8209 says to only add entitlements, not remove them.
      // Allowing INACTIVE would remove entitlement when users are patched.
      vm.entitlements = _(vm.extensions)
        .map(function (extension) {
          return _.pick(extension, ['entitlementState', 'entitlementName']);
        })
        .filter({
          entitlementState: 'ACTIVE'
        })
        .value();

      vm.updateEntitlements({
        'entitlements': vm.entitlements
      });
    }
  }
})();
