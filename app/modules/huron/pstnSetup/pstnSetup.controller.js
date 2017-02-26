(function () {
  'use strict';

  angular.module('Huron')
    .controller('PstnSetupCtrl', PstnSetupCtrl);

  /* @ngInject */
  function PstnSetupCtrl($state, $stateParams, PstnSetup, PstnSetupService, Notification) {
    //Save state params
    PstnSetup.setCustomerId($stateParams.customerId);
    PstnSetup.setCustomerName($stateParams.customerName);
    PstnSetup.setCustomerEmail($stateParams.customerEmail);
    PstnSetup.setIsTrial($stateParams.customerCommunicationLicenseIsTrial && $stateParams.customerRoomSystemsLicenseIsTrial);

    //Verify the the Terminus Reseller is setup, otherwise setup the Reseller
    if (!PstnSetup.isResellerExists()) {
      PstnSetupService.getResellerV2().then(function () {
        PstnSetup.setResellerExists(true);
      }).catch(function () {
        PstnSetupService.createResellerV2().then(function () {
          PstnSetup.setResellerExists(true);
        }).catch(function (response) {
          Notification.errorResponse(response, 'pstnSetup.resellerCreateError');
        });
      });
    }

    if ($state.modal && $state.modal.result) {
      $state.modal.result.finally(PstnSetup.clear);
    }
  }
})();
