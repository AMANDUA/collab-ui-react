(function () {
  'use strict';

  // TODO: refactor - do not use 'ngtemplate-loader' or ng-include directive
  var usersCardTemplatePath = require('ngtemplate-loader?module=Core!./usersCard.tpl.html');

  angular
    .module('Core')
    .factory('OverviewUsersCard', OverviewUsersCard);

  /* @ngInject */
  function OverviewUsersCard($q, $rootScope, $state, $timeout, $translate, Config, DirSyncService, FeatureToggleService, ModalService, Orgservice) {
    return {
      createCard: function createCard() {
        var card = {};
        card.features = {};
        card.autoAssignLicensesStatus = undefined;

        card.name = 'overview.cards.users.title';
        card.template = usersCardTemplatePath;
        card.cardClass = 'user-card';
        card.icon = 'icon-circle-user';
        card.isUpdating = true;
        card.showLicenseCard = false;

        card.unlicensedUsersHandler = function (data) {
          if (data.success) {
            // for now use the length to get the count as there is a bug in CI and totalResults is not accurate.
            card.usersToConvert = Math.max((data.resources || []).length, data.totalResults);
            if (card.usersToConvert === 0) {
              card.name = 'overview.cards.licenses.title';
              card.showLicenseCard = true;
              getUnassignedLicenses();
            }
          }
        };

        function getUnassignedLicenses() {
          Orgservice.getLicensesUsage().then(function (response) {
            var licenses = _.flatMap(response, 'licenses');
            if (licenses.length > 0) {
              displayLicenseData(licenses);
            }
          });
        }

        function displayLicenseData(licenses) {
          var finalCounts = {};
          var sharedDevices = {};
          // TODO: Would benefit from a shared service for license counts w/mySubscriptions and helpdesk
          _.forEach(licenses, function (data) {
            if (data.licenseType === Config.licenseTypes.SHARED_DEVICES) {
              if (data.offerName in sharedDevices) {
                sharedDevices[data.offerName].volume = sharedDevices[data.offerName].volume + data.volume;
              } else {
                sharedDevices[data.offerName] = {
                  volume: data.volume,
                  usage: data.usage,
                };
              }
            } else if (data.licenseType in finalCounts) {
              finalCounts[data.licenseType].volume = finalCounts[data.licenseType].volume + data.volume;
              finalCounts[data.licenseType].usage = finalCounts[data.licenseType].usage + data.usage;
            } else {
              finalCounts[data.licenseType] = {
                volume: data.volume,
                usage: data.usage,
              };
            }
          });

          _.forEach(sharedDevices, function (deviceType) {
            if (Config.licenseTypes.SHARED_DEVICES in finalCounts) {
              finalCounts[Config.licenseTypes.SHARED_DEVICES].volume = finalCounts[Config.licenseTypes.SHARED_DEVICES].volume + deviceType.volume;
              finalCounts[Config.licenseTypes.SHARED_DEVICES].usage = finalCounts[Config.licenseTypes.SHARED_DEVICES].usage + deviceType.usage;
            } else {
              finalCounts[Config.licenseTypes.SHARED_DEVICES] = {
                volume: deviceType.volume,
                usage: deviceType.usage,
              };
            }
          });

          var displayKey;
          var volume = 0;
          var usage = 0;
          _.forEach(finalCounts, function (countData, key) {
            if ((key !== Config.licenseTypes.STORAGE && countData.volume > volume) || (key === Config.licenseTypes.MESSAGING && countData.volume === volume)) {
              displayKey = key;
              volume = countData.volume;
              usage = countData.usage;
            }
          });

          if (displayKey) {
            card.licenseNumber = volume - usage;
            card.licenseType = displayKey;
          }
        }

        card.orgEventHandler = function (data) {
          if (data.success) {
            card.ssoEnabled = data.ssoEnabled || false;
            //ssoEnabled is used in enterpriseSettingsCtrl so share through rootScope
            if (data.ssoEnabled) {
              $rootScope.ssoEnabled = true;
            }
          }
          var dirSyncPromise = (DirSyncService.requiresRefresh() ? DirSyncService.refreshStatus() : $q.resolve());
          dirSyncPromise.finally(function () {
            card.dirsyncEnabled = DirSyncService.isDirSyncEnabled();
            card.isUpdating = false;
          });
        };

        function goToUsersConvert(options) {
          $state.go('users.convert', options);
        }

        card.isConvertButtonDisabled = function () {
          return card.isUpdating || !card.usersToConvert;
        };

        card.openConvertModal = function () {
          if (card.dirsyncEnabled) {
            ModalService.open({
              message: '<span>' + $translate.instant('homePage.convertUsersDirSyncEnabledWarning') + '</span>',
              title: $translate.instant('userManage.ad.adStatus'),
            }).result.then(function () {
              goToUsersConvert({
                readOnly: true,
              });
            });
          } else {
            goToUsersConvert();
          }
        };

        card.showSSOSettings = function () {
          $state.go('setupwizardmodal', {
            currentTab: 'enterpriseSettings',
            currentStep: 'init',
            onlyShowSingleTab: true,
            showStandardModal: true,
          });
        };

        card.showDirSyncSettings = function () {
          $state.go('settings', {
            showSettings: 'dirsync',
          });
        };

        card.manageUsers = function () {
          // notes:
          // - simply calling '$state.go(...)' inside of the callback does not seem to produce correct behavior
          // - workaround for now is to delay the subsequent call till the next tick
          // TODO: reverify after angular-ui-router upgrade
          $state.go('users.list').then(function () {
            $timeout(function () {
              $state.go('users.manage.picker');
            });
          });
        };

        card.showAutoAssignLicensesEditModal = function () {
          $state.go('users.list').then(function () {
            $timeout(function () {
              $state.go('users.manage.org');
            });
          });
        };

        card.getAutoAssignLicensesStatusCssClass = function () {
          var cssClassNames = {
            ACTIVATED: 'success',
            DEACTIVATED: 'warning',
          };
          if (_.isNil(card.autoAssignLicensesStatus)) {
            return 'disabled';
          }
          return cssClassNames[card.autoAssignLicensesStatus];
        };

        function initFeatureToggles() {
          return $q.all({
            atlasF3745AutoAssignLicenses: FeatureToggleService.atlasF3745AutoAssignLicensesGetStatus(),
          }).then(function (features) {
            card.features = features;
          });
        }

        // TODO: f3745 - rip this out once backend is available
        function initFakeValues() {
          // TODO: f3745 - apply logic for values returned by backend, once known
          // - currently assume enum of ('ACTIVATED'|'DEACTIVATED'|null)
          if (card.features.atlasF3745AutoAssignLicenses) {
            card.autoAssignLicensesStatus = 'ACTIVATED';
            // card.autoAssignLicensesStatus = 'DEACTIVATED';
            // card.autoAssignLicensesStatus = null;
          }
        }

        initFeatureToggles().then(initFakeValues);

        return card;
      },
    };
  }
})();
