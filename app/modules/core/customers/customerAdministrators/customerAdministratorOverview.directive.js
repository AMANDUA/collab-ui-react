require('./_customer-admin.scss');

(function () {
  'use strict';

  angular
    .module('Core')
    .directive('ucCustomerAdministratorOverview', ucCustomerAdministratorOverview);

  function ucCustomerAdministratorOverview() {
    var directive = {
      restrict: 'E',
      templateUrl: 'modules/core/customers/customerAdministrators/customerAdministratorOverview.tpl.html',
      controller: 'CustomerAdministratorOverviewCtrl',
      controllerAs: 'customerAdminOverview',
    };

    return directive;
  }
})();
