(function () {
  'use strict';

  angular.module('Hercules')
    .controller('EnterNameController', EnterNameController);

  /* @ngInject */
  function EnterNameController($q, $stateParams, $translate, FusionClusterService) {
    var vm = this;
    var wizardData = $stateParams.wizard.state().data;
    vm.name = wizardData.expressway.hostname;
    vm.next = next;
    vm.provisioning = false;
    vm._translation = {
      help: $translate.instant('hercules.expresswayClusterSettings.renameClusterDescription'),
      placeholder: $translate.instant('hercules.addResourceDialog.clusternameWatermark')
    };
    vm.minlength = 3;
    vm.validationMessages = {
      required: $translate.instant('common.invalidRequired'),
      minlength: $translate.instant('common.invalidMinLength', {
        min: vm.minlength
      })
    };

    ///////////////

    function provisionCluster(data) {
      vm.provisioning = true;
      return FusionClusterService.preregisterCluster(data.name, 'GA', 'c_mgmt')
        .then(function (cluster) {
          var promises = [];
          if (data.selectedServices.call) {
            promises.push(FusionClusterService.provisionConnector(cluster.id, 'c_ucmc'));
          }
          if (data.selectedServices.calendar) {
            promises.push(FusionClusterService.provisionConnector(cluster.id, 'c_cal'));
          }
          return $q.all(promises);
        })
        .then(function (cluster) {
          return FusionClusterService.addPreregisteredClusterToAllowList(data.hostname, 3600, cluster.id);
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
      return name && name.length >= 3;
    }

    function next() {
      wizardData.expressway.name = vm.name;
      provisionCluster(wizardData.expressway)
        .then(function () {
          $stateParams.wizard.next({
            expressway: {
              name: vm.name
            }
          });
        });
    }
  }
})();
