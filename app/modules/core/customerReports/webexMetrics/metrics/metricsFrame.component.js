(function () {
  'use strict';

  angular
    .module('core.customer-reports')
    .component('metricsFrame', {
      template: require('./metricsFrame.tpl.html'),
      controller: metricsFrameController,
    });

  /* @ngInject */
  function metricsFrameController($log, $rootScope, $scope, $timeout, $window, LoadingTimeout) {
    var vm = this;
    vm.isIframeLoaded = false;

    $window.addEventListener('message', messageHandle, true);

    $scope.$on('updateIframe', updateIframe);
    $scope.$on('unfreezeState', unfreezeState);

    function updateIframe(event, iframeUrl, data) {
      vm.data = data;
      $timeout(
        function loadIframe() {
          if (vm.iframeForm) {
            startLoadReport();
            vm.iframeForm.$$element[0].submit();
          }
        },
        0
      );
    }

    function messageHandle(event) {
      if (event.data === 'unfreeze') {
        $log.log('Unfreeze message received.');
        unfreezeState(null, true);
        $timeout.cancel(vm.startLoadReportTimer);
      }
    }

    function unfreezeState(event, isLoaded) {
      if (event) {
        vm.isIframeLoaded = isLoaded;
      } else {
        $scope.$apply(function () {
          vm.isIframeLoaded = isLoaded;
        });
      }
    }

    function startLoadReport() {
      vm.startLoadReportTimer = $timeout(
        function () {
          unfreezeState(null, true);
        },
        LoadingTimeout
      );
    }

    this.$onDestroy = function () {
      if (vm.startLoadReportTimer) {
        $timeout.cancel(vm.startLoadReportTimer);
      }
      $window.removeEventListener('message', messageHandle, true);
    };
  }
})();
