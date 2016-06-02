(function () {
  'use strict';

  angular.module('Huron')
    .controller('PstnOrderOverviewCtrl', PstnOrderOverviewCtrl);

  /* @ngInject */
  function PstnOrderOverviewCtrl($scope, $stateParams, $translate, PstnSetupService) {
    var vm = this;
    vm.currentCustomer = $stateParams.currentCustomer;
    vm.orders = [];

    init();

    function init() {
      PstnSetupService.getFormattedNumberOrders(vm.currentCustomer.customerOrgId).then(function (response) {
        vm.orders = response;
      });
    }
  }
})();