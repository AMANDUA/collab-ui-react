(function () {
  'use strict';

  angular.module('Hercules')
    .controller('ExpresswayEnterNameController', ExpresswayEnterNameController);

  /* @ngInject */
  function ExpresswayEnterNameController($q, $stateParams, $translate, FmsOrgSettings, HybridServicesClusterService, HybridServicesExtrasService, Notification) {
    var vm = this;
    var wizardData = $stateParams.wizard.state().data;
    vm.name = '';
    vm.next = next;
    vm.canGoNext = canGoNext;
    vm.handleKeypress = handleKeypress;
    vm.provisioning = false;
    vm._translation = {
      help: $translate.instant('hercules.renameAndDeregisterComponent.renameClusterDescription'),
      placeholder: $translate.instant('hercules.addResourceDialog.clusternameWatermark'),
    };
    vm.minlength = 1;
    vm.validationMessages = {
      required: $translate.instant('common.invalidRequired'),
      minlength: $translate.instant('common.invalidMinLength', {
        min: vm.minlength,
      }),
    };
    vm.releaseChannel = 'stable';

    ///////////////

    FmsOrgSettings.get()
      .then(function (data) {
        vm.releaseChannel = data.expresswayClusterReleaseChannel;
      });

    function provisionCluster(data) {
      vm.provisioning = true;
      vm.clusterId = null;
      return HybridServicesClusterService.preregisterCluster(data.name, vm.releaseChannel, 'c_mgmt')
        .then(function (cluster) {
          vm.clusterId = cluster.id;
          var promises = [];
          if (data.selectedServices.call) {
            promises.push(HybridServicesClusterService.provisionConnector(vm.clusterId, 'c_ucmc'));
          }
          if (data.selectedServices.calendar) {
            promises.push(HybridServicesClusterService.provisionConnector(vm.clusterId, 'c_cal'));
          }
          if (data.selectedServices.imp) {
            promises.push(HybridServicesClusterService.provisionConnector(vm.clusterId, 'c_imp'));
          }
          return $q.all(promises);
        })
        .then(function () {
          return HybridServicesExtrasService.addPreregisteredClusterToAllowList(data.hostname, vm.clusterId);
        })
        .catch(function () {
          throw $translate.instant('hercules.addResourceDialog.cannotCreateCluster');
        })
        .finally(function () {
          vm.provisioning = false;
        });
    }

    function canGoNext() {
      return isValidName(vm.name);
    }

    function handleKeypress(event) {
      if (event.keyCode === 13 && canGoNext()) {
        next();
      }
    }

    function isValidName(name) {
      return name && name.length >= vm.minlength;
    }

    function next() {
      wizardData.expressway.name = vm.name;
      provisionCluster(wizardData.expressway)
        .then(function () {
          $stateParams.wizard.next({
            expressway: {
              name: vm.name,
              clusterId: vm.clusterId,
            },
          });
        })
        .catch(function (error) {
          Notification.errorWithTrackingId(error, 'hercules.genericFailure');
        });
    }
  }
})();
