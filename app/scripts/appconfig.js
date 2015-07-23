'use strict';
angular
  .module('wx2AdminWebClientApp')
  .config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$translateProvider',
    function ($httpProvider, $stateProvider, $urlRouterProvider, $translateProvider) {
      var sidepanelMemo = 'sidepanelMemo';

      $urlRouterProvider.otherwise('login');
      $stateProvider
        .state('login', {
          url: '/login',
          views: {
            'main@': {
              templateUrl: 'modules/core/login/login.tpl.html',
              controller: 'LoginCtrl'
            }
          },
          authenticate: false
        })
        .state('main', {
          views: {
            'main@': {
              templateUrl: 'modules/core/views/main.tpl.html'
            }
          },
          abstract: true,
          sticky: true
        })
        .state('partner', {
          template: '<div ui-view></div>',
          url: '/partner',
          parent: 'main',
          abstract: true
        })
        .state('unauthorized', {
          url: '/unauthorized',
          templateUrl: 'modules/squared/views/unauthorized.html',
          parent: 'main'
        })
        .state('sidepanel', {
          abstract: true,
          onEnter: ['$modal', '$state', '$previousState',
            function ($modal, $state, $previousState) {
              $previousState.memo(sidepanelMemo);
              $state.sidepanel = $modal.open({
                template: '<cs-sidepanel></cs-sidepanel>',
                windowTemplateUrl: 'sidepanel/sidepanel-modal.tpl.html',
                backdrop: false,
                keyboard: false
              });
              $state.sidepanel.result.finally(function () {
                $state.sidepanel = null;
                var previousState = $previousState.get(sidepanelMemo);
                if (previousState) {
                  return $previousState.go(sidepanelMemo);
                }
              });
            }
          ],
          onExit: ['$state', '$previousState',
            function ($state, $previousState) {
              if ($state.sidepanel) {
                $previousState.forget(sidepanelMemo);
                $state.sidepanel.close();
              }
            }
          ]
        });

      $httpProvider.interceptors.push('TrackingIDInterceptor');
      $httpProvider.interceptors.push('ResponseInterceptor');

      $translateProvider.useStaticFilesLoader({
        prefix: 'l10n/',
        suffix: '.json'
      });

      $translateProvider.addInterpolation('$translateMessageFormatInterpolation');

      var defaultLang = 'en_US';

      //Tell the module what language to use by default
      $translateProvider.preferredLanguage(defaultLang);
    }
  ]);

angular
  .module('Squared')
  .config(['$urlRouterProvider', '$stateProvider',
    function ($urlRouterProvider, $stateProvider) {

      // Modal States Enter and Exit functions
      function modalOnEnter(size) {
        /* @ngInject */
        return function ($modal, $state, $previousState) {
          $previousState.memo(modalMemo);
          $state.modal = $modal.open({
            template: '<div ui-view="modal"></div>',
            size: size
          });
          $state.modal.result.finally(function () {
            $state.modal = null;
            var previousState = $previousState.get(modalMemo);
            if (previousState) {
              return $previousState.go(modalMemo);
            }
          });
        };
      }

      modalOnExit.$inject = ['$state', '$previousState'];

      function modalOnExit($state, $previousState) {
        if ($state.modal) {
          $previousState.forget(modalMemo);
          $state.modal.close();
        }
      }

      var modalMemo = 'modalMemo';
      var wizardmodalMemo = 'wizardmodalMemo';

      $stateProvider
        .state('activate', {
          url: '/activate',
          templateUrl: 'modules/squared/views/activate.html',
          controller: 'ActivateCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('csadmin', {
          url: '/csadmin?eqp',
          templateUrl: 'modules/squared/csadmin/csadmin.html',
          controller: 'CsAdminCtrl',
          parent: 'main'
        })
        .state('downloads', {
          url: '/downloads',
          templateUrl: 'modules/squared/views/downloads.html',
          controller: 'DownloadsCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('profile', {
          url: '/profile',
          templateUrl: 'modules/core/partnerProfile/partnerProfile.tpl.html',
          controller: 'PartnerProfileCtrl',
          parent: 'main'
        })
        .state('invite', {
          url: '/invite',
          templateUrl: 'modules/squared/views/invite.html',
          controller: 'InviteCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('invitelauncher', {
          url: '/invitelauncher',
          templateUrl: 'modules/squared/views/invitelauncher.html',
          controller: 'InvitelauncherCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('applauncher', {
          url: '/applauncher',
          templateUrl: 'modules/squared/views/applauncher.html',
          controller: 'ApplauncherCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('appdownload', {
          url: '/appdownload',
          templateUrl: 'modules/squared/views/appdownload.html',
          controller: 'AppdownloadCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('processorder', {
          url: '/processorder',
          templateUrl: 'modules/squared/views/processorder.html',
          controller: 'ProcessorderCtrl',
          parent: 'main',
          authenticate: false
        })
        .state('overview', {
          url: '/overview',
          templateUrl: 'modules/core/landingPage/landingPage.tpl.html',
          controller: 'LandingPageCtrl',
          parent: 'main'
        })
        .state('users', {
          abstract: true,
          template: '<div ui-view></div>',
          parent: 'main'
        })
        .state('users.list', {
          url: '/users',
          templateUrl: 'modules/core/users/userList/userList.tpl.html',
          controller: 'ListUsersCtrl',
          params: {
            showAddUsers: {}
          }
        })
        .state('users.delete', {
          parent: 'modal',
          views: {
            'modal@': {
              controller: 'UserDeleteCtrl',
              templateUrl: 'modules/core/users/userDelete/userDelete.tpl.html'
            }
          },
          params: {
            deleteUserOrgId: null,
            deleteUserUuId: null,
            deleteUsername: null,
            deleteUserfamilyName: null,
            Username: null
          }
        })
        .state('users.deleteSelf', {
          parent: 'modal',
          views: {
            'modal@': {
              controller: 'UserDeleteCtrl',
              templateUrl: 'modules/core/users/userDelete/userDeleteSelf.tpl.html'
            }
          },
          params: {
            deleteUserOrgId: null,
            deleteUserUuId: null,
            deleteUsername: null
          }
        })
        .state('users.add', {
          parent: 'modalLarge',
          views: {
            'modal@': {
              controller: 'OnboardCtrl',
              template: '<div ui-view="usersAdd"></div>'
            },
            'usersAdd@users.add': {
              templateUrl: 'modules/core/users/userAdd/onboardUsersModal.tpl.html'
            }
          }
        })
        .state('users.add.services', {
          views: {
            'usersAdd@users.add': {
              templateUrl: 'modules/core/users/userAdd/assignServicesModal.tpl.html'
            }
          }
        })
        .state('users.convert', {
          parent: 'modalLarge',
          views: {
            'modal@': {
              controller: 'OnboardCtrl',
              template: '<div ui-view="usersConvert"></div>'
            },
            'usersConvert@users.convert': {
              templateUrl: 'modules/core/convertUsers/convertUsersModal.tpl.html'
            }
          }
        })
        .state('users.convert.services', {
          views: {
            'usersConvert@users.convert': {
              templateUrl: 'modules/core/users/userAdd/assignServicesModal.tpl.html'
            }
          }
        })
        .state('editService', {
          parent: 'modalLarge',
          views: {
            'modal@': {
              controller: 'OnboardCtrl',
              templateUrl: 'modules/core/users/userPreview/editServices.tpl.html'
            }
          },
          params: {
            currentUser: {}
          }
        })
        .state('user-overview', {
          parent: 'sidepanel',
          views: {
            'sidepanel@': {
              controller: 'UserOverviewCtrl',
              controllerAs: 'userOverview',
              templateUrl: 'modules/core/users/userOverview/userOverview.tpl.html'
            },
            'header@user-overview': {
              templateUrl: 'modules/core/users/userOverview/userHeader.tpl.html'
            }
          },
          resolve: {
            currentUser: /* @ngInject */ function ($http, $stateParams, Config, Utils, Authinfo) {
              var scimUrl = Config.getScimUrl();
              var userUrl = Utils.sprintf(scimUrl, [Authinfo.getOrgId()]) + '/' + $stateParams.currentUser.id;

              return $http.get(userUrl)
                .then(function (response) {
                  angular.copy(response.data, this.currentUser);
                  this.entitlements = Utils.getSqEntitlements(this.currentUser);
                  return response.data;
                }.bind($stateParams));
            }
          },
          params: {
            currentUser: {},
            entitlements: {},
            queryuserslist: {}
          },
          data: {
            displayName: 'Overview'
          }
        })
        .state('user-overview.communication', {
          templateUrl: 'modules/huron/overview/telephonyOverview.tpl.html',
          controller: 'TelephonyOverviewCtrl',
          controllerAs: 'telephonyOverview',
          params: {
            reloadToggle: false
          },
          data: {
            displayName: 'Communication'
          }
        })
        .state('user-overview.communication.directorynumber', {
          templateUrl: 'modules/huron/lineSettings/lineSettings.tpl.html',
          controller: 'LineSettingsCtrl',
          controllerAs: 'lineSettings',
          params: {
            directoryNumber: {}
          },
          data: {
            displayName: 'Line Configuration'
          }
        })
        .state('user-overview.device', {
          params: {
            device: {}
          },
          data: {
            displayName: 'Device Configuration'
          },
          views: {
            'header@user-overview': {
              templateUrl: 'modules/huron/device/deviceHeader.tpl.html',
              controller: 'DeviceHeaderCtrl',
              controllerAs: 'device'
            },
            '': {
              templateUrl: 'modules/huron/device/deviceDetail.tpl.html',
              controller: 'DeviceDetailCtrl',
              controllerAs: 'ucDeviceDetail'
            }
          }
        })
        .state('user-overview.communication.voicemail', {
          template: '<div uc-voicemail></div>',
          data: {
            displayName: 'Voicemail'
          }
        })
        .state('user-overview.communication.snr', {
          template: '<div uc-single-number-reach></div>',
          data: {
            displayName: 'Single Number Reach'
          }
        })
        .state('user-overview.messaging', {
          templateUrl: 'modules/core/users/userPreview/userPreview.tpl.html',
          controller: 'UserPreviewCtrl',
          data: {
            displayName: 'Messaging'
          },
          params: {
            service: 'MESSAGING'
          }
        })
        .state('user-overview.cloudExtension-squared-fusion-cal', {
          templateUrl: 'modules/hercules/cloudExtensions/cloudExtensionPreview.tpl.html',
          controller: 'CloudExtensionPreviewCtrl',
          data: {
            displayName: 'Calendar Service'
          },
          params: {
            extensionId: {}
          }
        })
        .state('user-overview.cloudExtension-squared-fusion-uc', {
          templateUrl: 'modules/hercules/cloudExtensions/cloudExtensionPreview.tpl.html',
          controller: 'CloudExtensionPreviewCtrl',
          data: {
            displayName: 'Call Service'
          },
          params: {
            extensionId: {}
          }
        })
        .state('user-overview.conferencing', {
          templateUrl: 'modules/core/users/userPreview/conferencePreview.tpl.html',
          controller: 'ConferencePreviewCtrl',
          controllerAs: 'confPreview',
          data: {
            displayName: 'Conferencing'
          },
          params: {
            service: 'CONFERENCING'
          }
        })
        .state('user-overview.conferencing.webex', {
          templateUrl: 'modules/webex/userSettings/userSettings.tpl.html',
          controller: 'WebExUserSettingsCtrl',
          controllerAs: 'WebExUserSettings',
          data: {
            displayName: 'Session Enablement'
          },
          params: {
            currentUser: {},
            site: {}
          }
        })
        .state('user-overview.conferencing.webex.webex2', {
          templateUrl: 'modules/webex/userSettings/userSettings2.tpl.html',
          controller: 'WebExUserSettings2Ctrl',
          controllerAs: 'WebExUserSettings2',
          data: {
            displayName: 'Privileges'
          },
          params: {
            currentUser: {},
            site: {}
          }
        })
        .state('user-overview.userProfile', {
          templateUrl: 'modules/core/users/userRoles/userRoles.tpl.html',
          controller: 'UserRolesCtrl',
          data: {
            displayName: 'Roles'
          }
        })

      // .state('users.list.preview', {
      //     templateUrl: 'modules/core/users/userPreview/userPreview.tpl.html',
      //     controller: 'UserPreviewCtrl'
      //   })
      //   .state('users.list.preview.conversations', {
      //     template: '<div user-entitlements current-user="currentUser" entitlements="entitlements" queryuserslist="queryuserslist"></div>'
      //   })
      //   .state('users.list.preview.roles', {
      //     template: '<div class="sub-details-full" user-roles current-user="currentUser" entitlements="entitlements" roles="roles" queryuserslist="queryuserslist"></div>'
      //   })
      //   .state('users.list.preview.directorynumber', {
      //     templateUrl: 'modules/huron/lineSettings/lineSettings.tpl.html',
      //     controller: 'LineSettingsCtrl',
      //     controllerAs: 'lineSettings',
      //     params: {
      //       showAddUsers: {},
      //       directoryNumber: {}
      //     }
      //   })
      //   .state('users.list.preview.voicemail', {
      //     template: '<div uc-voicemail></div>'
      //   })
      //   .state('users.list.preview.snr', {
      //     template: '<div uc-single-number-reach></div>'
      //   })
      //   .state('users.list.preview.device', {
      //     templateUrl: 'modules/huron/device/deviceDetail.tpl.html',
      //     controller: 'DeviceDetailCtrl',
      //     controllerAs: 'ucDeviceDetail',
      //     params: {
      //       showAddUsers: {},
      //       device: {}
      //     }
      //   })
      .state('groups', {
          abstract: true,
          template: '<div ui-view></div>',
          parent: 'main'
        })
        .state('groups.list', {
          url: '/groups',
          templateUrl: 'modules/core/groups/groupList/groupList.tpl.html',
          controller: 'ListGroupsCtrl'
        })
        .state('groups.list.preview', {
          templateUrl: 'modules/core/groups/groupPreview/groupPreview.tpl.html',
          controller: 'GroupPreviewCtrl'
        })
        .state('organization', {
          url: '/organization',
          templateUrl: 'modules/core/organizations/organizationOverview/organizationOverview.tpl.html',
          controller: 'OrganizationOverviewCtrl',
          parent: 'main'
        })
        .state('organizationAdd', {
          url: '/add-organization',
          templateUrl: 'modules/core/organizations/organizationAdd/organizationAdd.tpl.html',
          controller: 'OrganizationAddCtrl',
          controllerAs: 'orgAdd',
          parent: 'main'
        })
        .state('organizationAdd.info', {
          templateUrl: 'modules/core/organizations/organizationAdd/organizationAdd.tpl.html'
        })
        .state('organizationAdd.addNumbers', {
          templateUrl: 'modules/core/organizations/organizationAdd/addNumbers.tpl.html',
          controller: 'DidAddCtrl',
          controllerAs: 'didAdd',
          params: {
            currentTrial: {},
            currentOrg: {}
          }
        })
        .state('site-list', {
          url: '/site-list',
          templateUrl: 'modules/core/siteList/siteList.tpl.html',
          controller: 'SiteListCtrl',
          controllerAs: 'siteList',
          parent: 'main'
        })
        .state('templates', {
          url: '/templates',
          templateUrl: 'modules/squared/views/templates.html',
          controller: 'UsersCtrl',
          parent: 'main'
        })
        .state('reports', {
          url: '/reports',
          templateUrl: 'modules/squared/views/reports.html',
          controller: 'ReportsCtrl',
          parent: 'main'
        })
        .state('userprofile', {
          url: '/userprofile/:uid',
          templateUrl: 'modules/squared/views/userprofile.html',
          controller: 'UserProfileCtrl',
          parent: 'main'
        })
        .state('support', {
          url: '/support?search',
          templateUrl: 'modules/squared/support/support.tpl.html',
          controller: 'SupportCtrl',
          parent: 'main'
        })
        .state('billing', {
          url: '/orderprovisioning?enc',
          templateUrl: 'modules/squared/support/billing.tpl.html',
          controller: 'BillingCtrl',
          parent: 'main'
        })

      /*
        devices
      */
      .state('devices', {
          url: '/devices',
          templateUrl: 'modules/squared/devices/devices.html',
          controller: 'SpacesCtrl',
          controllerAs: 'sc',
          parent: 'main'
        })
        .state('device-overview', {
          parent: 'sidepanel',
          views: {
            'sidepanel@': {
              controller: 'DeviceOverviewCtrl',
              controllerAs: 'deviceOverview',
              templateUrl: 'modules/squared/deviceOverview/deviceOverview.tpl.html'
            },
            'header@device-overview': {
              templateUrl: 'modules/squared/deviceOverview/deviceHeader.tpl.html'
            }
          },
          params: {
            currentDevice: {},
            querydeviceslist: {}
          },
          data: {
            displayName: ''
          }
        })

      /*
        devices redux
      */
      .state('devices-redux', {
          url: '/devices-redux',
          templateUrl: 'modules/squared/devicesRedux/devices.html',
          controller: 'DevicesCtrlRedux',
          controllerAs: 'sc',
          parent: 'main'
        })
        .state('device-overview-redux', {
          parent: 'sidepanel',
          views: {
            'sidepanel@': {
              controller: 'DeviceOverviewCtrlRedux',
              controllerAs: 'deviceOverview',
              templateUrl: 'modules/squared/devicesRedux/overview/deviceOverview.tpl.html'
            },
            'header@device-overview-redux': {
              templateUrl: 'modules/squared/devicesRedux/overview/deviceHeader.tpl.html'
            }
          },
          params: {
            currentDevice: {}
          },
          data: {
            displayName: 'Device Overview'
          }
        })

      .state('devices2', {
          url: '/devices2',
          templateUrl: 'modules/squared/devices2/devices2.html',
          controller: 'Devices2Ctrl',
          controllerAs: 'dc',
          parent: 'main'
        })
        .state('devices2-overview', {
          parent: 'sidepanel',
          views: {
            'sidepanel@': {
              controller: 'Devices2OverviewCtrl',
              controllerAs: 'devices2Overview',
              templateUrl: 'modules/squared/deviceOverview2/devices2Overview.tpl.html'
            },
            'header@devices2-overview': {
              templateUrl: 'modules/squared/deviceOverview2/devices2Header.tpl.html'
            }
          },
          params: {
            currentEntity: {},
            querydeviceslist: {}
          },
          data: {
            displayName: ''
          }
        })
        .state('partneroverview', {
          parent: 'partner',
          url: '/overview',
          templateUrl: 'modules/core/views/partnerlanding.html',
          controller: 'PartnerHomeCtrl'
        })
        .state('partnerreports', {
          parent: 'partner',
          url: '/reports',
          templateUrl: 'modules/squared/views/partnerreports.html',
          controller: 'PartnerReportsCtrl'
        })
        .state('newpartnerreports', {
          parent: 'partner',
          url: '/newreports',
          templateUrl: 'modules/core/partnerReports/partnerReports.tpl.html',
          controller: 'PartnerReportCtrl',
          controllerAs: 'nav'
        })
        .state('login_swap', {
          url: '/login/:customerOrgId/:customerOrgName',
          views: {
            'main@': {
              templateUrl: 'modules/core/login/login.tpl.html',
              controller: 'LoginCtrl'
            }
          },
          authenticate: false
        })
        .state('launch_partner_org', {
          url: '/login/:partnerOrgId/:partnerOrgName/:launchPartner',
          views: {
            'main@': {
              templateUrl: 'modules/core/login/login.tpl.html',
              controller: 'LoginCtrl'
            }
          },
          authenticate: false
        })
        .state('partnercustomers', {
          parent: 'partner',
          template: '<div ui-view></div>',
          absract: true
        })
        .state('partnercustomers.list', {
          url: '/customers',
          templateUrl: 'modules/core/customers/customerList/customerList.tpl.html',
          controller: 'PartnerHomeCtrl',
          params: {
            filter: null
          }
        })
        .state('partnercustomers.list.preview', {
          templateUrl: 'modules/core/customers/customerPreview/customerPreview.tpl.html',
          controller: 'CustomerPreviewCtrl'
        })
        .state('modal', {
          abstract: true,
          onEnter: modalOnEnter(),
          onExit: modalOnExit
        })
        .state('modalLarge', {
          abstract: true,
          onEnter: modalOnEnter('lg'),
          onExit: modalOnExit
        })
        .state('modalSmall', {
          abstract: true,
          onEnter: modalOnEnter('sm'),
          onExit: modalOnExit
        })
        .state('wizardmodal', {
          abstract: true,
          onEnter: ['$modal', '$state', '$previousState',
            function ($modal, $state, $previousState) {
              $previousState.memo(wizardmodalMemo);
              $state.modal = $modal.open({
                template: '<div ui-view="modal"></div>',
                controller: 'ModalWizardCtrl',
                windowTemplateUrl: 'modules/core/modal/wizardWindow.tpl.html'
              });
              $state.modal.result.finally(function () {
                $state.modal = null;
                var previousState = $previousState.get(wizardmodalMemo);
                if (previousState) {
                  return $previousState.go(wizardmodalMemo);
                }
              });
            }
          ],
          onExit: ['$state', '$previousState',
            function ($state, $previousState) {
              if ($state.modal) {
                $previousState.forget(wizardmodalMemo);
                $state.modal.close();
              }
            }
          ]
        })
        .state('firsttimesplash', {
          abstract: true,
          views: {
            'main@': {
              templateUrl: 'modules/core/setupWizard/firstTimeWizard.tpl.html',
              controller: 'FirstTimeWizardCtrl'
            }
          }
        })
        .state('firsttimewizard', {
          parent: 'firsttimesplash',
          template: '<cr-wizard tabs="tabs" finish="finish" is-first-time="true"></cr-wizard>',
          controller: 'SetupWizardCtrl',
          data: {
            firstTimeSetup: true
          }
        })
        .state('setupwizardmodal', {
          parent: 'wizardmodal',
          views: {
            'modal@': {
              template: '<cr-wizard tabs="tabs" finish="finish"></cr-wizard>',
              controller: 'SetupWizardCtrl'
            }
          },
          params: {
            currentTab: {}
          },
          data: {
            firstTimeSetup: false
          }
        });
    }
  ]);

angular
  .module('Huron')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('callroutingBase', {
          abstract: true,
          parent: 'main',
          templateUrl: 'modules/huron/callRouting/callRouting.tpl.html'
        })
        .state('callrouting', {
          url: '/callrouting',
          parent: 'callroutingBase',
          views: {
            'header': {
              templateUrl: 'modules/huron/callRouting/callRoutingHeader.tpl.html'
            },
            'nav': {
              templateUrl: 'modules/huron/callRouting/callRoutingNav.tpl.html',
              controller: 'CallRoutingNavCtrl',
              controllerAs: 'nav'
            },
            'main': {
              template: '<div ui-view></div>'
            }
          }
        })
        .state('autoattendant', {
          url: '/autoattendant',
          abstract: false,
          parent: 'callrouting',
          template: '<div> <div ui-view></div> </div>'
        })
        .state('autoattendant.landing', {
          parent: 'autoattendant',
          templateUrl: 'modules/huron/callRouting/autoAttendant/autoAttendantLanding.tpl.html',
          controller: 'AutoAttendantLandingCtrl',
          controllerAs: 'aaLanding'
        })
        .state('autoattendant.main', {
          abstract: true,
          parent: 'modal',
          views: {
            'modal@': {
              controller: 'AutoAttendantMainCtrl',
              templateUrl: 'modules/huron/callRouting/autoAttendant/autoAttendantMain.tpl.html',
              controllerAs: 'aaMain'
            }
          }
        })
        .state('autoattendant.main.general', {
          parent: 'autoattendant.main',
          params: {
            aaName: ''
          },
          views: {
            'tabContent': {
              templateUrl: 'modules/huron/callRouting/autoAttendant/autoAttendantGeneral.tpl.html',
              controller: 'AutoAttendantGeneralCtrl',
              controllerAs: 'aaGeneral'
            }
          }
        })
        .state('autoattendant.main.aa', {
          parent: 'autoattendant.main',
          params: {
            aaName: ''
          },
          views: {
            'tabContent': {
              templateUrl: 'modules/huron/callRouting/autoAttendant/autoAttendantMenu.tpl.html',
              controller: 'AutoAttendantMenuCtrl',
              controllerAs: 'aaMenu'
            }
          }
        })
        .state('callpark', {
          url: '/callpark',
          parent: 'callrouting',
          templateUrl: 'modules/huron/callRouting/callPark/callPark.tpl.html',
          controller: 'CallParkCtrl',
          controllerAs: 'cp'
        })
        .state('callpickup', {
          url: '/callpickup',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('intercomgroups', {
          url: '/intercomgroups',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('paginggroups', {
          url: '/paginggroups',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('huntgroups', {
          url: '/huntgroups',
          parent: 'callrouting',
          template: '<div></div>'
        })
        .state('mediaonhold', {
          parent: 'modalLarge',
          url: '/mediaonhold',
          views: {
            'modal@': {
              templateUrl: 'modules/huron/moh/moh.tpl.html',
              controller: 'MohCtrl',
              controllerAs: 'moh'
            }
          }
        })
        .state('trialAdd', {
          abstract: true,
          parent: 'modal',
          views: {
            'modal@': {
              template: '<div ui-view></div>',
              controller: 'TrialAddCtrl',
              controllerAs: 'trial'
            }
          }
        })
        .state('trialAdd.info', {
          templateUrl: 'modules/core/trials/trialAdd.tpl.html'
        })
        .state('trialAdd.addNumbers', {
          templateUrl: 'modules/core/trials/addNumbers.tpl.html',
          controller: 'DidAddCtrl',
          controllerAs: 'didAdd',
          params: {
            currentTrial: {},
            currentOrg: {}
          }
        })
        .state('trialAdd.nextSteps', {
          templateUrl: 'modules/core/trials/nextStep.tpl.html',
          controller: 'DidAddCtrl',
          controllerAs: 'didAdd'
        })
        .state('trialEdit', {
          abstract: true,
          parent: 'modal',
          views: {
            'modal@': {
              template: '<div ui-view></div>',
              controller: 'TrialEditCtrl',
              controllerAs: 'trial'
            }
          },
          params: {
            showPartnerEdit: false,
            currentTrial: {}
          }
        })
        .state('trialEdit.addNumbers', {
          templateUrl: 'modules/core/trials/addNumbers.tpl.html',
          controller: 'DidAddCtrl',
          controllerAs: 'didAdd',
          params: {
            fromEditTrial: false,
            currentOrg: {}
          }
        })
        .state('trialEdit.info', {
          templateUrl: 'modules/core/trials/trialEdit.tpl.html'
        })
        .state('generateauthcode', {
          parent: 'modal',
          url: '/generateauthcode',
          params: {
            currentUser: {},
            activationCode: {}
          },
          views: {
            'modal@': {
              templateUrl: 'modules/huron/device/generateActivationCodeModal.tpl.html',
              controller: 'GenerateActivationCodeCtrl',
              controllerAs: 'genAuthCode'
            }
          }
        })
        .state('didadd', {
          parent: 'modal',
          url: '/didadd',
          params: {
            currentOrg: {},
            editMode: true
          },
          views: {
            'modal@': {
              templateUrl: 'modules/huron/didAdd/didAdd.tpl.html',
              controller: 'DidAddCtrl',
              controllerAs: 'didAdd'
            }
          }
        });
    }
  ]);

angular
  .module('Hercules')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('fusion', {
          url: '/fusion',
          templateUrl: 'modules/hercules/dashboard/dashboard-next.html',
          controller: 'DashboardNextController',
          parent: 'main'
        })
        .state('cluster-details', {
          parent: 'sidepanel',
          views: {
            'sidepanel@': {
              controller: 'ClusterDetailsController',
              templateUrl: 'modules/hercules/dashboard/cluster-details.html'
            },
            'header@cluster-details': {
              templateUrl: 'modules/hercules/dashboard/cluster-header.html'
            }
          },
          data: {
            displayName: 'Overview'
          },
          params: {
            clusterId: undefined
          }
        })
        .state('cluster-details.hosts', {
          templateUrl: 'modules/hercules/dashboard/host-details.html',
          controller: 'HostDetailsController',
          data: {
            displayName: 'Hosts'
          },
          params: {
            clusterId: undefined,
            hostSerial: undefined
          }
        })
        .state('cluster-details.service', {
          templateUrl: 'modules/hercules/dashboard/service-details.html',
          controller: 'ServiceDetailsController',
          data: {
            displayName: 'Connectors'
          },
          params: {
            clusterId: undefined,
            serviceType: undefined
          }
        });
    }
  ]);

angular
  .module('Mediafusion')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('meetings', {
          abstract: true,
          template: '<div ui-view></div>',
          //url: '/meetings',
          //templateUrl: 'modules/mediafusion/meetings/meetingList/meetingList.tpl.html',
          //controller: 'ListMeetingsCtrl',
          parent: 'main'
        })
        .state('meetings.list', {
          url: '/meetings',
          templateUrl: 'modules/mediafusion/meetings/meetingList/meetingList.tpl.html',
          controller: 'ListMeetingsCtrl',
          params: {
            showAddUsers: {}
          }
        })
        .state('meetings.list.preview', {
          templateUrl: 'modules/mediafusion/meetings/meetingPreview/meetingPreview.tpl.html',
          controller: 'MeetingPreviewCtrl'
        })
        .state('metrics', {
          url: '/metrics',
          templateUrl: 'modules/mediafusion/metrics/metricsList/metricsList.tpl.html',
          controller: 'MetricsCtrl',
          parent: 'main'
        })
        .state('metrics.preview', {
          templateUrl: 'modules/mediafusion/metrics/metricsPreview/metricsPreview.tpl.html',
          controller: 'MetricsPreviewCtrl'
        })
        .state('threshold', {
          url: '/threshold',
          templateUrl: 'modules/mediafusion/threshold/thresholdList/thresholdList.tpl.html',
          controller: 'ThresholdCtrl',
          parent: 'main'
        })
        .state('threshold.preview', {
          templateUrl: 'modules/mediafusion/threshold/thresholdPreview/thresholdPreview.tpl.html',
          controller: 'ThresholdPreviewCtrl'
        })
        .state('fault', {
          url: '/fault',
          templateUrl: 'modules/mediafusion/faultRules/faultRules.tpl.html',
          controller: 'FaultRulesCtrl',
          parent: 'main'
        })
        .state('vts', {
          abstract: true,
          template: '<div ui-view></div>',
          parent: 'main'
        })
        .state('vts.list', {
          url: '/vts',
          templateUrl: 'modules/mediafusion/enterpriseResource/enterpriseResourceList/enterpriseResourceList.tpl.html',
          controller: 'ListVtsCtrl'
        })
        .state('vts.list.preview', {
          templateUrl: 'modules/mediafusion/enterpriseResource/enterpriseResourcePreview/enterpriseResourcePreview.tpl.html',
          controller: 'VtsPreviewCtrl'
        })
        .state('alarms', {
          url: '/alarms',
          templateUrl: 'modules/mediafusion/alarms/alarmList/alarmList.tpl.html',
          controller: 'AlarmListCtrl',
          parent: 'main'
        })
        .state('alarms.preview', {
          templateUrl: 'modules/mediafusion/alarms/alarmPreview/alarmPreview.tpl.html',
          controller: 'AlarmPreviewCtrl'
        })
        .state('events', {
          url: '/events',
          templateUrl: 'modules/mediafusion/events/eventList/eventList.tpl.html',
          controller: 'EventListCtrl',
          parent: 'main'
        })
        .state('events.preview', {
          templateUrl: 'modules/mediafusion/events/eventPreview/eventPreview.tpl.html',
          controller: 'EventPreviewCtrl'
        })
        .state('utilization', {
          url: '/utilization',
          templateUrl: 'modules/mediafusion/utilization/overAllUtilization.tpl.html',
          controller: 'UtilizationCtrl',
          parent: 'main'
        })
        .state('mediafusionconnector', {
          url: '/mediafusionconnector',
          templateUrl: 'modules/mediafusion/mediafusion-connector/mediafusionConnector.tpl.html',
          controller: 'mediafusionConnectorCtrl',
          parent: 'main'
        })
        .state('connector-details', {
          parent: 'sidepanel',
          views: {
            'sidepanel@': {
              controller: 'ConnectorDetailsController',
              templateUrl: 'modules/mediafusion/mediafusion-connector/connector-details.html'
            },
            'header@connector-details': {
              templateUrl: 'modules/mediafusion/mediafusion-connector/connector-header.html'
            }
          },
          data: {
            displayName: 'Overview'
          },
          params: {
            connectorId: {}
          }
        })
        .state('connector-details.alarms', {
          templateUrl: 'modules/mediafusion/mediafusion-connector/alarms-details.html',
          controller: 'AlarmsDetailsController',
          data: {
            displayName: 'Alarms'
          },
          params: {
            cconnectorId: {}
          }
        });
    }
  ]);

angular
  .module('WebExUserSettings')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('webexUserSettings', {
          url: '/webexUserSettings',
          templateUrl: 'modules/webex/userSettings/userSettings.tpl.html',
          parent: 'main'
        });
    }
  ]);

angular
  .module('WebExUserSettings2')
  .config(['$stateProvider',
    function ($stateProvider) {
      $stateProvider
        .state('webexUserSettings2', {
          url: '/webexUserSettings2',
          templateUrl: 'modules/webex/userSettings/userSettings2.tpl.html',
          parent: 'main'
        });
    }
  ]);
