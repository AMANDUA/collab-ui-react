require('./_devices.scss');

(function () {
  'use strict';

  angular.module('Squared')
    .controller('DevicesCtrl',

      /* @ngInject */
      function ($q, $scope, $state, $translate, $templateCache, Userservice, DeviceFilter, CsdmHuronOrgDeviceService, CsdmDataModelService, Authinfo, AccountOrgService, WizardFactory, FeatureToggleService, $modal, Notification, DeviceExportService, ServiceDescriptor) {
        var vm = this;
        var filteredDevices = [];
        var exportProgressDialog = undefined;
        vm.addDeviceIsDisabled = true;

        AccountOrgService.getAccount(Authinfo.getOrgId()).success(function (data) {
          vm.showLicenseWarning = !!_.find(data.accounts, {
            licenses: [{
              offerName: "SD",
              status: "SUSPENDED",
            }],
          });
          vm.licenseError = vm.showLicenseWarning ? $translate.instant('spacesPage.licenseSuspendedWarning') : "";
        });

        function init() {
          fetchAsyncSettings();
        }

        function fetchAsyncSettings() {
          var ataPromise = FeatureToggleService.csdmATAGetStatus().then(function (result) {
            vm.showATA = result;
          });
          var hybridPromise = FeatureToggleService.csdmHybridCallGetStatus().then(function (feature) {
            vm.csdmHybridCallFeature = feature;
          });
          var personalPromise = FeatureToggleService.cloudberryPersonalModeGetStatus().then(function (result) {
            vm.showPersonal = result;
          });
          var placeCalendarPromise = FeatureToggleService.csdmPlaceCalendarGetStatus().then(function (feature) {
            vm.csdmHybridCalendarFeature = feature;
          });
          var anyCalendarEnabledPromise = ServiceDescriptor.getServices().then(function (services) {
            vm.hybridCalendarEnabledOnOrg = _.chain(ServiceDescriptor.filterEnabledServices(services)).filter(function (service) {
              return service.id === 'squared-fusion-gcal' || service.id === 'squared-fusion-cal';
            }).some().value();
            vm.hybridCallEnabledOnOrg = _.chain(ServiceDescriptor.filterEnabledServices(services)).filter(function (service) {
              return service.id === 'squared-fusion-uc';// || service.id === 'squared-fusion-cal';
            }).some().value();
          });
          $q.all([ataPromise, hybridPromise, personalPromise, placeCalendarPromise, anyCalendarEnabledPromise, fetchDetailsForLoggedInUser()]).finally(function () {
            vm.addDeviceIsDisabled = false;
          });

          FeatureToggleService.atlasDeviceExportGetStatus().then(function (result) {
            vm.deviceExportFeature = result;
          });
        }

        function fetchDetailsForLoggedInUser() {
          var userDetailsDeferred = $q.defer();
          Userservice.getUser('me', function (data) {
            if (data.success) {
              vm.adminUserDetails = {
                firstName: data.name && data.name.givenName,
                lastName: data.name && data.name.familyName,
                displayName: data.displayName,
                userName: data.userName,
                cisUuid: data.id,
                organizationId: data.meta.organizationID,
              };
              if (data.name) {
                vm.adminFirstName = data.name.givenName;
              }
              if (!vm.adminFirstName) {
                vm.adminFirstName = data.displayName;
              }
            }
            userDetailsDeferred.resolve();
          });
          return userDetailsDeferred.promise;
        }

        init();

        vm.deviceFilter = DeviceFilter;
        vm.deviceFilter.resetFilters();

        CsdmDataModelService.getDevicesMap(true).then(function (devicesMap) {
          vm.devicesMap = devicesMap;
          vm.updateListAndFilter();
        });

        CsdmDataModelService.devicePollerOn('data',
          function () {
            vm.updateListAndFilter();
          }, {
            scope: $scope,
          }
        );

        var csdmHuronOrgDeviceService = CsdmHuronOrgDeviceService.create(Authinfo.getOrgId());

        vm.setCurrentSearch = function (searchStr) {
          vm.deviceFilter.setCurrentSearch(searchStr);
          vm.updateListAndFilter();
        };
        vm.setCurrentFilter = function (filterValue) {
          vm.deviceFilter.setCurrentFilter(filterValue);
          vm.updateListAndFilter();
        };

        vm.existsDevices = function () {
          if (!vm._existsDevices) {
            vm._existsDevices = (vm.shouldShowList() && CsdmDataModelService.hasDevices());
          }
          return vm._existsDevices;
        };

        vm.shouldShowList = function () {
          return CsdmDataModelService.hasLoadedAllDeviceSources();
        };

        vm.isOrgEntitledToRoomSystem = function () {
          return Authinfo.isDeviceMgmt();
        };

        vm.isOrgEntitledToHuron = function () {
          return _.filter(Authinfo.getLicenses(), function (l) { return l.licenseType === 'COMMUNICATION'; }).length > 0;
        };

        vm.isEntitled = function () {
          return vm.isOrgEntitledToRoomSystem() || vm.isOrgEntitledToHuron();
        };

        vm.deviceList = function () {
          return filteredDevices;
        };
        vm.updateListAndFilter = function () {
          var allDevices = _.chain({})
            .extend(vm.devicesMap)
            .values()
            .value();
          filteredDevices = vm.deviceFilter.getFilteredList(allDevices);
          return filteredDevices;
        };

        CsdmDataModelService.subscribeToChanges($scope, vm.updateListAndFilter.bind(this));

        vm.showDeviceDetails = function (device) {
          vm.currentDevice = device; // fixme: modals depend on state set here
          $state.go('device-overview', {
            currentDevice: device,
            huronDeviceService: csdmHuronOrgDeviceService,
          });
        };

        vm.gridOptions = {
          data: 'sc.deviceList()',
          rowHeight: 45,
          enableRowHeaderSelection: false,
          enableColumnMenus: false,
          multiSelect: false,
          onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
              vm.showDeviceDetails(row.entity);
            });
          },

          columnDefs: [{
            field: 'photos',
            displayName: '',
            cellTemplate: getTemplate('_imageTpl'),
            sortable: false,
            width: 70,
          }, {
            field: 'displayName',
            displayName: $translate.instant('spacesPage.nameHeader'),
            sortingAlgorithm: sortFn,
            sort: {
              direction: 'asc',
              priority: 1,
            },
            sortCellFiltered: true,
          }, {
            field: 'state',
            displayName: $translate.instant('spacesPage.statusHeader'),
            cellTemplate: getTemplate('_statusTpl'),
            sortable: true,
            sortingAlgorithm: sortStateFn,
            sort: {
              direction: 'asc',
              priority: 0,
            },
          }, {
            field: 'product',
            displayName: $translate.instant('spacesPage.typeHeader'),
            cellTemplate: getTemplate('_productTpl'),
            sortingAlgorithm: sortFn,
          }],
        };

        var wizardWithoutPersonal = function () {
          return {
            data: {
              function: "addDevice",
              showATA: vm.showATA,
              showPersonal: false,
              admin: vm.adminUserDetails,
              csdmHybridCallFeature: vm.csdmHybridCallFeature,
              csdmHybridCalendarFeature: vm.csdmHybridCalendarFeature,
              hybridCalendarEnabledOnOrg: vm.hybridCalendarEnabledOnOrg,
              hybridCallEnabledOnOrg: vm.hybridCallEnabledOnOrg,
              title: "addDeviceWizard.newDevice",
              isEntitledToHuron: vm.isOrgEntitledToHuron(),
              isEntitledToRoomSystem: vm.isOrgEntitledToRoomSystem(),
              account: {
                organizationId: Authinfo.getOrgId(),
              },
              recipient: {
                cisUuid: Authinfo.getUserId(),
                displayName: vm.adminUserDetails.displayName,
                email: Authinfo.getPrimaryEmail(),
                organizationId: vm.adminUserDetails.organizationId,
                firstName: vm.adminFirstName,
              },
            },
            history: [],
            currentStateName: 'addDeviceFlow.chooseDeviceType',
            wizardState: {
              'addDeviceFlow.chooseDeviceType': {
                nextOptions: {
                  cloudberry: 'addDeviceFlow.chooseSharedSpace',
                  huron: 'addDeviceFlow.chooseAccountType',
                },
              },
              'addDeviceFlow.chooseAccountType': {
                nextOptions: {
                  shared: 'addDeviceFlow.chooseSharedSpace',
                  personal: 'addDeviceFlow.choosePersonal',
                },
              },
              'addDeviceFlow.choosePersonal': {
                next: 'addDeviceFlow.showActivationCode',
              },
              'addDeviceFlow.chooseSharedSpace': {
                nextOptions: {
                  cloudberry_existing: 'addDeviceFlow.showActivationCode',
                  cloudberry_create: 'addDeviceFlow.editServices',
                  huron_existing: 'addDeviceFlow.showActivationCode',
                  huron_create: 'addDeviceFlow.addLines',
                },
              },
              'addDeviceFlow.editServices': {
                nextOptions: {
                  sparkCall: 'addDeviceFlow.addLines',
                  sparkCallConnect: 'addDeviceFlow.callConnectOptions',
                  sparkOnly: 'addDeviceFlow.showActivationCode',
                  sparkOnlyAndCalendar: 'addDeviceFlow.editCalendarService',
                },
              },
              'addDeviceFlow.addLines': {
                nextOptions: {
                  next: 'addDeviceFlow.showActivationCode',
                  calendar: 'addDeviceFlow.editCalendarService',
                },
              },
              'addDeviceFlow.callConnectOptions': {
                nextOptions: {
                  next: 'addDeviceFlow.showActivationCode',
                  calendar: 'addDeviceFlow.editCalendarService',
                },
              },
              'addDeviceFlow.editCalendarService': {
                next: 'addDeviceFlow.showActivationCode',
              },
              'addDeviceFlow.showActivationCode': {},
            },
          };
        };

        var wizardWithPersonal = function () {
          return {
            data: {
              function: "addDevice",
              showATA: vm.showATA,
              showPersonal: true,
              admin: vm.adminUserDetails,
              csdmHybridCallFeature: vm.csdmHybridCallFeature,
              csdmHybridCalendarFeature: vm.csdmHybridCalendarFeature,
              hybridCalendarEnabledOnOrg: vm.hybridCalendarEnabledOnOrg,
              hybridCallEnabledOnOrg: vm.hybridCallEnabledOnOrg,
              title: "addDeviceWizard.newDevice",
              isEntitledToHuron: vm.isOrgEntitledToHuron(),
              isEntitledToRoomSystem: vm.isOrgEntitledToRoomSystem(),
              account: {
                organizationId: Authinfo.getOrgId(),
              },
              recipient: {
                cisUuid: Authinfo.getUserId(),
                displayName: vm.adminUserDetails.displayName,
                email: Authinfo.getPrimaryEmail(),
                organizationId: vm.adminUserDetails.organizationId,
                firstName: vm.adminFirstName,
              },
            },
            history: [],
            currentStateName: 'addDeviceFlow.chooseAccountType',
            wizardState: {
              'addDeviceFlow.chooseAccountType': {
                nextOptions: {
                  shared: 'addDeviceFlow.chooseSharedSpace',
                  personal: 'addDeviceFlow.choosePersonal',
                },
              },
              'addDeviceFlow.choosePersonal': {
                next: 'addDeviceFlow.showActivationCode',
              },
              'addDeviceFlow.chooseSharedSpace': {
                nextOptions: {
                  existing: 'addDeviceFlow.showActivationCode',
                  create: 'addDeviceFlow.chooseDeviceType',
                },
              },
              'addDeviceFlow.chooseDeviceType': {
                nextOptions: {
                  cloudberry: 'addDeviceFlow.editServices',
                  huron: 'addDeviceFlow.addLines',
                },
              },
              'addDeviceFlow.editServices': {
                nextOptions: {
                  sparkCall: 'addDeviceFlow.addLines',
                  sparkCallConnect: 'addDeviceFlow.callConnectOptions',
                  sparkOnly: 'addDeviceFlow.showActivationCode',
                  sparkOnlyAndCalendar: 'addDeviceFlow.editCalendarService',
                },
              },
              'addDeviceFlow.addLines': {
                nextOptions: {
                  next: 'addDeviceFlow.showActivationCode',
                  calendar: 'addDeviceFlow.editCalendarService',
                },
              },
              'addDeviceFlow.callConnectOptions': {
                nextOptions: {
                  next: 'addDeviceFlow.showActivationCode',
                  calendar: 'addDeviceFlow.editCalendarService',
                },
              },
              'addDeviceFlow.editCalendarService': {
                next: 'addDeviceFlow.showActivationCode',
              },
              'addDeviceFlow.showActivationCode': {},
            },
          };
        };

        vm.startAddDeviceFlow = function () {
          var wizard = WizardFactory.create(vm.showPersonal ? wizardWithPersonal() : wizardWithoutPersonal());
          $state.go(wizard.state().currentStateName, {
            wizard: wizard,
          });
        };

        vm.startDeviceExport = function () {
          $modal.open({
            templateUrl: "modules/squared/devices/export/devices-export.html",
            type: 'dialog',
          }).result.then(function () {
            vm.openExportProgressTracker();
          }, function () {
            vm.exporting = false;
          });
        };

        vm.openExportProgressTracker = function () {
          exportProgressDialog = $modal.open({
            templateUrl: 'modules/squared/devices/export/devices-export-progress.html',
            type: 'dialog',
            controller: function () {
              var vm = this;
              vm.cancelExport = function () {
                DeviceExportService.cancelExport();
              };
            },
            controllerAs: 'vm',
          });
          exportProgressDialog.opened.then(function () {
            vm.exporting = true;
            DeviceExportService.exportDevices(vm.exportStatus);
          });
        };

        vm.exportStatus = function (percent) {
          if (percent === 100) {
            exportProgressDialog.close();
            vm.exporting = false;
            var title = $translate.instant('spacesPage.export.exportCompleted');
            var text = $translate.instant('spacesPage.export.deviceListReadyForDownload');
            Notification.success(text, title);
          } else if (percent === -1) {
            exportProgressDialog.close();
            vm.exporting = false;
            var warn = $translate.instant('spacesPage.export.deviceExportFailedOrCancelled');
            Notification.warning(warn);
          }
        };

        function getTemplate(name) {
          return $templateCache.get('modules/squared/devices/templates/' + name + '.html');
        }

        function sortFn(a, b) {
          if (a && a.localeCompare) {
            return a.localeCompare(b);
          }
          return 1;
        }

        function sortStateFn(a, b) {
          if (!a) {
            return b.priority;
          }
          return a.priority - b.priority;
        }
      }
    );
})();
