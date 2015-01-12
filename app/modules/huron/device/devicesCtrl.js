(function () {
  'use strict';

  angular
    .module('uc.device')
    .controller('DevicesCtrl', DevicesCtrl);

  /* @ngInject */
  function DevicesCtrl($scope, $state, DeviceService, OtpService, Config) {
    var vm = this;
    vm.devices = [];
    vm.otps = [];
    vm.showDeviceDetailPanel = showDeviceDetailPanel;

    ////////////

    function activate() {
      return DeviceService.loadDevices($scope.currentUser.id).then(function (deviceList) {
        vm.devices = deviceList;
      });
    }

    function showDeviceDetailPanel(device) {
      DeviceService.setCurrentDevice(device);
    }

    function isHuronEnabled() {
      return isEntitled(Config.entitlements.huron);
    }

    function isEntitled(ent) {
      if ($scope.currentUser && $scope.currentUser.entitlements) {
        for (var i = 0; i < $scope.currentUser.entitlements.length; i++) {
          var svc = $scope.currentUser.entitlements[i];
          if (svc === ent) {
            return true;
          }
        }
      }
      return false;
    }

    $scope.$watch('currentUser', function (newUser, oldUser) {
      if (newUser) {
        if (isHuronEnabled()) {
          activate();
        }
      }
    });

    $scope.$on('updateDeviceList', function () {
      activate();
    });

    $scope.$on('entitlementsUpdated', function () {
      if (isHuronEnabled()) {
        activate();
      }
    });

  }
})();
