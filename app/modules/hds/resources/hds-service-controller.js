(function () {
  'use strict';

  angular
    .module('HDS')
    .controller('HDSServiceController', HDSServiceController);

  /* @ngInject */
  function HDSServiceController($modal, $state, $translate, Authinfo, HybridServicesClusterService, HDSService, Notification) {


    var vm = this;
    vm.backState = 'services-overview';
    vm.pageTitle = 'hds.resources.page_title';
    vm.state = $state;
    vm.tabs = [
      {
        title: $translate.instant('common.resources'),
        state: 'hds.list',
      }, {
        title: $translate.instant('common.settings'),
        state: 'hds.settings',
      },
    ];

    vm.addResourceModal = {
      type: 'small',
      controller: 'HDSRedirectAddResourceController',
      controllerAs: 'hdsRedirectAddResourceController',
      templateUrl: 'modules/hds/add-resource/add-resource-modal.html',
      modalClass: 'redirect-add-resource',
      resolve: {
        firstTimeSetup: false,
      },
    };

    HybridServicesClusterService.serviceIsSetUp('spark-hybrid-datasecurity')
      .then(function (enabled) {
        if (!enabled) {
          HDSService.enableHdsEntitlement()
            .catch(function (error) {
              Notification.errorWithTrackingId(error, 'HDSServiceController - HDSService.enableHdsEntitlement()');
            }).finally(function () {
              vm.addResourceModal.resolve.firstTimeSetup = true;
              if (Authinfo.isCustomerLaunchedFromPartner()) {
                $modal.open({
                  templateUrl: 'modules/hercules/service-specific-pages/components/add-resource/partnerAdminWarning.html',
                  type: 'dialog',
                });
                return;
              }
              $modal.open(vm.addResourceModal);
            });
        }
      });

  }
}());
