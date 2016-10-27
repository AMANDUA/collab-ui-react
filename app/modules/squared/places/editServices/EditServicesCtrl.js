(function () {
  'use strict';

  angular.module('Core')
    .controller('EditServicesCtrl', EditServicesCtrl);
  /* @ngInject */
  function EditServicesCtrl($stateParams, $scope, Notification, CsdmDataModelService) {
    var vm = this;
    vm.wizardData = $stateParams.wizard.state().data;
    vm.service = (vm.wizardData.entitlements || []).indexOf('ciscouc') > -1 ? 'sparkCall' : 'sparkOnly';

    vm.next = function () {
      $stateParams.wizard.next({
        service: vm.service
      });
    };

    vm.save = function () {
      vm.isLoading = true;
      var entitlements = vm.wizardData.entitlements;
      var sparkCallIndex = entitlements.indexOf('ciscouc');
      if (sparkCallIndex > -1) {
        entitlements.splice(sparkCallIndex, 1);
        CsdmDataModelService.updateCloudberryPlace(vm.wizardData.selectedPlace, entitlements)
          .then(function () {
            $scope.$dismiss();
            Notification.success("Line configuration saved successfully");
          })
          .catch(function (error) {
            Notification.errorResponse(error, 'placesPage.placeEditError');
          });
      } else {
        $scope.$dismiss();
      }
    };

    vm.back = function () {
      $stateParams.wizard.back();
    };
  }
})();
