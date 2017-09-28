var HttpStatus = require('http-status-codes');
(function () {
  'use strict';

  angular.module('Core')
    .controller('CareSettingsCtrl', CareSettingsCtrl);

  function CareSettingsCtrl($interval, $q, $scope, $translate, Authinfo, Log, Notification, SunlightConfigService) {
    var vm = this;

    vm.status = {
      UNKNOWN: 'Unknown',
      PENDING: 'Pending',
      SUCCESS: 'Success',
      FAILURE: 'Failure',
    };

    vm.ONBOARDED = 'onboarded';
    vm.NOT_ONBOARDED = 'notOnboarded';
    vm.IN_PROGRESS = 'inProgress';

    vm.csOnboardingStatus = vm.status.UNKNOWN;
    vm.aaOnboardingStatus = vm.status.UNKNOWN;
    vm.appOnboardingStatus = vm.status.UNKNOWN;

    vm.careSetupDoneByAdmin = (Authinfo.getOrgId() === Authinfo.getUserOrgId());

    vm.state = vm.status.UNKNOWN;
    vm.errorCount = 0;

    vm.onboardToCare = function () {
      vm.state = vm.IN_PROGRESS;

      var promises = {};
      if (vm.csOnboardingStatus !== vm.status.SUCCESS) {
        promises.onBoardCS = SunlightConfigService.onBoardCare();
        promises.onBoardCS.then(function (result) {
          if (result.status === HttpStatus.ACCEPTED) {
            vm.csOnboardingStatus = vm.status.SUCCESS;
          }
        });
      }
      if (Authinfo.isCareVoice() && vm.aaOnboardingStatus !== vm.status.SUCCESS) {
        promises.onBoardAA = SunlightConfigService.aaOnboard();
        promises.onBoardAA.then(function (result) {
          if (result.status === HttpStatus.NO_CONTENT) {
            vm.aaOnboardingStatus = vm.status.SUCCESS;
          }
        });
      }
      if (vm.careSetupDoneByAdmin && vm.appOnboardingStatus !== vm.status.SUCCESS) {
        promises.onBoardBotApp = SunlightConfigService.onboardCareBot();
        promises.onBoardBotApp.then(function (result) {
          if (result.status === HttpStatus.NO_CONTENT) {
            vm.appOnboardingStatus = vm.status.SUCCESS;
          }
        });
      }
      $q.all(promises).then(function (results) {
        Log.debug('Care onboarding is success', results);
        startPolling();
      }, function (error) {
        vm.state = vm.NOT_ONBOARDED;
        Log.error('Care onboarding failed with error', error);
        Notification.errorWithTrackingId(error, $translate.instant('firstTimeWizard.setUpCareFailure'));
      });
    };

    var poller;
    var pollInterval = 10000;
    var pollRetryCount = 30;
    var pollErrorCount = 3;
    $scope.$on('$destroy', function () {
      $interval.cancel(poller);
      poller = undefined;
    });

    function startPolling() {
      if (!_.isUndefined(poller)) return;

      vm.errorCount = 0;
      poller = $interval(processOnboardStatus, pollInterval, pollRetryCount);
      poller.then(processTimeout);
    }

    function stopPolling() {
      if (!_.isUndefined(poller)) {
        $interval.cancel(poller);
        poller = undefined;
      }
    }

    function processOnboardStatus() {
      SunlightConfigService.getChatConfig().then(function (result) {
        var onboardingStatus = getOnboardingStatus(result);
        switch (onboardingStatus) {
          case vm.status.SUCCESS:
            Notification.success($translate.instant('firstTimeWizard.careSettingsComplete'));
            vm.state = vm.ONBOARDED;
            stopPolling();
            enableNext();
            break;
          case vm.status.FAILURE:
            Notification.errorWithTrackingId(result, $translate.instant('firstTimeWizard.setUpCareFailure'));
            vm.state = vm.NOT_ONBOARDED;
            stopPolling();
            break;
          default:
            Log.debug('Care setup status is not Success: ', result);
        }
      })
        .catch(function (result) {
          if (result.status !== 404) {
            Log.debug('Fetching Care setup status failed: ', result);
            if (vm.errorCount++ >= pollErrorCount) {
              vm.state = vm.status.UNKNOWN;
              Notification.errorWithTrackingId(result, 'firstTimeWizard.careSettingsFetchFailed');
              stopPolling();
            }
          }
        });
    }

    function processTimeout(pollerResult) {
      Log.debug('Poll timed out after ' + pollerResult + ' attempts.');
      vm.state = vm.NOT_ONBOARDED;
      Notification.error('firstTimeWizard.careSettingsTimeout');
    }

    function getOnboardingStatus(result) {
      var onboardingStatus = vm.status.UNKNOWN;
      vm.csOnboardingStatus = _.get(result, 'data.csOnboardingStatus');
      vm.aaOnboardingStatus = _.get(result, 'data.aaOnboardingStatus');
      if (vm.careSetupDoneByAdmin) {
        onboardingStatus = onboardingDoneByAdminStatus(result);
      } else {
        onboardingStatus = onboardingDoneByPartnerStatus();
      }
      return onboardingStatus;
    }

    function onboardingDoneByAdminStatus(result) {
      var onboardingDoneByAdminStatus = vm.status.UNKNOWN;
      vm.appOnboardingStatus = _.get(result, 'data.appOnboardStatus');
      if (vm.csOnboardingStatus === vm.status.SUCCESS && vm.appOnboardingStatus === vm.status.SUCCESS) {
        onboardingDoneByAdminStatus = onboardingStatusWhenCareVoiceEnabled();
      } else if (vm.csOnboardingStatus !== vm.status.SUCCESS) {
        onboardingDoneByAdminStatus = vm.csOnboardingStatus;
      } else if (vm.appOnboardingStatus !== vm.status.SUCCESS) {
        onboardingDoneByAdminStatus = vm.appOnboardingStatus;
      } else {
        onboardingDoneByAdminStatus = vm.status.UNKNOWN;
      }
      return onboardingDoneByAdminStatus;
    }

    function onboardingDoneByPartnerStatus() {
      var onboardingDoneByPartnerStatus = vm.status.UNKNOWN;
      if (vm.csOnboardingStatus === vm.status.SUCCESS) {
        onboardingDoneByPartnerStatus = onboardingStatusWhenCareVoiceEnabled();
      } else if (vm.csOnboardingStatus !== vm.status.SUCCESS) {
        onboardingDoneByPartnerStatus = vm.csOnboardingStatus;
      }
      return onboardingDoneByPartnerStatus;
    }

    function onboardingStatusWhenCareVoiceEnabled() {
      var status;
      if (Authinfo.isCareVoice()) {
        status = vm.aaOnboardingStatus;
      } else {
        status = vm.status.SUCCESS;
      }
      return status;
    }

    function enableNext() {
      _.set($scope.wizard, 'isNextDisabled', false);
    }

    function disableNext() {
      _.set($scope.wizard, 'isNextDisabled', true);
    }

    function init() {
      disableNext();

      SunlightConfigService.getChatConfig().then(function (result) {
        var onboardingStatus = getOnboardingStatus(result);
        switch (onboardingStatus) {
          case vm.status.PENDING:
            vm.state = vm.IN_PROGRESS;
            startPolling();
            break;
          case vm.status.SUCCESS:
            vm.state = vm.ONBOARDED;
            enableNext();
            break;
          default:
            vm.state = vm.NOT_ONBOARDED;
        }
      })
        .catch(function (result) {
          if (result.status === 404) {
            vm.state = vm.NOT_ONBOARDED;
          } else {
            Log.debug('Fetching Care setup status, on load, failed: ', result);
          }
        });
    }

    init();
  }
})();
