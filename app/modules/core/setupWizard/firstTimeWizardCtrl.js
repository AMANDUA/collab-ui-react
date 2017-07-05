(function () {
  'use strict';

  angular.module('Core')
    .controller('FirstTimeWizardCtrl', FirstTimeWizardCtrl);

  /* @ngInject */
  function FirstTimeWizardCtrl($scope, $state, $translate, Auth, Authinfo, Orgservice, SetupWizardService) {
    $scope.greeting = $translate.instant('index.greeting', {
      name: Authinfo.getUserName(),
    });

    $scope.finish = function () {
      return Orgservice.setSetupDone().then(function () {
        Authinfo.setSetupDone(true);
      })
        .then(function () {
          if (Authinfo.isAdmin()) {
            return Auth.getCustomerAccount(Authinfo.getOrgId())
              .then(function (response) {
                Authinfo.updateAccountInfo(response.data, response.status);
              });
          }
        })
        .then(function () {
          return SetupWizardService.processCallbacks();
        })
        .finally(function () {
          $state.go('overview');
        });
    };
  }
})();
