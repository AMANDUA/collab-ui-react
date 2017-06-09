require('./_setup-wizard.scss');

(function () {
  'use strict';

  angular.module('Core')
    .controller('SetupWizardCtrl', SetupWizardCtrl);

  function SetupWizardCtrl($q, $scope, $state, $stateParams, Authinfo, Config, FeatureToggleService, Orgservice, Utils, DirSyncService) {
    var isFirstTimeSetup = _.get($state, 'current.data.firstTimeSetup', false);
    var shouldRemoveAddUserTab = false;
    var shouldRemoveSSOSteps = false;
    var isSharedDevicesOnlyLicense = false;
    var supportsAtlasPMRonM2 = false;

    $scope.tabs = [];
    $scope.isDirSyncEnabled = false;
    $scope.isTelstraCsbEnabled = false;
    $scope.isCSB = Authinfo.isCSB();

    if (Authinfo.isCustomerAdmin()) {
      initToggles().finally(init);
    }

    function initToggles() {
      var atlasFTSWRemoveUsersSSOPromise = FeatureToggleService.supports(FeatureToggleService.features.atlasFTSWRemoveUsersSSO)
        .then(function (atlasFTSWRemoveUsersSSO) {
          if (atlasFTSWRemoveUsersSSO) {
            shouldRemoveAddUserTab = true;
            if (isFirstTimeSetup) {
              shouldRemoveSSOSteps = true;
            }
          } else {
            return DirSyncService.refreshStatus().then(function () {
              $scope.isDirSyncEnabled = DirSyncService.isDirSyncEnabled();
            });
          }
        });

      var tenDigitExtPromise = FeatureToggleService.supports(FeatureToggleService.features.sparkCallTenDigitExt)
        .then(function (sparkCallTenDigitExt) {
          $scope.sparkCallTenDigitExtEnabled = sparkCallTenDigitExt;
        });

      var adminOrgUsagePromise = Orgservice.getAdminOrgUsage()
        .then(function (subscriptions) {
          var licenseTypes = Utils.getDeepKeyValues(subscriptions, 'licenseType');
          isSharedDevicesOnlyLicense = _.without(licenseTypes, Config.licenseTypes.SHARED_DEVICES).length === 0;
        })
        .catch(_.noop);

      var atlasPMRonM2Promise = FeatureToggleService.supports(FeatureToggleService.features.atlasPMRonM2)
        .then(function (_supportsAtlasPMRonM2) {
          supportsAtlasPMRonM2 = _supportsAtlasPMRonM2;
        });

      return $q.all([
        atlasFTSWRemoveUsersSSOPromise,
        adminOrgUsagePromise,
        atlasPMRonM2Promise,
        tenDigitExtPromise,
      ]);
    }

    function init() {
      var tabs = getInitTabs();
      initAddUserTab(tabs);
      initEnterpriseSettingsTab(tabs);
      initMeetingSettingsTab(tabs);
      initCallSettingsTab(tabs);
      initCareTab(tabs);
      initCSB(tabs);
      initSharedDeviceOnly(tabs);
      initAtlasPMRonM2(tabs);
      initFinishTab(tabs);
      removeTabsWithEmptySteps(tabs);
      $scope.tabs = filterTabsByStateParams(tabs);
    }

    function getInitTabs() {
      return [{
        name: 'planReview',
        label: 'firstTimeWizard.planReview',
        description: 'firstTimeWizard.planReviewSub',
        icon: 'icon-plan-review',
        title: 'firstTimeWizard.planReview',
        controller: 'PlanReviewCtrl as planReview',
        steps: [{
          name: 'init',
          template: 'modules/core/setupWizard/planReview/planReview.tpl.html',
        }],
      }, {
        name: 'messagingSetup',
        label: 'firstTimeWizard.messageSettings',
        description: 'firstTimeWizard.messagingSetupSub',
        icon: 'icon-convo',
        title: 'firstTimeWizard.messagingSetup',
        controller: 'MessagingSetupCtrl as msgSetup',
        steps: [{
          name: 'setup',
          template: 'modules/core/setupWizard/messageSettings/messagingSetup.tpl.html',
        }],
      }, {
        name: 'enterpriseSettings',
        label: 'firstTimeWizard.enterpriseSettings',
        description: 'firstTimeWizard.enterpriseSettingsSub',
        icon: 'icon-settings',
        title: 'firstTimeWizard.enterpriseSettings',
        controller: 'EnterpriseSettingsCtrl as entprCtrl',
        steps: [{
          name: 'enterpriseSipUrl',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.setSipDomain.tpl.html',
        }, {
          name: 'init',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.init.tpl.html',
        }, {
          name: 'exportMetadata',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.exportMetadata.tpl.html',
        }, {
          name: 'importIdp',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.importIdp.tpl.html',
        }, {
          name: 'testSSO',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.testSSO.tpl.html',
        }],
      }, {
        name: 'addUsers',
        label: 'firstTimeWizard.addUsers',
        description: 'firstTimeWizard.addUsersSubDescription',
        icon: 'icon-add-users',
        title: 'firstTimeWizard.addUsers',
        controller: 'AddUserCtrl',
        subTabs: [{
          name: 'csv',
          controller: 'UserCsvCtrl as csv',
          controllerAs: 'csv',
          steps: [{
            name: 'init',
            template: 'modules/core/setupWizard/addUsers/addUsers.init.tpl.html',
          }, {
            name: 'csvDownload',
            template: 'modules/core/setupWizard/addUsers/addUsers.downloadCsv.tpl.html',
          }, {
            name: 'csvUpload',
            template: 'modules/core/setupWizard/addUsers/addUsers.uploadCsv.tpl.html',
          }, {
            name: 'csvProcessing',
            template: 'modules/core/setupWizard/addUsers/addUsers.processCsv.tpl.html',
            buttons: false,
          }, {
            name: 'csvResult',
            template: 'modules/core/setupWizard/addUsers/addUsers.uploadResult.tpl.html',
            buttons: 'modules/core/setupWizard/addUsers/addUsers.csvResultButtons.tpl.html',
          }],
        }, {
          name: 'advanced',
          controller: 'OnboardCtrl',
          steps: [{
            name: 'init',
            template: 'modules/core/setupWizard/addUsers/addUsers.init.tpl.html',
          }, {
            name: 'installConnector',
            template: 'modules/core/setupWizard/addUsers/addUsers.installConnector.tpl.html',
          }, {
            name: 'syncStatus',
            template: 'modules/core/setupWizard/addUsers/addUsers.syncStatus.tpl.html',
          }],
        }],
      }];
    }

    function initAddUserTab(tabs) {
      var userTab = _.find(tabs, {
        name: 'addUsers',
      });
      if (userTab) {
        if (shouldRemoveAddUserTab) {
          _.remove(tabs, userTab);
          return;
        }

        var simpleSubTab = {
          name: 'simple',
          controller: 'OnboardCtrl',
          steps: [{
            name: 'init',
            template: 'modules/core/setupWizard/addUsers/addUsers.init.tpl.html',
          }, {
            name: 'manualEntry',
            template: 'modules/core/setupWizard/addUsers/addUsers.manualEntry.tpl.html',
          }, {
            name: 'assignServices',
            template: 'modules/core/setupWizard/addUsers/addUsers.assignServices.tpl.html',
          }, {
            name: 'assignDnAndDirectLines',
            template: 'modules/core/setupWizard/addUsers/addUsers.assignDnAndDirectLines.tpl.html',
          }, {
            name: 'addUsersResults',
            template: 'modules/core/setupWizard/addUsers/addUsers.results.tpl.html',
          }],
        };
        var advancedSubTabSteps = [{
          name: 'dirsyncServices',
          template: 'modules/core/setupWizard/addUsers/addUsers.assignServices.tpl.html',
        }, {
          name: 'dirsyncProcessing',
          template: 'modules/core/setupWizard/addUsers/addUsers.processDirSync.tpl.html',
          buttons: false,
        }, {
          name: 'dirsyncResult',
          template: 'modules/core/setupWizard/addUsers/addUsers.uploadResultDirSync.tpl.html',
          buttons: 'modules/core/setupWizard/addUsers/addUsers.dirSyncResultButtons.tpl.html',
        }];

        if ($scope.isDirSyncEnabled) {
          var advancedSubTab = _.find(userTab.subTabs, {
            name: 'advanced',
          });
          advancedSubTab.steps = advancedSubTab.steps.concat(advancedSubTabSteps);
        } else {
          userTab.subTabs.splice(0, 0, simpleSubTab);
        }
      }
    }

    function initMeetingSettingsTab(tabs) {
      var userEmail = Authinfo.getUserName();
      var trialFlowSteps = [{
        name: 'migrateTrial',
        template: 'modules/core/setupWizard/meeting-settings/meeting-migrate-trial.html',
      },
      {
        name: 'siteSetup',
        template: 'modules/core/setupWizard/meeting-settings/meeting-site-setup.html',
      },
      {
        name: 'licenseDistribution',
        template: 'modules/core/setupWizard/meeting-settings/meeting-license-distribution.html',
      },
      {
        name: 'summary',
        template: 'modules/core/setupWizard/meeting-settings/meeting-summary.html',
      }];
      var meetingTab = {
        name: 'meetingSettings',
        required: true,
        label: 'firstTimeWizard.meetingSettings',
        description: 'firstTimeWizard.setupMeetingService',
        icon: 'icon-conference',
        title: 'firstTimeWizard.setupWebexMeetingSites',
        controller: 'MeetingSettingsCtrl as meetingCtrl',
        controllerAs: 'meetingCtrl',
        steps: [{
          name: 'init',
          template: 'modules/core/setupWizard/meeting-settings/meeting-init.html',
        }],
      };

      if (showMeetingSettingsTab(userEmail)) {
        if (hasWebexMeetingTrial()) {
          _.remove(meetingTab.steps, { name: 'init' });
        } else if (isDirectOrderWithoutTrial()) {
          _.remove(meetingTab.steps, { name: 'migrateTrial' });
        }
        meetingTab.steps = meetingTab.steps.concat(trialFlowSteps);
        tabs.splice(1, 0, meetingTab);
      }
    }

    function initEnterpriseSettingsTab(tabs) {
      if (shouldRemoveSSOSteps) {
        var enterpriseSettingTab = _.find(tabs, {
          name: 'enterpriseSettings',
        }, {});
        var ssoInitIndex = _.findIndex(enterpriseSettingTab.steps, {
          name: 'init',
        });
        if (ssoInitIndex > -1) {
          enterpriseSettingTab.steps.splice(ssoInitIndex);
        }
      }
    }

    function initCallSettingsTab(tabs) {
      if (showCallSettings()) {
        if ($scope.sparkCallTenDigitExtEnabled) {
          tabs.splice(1, 0, {
            name: 'serviceSetup',
            required: true,
            label: 'firstTimeWizard.callSettings',
            description: 'firstTimeWizard.serviceSetupSub',
            icon: 'icon-calls',
            title: 'firstTimeWizard.unifiedCommunication',
            controllerAs: '$ctrl',
            steps: [{
              name: 'init',
              template: 'modules/core/setupWizard/callSettings/serviceSetup.html',
            }],
          });
        } else {
          tabs.splice(1, 0, {
            name: 'serviceSetup',
            required: true,
            label: 'firstTimeWizard.callSettings',
            description: 'firstTimeWizard.serviceSetupSub',
            icon: 'icon-calls',
            title: 'firstTimeWizard.unifiedCommunication',
            controller: 'ServiceSetupCtrl as squaredUcSetup',
            controllerAs: 'squaredUcSetup',
            steps: [{
              name: 'init',
              template: 'modules/core/setupWizard/callSettings/serviceSetup.tpl.html',
            }],
          });
        }
      }
    }

    function showMeetingSettingsTab(userEmail) {
      if (_.isEmpty(userEmail)) {
        return false;
      }

      // Currently we are deferentiating trial migration orders for WebEx meeting sites setup by a prefix/suffix of 'ordersimp' in the users email.
      return _.toLower(userEmail.split('+')[1]) === 'ordersimp@gmail.com' || _.toLower(userEmail.split('+')[0]) === 'ordersimp' || _.toLower(userEmail.split('-')[0]) === 'ordersimp';
    }

    function hasWebexMeetingTrial() {
      var conferencingServices = _.filter(Authinfo.getConferenceServices(), { license: { isTrial: true } });

      return _.some(conferencingServices, function (service) {
        return _.get(service, 'license.offerName') === Config.offerCodes.MC || _.get(service, 'license.offerName') === Config.offerCodes.EE;
      });
    }

    function isDirectOrderWithoutTrial() {
      return !hasWebexMeetingTrial();
    }

    function showCallSettings() {
      return _.some(Authinfo.getLicenses(), function (license) {
        return license.licenseType === Config.licenseTypes.COMMUNICATION || license.licenseType === Config.licenseTypes.SHARED_DEVICES;
      });
    }

    function initCareTab(tabs) {
      if (Authinfo.isCare()) {
        var careTab = {
          name: 'careSettings',
          label: 'firstTimeWizard.careSettings',
          description: 'firstTimeWizard.careSettingsSub',
          icon: 'icon-headset',
          title: 'firstTimeWizard.careSettings',
          controller: 'CareSettingsCtrl as careSettings',
          steps: [{
            name: 'csonboard',
            template: 'modules/core/setupWizard/careSettings/careSettings.tpl.html',
          }],
        };

        var userOrFinishTabIndex = _.findIndex(tabs, function (tab) {
          return (tab.name === 'finish' || tab.name === 'addUsers');
        });

        if (userOrFinishTabIndex === -1) { // addUsers and finish tab not found
          tabs.push(careTab);
        } else {
          tabs.splice(userOrFinishTabIndex, 0, careTab);
        }
      }
    }

    function initCSB(tabs) {
      if ($scope.isCSB) {
        _.remove(tabs, {
          name: 'addUsers',
        });
      }
    }

    function initSharedDeviceOnly(tabs) {
      if (isSharedDevicesOnlyLicense) {
        _.remove(tabs, function (tab) {
          return tab.name === 'messagingSetup' || tab.name === 'addUsers';
        });
        if (isFirstTimeSetup) {
          _.forEach(tabs, function (tab) {
            if (tab.name === 'enterpriseSettings') {
              tab.steps = _.reject(tab.steps, function (step) {
                return (step.name === 'init') || step.name === 'exportMetadata' || step.name === 'importIdp' || step.name === 'testSSO';
              });
            }
          });
        }
      }
    }

    function initAtlasPMRonM2(tabs) {
      if (supportsAtlasPMRonM2) {
        var step = {
          name: 'enterprisePmrSetup',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.pmrSetup.tpl.html',
        };
        var enterpriseSettings = _.find(tabs, {
          name: 'enterpriseSettings',
        });
        if (enterpriseSettings) {
          enterpriseSettings.steps.splice(1, 0, step);
        }
      }
    }

    function initFinishTab(tabs) {
      if (!Authinfo.isSetupDone()) {
        tabs.push({
          name: 'finish',
          label: 'firstTimeWizard.finish',
          description: 'firstTimeWizard.finishSub',
          icon: 'icon-check',
          title: 'firstTimeWizard.getStarted',
          controller: 'WizardFinishCtrl',
          steps: [{
            name: 'init',
            template: 'modules/core/setupWizard/finish/finish.tpl.html',
          }],
        });
      }
    }

    function removeTabsWithEmptySteps(tabs) {
      _.remove(tabs, function (tab) {
        return _.isArray(tab.steps) && tab.steps.length === 0;
      });
    }

    function filterTabsByStateParams(tabs) {
      if (!($stateParams.onlyShowSingleTab && $stateParams.currentTab)) {
        return tabs;
      }

      var filteredTabs = _.filter(tabs, function (tab) {
        return ($stateParams.currentTab === tab.name);
      });

      if ($stateParams.currentStep && filteredTabs.length === 1 && filteredTabs[0].steps) {
        //prevent "back" button if a step is defined in single tab mode:
        var tab = filteredTabs[0];
        var index = _.findIndex(tab.steps, {
          name: $stateParams.currentStep,
        });
        if (index > 0) {
          tab.steps.splice(0, index);
          // currentStep is now 0 index
          index = 0;
        }
        if ($stateParams.numberOfSteps) {
          // if specific number of steps, make sure no steps following
          tab.steps = _.slice(tab.steps, index, index + $stateParams.numberOfSteps);
        }
      }
      return filteredTabs;
    }
  }
})();
