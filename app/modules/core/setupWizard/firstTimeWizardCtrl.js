(function () {
  'use strict';

  angular.module('Core')
    .controller('FirstTimeWizardCtrl', FirstTimeWizardCtrl);

  /* @ngInject */
  function FirstTimeWizardCtrl($scope, $state, $translate, Auth, Authinfo,
    Config, FeatureToggleService, Orgservice,
    Userservice) {
    $scope.greeting = $translate.instant('index.greeting', {
      name: Authinfo.getUserName()
    });

    $scope.finish = function () {
      return Orgservice.setSetupDone().then(function () {
        Authinfo.setSetupDone(true);
      }).then(function () {
        if (Authinfo.isAdmin()) {
          return Auth.getCustomerAccount(Authinfo.getOrgId())
            .success(function (data, status) {
              Authinfo.updateAccountInfo(data, status);
            });
        }
      }).finally(function () {
        $state.go('overview');
      });
    };

    init();

    function init() {
      /**
       * Patch the first time admin login with SyncKms role and Care entitlements.
       */
      if (adminPatchNeeded()) {
        FeatureToggleService.atlasCareTrialsGetStatus()
          .then(getCareAdminUser)
          .then(isPatchRequired)
          .then(patchAdmin)
          .then(updateAccessToken);
      }
    }

    function adminPatchNeeded() {
      return (!Authinfo.isInDelegatedAdministrationOrg() &&
        Authinfo.getCareServices() &&
        Authinfo.getCareServices().length > 0);
    }

    function getCareAdminUser(careEnabled) {
      if (careEnabled) {
        return Userservice.getUser('me', _.noop);
      }
    }

    function isPatchRequired(careAdmin) {
      if (!careAdmin || !careAdmin.success) {
        return;
      }

      var hasSyncKms = _.find(careAdmin.roles, function (r) {
        return r === Config.backend_roles.spark_synckms;
      });

      var hasCareEntitlements = _.filter(careAdmin.entitlements, function (e) {
        return (e === Config.entitlements.care ||
          e === Config.entitlements.context);
      }).length === 2;

      if (!hasSyncKms || !hasCareEntitlements) {
        return careAdmin;
      }
    }

    function patchAdmin(admin) {
      if (!admin) {
        return;
      }

      var userData = {
        schemas: Config.scimSchemas,
        roles: [Config.backend_roles.spark_synckms],
        entitlements: [Config.entitlements.care, Config.entitlements.context]
      };

      return Userservice.updateUserProfile(admin.id, userData, _.noop);
    }

    function updateAccessToken(result) {
      if (result && result.success) {
        /**
         * TODO: This is a workaround until we figure out a way to
         * Revoke/Refresh access token with newly patched entitlements.
         */
        Auth.logout();
      }
    }
  }
})();
