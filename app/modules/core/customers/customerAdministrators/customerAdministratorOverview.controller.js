(function () {
  'use strict';

  angular.module('Core')
    .controller('CustomerAdministratorOverviewCtrl', CustomerAdministratorOverview);

  /* @ngInject */
  function CustomerAdministratorOverview($stateParams, Notification, CustomerAdministratorService) {
    var vm = this;
    var currentCustomer = $stateParams.currentCustomer;
    var customerOrgId = currentCustomer.customerOrgId;

    vm.count = 0;
    vm.loading = true;

    init();

    function init() {
      getAdminCount();
    }

    function getAdminCount() {
      vm.loading = true;
      if (currentCustomer && customerOrgId) {
        CustomerAdministratorService.getCustomerAdmins(customerOrgId)
          .then(function (response) {
            vm.loading = false;
            _.set(vm, 'count', response.data.totalResults);
          })
          .catch(function (response) {
            Notification.errorResponse(response, 'customerAdminPanel.customerAdministratorServiceError');
          });
      }
    }
  }
})();
