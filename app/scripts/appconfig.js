(function () {
  'use strict';

  /* eslint angular/di:0 */
  var loadedModules = [];

  function resolveLazyLoad(requireFunction) {
    // https://github.com/ocombe/ocLazyLoad/issues/321
    // $$animateJs issue when 'ng' module is "reloaded" through $ocLazyLoad
    // force $$animateJs to be loaded before we try to lazy load
    return /* @ngInject */ function lazyLoad($$animateJs, $ocLazyLoad, $q) {
      return $q(function resolvePromise(resolve) {
        requireFunction(requireDoneCallback);

        function requireDoneCallback(_module) {
          var moduleName;
          if (_.isObject(_module) && _.has(_module, 'default')) {
            moduleName = _module.default;
          } else {
            moduleName = _module;
          }
          // Don't reload a loaded module or core angular module
          if (_.includes(loadedModules, moduleName) || _.includes($ocLazyLoad.getModules(), moduleName) || _.startsWith(moduleName, 'ng')) {
            resolve();
          } else {
            loadedModules.push(moduleName);
            $ocLazyLoad.toggleWatch(true);
            $ocLazyLoad.inject(moduleName)
              .finally(function finishLazyLoad() {
                $ocLazyLoad.toggleWatch(false);
                resolve();
              });
          }
        }
      });
    };
  }

  angular
    .module('wx2AdminWebClientApp')
    .config(['$httpProvider', '$stateProvider', '$urlRouterProvider', '$translateProvider', '$compileProvider', 'languagesProvider',
      function ($httpProvider, $stateProvider, $urlRouterProvider, $translateProvider, $compileProvider, languagesProvider) {
        var sidepanelMemo = 'sidepanelMemo';

        // sidepanel helper
        function isStateInSidepanel($state) {
          var rootStateName = $state.current.name.split('.')[0];
          var rootState = $state.get(rootStateName);
          var rootStateIsSidepanel = rootState.parent === 'sidepanel';
          return $state.current.parent === 'sidepanel' || (rootStateIsSidepanel && $state.includes(rootState));
        }

        /* @ngInject */
        function SidePanelLargeOpen($window) {
          $window.document.querySelector('.side-panel').classList.add('large');
        }

        /* @ngInject */
        function SidePanelLargeClose($window) {
          $window.document.querySelector('.side-panel').classList.remove('large');
        }

        //Add blob to the default angular whitelist
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);

        $urlRouterProvider.otherwise(function ($injector) {
          // inspired by https://github.com/angular-ui/ui-router/issues/600
          // unit tests $digest not settling due to $location url changes
          var $state = $injector.get('$state');
          $state.go('login');
        });
        $stateProvider
          .state('modal', {
            abstract: true,
            onEnter: modalOnEnter({
              type: 'full',
            }),
            onExit: modalOnExit,
          })
          .state('modalDialog', {
            abstract: true,
            onEnter: modalOnEnter({
              type: 'dialog',
            }),
            onExit: modalOnExit,
          })
          .state('modalSmall', {
            abstract: true,
            onEnter: modalOnEnter({
              type: 'small',
            }),
            onExit: modalOnExit,
          })
          .state('wizardmodal', {
            abstract: true,
            onEnter: /* @ngInject */ function ($modal, $state, $previousState) {
              $previousState.memo(wizardmodalMemo);
              $state.modal = $modal.open({
                template: '<div ui-view="modal"></div>',
                controller: 'ModalWizardCtrl',
                // TODO(pajeter): remove inline template when cs-modal is updated
                windowTemplate: '<div modal-render="{{$isRendered}}" tabindex="-1" role="dialog" class="modal-alt"' +
                'modal-animation-class="fade"' +
                'modal-in-class="in"' +
                'ng-style="{\'z-index\': 1051, display: \'block\', visibility: \'visible\', position: \'relative\'}">' +
                '<div class="modal-content" modal-transclude></div>' +
                '</div>',
                backdrop: 'static',
              });
              $state.modal.result.finally(function () {
                $state.modal = null;
                var previousState = $previousState.get(wizardmodalMemo);
                if (previousState) {
                  return $previousState.go(wizardmodalMemo);
                }
              });
            },
            onExit: ['$state', '$previousState',
              function ($state, $previousState) {
                if ($state.modal) {
                  $previousState.forget(wizardmodalMemo);
                  $state.modal.close();
                }
              },
            ],
          })
          .state('login', {
            parent: 'loginLazyLoad',
            url: '/login',
            views: {
              'main@': {
                template: '<login/>',
              },
            },
            params: {
              reauthorize: undefined,
            },
            authenticate: false,
          })
          .state('activateUser', {
            parent: 'mainLazyLoad',
            url: '/activate-user',
            views: {
              'main@': {
                template: '<div ui-view></div>',
                controller: 'ActivateUserController',
              },
            },
            authenticate: false,
          })
          .state('activateUser.successPage', {
            url: '/success-page',
            views: {
              'main@': {
                template: '<div ui-view></div>',
              },
            },
            authenticate: false,
          })
          .state('activateUser.errorPage', {
            url: '/error-page',
            views: {
              'main@': {
                template: '<div ui-view></div>',
              },
            },
            authenticate: false,
          })
          .state('activateProduct', {
            parent: 'mainLazyLoad',
            url: '/activate-product',
            views: {
              'main@': {
                template: '<div ui-view></div>',
                controller: 'ActivateProductController',
              },
            },
          })
          .state('activateProduct.successPage', {
            url: '/success-page',
            views: {
              'main@': {
                template: '<div ui-view></div>',
              },
            },
          })
          .state('activateProduct.errorPage', {
            url: '/error-page',
            views: {
              'main@': {
                template: '<div ui-view></div>',
              },
            },
          })
          .state('unauthorized', {
            parent: 'stateRedirectLazyLoad',
            views: {
              'main@': {
                templateUrl: 'modules/core/stateRedirect/unauthorized.tpl.html',
                controller: 'StateRedirectCtrl',
                controllerAs: 'stateRedirect',
              },
            },
            authenticate: false,
          })
          .state('login-error', {
            parent: 'stateRedirectLazyLoad',
            views: {
              'main@': {
                templateUrl: 'modules/core/stateRedirect/loginError.tpl.html',
                controller: 'StateRedirectCtrl',
                controllerAs: 'stateRedirect',
              },
            },
            authenticate: false,
          })
          .state('server-maintenance', {
            views: {
              'main@': {
                templateUrl: 'modules/core/stateRedirect/serverMaintenance.tpl.html',
              },
            },
            authenticate: false,
          })
          .state('404', {
            parent: 'stateRedirectLazyLoad',
            url: '/404',
            views: {
              'main@': {
                templateUrl: 'modules/core/stateRedirect/404.tpl.html',
                controller: 'StateRedirectCtrl',
                controllerAs: 'stateRedirect',
              },
            },
            authenticate: false,
          })
          .state('mainLazyLoad', {
            views: {
              'main@': {
                template: '<div ui-view="main"></div>',
              },
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('./main'));
                }, 'modules');
              }),
            },
            abstract: true,
          })
          .state('loginLazyLoad', {
            views: {
              'main@': {
                template: '<div ui-view="main"></div>',
              },
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/core/login'));
                }, 'login');
              }),
            },
            abstract: true,
          })
          .state('stateRedirectLazyLoad', {
            views: {
              'main@': {
                template: '<div ui-view="main"></div>',
              },
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/core/stateRedirect/stateRedirect.controller'));
                }, 'state-redirect');
              }),
            },
            abstract: true,
          })
          .state('main', {
            views: {
              'main@': {
                templateUrl: 'modules/core/views/main.tpl.html',
              },
            },
            abstract: true,
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('./main'));
                }, 'modules');
              }),
            },
            sticky: true,
          })
          .state('partner', {
            template: '<div ui-view></div>',
            url: '/partner',
            parent: 'main',
            abstract: true,
          })
          .state('sidepanel', {
            abstract: true,
            onExit: panelOnExit,
            onEnter: panelOnEnter({ type: '' }),
          })
          .state('largepanel', {
            abstract: true,
            onExit: panelOnExit,
            onEnter: panelOnEnter({ type: 'large' }),
          });

        // Enter and Exit functions for panel(large or side)
        function panelOnEnter(options) {
          options = options || {};
          return /* @ngInject */ function ($modal, $state, $previousState) {
            if ($state.sidepanel) {
              $state.sidepanel.stopPreviousState = true;
            } else {
              $previousState.memo(sidepanelMemo);
            }

            var template = '<cs-sidepanel';
            template += options.type ? ' size=' + options.type : '';
            template += '></cs-sidepanel>';

            $state.sidepanel = $modal.open({
              template: template,
              // TODO(pajeter): remove inline template when cs-modal is updated
              windowTemplate: '<div modal-render="{{$isRendered}}" tabindex="-1" role="dialog" class="sidepanel-modal"' +
              'modal-animation-class="fade"' +
              'modal-in-class="in"' +
              'ng-style="{\'z-index\': 1051, display: \'block\', visibility: \'visible\'}">' +
              '<div class="modal-content" modal-transclude></div>' +
              ' </div>',
              backdrop: false,
              keyboard: false,
            });
            $state.sidepanel.result.finally(function () {
              if (!this.stopPreviousState && !$state.modal) {
                $state.sidepanel = null;
                var previousState = $previousState.get(sidepanelMemo);
                if (previousState) {
                  if (isStateInSidepanel($state)) {
                    return $previousState.go(sidepanelMemo).then(function () {
                      $previousState.forget(sidepanelMemo);
                    });
                  }
                }
              }
            }.bind($state.sidepanel));
          };
        }

        /* @ngInject */
        function panelOnExit($state) {
          if ($state.sidepanel) {
            $state.sidepanel.dismiss();
          }
        }

        // See http://angular-translate.github.io/docs/#/guide/19_security
        $translateProvider.useSanitizeValueStrategy('escapeParameters');
        $translateProvider.useStaticFilesLoader({
          prefix: 'l10n/',
          suffix: '.json',
        });
        $translateProvider.addInterpolation('$translateMessageFormatInterpolation');
        $translateProvider.preferredLanguage(languagesProvider.getPreferredLanguage());
        $translateProvider.fallbackLanguage(languagesProvider.getFallbackLanguage());

        $httpProvider.interceptors.push('TrackingIdInterceptor');
        $httpProvider.interceptors.push('ResponseInterceptor');
        $httpProvider.interceptors.push('TimingInterceptor');
        $httpProvider.interceptors.push('ServerErrorInterceptor');
        $httpProvider.interceptors.push('ReadonlyInterceptor');

        var modalMemo = 'modalMemo';
        var wizardmodalMemo = 'wizardmodalMemo';

        // Modal States Enter and Exit functions
        function modalOnEnter(options) {
          options = options || {};
          return /* @ngInject */ function ($modal, $state, $previousState) {
            if ($state.modal) {
              $state.modal.stopPreviousState = true;
            } else {
              $previousState.memo(modalMemo);
            }
            $state.modal = $modal.open({
              template: '<div ui-view="modal"></div>',
              windowClass: options.windowClass,
              backdrop: options.backdrop || 'static',
              modalClass: $state.params.modalClass,
              modalId: $state.params.modalId,
              type: options.type,
            });
            $state.modal.result.finally(function () {
              if (!this.stopPreviousState) {
                $state.modal = null;
                //context-fields-sidepanel needs to update the view with new values after the update; otherwise go back to previous state
                if ($state.current.name !== 'context-fields-sidepanel' && $state.current.name !== 'context-fieldsets-sidepanel') {
                  var previousState = $previousState.get(modalMemo);
                  if (previousState) {
                    return $previousState.go(modalMemo).then(function () {
                      $previousState.forget(modalMemo);
                    });
                  }
                }
              }
            }.bind($state.modal));
          };
        }

        /* @ngInject */
        function modalOnExit($state) {
          if ($state.modal) {
            $state.modal.dismiss();
          }
        }

        $stateProvider
          .state('addDeviceFlow', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'ChooseDeviceTypeCtrl',
                controllerAs: 'chooseDeviceType',
                templateUrl: 'modules/squared/devices/addDeviceNew/ChooseDeviceTypeTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.confirmRoomDeviceOnly', {
            parent: 'modalDialog',
            views: {
              'modal@': {
                controller: 'ConfirmRoomDeviceOnlyCtrl',
                controllerAs: 'confirmRoomDeviceOnly',
                templateUrl: 'modules/squared/devices/addDeviceNew/ConfirmRoomDeviceOnlyTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.chooseDeviceType', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'ChooseDeviceTypeCtrl',
                controllerAs: 'chooseDeviceType',
                templateUrl: 'modules/squared/devices/addDeviceNew/ChooseDeviceTypeTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.chooseAccountType', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'ChooseAccountTypeCtrl',
                controllerAs: 'chooseAccountType',
                templateUrl: 'modules/squared/devices/addDeviceNew/ChooseAccountTypeTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.choosePersonal', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'ChoosePersonalCtrl',
                controllerAs: 'choosePersonal',
                templateUrl: 'modules/squared/devices/addDeviceNew/ChoosePersonalTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.chooseSharedSpace', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'ChooseSharedSpaceCtrl',
                controllerAs: 'choosePlace',
                templateUrl: 'modules/squared/devices/addDeviceNew/ChooseSharedSpaceTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.newSharedSpace', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'NewSharedSpaceCtrl',
                controllerAs: 'newPlace',
                templateUrl: 'modules/squared/devices/addPlace/NewSharedSpaceTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.addLines', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'AddLinesCtrl',
                controllerAs: 'addLines',
                templateUrl: 'modules/squared/common/AddLinesTemplate.tpl.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('addDeviceFlow.showActivationCode', {
            parent: 'modal',
            params: {
              wizard: null,
            },
            views: {
              'modal@': {
                templateUrl: 'modules/squared/devices/addDeviceNew/ShowActivationCodeTemplate.tpl.html',
                controller: 'ShowActivationCodeCtrl',
                controllerAs: 'showActivationCode',
              },
            },
          })
          .state('addDeviceFlow.editServices', {
            parent: 'modal',
            params: {
              wizard: null,
            },
            views: {
              'modal@': {
                templateUrl: 'modules/squared/places/editServices/EditServicesTemplate.tpl.html',
                controller: 'EditServicesCtrl',
                controllerAs: 'editServices',
              },
            },
          })
          .state('addDeviceFlow.editCalendarService', {
            parent: 'modal',
            params: {
              wizard: null,
            },
            views: {
              'modal@': {
                template: '<edit-calendar-service id="edit-calendar-modal" class="modal-content" dismiss="$dismiss()"></edit-calendar-service>',
              },
            },
          })
          .state('addDeviceFlow.callConnectOptions', {
            parent: 'modal',
            params: {
              wizard: null,
            },
            views: {
              'modal@': {
                template: '<call-connect-options id="call-connect-options-modal" class="modal-content" dismiss="$dismiss()"></call-connect-options>',
              },
            },
          })
          .state('activate', {
            url: '/activate',
            views: {
              'main@': {
                templateUrl: 'modules/squared/views/activate.html',
                controller: 'ActivateCtrl',
              },
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/squared/scripts/controllers/activate'));
                }, 'activate');
              }),
            },
            authenticate: false,
          })
          .state('csadmin', {
            url: '/csadmin?eqp',
            templateUrl: 'modules/squared/csadmin/csadmin.html',
            controller: 'CsAdminCtrl',
            parent: 'main',
          })
          .state('downloads', {
            url: '/downloads',
            parent: 'mainLazyLoad',
            views: {
              'main@': {
                templateUrl: 'modules/squared/views/downloads.html',
                controller: 'DownloadsCtrl',
              },
            },
            authenticate: false,
          })
          .state('domainmanagement', {
            templateUrl: 'modules/core/domainManagement/domainManagement.tpl.html',
            parent: 'main',
          })
          .state('domainmanagement.add', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'DomainManageAddCtrl',
                controllerAs: 'dmpopup',
                templateUrl: 'modules/core/domainManagement/add.tpl.html',
              },
            },
            params: {
              loggedOnUser: null,
            },
          })
          .state('domainmanagement.instructions', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'DomainManageInstructionsCtrl',
                controllerAs: 'dmpopup',
                templateUrl: 'modules/core/domainManagement/instructions.tpl.html',
              },
            },
            params: {
              domain: null,
              loggedOnUser: null,
            },
          })
          .state('domainmanagement.delete', {
            parent: 'modalDialog',
            views: {
              'modal@': {
                controller: 'DomainManageDeleteCtrl',
                controllerAs: 'dmpopup',
                templateUrl: 'modules/core/domainManagement/delete.tpl.html',
              },
            },
            params: {
              domain: null,
              loggedOnUser: null,
            },
          })
          .state('domainmanagement.unclaim', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'DomainManageDeleteCtrl',
                controllerAs: 'dmpopup',
                templateUrl: 'modules/core/domainManagement/unclaim.tpl.html',
              },
            },
            params: {
              domain: null,
              loggedOnUser: null,
            },
          })
          .state('domainmanagement.claim', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'DomainManageClaimCtrl',
                controllerAs: 'dmpopup',
                templateUrl: 'modules/core/domainManagement/claim.tpl.html',
              },
            },
            params: {
              domain: null,
              loggedOnUser: null,
            },
          })
          .state('domainmanagement.verify', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'DomainManageVerifyCtrl',
                controllerAs: 'dmpopup',
                templateUrl: 'modules/core/domainManagement/verify.tpl.html',
              },
            },
            params: {
              domain: null,
              loggedOnUser: null,
            },
          })
          .state('settings', {
            url: '/settings',
            templateUrl: 'modules/core/settings/settings.tpl.html',
            controller: 'SettingsCtrl',
            controllerAs: 'settingsCtrl',
            parent: 'main',
            params: {
              showSettings: null,
            },
          })
          .state('authentication.enable3rdPartyAuth', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'Enable3rdPartyAuthCtrl',
                controllerAs: 'enable3rdPartyAuth',
                templateUrl: 'modules/core/settings/authentication/enable3rdPartyAuth.tpl.html',
              },
            },
          })
          .state('profile', {
            url: '/profile',
            templateUrl: 'modules/core/partnerProfile/partnerProfile.tpl.html',
            controller: 'PartnerProfileCtrl',
            parent: 'main',
          })
          .state('brandingUpload', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                templateUrl: 'modules/core/partnerProfile/branding/brandingUpload.tpl.html',
                controller: 'BrandingCtrl',
                controllerAs: 'brandupload',
              },
            },
            authenticate: false,
          })
          .state('brandingExample', {
            parent: 'modal',
            views: {
              'modal@': {
                templateUrl: 'modules/core/partnerProfile/branding/brandingExample.tpl.html',
                controller: 'BrandingExampleCtrl',
                controllerAs: 'brandEg',
              },
            },
            authenticate: false,
            params: {
              modalType: 'Partner',
            },
          })
          .state('processorder', {
            url: '/processorder',
            templateUrl: 'modules/squared/views/processorder.html',
            controller: 'ProcessorderCtrl',
            controllerAs: 'processOrder',
            parent: 'main',
            authenticate: false,
          })
          .state('overview', {
            url: '/overview',
            templateUrl: 'modules/core/overview/overview.tpl.html',
            controller: 'OverviewCtrl',
            controllerAs: 'overview',
            parent: 'main',
            resolve: {
              hasGoogleCalendarFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHerculesGoogleCalendar);
              },
            },
          })
          .state('my-company', {
            templateUrl: 'modules/core/myCompany/myCompanyPage.tpl.html',
            controller: 'MyCompanyPageCtrl',
            controllerAs: 'mcp',
            parent: 'main',
            abstract: true,
          })
          .state('my-company.subscriptions', {
            url: '/my-company/subscriptions',
            onEnter: /* @ngInject */ function (OnlineAnalyticsService) {
              OnlineAnalyticsService.track(OnlineAnalyticsService.MY_COMPANY_SUBSCRIPTIONS);
            },
            views: {
              'tabContent': {
                controllerAs: 'mcpSub',
                controller: 'MySubscriptionCtrl',
                templateUrl: 'modules/core/myCompany/mySubscriptions/mySubscription.tpl.html',
              },
              'headerRight': {
                controllerAs: 'subscriptionHeader',
                controller: 'SubscriptionHeaderCtrl',
                templateUrl: 'modules/core/myCompany/mySubscriptions/subscriptionHeader.tpl.html',
              },
            },
          })
          .state('my-company.info', {
            url: '/my-company',
            onEnter: /* @ngInject */ function (OnlineAnalyticsService) {
              OnlineAnalyticsService.track(OnlineAnalyticsService.MY_COMPANY_INFO);
            },
            views: {
              'tabContent': {
                controllerAs: 'mcpInfo',
                controller: 'MyCompanyPageInfoCtrl',
                templateUrl: 'modules/core/myCompany/myCompanyPageInfo.tpl.html',
              },
            },
          })
          .state('my-company.orders', {
            url: '/my-company/orders',
            onEnter: /* @ngInject */ function (OnlineAnalyticsService) {
              OnlineAnalyticsService.track(OnlineAnalyticsService.MY_COMPANY_ORDER_HISTORY);
            },
            views: {
              'tabContent': {
                template: '<my-company-orders></my-company-orders>',
              },
            },
          })
          .state('users', {
            abstract: true,
            template: '<div ui-view></div>',
            parent: 'main',
          })
          .state('users.list', {
            url: '/users',
            templateUrl: 'modules/core/users/userList/userList.tpl.html',
            controller: 'UserListCtrl',
            params: {
              showAddUsers: {},
            },
          })
          .state('users.delete', {
            parent: 'modalDialog',
            views: {
              'modal@': {
                controller: 'UserDeleteCtrl',
                controllerAs: 'userDelete',
                templateUrl: 'modules/core/users/userDelete/userDelete.tpl.html',
                resolve: {
                  modalInfo: function ($state) {
                    $state.params.modalId = 'deleteUserModal';
                    $state.params.modalClass = 'modalContent';
                  },
                },
              },
            },
            params: {
              deleteUserOrgId: null,
              deleteUserUuId: null,
              deleteUsername: null,
            },
          })
          .state('users.deleteSelf', {
            parent: 'modalDialog',
            views: {
              'modal@': {
                controller: 'UserDeleteCtrl',
                controllerAs: 'userDelete',
                templateUrl: 'modules/core/users/userDelete/userDeleteSelf.tpl.html',
                resolve: {
                  modalInfo: function ($state) {
                    $state.params.modalId = 'deleteUserModal';
                    $state.params.modalClass = 'modalContent';
                  },
                },
              },
            },
            params: {
              deleteUserOrgId: null,
              deleteUserUuId: null,
              deleteUsername: null,
            },
          })
          .state('users.add', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'OnboardCtrl',
                controllerAs: 'obc',
                template: '<div ui-view="usersAdd"></div>',
              },
              'usersAdd@users.add': {
                templateUrl: 'modules/core/users/userAdd/onboardUsersModal.tpl.html',
                resolve: {
                  modalInfo: function ($state) {
                    $state.params.modalClass = 'add-users';
                    $state.params.modalId = 'modalContent';
                  },
                },
              },
            },
          })
          .state('users.add.services', {
            views: {
              'usersAdd@users.add': {
                templateUrl: 'modules/core/users/userAdd/assignServicesModal.tpl.html',
                resolve: {
                  modalInfo: function ($state) {
                    $state.params.modalClass = 'add-users';
                    $state.params.modalId = 'modalContent';
                  },
                },
              },
            },
          })
          .state('users.add.services.dn', {
            views: {
              'usersAdd@users.add': {
                templateUrl: 'modules/huron/users/assignDnAndDirectLinesModal.tpl.html',
              },
            },
          })
          .state('users.add.results', {
            views: {
              'usersAdd@users.add': {
                templateUrl: 'modules/core/users/userAdd/addUsersResultsModal.tpl.html',
                resolve: {
                  modalInfo: function ($state) {
                    $state.params.modalClass = 'add-users';
                    $state.params.modalId = 'modalContent';
                  },
                },
              },
            },
          })

          ///////////////////////////
          .state('users.manage.picker', {
            controller: 'UserManageModalPickerController',
            template: '<div class="center-spinner">' +
                '<i class="icon icon-spinner icon-2x"></i></div>',
          })
          .state('users.manage', {
            abstract: true,
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'UserManageModalController',
                controllerAs: 'ummc',
                template: '<div ui-view></div>',
              },
            },
          })
          .state('users.manage.org', {
            controller: 'UserManageOrgController',
            controllerAs: 'umoc',
            templateUrl: 'modules/core/users/userManage/userManageOrg.tpl.html',
          })
          .state('users.manage.activedir', {
            controller: 'UserManageActiveDirController',
            controllerAs: 'umadc',
            templateUrl: 'modules/core/users/userManage/userManageActiveDir.tpl.html',
          })

          .state('users.manage.advanced', {
            abstract: true,
            controller: 'UserManageAdvancedController',
            controllerAs: 'umac',
            templateUrl: 'modules/core/users/userManage/userManageAdvanced.tpl.html',
          })
          .state('users.manage.advanced.add', {
            abstract: true,
            controller: 'AddUserCtrl',
            controllerAs: 'auc',
            template: '<div ui-view class="flex-container flex-item-resize"></div>',
          })
          .state('users.manage.advanced.add.ob', {
            abstract: true,
            controller: 'OnboardCtrl',
            controllerAs: 'obc',
            template: '<div ui-view class="flex-container flex-item-resize"></div>',
          })
          .state('users.manage.advanced.add.ob.installConnector', {
            templateUrl: 'modules/core/setupWizard/addUsers/addUsers.installConnector.tpl.html',
          })
          .state('users.manage.advanced.add.ob.syncStatus', {
            templateUrl: 'modules/core/users/userManage/userManageAdvancedSyncStatus.tpl.html',
          })
          .state('users.manage.advanced.add.ob.dirsyncServices', {
            templateUrl: 'modules/core/setupWizard/addUsers/addUsers.assignServices.tpl.html',
            controller: /* @ngInject */ function ($scope) {
              $scope.dirsyncInitForServices();
            },
          })
          .state('users.manage.advanced.add.ob.dirsyncResult', {
            templateUrl: 'modules/core/users/userManage/userManageAdvancedResults.tpl.html',
            controller: /* @ngInject */ function ($scope) {
              $scope.umac.isBusy = true;
              $scope.csv.model = $scope.model;
              $scope.bulkSave().then(function () {
                $scope.umac.isBusy = false;
              });
            },
          })

          //////////////////

          .state('users.convert', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'OnboardCtrl',
                template: '<div ui-view="usersConvert"></div>',
              },
              'usersConvert@users.convert': {
                template: '<cr-convert-users-modal/>',
                resolve: {
                  modalInfo: function ($state) {
                    $state.params.modalClass = 'convert-users';
                    $state.params.modalId = 'convertDialog';
                  },
                },
              },
            },
            params: {
              manageUsers: false,
            },
          })
          .state('users.convert.services', {
            views: {
              'usersConvert@users.convert': {
                templateUrl: 'modules/core/users/userAdd/assignServicesModal.tpl.html',
              },
            },
          })
          .state('users.convert.services.dn', {
            views: {
              'usersConvert@users.convert': {
                templateUrl: 'modules/huron/users/assignDnAndDirectLinesModal.tpl.html',
              },
            },
          })
          .state('users.convert.results', {
            views: {
              'usersConvert@users.convert': {
                templateUrl: 'modules/core/users/userAdd/addUsersResultsModal.tpl.html',
              },
            },
          })
          .state('users.csv', {
            parent: 'users.manage',
            views: {
              'modal@': {
                controller: 'UserCsvCtrl',
                controllerAs: 'csv',
                template: '<div ui-view="usersCsv"></div>',
              },
              'usersCsv@users.csv': {
                templateUrl: 'modules/core/users/userCsv/userCsvFileModal.tpl.html',
              },
            },
          })
          .state('users.csv.results', {
            views: {
              'usersCsv@users.csv': {
                templateUrl: 'modules/core/users/userCsv/userCsvResultsModal.tpl.html',
              },
            },
          })
          .state('editService', {
            parent: 'modal',
            views: {
              'modal@': {
                controller: 'OnboardCtrl',
                template: '<div ui-view="editServices"></div>',
              },
              'editServices@editService': {
                templateUrl: 'modules/core/users/userPreview/editServices.tpl.html',
              },
            },
            params: {
              currentUser: {},
            },
          })
          .state('editService.dn', {
            views: {
              'editServices@editService': {
                templateUrl: 'modules/huron/users/assignDnAndDirectLinesModal.tpl.html',
              },
            },
          })
          .state('userRedirect', {
            parent: 'mainLazyLoad',
            url: '/userRedirect',
            views: {
              'main@': {
                controller: 'userRedirectCtrl',
                controllerAs: 'userRedirect',
                templateUrl: 'modules/core/users/userRedirect/userRedirect.tpl.html',
              },
            },
          })
          .state('user-overview', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                controller: 'UserOverviewCtrl',
                controllerAs: 'userOverview',
                templateUrl: 'modules/core/users/userOverview/userOverview.tpl.html',
              },
              'header@user-overview': {
                templateUrl: 'modules/core/users/userOverview/userHeader.tpl.html',
              },
              'userPending@user-overview': {
                templateUrl: 'modules/core/users/userOverview/userPending.tpl.html',
              },
            },
            resolve: {
              currentUser: /* @ngInject */ function (UserOverviewService, $stateParams) {
                return UserOverviewService.getUser($stateParams.currentUserId)
                  .then(function (response) {
                    $stateParams.currentUser = response.user;
                    $stateParams.entitlements = response.sqEntitlements;
                  });
              },
            },
            params: {
              currentUser: {},
              entitlements: {},
              queryuserslist: {},
              currentUserId: '',
              orgInfo: {},
              preferredLanguageDetails: {},
            },
            data: {
              displayName: 'Overview',
            },
          })
          .state('user-overview.communication', {
            template: '<user-call-overview></user-call-overview>',
            params: {
              reloadToggle: false,
            },
            data: {
              displayName: 'Call',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/overview'));
                }, 'user-call-overview');
              }),
            },
          })
          .state('user-overview.userDetails', {
            template: '<uc-user-details-overview preferred-language-details="$resolve.preferredLanguageDetails"></uc-user-details-overview>',
            params: {
              reloadToggle: false,
            },
            data: {},
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('user-overview.userDetails').data.displayName = $translate.instant('usersPreview.userDetails');
              },
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/users/userDetailsOverview'));
                }, 'uc-user-details-overview');
              }),
              preferredLanguageDetails: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'preferredLanguageDetails');
              },
            },
          })
          .state('user-overview.csdmDevice', {
            views: {
              '': {
                controller: 'DeviceOverviewCtrl',
                controllerAs: 'deviceOverview',
                templateUrl: 'modules/squared/devices/overview/deviceOverview.tpl.html',
              },
            },
            resolve: {
              channels: /* @ngInject */ function (CsdmUpgradeChannelService) {
                return CsdmUpgradeChannelService.getUpgradeChannelsPromise();
              },
            },
            params: {
              currentDevice: {},
              huronDeviceService: {},
            },
            data: {
              displayName: 'Device Configuration',
            },
          })
          .state('user-overview.csdmDevice.emergencyServices', {
            views: {
              '': {
                template: '<uc-emergency-services></uc-emergency-services>',
              },
            },
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('user-overview.csdmDevice.emergencyServices').data.displayName = $translate.instant('spacesPage.emergencyTitle');
              },
            },
            data: {},
            params: {
              currentAddress: {},
              currentNumber: '',
              status: '',
              staticNumber: '',
            },
          })
          .state('user-overview.communication.voicemail', {
            template: '<uc-voicemail  owner-id="$resolve.ownerId"  ></uc-voicemail>',
            params: {
              watcher: null,
              selected: null,
            },
            data: {
              displayName: 'Voicemail',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/voicemail'));
                }, 'user-call-voicemail');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentUser, 'id');
              },
            },
          })
          .state('user-overview.communication.snr', {
            template: '<uc-snr owner-id="$resolve.ownerId" ></uc-snr>',
            data: {
              displayName: 'Single Number Reach',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/snr'));
                }, 'user-call-snr');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentUser, 'id');
              },
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('user-overview.communication.snr').data.displayName = $translate.instant('singleNumberReachPanel.title');
              },
            },
          })
          .state('user-overview.communication.speedDials', {
            template: '<uc-speed-dial owner-type="users" owner-id="$resolve.ownerId"></uc-speed-dial>',
            data: {
              displayName: 'Speed Dials',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/speedDials'));
                }, 'user-call-speed-dials');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentUser, 'id');
              },
            },
          })
          .state('user-overview.communication.cos', {
            template: '<uc-user-cos-form member-type="users" member-id="$resolve.ownerId"></uc-user-cos-form>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/cos/user'));
                }, 'user-call-cos');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentUser, 'id');
              },
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('user-overview.communication.cos').data.displayName = $translate.instant('serviceSetupModal.cos.title');
              },
            },
          })
          .state('user-overview.communication.internationalDialing', {
            template: '<uc-dialing  watcher="$resolve.watcher" selected="$resolve.selected" title="internationalDialingPanel.title"></uc-dialing>',
            params: {
              watcher: null,
              selected: null,
            },
            data: {
              displayName: 'International Dialing',
            },
            resolve: {
              watcher: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'watcher');
              },
              selected: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'selected');
              },
            },
          })
          .state('user-overview.communication.local', {
            template: '<uc-dialing  watcher="$resolve.watcher" selected="$resolve.selected" title="telephonyPreview.localDialing"></uc-dialing>',
            params: {
              watcher: null,
              selected: null,
            },
            data: {
              displayName: 'Local Dialing',
            },
            resolve: {
              watcher: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'watcher');
              },
              selected: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'selected');
              },
            },
          })
          .state('user-overview.communication.line-overview', {
            template: '<uc-line-overview owner-type="user" owner-name="$resolve.ownerName" owner-id="$resolve.ownerId" number-id="$resolve.numberId"></uc-line-overview>',
            params: {
              numberId: '',
            },
            data: {
              displayName: 'Line Configuration',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/lines/lineOverview'));
                }, 'user-call-line');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentUser, 'id');
              },
              ownerName: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentUser, 'displayName');
              },
              numberId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'numberId', '');
              },
            },
          })
          .state('user-overview.messaging', {
            templateUrl: 'modules/core/users/userPreview/userPreview.tpl.html',
            controller: 'UserPreviewCtrl',
            data: {
              displayName: 'Message',
            },
            params: {
              service: 'MESSAGING',
            },
          })
          .state('user-overview.hybrid-services-squared-fusion-cal', {
            templateUrl: 'modules/hercules/user-sidepanel/calendarServicePreview.tpl.html',
            controller: 'CalendarServicePreviewCtrl',
            data: {
              displayName: 'Calendar Service',
            },
            params: {
              extensionId: {},
              extensions: {},
            },
          })
          .state('user-overview.hybrid-services-squared-fusion-cal.history', {
            template: '<user-status-history service-id="\'squared-fusion-cal\'"></user-status-history>',
            data: {
              displayName: 'Status History',
            },
            params: {
              serviceId: {},
            },
          })
          .state('user-overview.hybrid-services-squared-fusion-gcal', {
            templateUrl: 'modules/hercules/user-sidepanel/calendarServicePreview.tpl.html',
            controller: 'CalendarServicePreviewCtrl',
            data: {
              displayName: 'Calendar Service',
            },
            params: {
              extensionId: {},
              extensions: {},
            },
          })
          .state('user-overview.hybrid-services-squared-fusion-gcal.history', {
            template: '<user-status-history service-id="\'squared-fusion-gcal\'"></user-status-history>',
            data: {
              displayName: 'Status History',
            },
            params: {
              serviceId: {},
            },
          })
          .state('user-overview.hybrid-services-squared-fusion-uc', {
            templateUrl: 'modules/hercules/user-sidepanel/callServicePreview.tpl.html',
            controller: 'CallServicePreviewCtrl',
            data: {
              displayName: 'Call Service',
            },
            params: {
              extensionId: {},
              extensions: {},
            },
          })
          .state('user-overview.hybrid-services-squared-fusion-uc.uc-history', {
            template: '<user-status-history service-id="\'squared-fusion-uc\'"></user-status-history>',
            data: {
              displayName: 'Aware Status History',
            },
            params: {
              serviceId: {},
            },
          })
          .state('user-overview.hybrid-services-squared-fusion-uc.ec-history', {
            template: '<user-status-history service-id="\'squared-fusion-ec\'"></user-status-history>',
            data: {
              displayName: 'Connect Status History',
            },
            params: {
              serviceId: {},
            },
          })
          .state('user-overview.conferencing', {
            templateUrl: 'modules/core/users/userPreview/conferencePreview.tpl.html',
            controller: 'ConferencePreviewCtrl',
            controllerAs: 'confPreview',
            data: {
              displayName: 'Meeting',
            },
            params: {
              service: 'CONFERENCING',
            },
          })
          .state('user-overview.conferencing.webex', {
            templateUrl: 'modules/webex/userSettings/userSettings.tpl.html',
            controller: 'WebExUserSettingsCtrl',
            data: {
              displayName: 'Session Enablement',
            },
            params: {
              currentUser: {},
              site: {},
            },
          })
          .state('user-overview.conferencing.webex.webex2', {
            templateUrl: 'modules/webex/userSettings/userSettings2.tpl.html',
            controller: 'WebExUserSettings2Ctrl',
            data: {
              displayName: 'Privileges',
            },
            params: {
              currentUser: {},
              site: {},
            },
          })
          .state('user-overview.contactCenter', {
            templateUrl: 'modules/sunlight/users/userOverview/sunlightUserOverview.tpl.html',
            controller: 'SunlightUserOverviewCtrl',
            controllerAs: 'SunlightUserOverview',
            data: {
              displayName: 'Care',
            },
            params: {
              service: 'CONTACTCENTER',
            },
          })
          .state('user-overview.userProfile', {
            templateUrl: 'modules/core/users/userRoles/userRoles.tpl.html',
            controller: 'UserRolesCtrl',
            data: {
              displayName: 'Roles',
            },
          })

          .state('user-overview.cmc', {
            template: '<cmc-user-details-settings user="$resolve.user" ng-if="$resolve.hasCmcFeatureToggle"></cmc-user-details-settings>',
            params: {
              service: 'CMC',
            },
            resolve: {
              data: /* @ngInject */ function ($translate, $state) {
                $state.get('user-overview.cmc').data.displayName = $translate.instant('cmc.menu.mobileConvergenceService');
              },
              user: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'currentUser');
              },
              hasCmcFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasMobileConvergence);
              },
            },
          })

          // FOR Development: allow editing of user's feature toggles
          .state('edit-featuretoggles', {
            url: '/editfeaturetoggles',
            template: '<feature-toggles-editor></feature-toggles-editor>',
            parent: 'main',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require(['modules/core/featureToggle/editor'], done);
              }),
            },
          })

          .state('organizations', {
            url: '/organizations',
            templateUrl: 'modules/core/organizations/organizationList/organizationList.tpl.html',
            controller: 'ListOrganizationsCtrl',
            parent: 'main',
          })
          .state('organization-overview', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                controller: 'OrganizationOverviewCtrl',
                controllerAs: 'orgOverview',
                templateUrl: 'modules/core/organizations/organizationOverview/organizationOverview.tpl.html',
              },
              'header@organization-overview': {
                templateUrl: 'modules/core/organizations/organizationOverview/organizationHeader.tpl.html',
              },
            },
            params: {
              currentOrganization: null,
            },
            data: {
              displayName: 'Overview',
            },
          })
          .state('organization-overview.features', {
            templateUrl: 'modules/core/organizations/organizationFeatures/organizationFeatures.tpl.html',
            controller: 'OrganizationFeaturesCtrl',
            controllerAs: 'features',
            params: {
              reloadToggle: false,
            },
            data: {
              displayName: 'Beta Features',
            },
          })
          .state('organization-overview.add.addNumbers', {
            templateUrl: 'modules/core/organizations/organizationAdd/addNumbers.tpl.html',
            controller: 'DidAddCtrl',
            controllerAs: 'didAdd',
            params: {
              currentTrial: {},
              currentOrg: {},
            },
          })
          .state('site-list', {
            url: '/site-list',
            templateUrl: 'modules/core/siteList/siteList.tpl.html',
            controller: 'WebExSiteRowCtrl',
            controllerAs: 'siteList',
            parent: 'main',
          })
          .state('site-csv', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'SiteCSVModalCtrl',
                templateUrl: 'modules/webex/siteCSVModal/siteCSVModal.tpl.html',
                controllerAs: 'siteCSVModalCtrl',
              },
            },
            params: {
              siteRow: null,
            },
          })
          .state('site-csv-results', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'SiteCSVResultsCtrl',
                templateUrl: 'modules/webex/siteCSVResultsModal/siteCSVResults.tpl.html',
                controllerAs: 'siteCSVResult',
              },
            },
            params: {
              siteRow: null,
            },
          })
          .state('site-list.site-settings', {
            templateUrl: 'modules/webex/siteSettings/siteSettings.tpl.html',
            controller: 'WebExSiteSettingsCtrl',
            parent: 'main',
            params: {
              siteUrl: null,
            },
          })
          .state('site-list.site-setting', {
            templateUrl: 'modules/webex/siteSetting/siteSetting.tpl.html',
            controller: 'WebExSiteSettingCtrl',
            parent: 'main',
            params: {
              siteUrl: null,
              webexPageId: null,
              settingPageIframeUrl: null,
            },
          })

          .state('reports', {
            templateUrl: 'modules/core/customerReports/customerReportsHeader.tpl.html',
            controller: 'CustomerReportsHeaderCtrl',
            controllerAs: 'header',
            parent: 'main',
            abstract: true,
          })
          .state('reports.spark', {
            url: '/reports',
            views: {
              'tabContent': {
                controllerAs: 'nav',
                controller: 'SparkReportCtrl',
                templateUrl: 'modules/core/customerReports/sparkReports/sparkReports.tpl.html',
              },
            },
          })
          .state('reports.metrics', {
            url: '/reports/metrics',
            views: {
              'tabContent': {
                controllerAs: 'nav',
                controller: 'MediaServiceMetricsContoller',
                templateUrl: 'modules/mediafusion/metrics-graph-report/mediaServiceMetricsReports.tpl.html',
              },
            },
          })
          .state('reports.webex-metrics', {
            url: '/reports/webexMetrics',
            views: {
              'tabContent': {
                controllerAs: 'nav',
                controller: 'WebExMetricsCtrl',
                templateUrl: 'modules/core/customerReports/webexMetrics/webexMetrics.tpl.html',
              },
            },
          })
          .state('reports.media', {
            url: '/reports/media',
            views: {
              'tabContent': {
                controllerAs: 'nav',
                controller: 'MediaReportsController',
                templateUrl: 'modules/mediafusion/reports/media-reports.html',
              },
            },
          })
          .state('reports.mediaservice', {
            url: '/reports/mediaservice',
            views: {
              'tabContent': {
                controllerAs: 'nav',
                controller: 'MediaReportsController',
                templateUrl: 'modules/mediafusion/reports/media-reports-phase-two.html',
              },
            },
          })
          .state('reports.care', {
            url: '/reports/care',
            views: {
              'tabContent': {
                controllerAs: 'nav',
                controller: 'CareReportsController',
                templateUrl: 'modules/sunlight/reports/careReports.tpl.html',
              },
            },
          })
          .state('reports.device-usage', {
            url: '/reports/device/usage',
            views: {
              'tabContent': {
                controllerAs: 'deviceUsage',
                controller: 'DeviceUsageCtrl',
                templateUrl: 'modules/core/customerReports/deviceUsage/total.tpl.html',
              },
            },
          })
          .state('reports.webex', {
            url: '/reports/webex',
            views: {
              'tabContent': {
                controllerAs: 'nav',
                controller: 'WebexReportsCtrl',
                templateUrl: 'modules/core/customerReports/webexReports/webexReports.tpl.html',
              },
            },
            params: {
              siteUrl: null,
            },
          })
          .state('webex-reports-iframe', {
            templateUrl: 'modules/webex/siteReportsIframe/siteReportIframe.tpl.html',
            controller: 'ReportsIframeCtrl',
            parent: 'main',
            params: {
              siteUrl: null,
              reportPageId: null,
              reportPageIframeUrl: null,
            },
            data: {
              displayName: 'Reports Page2',
            },
          })
          .state('userprofile', {
            url: '/userprofile/:uid',
            templateUrl: 'modules/squared/views/userprofile.html',
            controller: 'UserProfileCtrl',
            parent: 'main',
          })
          .state('support', {
            url: '/support',
            templateUrl: 'modules/squared/support/support.html',
            controller: 'SupportCtrl',
            parent: 'main',
          })
          .state('support.status', {
            url: '/status',
            views: {
              'supportPane': {
                templateUrl: 'modules/squared/support/support-status.html',
                controller: 'SupportCtrl',
                controllerAs: 'support',
              },
            },
          })
          .state('support.logs', {
            url: '/logs?search',

            views: {
              'supportPane': {
                templateUrl: 'modules/squared/support/support-logs.html',
                controller: 'SupportCtrl',
              },
            },
          })
          .state('support.billing', {
            url: '/billing?enc',
            views: {
              'supportPane': {
                templateUrl: 'modules/squared/support/support-billing.html',
                controller: 'BillingCtrl',
              },
            },

          })
          .state('billing', {
            url: '/orderprovisioning?enc',
            templateUrl: 'modules/squared/support/billing.tpl.html',
            controller: 'BillingCtrl',
            parent: 'main',
          })

          /*
           devices
           */
          .state('places', {
            url: '/places',
            templateUrl: 'modules/squared/places/places.html',
            controller: 'PlacesCtrl',
            controllerAs: 'sc',
            parent: 'main',
            data: {
              bodyClass: 'places-page',
            },
          })
          .state('place-overview', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<place-overview></place-overview>',
              },
              'header@place-overview': {
                templateUrl: 'modules/squared/places/overview/placeHeader.html',
              },
            },
            params: {
              currentPlace: {},
            },
            data: {
              displayName: 'Overview',
            },
          })
          .state('place-overview.csdmDevice', {
            views: {
              '': {
                controller: 'DeviceOverviewCtrl',
                controllerAs: 'deviceOverview',
                templateUrl: 'modules/squared/devices/overview/deviceOverview.tpl.html',
              },
            },
            resolve: {
              channels: /* @ngInject */ function (CsdmUpgradeChannelService) {
                return CsdmUpgradeChannelService.getUpgradeChannelsPromise();
              },
            },
            params: {
              currentDevice: {},
              huronDeviceService: {},
            },
            data: {
              displayName: 'Device Configuration',
            },
          })
          .state('place-overview.csdmDevice.emergencyServices', {
            views: {
              '': {
                template: '<uc-emergency-services></uc-emergency-services>',
              },
            },
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('place-overview.csdmDevice.emergencyServices').data.displayName = $translate.instant('spacesPage.emergencyTitle');
              },
            },
            data: {},
            params: {
              currentAddress: {},
              currentNumber: '',
              status: '',
              staticNumber: '',
            },
          })
          .state('place-overview.communication', {
            template: '<place-call-overview></place-call-overview>',
            params: {
              reloadToggle: false,
            },
            data: {
              displayName: 'Call',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/squared/places/callOverview'));
                }, 'place-call-overview');
              }),
            },
          })
          .state('place-overview.communication.speedDials', {
            template: '<uc-speed-dial owner-type="places" owner-id="$resolve.ownerId"></uc-speed-dial>',
            data: {
              displayName: 'Speed Dials',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/speedDials'));
                }, 'place-call-speed-dials');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentPlace, 'cisUuid');
              },
            },
          })
          .state('place-overview.communication.cos', {
            template: '<uc-user-cos-form member-type="places" member-id="$resolve.ownerId"></uc-user-cos-form>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/cos/user'));
                }, 'place-call-cos');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentPlace, 'cisUuid');
              },
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('place-overview.communication.cos').data.displayName = $translate.instant('serviceSetupModal.cos.title');
              },
            },
          })
          .state('place-overview.communication.internationalDialing', {
            template: '<uc-dialing  watcher="$resolve.watcher" selected="$resolve.selected" title="internationalDialingPanel.title"></uc-dialing>',
            params: {
              watcher: null,
              selected: null,
            },
            data: {
              displayName: 'International Dialing',
            },
            resolve: {
              watcher: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'watcher');
              },
              selected: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'selected');
              },
            },
          })
          .state('place-overview.communication.local', {
            template: '<uc-dialing  watcher="$resolve.watcher" selected="$resolve.selected" title="telephonyPreview.localDialing"></uc-dialing>',
            params: {
              watcher: null,
              selected: null,
            },
            data: {
              displayName: 'Local Dialing',
            },
            resolve: {
              watcher: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'watcher');
              },
              selected: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'selected');
              },
            },
          })
          .state('place-overview.communication.line-overview', {
            template: '<uc-line-overview owner-type="place" owner-name="$resolve.ownerName" owner-id="$resolve.ownerId" owner-place-type="$resolve.ownerPlaceType" number-id="$resolve.numberId"></uc-line-overview>',
            params: {
              numberId: '',
            },
            data: {
              displayName: 'Line Configuration',
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/lines/lineOverview'));
                }, 'place-call-line');
              }),
              ownerId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentPlace, 'cisUuid');
              },
              ownerName: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentPlace, 'displayName');
              },
              ownerPlaceType: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams.currentPlace, 'type');
              },
              numberId: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'numberId', '');
              },
            },
          })
          .state('place-overview.hybrid-services-squared-fusion-cal', {
            templateUrl: 'modules/hercules/user-sidepanel/calendarServicePreview.tpl.html',
            controller: 'CalendarServicePreviewCtrl',
            data: {
              displayName: 'Calendar Service',
            },
            params: {
              extensionId: {},
              extensions: {},
              parentState: 'place-overview',
              editService: {},
              getCurrentPlace: {},
            },
          })
          .state('place-overview.hybrid-services-squared-fusion-cal.history', {
            template: '<user-status-history service-id="\'squared-fusion-cal\'"></user-status-history>',
            data: {
              displayName: 'Status History',
            },
            params: {
              serviceId: {},
            },
          })
          .state('place-overview.hybrid-services-squared-fusion-gcal', {
            templateUrl: 'modules/hercules/user-sidepanel/calendarServicePreview.tpl.html',
            controller: 'CalendarServicePreviewCtrl',
            data: {
              displayName: 'Calendar Service',
            },
            params: {
              extensionId: {},
              extensions: {},
              editService: {},
              getCurrentPlace: {},
            },
          })
          .state('place-overview.hybrid-services-squared-fusion-gcal.history', {
            template: '<user-status-history service-id="\'squared-fusion-gcal\'"></user-status-history>',
            data: {
              displayName: 'Status History',
            },
            params: {
              serviceId: {},
            },
          })
          .state('place-overview.hybrid-services-squared-fusion-uc', {
            templateUrl: 'modules/hercules/user-sidepanel/callServicePreview.tpl.html',
            controller: 'CallServicePreviewCtrl',
            data: {
              displayName: 'Call Service',
            },
            params: {
              extensionId: {},
              extensions: {},
              editService: {},
              getCurrentPlace: {},
            },
          })
          .state('place-overview.hybrid-services-squared-fusion-uc.uc-history', {
            template: '<user-status-history service-id="\'squared-fusion-uc\'"></user-status-history>',
            data: {
              displayName: 'Aware Status History',
            },
            params: {
              serviceId: {},
            },
          })
          .state('devices', {
            url: '/devices',
            templateUrl: 'modules/squared/devices/devices.html',
            controller: 'DevicesCtrl',
            controllerAs: 'sc',
            parent: 'main',
            data: {
              bodyClass: 'devices-page',
            },
          })
          .state('device-overview', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                controller: 'DeviceOverviewCtrl',
                controllerAs: 'deviceOverview',
                templateUrl: 'modules/squared/devices/overview/deviceOverview.tpl.html',
              },
              'header@device-overview': {
                templateUrl: 'modules/squared/devices/overview/deviceHeader.tpl.html',
              },
            },
            resolve: {
              channels: /* @ngInject */ function (CsdmUpgradeChannelService) {
                return CsdmUpgradeChannelService.getUpgradeChannelsPromise();
              },
            },
            params: {
              currentDevice: {},
              huronDeviceService: {},
            },
            data: {
              displayName: 'Overview',
            },
          })
          .state('device-overview.emergencyServices', {
            parent: 'device-overview',
            views: {
              'sidepanel@': {
                template: '<uc-emergency-services></uc-emergency-services>',
              },
              'header@device-overview.emergencyServices': {
                templateUrl: 'modules/squared/devices/emergencyServices/emergencyServicesHeader.tpl.html',
              },
            },
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('device-overview.emergencyServices').data.displayName = $translate.instant('spacesPage.emergencyTitle');
              },
            },
            data: {},
            params: {
              currentAddress: {},
              currentNumber: '',
              status: '',
              staticNumber: '',
            },
          })
          .state('video', {
            parent: 'modal',
            views: {
              'modal@': {
                template: '<cr-video-modal class="modal-content" dismiss="$dismiss()"></cr-video-modal>',
              },
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/core/video'));
                }, 'video');
              }),
            },
          })
          .state('partneroverview', {
            parent: 'partner',
            url: '/overview',
            templateUrl: 'modules/core/partnerHome/partnerHome.tpl.html',
            controller: 'PartnerHomeCtrl',
          })
          .state('partnerreports', {
            parent: 'partner',
            url: '/reports',
            templateUrl: 'modules/core/partnerReports/partnerReports.tpl.html',
            controller: 'PartnerReportCtrl',
            controllerAs: 'nav',
          })
          .state('login_swap', {
            parent: 'loginLazyLoad',
            url: '/login/:customerOrgId/:customerOrgName',
            views: {
              'main@': {
                template: '<login/>',
              },
            },
            authenticate: false,
          })
          .state('launch_partner_org', {
            parent: 'loginLazyLoad',
            url: '/login/:partnerOrgId/:partnerOrgName/:launchPartner',
            views: {
              'main@': {
                template: '<login/>',
              },
            },
            authenticate: false,
          })
          .state('partnercustomers', {
            parent: 'partner',
            template: '<div ui-view></div>',
            absract: true,
          })
          .state('gem', {
            parent: 'partner',
            controller: 'GemCtrl',
            template: '<div ui-view></div>',
          })
          .state('gemOverview', {
            parent: 'partner',
            url: '/services/overview',
            template: '<cca-card></cca-card>',
          })
          .state('gem.servicesPartner', {
            url: '/services/spList',
            templateUrl: "modules/gemini/common/servicePartner.tpl.html",
            controller: 'servicePartnerCtrl',
            controllerAs: 'gsls',
          })
          .state('gem.base', {
            abstract: true,
            template: '<gem-base></gem-base>',
          })
          .state('gem.base.cbgs', {
            controller: 'CbgsCtrl',
            controllerAs: 'cbgsCtrl',
            url: '/services/gemcbg/:companyName/:customerId',
            templateUrl: 'modules/gemini/callbackGroup/cbgs.tpl.html',
          })
          .state('gem.base.tds', {
            url: '/services/td/:companyName/:customerId',
            template: '<gm-telephony-domains></gm-telephony-domains>',
          })
          .state('gem.modal', {
            abstract: true,
            parent: 'modal',
            views: {
              'modal@': {
                template: '<div ui-view></div>',
              },
            },
          })
          .state('gem.modal.request', {
            controller: 'CbgRequestCtrl',
            controllerAs: 'cbgrCtrl',
            params: {
              customerId: null,
            },
            templateUrl: 'modules/gemini/callbackGroup/cbgRequest.tpl.html',
          })
          .state('gmTdLargePanel', {
            data: {},
            parent: 'largepanel',
            views: { 'sidepanel@': { template: '<gm-td-large-panel></gm-td-large-panel>' } },
          })
          .state('gmTdDetails', {
            data: {},
            params: { info: {} },
            parent: 'sidepanel',
            views: {
              'sidepanel@': { template: '<gm-td-details></gm-td-details>' },
              'header@gmTdDetails': { templateUrl: 'modules/gemini/telephonyDomain/details/gmTdDetailsHeader.tpl.html' } },
          })
          .state('gmTdDetails.numbersView', {
            onEnter: SidePanelLargeOpen,
            onExit: SidePanelLargeClose,
            template: '<gm-td-numbers-view></gm-td-numbers-view>',
          })
          .state('gmTdDetails.sites', {
            params: { data: {} },
            template: '<gm-td-sites></gm-td-sites>',
          })
          .state('gmTdDetails.notes', {
            template: '<gm-td-notes></gm-td-notes>',
            params: { obj: {} },
          })
          .state('gemCbgDetails', {
            data: {},
            parent: 'sidepanel',
            params: { info: {} },
            views: { 'sidepanel@': { template: '<cbg-details></cbg-details>' } },
          })
          .state('gemCbgDetails.sites', {
            template: '<cbg-sites></cbg-sites>',
            params: { obj: {} },
          })
          .state('gemCbgDetails.editCountry', {
            template: '<cbg-edit-country></cbg-edit-country>',
            params: { obj: {} },
          })
          .state('gemCbgDetails.notes', {
            template: '<cbg-notes></cbg-notes>',
            params: { obj: {} },
          })
          .state('partnercustomers.list', {
            url: '/customers',
            templateUrl: 'modules/core/customers/customerList/customerList.tpl.html',
            controller: 'CustomerListCtrl',
            controllerAs: 'customerList',
            params: {
              filter: null,
            },
          })
          .state('customer-overview', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                controller: 'CustomerOverviewCtrl',
                controllerAs: 'customerOverview',
                templateUrl: 'modules/core/customers/customerOverview/customerOverview.tpl.html',
              },
            },
            resolve: {
              identityCustomer: /* @ngInject */ function ($stateParams, $q, Orgservice) {
                var defer = $q.defer();
                if ($stateParams.currentCustomer) {
                  var params = {
                    basicInfo: true,
                  };
                  Orgservice.getOrg(orgCallback, $stateParams.currentCustomer.customerOrgId, params);
                }

                return defer.promise;

                function orgCallback(data) {
                  defer.resolve(data);
                }
              },
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview').data.displayName = $translate.instant('common.overview');
              },
            },
            params: {
              currentCustomer: {},
            },
            data: {},
          })
          .state('customer-overview.customerAdministrators', {
            controller: 'CustomerAdministratorDetailCtrl',
            controllerAs: 'customerAdmin',
            templateUrl: 'modules/core/customers/customerAdministrators/customerAdministratorDetail.tpl.html',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.customerAdministrators').data.displayName = $translate.instant('customerPage.administrators');
              },
            },
            data: {},
          })
          .state('customer-overview.customerSubscriptions', {
            controller: 'CustomerSubscriptionsDetailCtrl',
            controllerAs: '$ctrl',
            templateUrl: 'modules/core/customers/customerSubscriptions/customerSubscriptionsDetail.tpl.html',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.customerSubscriptions').data.displayName = $translate.instant('customerPage.orderRequest');
              },
            },
          })
          .state('customer-overview.ordersOverview', {
            params: {
              currentCustomer: {},
            },
            data: {},
            template: '<uc-orders-overview is-partner="true" current-customer="$resolve.currentCustomer"></uc-orders-overview>',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.ordersOverview').data.displayName = $translate.instant('customerPage.pstnOrders');
              },
              lazy: resolveLazyLoad(function (done) {
                require(['modules/huron/pstnOrderManagement/ordersOverview'], done);
              }),
              currentCustomer: /* @ngInject */ function ($stateParams) {
                return $stateParams.currentCustomer;
              },
            },
          })
          .state('customer-overview.meetingDetail', {
            controller: 'MeetingDetailCtrl',
            controllerAs: 'meetingDetail',
            templateUrl: 'modules/core/customers/customerOverview/meetingDetail.tpl.html',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.meetingDetail').data.displayName = $translate.instant('customerPage.meetingLicenses');
              },
            },
            data: {},
            params: {
              meetingLicenses: {},
            },
          })
          .state('customer-overview.sharedDeviceDetail', {
            controller: 'SharedDeviceDetailCtrl',
            controllerAs: 'sharedDeviceDetail',
            templateUrl: 'modules/core/customers/customerOverview/sharedDeviceDetail.tpl.html',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.sharedDeviceDetail').data.displayName = $translate.instant('customerPage.sharedDeviceLicenses');
              },
            },
            data: {},
            params: {
              sharedDeviceLicenses: {},
            },
          })
          .state('customer-overview.careLicenseDetail', {
            controller: 'CareLicenseDetailCtrl',
            controllerAs: 'careLicenseDetail',
            templateUrl: 'modules/core/customers/customerOverview/careLicenseDetail.tpl.html',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.careLicenseDetail').data.displayName = $translate.instant('customerPage.careLicenses');
              },
            },
            data: {},
            params: {
              careLicense: {},
            },
          })
          .state('customer-overview.externalNumbers', {
            controller: 'ExternalNumberDetailCtrl',
            controllerAs: 'externalNumbers',
            templateUrl: 'modules/huron/externalNumbers/externalNumberDetail.tpl.html',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.externalNumbers').data.displayName = $translate.instant('customerPage.phoneNumbers');
              },
            },
            data: {},
          })
          .state('customer-overview.domainDetail', {
            controller: 'DomainDetailCtrl',
            controllerAs: 'domainDetail',
            templateUrl: 'modules/core/customers/customerOverview/domainDetail.tpl.html',
            resolve: {
              data: /*ngInject */ function ($state, $translate) {
                $state.get('customer-overview.domainDetail').data.displayName = $translate.instant('customerPage.domains');
              },
            },
            data: {},
            params: {
              webexDomains: {},
            },
          })
          .state('customerPstnOrdersOverview', {
            parent: 'sidepanel',
            params: {
              currentCustomer: {},
              vendor: undefined,
            },
            data: {},
            views: {
              'sidepanel@': {
                template: '<uc-customer-pstn-orders-overview current-customer="$resolve.currentCustomer" vendor="$resolve.vendor"></uc-customer-pstn-orders-overview>',
              },
            },
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customerPstnOrdersOverview').data.displayName = $translate.instant('pstnOrderOverview.orderHistory');
              },
              lazy: resolveLazyLoad(function (done) {
                require(['modules/huron/pstnOrderManagement/customerPstnOrdersOverview'], done);
              }),
              currentCustomer: /* @ngInject */ function ($stateParams) {
                return $stateParams.currentCustomer;
              },
              vendor: /* @ngInject */ function ($stateParams) {
                return $stateParams.vendor;
              },
            },
          })
          .state('customerPstnOrdersOverview.orderDetail', {
            params: {
              currentOrder: {},
              currentCustomer: {},
            },
            data: {},
            template: '<uc-order-detail current-customer= "$resolve.currentCustomer" current-order="$resolve.currentOrder"></uc-order-detail>',
            resolve: {
              data: /* @ngInject */ function ($state, $stateParams) {
                $state.get('customerPstnOrdersOverview.orderDetail').data.displayName = $stateParams.currentOrder.carrierOrderId;
              },
              lazy: resolveLazyLoad(function (done) {
                require(['modules/huron/pstnOrderManagement/orderDetail'], done);
              }),
              currentOrder: /* @ngInject */ function ($stateParams) {
                return $stateParams.currentOrder;
              },
              currentCustomer: /* @ngInject */ function ($stateParams) {
                return $stateParams.currentCustomer;
              },
            },
          })
          .state('customer-overview.orderDetail', {
            parent: 'customer-overview.ordersOverview',
            params: {
              currentCustomer: {},
              currentOrder: {},
            },
            data: {},
            template: '<uc-order-detail current-customer= "$resolve.currentCustomer" current-order="$resolve.currentOrder"></uc-order-detail>',
            resolve: {
              data: /* @ngInject */ function ($state, $translate) {
                $state.get('customer-overview.orderDetail').data.displayName = $translate.instant('customerPage.pstnOrders');
              },
              lazy: resolveLazyLoad(function (done) {
                require(['modules/huron/pstnOrderManagement/orderDetail'], done);
              }),
              currentCustomer: /* @ngInject */ function ($stateParams) {
                return $stateParams.currentCustomer;
              },
              currentOrder: /* @ngInject */ function ($stateParams) {
                return $stateParams.currentOrder;
              },
            },
          })
          .state('firsttimesplash', {
            parent: 'mainLazyLoad',
            abstract: true,
            views: {
              'main@': {
                templateUrl: 'modules/core/setupWizard/firstTimeWizard.tpl.html',
                controller: 'FirstTimeWizardCtrl',
              },
            },
          })
          .state('firsttimewizard', {
            parent: 'firsttimesplash',
            template: '<cr-wizard tabs="tabs" finish="finish" is-first-time="true"></cr-wizard>',
            controller: 'SetupWizardCtrl',
            data: {
              firstTimeSetup: true,
            },
          })
          .state('setupwizardmodal', {
            parent: 'wizardmodal',
            views: {
              'modal@': {
                template: '<cr-wizard tabs="tabs" finish="finish"></cr-wizard>',
                controller: 'SetupWizardCtrl',
              },
            },
            params: {
              currentTab: {},
              currentSubTab: '',
              currentStep: '',
              numberOfSteps: undefined,
              onlyShowSingleTab: false,
            },
            data: {
              firstTimeSetup: false,
            },
          })
          .state('trialExtInterest', {
            url: '/trialExtInterest?eqp',
            templateUrl: 'modules/core/trialExtInterest/trialExtInterest.tpl.html',
            controller: 'TrialExtInterestCtrl',
            controllerAs: 'extInterest',
            parent: 'main',
          })
          .state('helpdesk-main', {
            parent: 'mainLazyLoad',
            views: {
              'main@': {
                controller: 'HelpdeskHeaderController',
                controllerAs: 'helpdeskHeaderCtrl',
                templateUrl: 'modules/squared/helpdesk/helpdesk.tpl.html',
              },
            },
            abstract: true,
            sticky: true,
          })
          .state('helpdesklaunch', {
            url: '/helpdesklaunch',
            templateUrl: 'modules/squared/helpdesk/helpdesk-launch.html',
            parent: 'main',
          })
          .state('helpdesk', {
            url: '/helpdesk',
            template: '<div ui-view></div>',
            controller: 'HelpdeskController',
            controllerAs: 'helpdeskCtrl',
            parent: 'helpdesk-main',
          })
          .state('helpdesk.search', {
            url: '/',
            templateUrl: 'modules/squared/helpdesk/helpdesk-search.html',
          })
          .state('helpdesk.user', {
            url: '/user/:orgId/:id',
            templateUrl: 'modules/squared/helpdesk/helpdesk-user.html',
            controller: 'HelpdeskUserController',
            controllerAs: 'helpdeskUserCtrl',
            params: {
              user: null,
              id: null,
              orgId: null,
            },
          })
          .state('helpdesk.order', {
            url: '/order/:orderId/:id',
            templateUrl: 'modules/squared/helpdesk/helpdesk-order.html',
            controller: 'HelpdeskOrderController',
            controllerAs: 'helpdeskOrderCtrl',
            params: {
              order: null,
            },
          })
          .state('helpdesk.org', {
            url: '/org/:id',
            templateUrl: 'modules/squared/helpdesk/helpdesk-org.html',
            controller: 'HelpdeskOrgController',
            controllerAs: 'helpdeskOrgCtrl',
            params: {
              org: null,
              id: null,
            },
          })
          .state('helpdesk.cloudberry-device', {
            url: '/cloudberryDevice/:orgId/:id',
            templateUrl: 'modules/squared/helpdesk/helpdesk-cloudberry-device.html',
            controller: 'HelpdeskCloudberryDeviceController',
            controllerAs: 'helpdeskDeviceCtrl',
            params: {
              device: null,
              id: null,
              orgId: null,
            },
          })
          .state('helpdesk.huron-device', {
            url: '/huronDevice/:orgId/:id',
            templateUrl: 'modules/squared/helpdesk/helpdesk-huron-device.html',
            controller: 'HelpdeskHuronDeviceController',
            controllerAs: 'helpdeskDeviceCtrl',
            params: {
              device: null,
              id: null,
              orgId: null,
            },
          });

        $stateProvider
          .state('cdrsupport', {
            url: '/cdrsupport',
            templateUrl: 'modules/huron/cdrLogs/cdrlogs.tpl.html',
            controller: 'CdrLogsCtrl',
            controllerAs: 'cdr',
            parent: 'main',
          })
          .state('cdr-overview', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                controller: 'CdrOverviewCtrl',
                controllerAs: 'cdrpanel',
                templateUrl: 'modules/huron/cdrLogs/cdrOverview/cdrOverview.tpl.html',
              },
            },
            params: {
              cdrData: {},
              call: [],
              uniqueIds: [],
              events: [],
              imported: '',
              logstashPath: '',
            },
            data: {
              displayName: 'Advanced CDR Report',
            },
          })
          .state('cdrladderdiagram', {
            parent: 'modal',
            views: {
              'modal@': {
                templateUrl: 'modules/huron/cdrLogs/cdrLadderDiagram/cdrLadderDiagram.tpl.html',
                controller: 'CdrLadderDiagramCtrl',
                controllerAs: 'cdrLadderDiagram',
              },
            },
            params: {
              call: [],
              uniqueIds: [],
              events: [],
              imported: '',
              logstashPath: '',
            },
          })
          .state('trial', {
            abstract: true,
            parent: 'modal',
            views: {
              'modal@': {
                template: '<div ui-view></div>',
                controller: 'TrialCtrl',
                controllerAs: 'trial',
              },
            },
            params: {
              isEditing: false,
              currentTrial: {},
              details: {},
              mode: {},
            },
          })
          .state('trial.info', {
            templateUrl: 'modules/core/trials/trial.tpl.html',
          })
          .state('trial.finishSetup', {
            templateUrl: 'modules/core/trials/trialFinishSetup.tpl.html',
          })
          .state('trial.webex', {
            templateUrl: 'modules/core/trials/trialWebex.tpl.html',
            controller: 'TrialWebexCtrl',
            controllerAs: 'webexTrial',
          })
          .state('trial.call', {
            templateUrl: 'modules/core/trials/trialDevice.tpl.html',
            controller: 'TrialDeviceController',
            controllerAs: 'callTrial',
          })
          .state('trial.pstnDeprecated', {
            templateUrl: 'modules/core/trials/trialPstn.tpl.html',
            controller: 'TrialPstnCtrl',
            controllerAs: 'pstnTrial',
          })
          .state('trial.pstn', {
            template: '<uc-pstn-trial-setup class="modal-content" dismiss="$dismiss()"></uc-pstn-trial-setup>',
            controller: 'TrialPstnCtrl',
            controllerAs: 'pstnTrial',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/pstn/pstnTrialSetup'));
                }, 'pstn-setup');
              }),
            },
          })
          .state('trial.emergAddress', {
            templateUrl: 'modules/core/trials/trialEmergAddress.tpl.html',
            controller: 'TrialEmergAddressCtrl',
            controllerAs: 'eAddressTrial',
          })
          .state('trial.addNumbers', {
            templateUrl: 'modules/core/trials/addNumbers.tpl.html',
            controller: 'DidAddCtrl',
            controllerAs: 'didAdd',
            params: {
              currentTrial: {},
              currentOrg: {},
            },
          })
          .state('didadd', {
            parent: 'modal',
            params: {
              currentOrg: {},
              editMode: true,
            },
            views: {
              'modal@': {
                templateUrl: 'modules/huron/didAdd/didAdd.tpl.html',
                controller: 'DidAddCtrl',
                controllerAs: 'didAdd',
              },
            },
          })
          .state('pstn', {
            parent: 'modal',
            params: {
              customerId: {},
              customerName: {},
              customerEmail: {},
              customerCommunicationLicenseIsTrial: {},
              customerRoomSystemsLicenseIsTrial: {},
            },
            views: {
              'modal@': {
                template: '<uc-pstn-wizard customer-id="$resolve.customerId" customer-name="$resolve.customerName" customer-email="$resolve.customerEmail" customer-communication-license-is-trial="$resolve.customerCommunicationLicenseIsTrial" customer-room-systems-license-is-trial="$resolve.customerRoomSystemsLicenseIsTrial"></uc-pstn-wizard>',
              },
            },
            resolve: {
              customerId: /* @ngInject */ function ($stateParams) {
                return $stateParams.customerId;
              },
              customerName: /* @ngInject */ function ($stateParams) {
                return $stateParams.customerName;
              },
              customerEmail: /* @ngInject */ function ($stateParams) {
                return $stateParams.customerEmail;
              },
              customerCommunicationLicenseIsTrial: /* @ngInject */ function ($stateParams) {
                return $stateParams.customerCommunicationLicenseIsTrial;
              },
              customerRoomSystemsLicenseIsTrial: /* @ngInject */ function ($stateParams) {
                return $stateParams.customerRoomSystemsLicenseIsTrial;
              },
            },
          })
          .state('pstnWizard', {
            parent: 'modal',
            params: {
              customerId: {},
              customerName: {},
              customerEmail: {},
              customerCommunicationLicenseIsTrial: {},
              customerRoomSystemsLicenseIsTrial: {},
            },
            views: {
              'modal@': {
                template: '<uc-pstn-paid-wizard class="modal-content" customer-id="$resolve.customerId" customer-communication-license-is-trial="$resolve.customerCommunicationLicenseIsTrial" customer-room-systems-license-is-trial="$resolve.customerRoomSystemsLicenseIsTrial" dismiss="$dismiss()" close="$close()"></uc-pstn-paid-wizard>',
                resolve: {
                  modalInfo: function ($state) {
                    $state.params.modalClass = 'pstn-numbers';
                  },
                },
              },
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/pstn/pstnWizard'));
                }, 'pstn-wizard');
              }),
              customerSetup: /* @ngInject */ function ($stateParams, PstnSetup, PstnSetupService, Notification) {
                PstnSetup.setCustomerId($stateParams.customerId);
                PstnSetup.setCustomerName($stateParams.customerName);
                PstnSetup.setCustomerEmail($stateParams.customerEmail);
                PstnSetup.setIsTrial($stateParams.customerCommunicationLicenseIsTrial && $stateParams.customerRoomSystemsLicenseIsTrial);
                //Reset Carriers
                PstnSetup.setCarriers([]);

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
              },
            },
          })
          .state('pstnSetup', {
            parent: 'modal',
            params: {
              customerId: {},
              customerName: {},
              customerEmail: {},
              customerCommunicationLicenseIsTrial: {},
              customerRoomSystemsLicenseIsTrial: {},
            },
            views: {
              'modal@': {
                template: '<div ui-view></div>',
                controller: 'PstnSetupCtrl',
                controllerAs: 'pstnSetup',
              },
              '@pstnSetup': {
                templateUrl: 'modules/huron/pstnSetup/pstnProviders/pstnProviders.tpl.html',
                controller: 'PstnProvidersCtrl',
                controllerAs: 'pstnProviders',
              },
            },
          })
          .state('pstnSetup.contractInfo', {
            templateUrl: 'modules/huron/pstnSetup/pstnContractInfo/pstnContractInfo.tpl.html',
            controller: 'PstnContractInfoCtrl',
            controllerAs: 'pstnContractInfo',
          })
          .state('pstnSetup.serviceAddress', {
            templateUrl: 'modules/huron/pstnSetup/pstnServiceAddress/pstnServiceAddress.tpl.html',
            controller: 'PstnServiceAddressCtrl',
            controllerAs: 'pstnServiceAddress',
          })
          .state('pstnSetup.orderNumbers', {
            templateUrl: 'modules/huron/pstnSetup/pstnNumbers/pstnNumbers.tpl.html',
            controller: 'PstnNumbersCtrl',
            controllerAs: 'pstnNumbers',
          })
          .state('pstnSetup.swivelNumbers', {
            templateUrl: 'modules/huron/pstnSetup/pstnSwivelNumbers/pstnSwivelNumbers.tpl.html',
            controller: 'PstnSwivelNumbersCtrl',
            controllerAs: 'pstnSwivelNumbers',
          })
          .state('pstnSetup.review', {
            templateUrl: 'modules/huron/pstnSetup/pstnReview/pstnReview.tpl.html',
            controller: 'PstnReviewCtrl',
            controllerAs: 'pstnReview',
          })
          .state('pstnSetup.nextSteps', {
            templateUrl: 'modules/huron/pstnSetup/pstnNextSteps/pstnNextSteps.tpl.html',
            controller: 'PstnNextStepsCtrl',
            controllerAs: 'pstnNextSteps',
            params: {
              portOrders: null,
            },
          })
          .state('hurondetailsBase', {
            abstract: true,
            parent: 'main',
            templateUrl: 'modules/huron/details/huronDetails.html',
          })
          .state('hurondetails', {
            url: '/hurondetails',
            parent: 'hurondetailsBase',
            views: {
              'header': {
                template: '<uc-huron-details-header></uc-huron-details-header>',
              },
              'main': {
                template: '<div ui-view></div>',
              },
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/details'));
                }, 'call-details');
              }),
            },
          })
          .state('huronlines', {
            url: '/lines',
            parent: 'hurondetails',
            templateUrl: 'modules/huron/lines/lineList.tpl.html',
            controller: 'LinesListCtrl',
            controllerAs: 'linesListCtrl',
          })
          .state('externalNumberDelete', {
            parent: 'modalDialog',
            params: {
              numberInfo: {},
              refreshFn: function () {},
            },
            views: {
              'modal@': {
                template: '<delete-external-number number-info="$resolve.numberInfo" refresh-fn="$resolve.refreshFn()" dismiss="$dismiss()"></delete-external-number>',
              },
            },
            resolve: {
              numberInfo: /* @ngInject */ function ($stateParams) {
                return _.get($stateParams, 'numberInfo');
              },
              refreshFn: /* @ngInject */ function ($stateParams) {
                return $stateParams.refreshFn;
              },
            },
          })
          .state('huronsettings', {
            url: '/settings',
            parent: 'hurondetails',
            templateUrl: 'modules/huron/settings/settings.tpl.html',
            controller: 'HuronSettingsCtrl',
            controllerAs: 'settings',
          })
          // TODO (jlowery): rename the huronsettingsnew to huronsettings state when sparkCallTenDigitExt is removed.
          .state('huronsettingsnew', {
            url: '/settingsnew',
            parent: 'hurondetails',
            template: '<uc-settings ftsw="false"></uc-settings>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/settings'));
                }, 'call-settings');
              }),
            },
          })
          .state('users.enableVoicemail', {
            parent: 'modal',
            views: {
              'modal@': {
                templateUrl: 'modules/huron/settings/bulkEnableVmModal/bulkEnableVmModal.html',
              },
            },
          })
          .state('huronfeatures', {
            url: '/features',
            parent: 'hurondetails',
            templateUrl: 'modules/huron/features/featureLanding/features.tpl.html',
            controller: 'HuronFeaturesCtrl',
            controllerAs: 'huronFeaturesCtrl',
          })
          .state('huronnewfeature', {
            url: '/newfeature',
            parent: 'hurondetails',
            templateUrl: 'modules/huron/features/newFeature/newFeature.tpl.html',
            controller: 'NewFeatureCtrl',
            controllerAs: 'newFeatureCtrl',
          })
          .state('huronfeatures.aabuilder', {
            parent: 'hurondetails',
            params: {
              aaName: '',
              aaTemplate: '',
            },
            templateUrl: 'modules/huron/features/autoAttendant/builder/aaBuilderMain.tpl.html',
            controller: 'AABuilderMainCtrl',
            controllerAs: 'aaBuilderMain',
          })
          .state('huronfeatures.deleteFeature', {
            parent: 'modalDialog',
            views: {
              'modal@': {
                controller: 'HuronFeatureDeleteCtrl',
                controllerAs: 'huronFeatureDelete',
                templateUrl: 'modules/huron/features/featureLanding/featureDeleteModal.tpl.html',
              },
            },
            params: {
              deleteFeatureName: null,
              deleteFeatureId: null,
              deleteFeatureType: null,
            },
          })
          .state('huronfeatures.aaListDepends', {
            parent: 'modalDialog',
            views: {
              'modal@': {
                controller: 'HuronFeatureAADependsCtrl',
                controllerAs: 'huronFeatureAADepends',
                templateUrl: 'modules/huron/features/featureLanding/featureAADependsModal.tpl.html',
              },
            },
            params: {
              detailsFeatureName: null,
              detailsFeatureId: null,
              detailsFeatureType: null,
              detailsDependsList: null,
            },
          })
          .state('huronCallPickup', {
            url: '/callPickup',
            parent: 'hurondetails',
            template: '<call-pickup-setup-assistant></call-pickup-setup-assistant>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/features/callPickup/callPickupSetupAssistant'));
                }, 'call-pickup');
              }),
            },
          })
          .state('callpickupedit', {
            url: '/features/pi/edit',
            parent: 'main',
            template: '<call-pickup-setup-assistant></call-pickup-setup-assistant>',
            params: {
              feature: null,
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/features/callPickup/callPickupSetupAssistant'));
                }, 'call-pickup');
              }),
            },
          })
          .state('huronCallPark', {
            url: '/huronCallPark',
            parent: 'hurondetails',
            template: '<uc-call-park></uc-call-park>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/features/callPark/callPark'));
                }, 'call-park');
              }),
            },
          })
          .state('callparkedit', {
            url: '/features/cp/edit',
            parent: 'main',
            template: '<uc-call-park></uc-call-park>',
            params: {
              feature: null,
            },
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/features/callPark/callPark'));
                }, 'call-park');
              }),
            },
          })
          .state('huronHuntGroup', {
            url: '/huronHuntGroup',
            parent: 'hurondetails',
            templateUrl: 'modules/huron/features/huntGroup/hgSetupAssistant.tpl.html',
            controller: 'HuntGroupSetupAssistantCtrl',
            controllerAs: 'huntGroupSA',
          })
          .state('huntgroupedit', {
            url: '/features/hg/edit',
            parent: 'main',
            templateUrl: 'modules/huron/features/huntGroup/edit/hgEdit.tpl.html',
            controller: 'HuntGroupEditCtrl',
            controllerAs: 'hge',
            params: {
              feature: null,
            },
          })
          .state('huronPagingGroup', {
            url: '/huronPagingGroup',
            parent: 'main',
            template: '<pg-setup-assistant></pg-setup-assistant>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/features/pagingGroup/pgSetupAssistant'));
                }, 'call-paging');
              }),
            },
          })
          .state('huronPagingGroupEdit', {
            url: '/huronPagingGroupEdit',
            parent: 'main',
            template: '<pg-edit pg-id="$resolve.pgId"></pg-edit>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/huron/features/pagingGroup/edit'));
                }, 'call-paging');
              }),
              pgId: /* @ngInject */ function pgId($stateParams) {
                var id = _.get($stateParams.feature, 'id');
                return id;
              },
            },
            params: {
              feature: null,
            },
          });

        $stateProvider
          .state('services-overview', {
            url: '/services',
            templateUrl: 'modules/services-overview/services-overview.html',
            controller: 'ServicesOverviewCtrl',
            controllerAs: 'servicesOverviewCtrl',
            parent: 'main',
          })
          .state('cluster-list', {
            url: '/services/clusters',
            templateUrl: 'modules/hercules/fusion-pages/cluster-list.html',
            controller: 'FusionClusterListController',
            controllerAs: 'resourceList',
            parent: 'main',
            resolve: {
              hasCucmSupportFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridCucmSupport);
              },
              hasEnterprisePrivateTrunkingFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.huronEnterprisePrivateTrunking);
              },
            },
          })
          // hybrid context
          .state('context', {
            templateUrl: 'modules/context/container/hybrid-context-container.html',
            controller: 'HybridContextContainerController',
            controllerAs: 'hybridContextContainerController',
            parent: 'main',
            params: {
              backState: null,
            },
            resolve: {
              backState: /* @ngInject */ function ($stateParams) {
                return $stateParams.backState;
              },
            },
          })
          .state('context-resources', {
            url: '/services/context',
            parent: 'context',
            views: {
              'subHeader': {
                template: '<context-resources-sub-header></context-resources-sub-header>',
              },
              'contextServiceView': {
                template: '<hybrid-service-cluster-list service-id="\'contact-center-context\'" cluster-id="$resolve.clusterId"></hybrid-service-cluster-list>',
                controller: /* @ngInject */ function (Analytics) {
                  return Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_CONTEXT_LIST);
                },
              },
            },
            params: {
              clusterId: null,
            },
            resolve: {
              hasContactCenterContextFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.contactCenterContext);
              },
              clusterId: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
            },
          })
          .state('context-fields', {
            url: '/services/context/fields',
            parent: 'context',
            views: {
              'contextServiceView': {
                templateUrl: 'modules/context/fields/hybrid-context-fields.html',
                controller: 'HybridContextFieldsCtrl',
                controllerAs: 'contextFields',
              },
            },
            resolve: {
              hasContextDictionaryEditFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasContextDictionaryEdit);
              },
            },
          })
          .state('context-field-modal', {
            parent: 'modal',
            views: {
              'modal@': {
                template: '<context-field-modal existing-field-ids="$resolve.existingFieldIds" callback="$resolve.callback" existing-field-data="$resolve.existingFieldData" dismiss="$dismiss()" class="context-modal"></context-field-modal>',
              },
            },
            params: {
              existingFieldIds: [],
              existingFieldData: {},
              callback: function () {},
            },
            resolve: {
              existingFieldIds: /* @ngInject */ function ($stateParams) {
                return $stateParams.existingFieldIds;
              },
              existingFieldData: /* @ngInject */ function ($stateParams) {
                return $stateParams.existingFieldData;
              },
              callback: /* @ngInject */ function ($stateParams) {
                return $stateParams.callback;
              },
            },
          })
          .state('context-fields-sidepanel', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<context-fields-sidepanel field="$resolve.field" process="$resolve.process" callback="$resolve.callback"></context-fields-sidepanel>',
              },
              'header@context-fields-sidepanel': {
                templateUrl: 'modules/context/fields/sidepanel/hybrid-context-fields-sidepanel-header.html',
              },
            },
            data: {
              displayName: 'Overview',
            },
            params: {
              field: {},
              process: function () {},
              callback: function () {},
            },
            resolve: {
              field: /* @ngInject */ function ($stateParams) {
                return $stateParams.field;
              },
              process: /* @ngInject */ function ($stateParams) {
                return $stateParams.process;
              },
              callback: /* @ngInject */ function ($stateParams) {
                return $stateParams.callback;
              },
            },
          })
          .state('context-fieldsets', {
            url: '/services/context/fieldsets',
            parent: 'context',
            views: {
              'contextServiceView': {
                templateUrl: 'modules/context/fieldsets/hybrid-context-fieldsets.html',
                controller: 'HybridContextFieldsetsCtrl',
                controllerAs: 'contextFieldsets',
              },
            },
            resolve: {
              hasContextDictionaryEditFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasContextDictionaryEdit);
              },
            },
          })
          .state('context-fieldset-modal', {
            parent: 'modal',
            views: {
              'modal@': {
                template: '<context-fieldset-modal existing-fieldset-ids="$resolve.existingFieldsetIds" existing-fieldset-data="$resolve.existingFieldsetData" callback="$resolve.callback" dismiss="$dismiss()" class="context-modal"></context-fieldset-modal>',
              },
            },
            params: {
              existingFieldsetIds: [],
              existingFieldsetData: {},
              callback: function () {},
            },
            resolve: {
              existingFieldsetIds: /* @ngInject */ function ($stateParams) {
                return $stateParams.existingFieldsetIds;
              },
              existingFieldsetData: /* @ngIngect */function ($stateParams) {
                return $stateParams.existingFieldsetData;
              },
              callback: /* @ngInject */ function ($stateParams) {
                return $stateParams.callback;
              },
            },
          })
          .state('context-fieldsets-sidepanel', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<context-fieldsets-sidepanel fieldset="$resolve.fieldset" process="$resolve.process" callback="$resolve.callback" ></context-fieldsets-sidepanel>',
              },
              'header@context-fieldsets-sidepanel': {
                templateUrl: 'modules/context/fieldsets/sidepanel/hybrid-context-fieldsets-sidepanel-header.html',
              },
            },
            data: {
              displayName: 'Overview',
            },
            params: {
              fieldset: {},
              process: function () {},
              callback: function () {},
            },
            resolve: {
              fieldset: /* @ngInject */ function ($stateParams) {
                return $stateParams.fieldset;
              },
              process: /* @ngInject */ function ($stateParams) {
                return $stateParams.process;
              },
              callback: /* @ngInject */ function ($stateParams) {
                return $stateParams.callback;
              },
            },
          })
          .state('context-fieldsets-sidepanel.fields', {
            templateUrl: 'modules/context/fieldsets/sidepanel/fieldList/hybrid-context-fieldsets-field-list.html',
            controller: 'ContextFieldsetsSidepanelFieldListCtrl',
            controllerAs: 'contextFieldsetsSidepanelFieldListCtrl',
            data: {
              displayName: 'Fields',
            },
            params: {
              fields: {},
            },
            resolve: {
              fields: /* @ngInject */ function ($stateParams) {
                return $stateParams.fields;
              },
            },
          })
          .state('context-cluster-sidepanel', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<cluster-sidepanel-overview cluster-type="\'cs_mgmt\'" cluster-id="$resolve.id" connector-type="$resolve.connectorType"></cluster-sidepanel-overview>',
              },
              'header@context-cluster-sidepanel': {
                templateUrl: 'modules/hercules/cluster-sidepanel/cluster-sidepanel-overview/cluster-sidepanel-overview-header.html',
              },
            },
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              clusterId: null,
              connectorType: null,
            },
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
              connectorType: /* @ngInject */ function ($stateParams) {
                return $stateParams.connectorType;
              },
            },
          })
          .state('private-trunk-overview', {
            parent: 'main',
            template: '<private-trunk-overview has-private-trunk-feature-toggle="$resolve.hasPrivateTrunkFeatureToggle"></private-trunk-overview>',
            resolve: {
              lazy: resolveLazyLoad(function (done) {
                require.ensure([], function () {
                  done(require('modules/hercules/private-trunk/overview'));
                }, 'private-trunk');
              }),
              hasPrivateTrunkFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.huronEnterprisePrivateTrunking);
              },
            },
          })
          .state('private-trunk-overview.list', {
            url: '/private-trunk-overview/list',
            views: {
              sipDestinationList: {
                template: '<hybrid-service-cluster-list service-id="\'ept\'" cluster-id="$resolve.clusterId"></hybrid-service-cluster-list>',
              },
            },
            params: {
              clusterId: null,
            },
            resolve: {
              clusterId: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
            },
          })
          .state('context-cluster-sidepanel.host-details', {
            templateUrl: 'modules/hercules/cluster-sidepanel/host-details/host-details.html',
            controller: 'HybridServicesHostDetailsController',
            controllerAs: 'hostDetailsCtrl',
            data: {
              displayName: 'Node',
            },
            params: {
              host: null,
              hostSerial: null,
            },
            resolve: {
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          // Cluster settings and nodes
          .state('expressway-cluster', {
            abstract: true,
            url: '/services/cluster/expressway/:id',
            parent: 'main',
            template: '<hybrid-services-cluster-page cluster-id="$resolve.id" has-nodes-view-feature-toggle="$resolve.hasNodesViewFeatureToggle"></hybrid-services-cluster-page>',
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.id;
              },
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('expressway-cluster.nodes', {
            url: '/nodes',
            template: '<hybrid-services-nodes-page cluster-id="$resolve.id"></hybrid-services-nodes-page>',
          })
          .state('expressway-cluster.settings', {
            url: '/settings',
            template: '<expressway-cluster-settings-page cluster-id="$resolve.id"></expressway-cluster-settings-page>',
          })
          .state('hybrid-services-connector-sidepanel', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<hybrid-services-connector-sidepanel connector="$resolve.connector"></hybrid-services-connector-sidepanel>',
              },
              'header@hybrid-services-connector-sidepanel': {
                templateUrl: 'modules/hercules/hybrid-services-connector-sidepanel/hybrid-services-connector-sidepanel-header.html',
              },
            },
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              connector: null,
            },
            resolve: {
              connector: /* @ngInject */ function ($stateParams) {
                return $stateParams.connector;
              },
            },
          })
          .state('hybrid-services-connector-sidepanel.alarm-details', {
            template: '<alarm-details-sidepanel alarm="$resolve.alarm"></alarm-details-sidepanel>',
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              alarm: null,
            },
            resolve: {
              alarm: /* @ngInject */ function ($stateParams) {
                return $stateParams.alarm;
              },
            },
          })
          .state('hds', {
            templateUrl: 'modules/hds/resources/hybrid-data-security-container.html',
            controller: 'HDSServiceController',
            controllerAs: 'hdsServiceController',
            parent: 'main',
          })
          .state('hds.list', {
            url: '/hds/resources',
            views: {
              'fullPane': {
                template: '<hybrid-service-cluster-list service-id="\'spark-hybrid-datasecurity\'" cluster-id="$resolve.clusterId"></hybrid-service-cluster-list>',
                controller: /* @ngInject */ function (Analytics) {
                  return Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_HDS_LIST);
                },
              },
            },
            params: {
              clusterId: null,
            },
            resolve: {
              clusterId: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
            },
          })
          .state('hds.settings', {
            url: '/hds/settings',
            views: {
              'fullPane': {
                controller: 'HDSSettingsController',
                controllerAs: 'hdsSettings',
                templateUrl: 'modules/hds/settings/hds-settings.html',
              },
            },
          })
          .state('hds-cluster-details', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<cluster-sidepanel-overview cluster-type="\'hds_app\'" cluster-id="$resolve.id" connector-type="$resolve.connectorType" has-nodes-view-feature-toggle="$resolve.hasNodesViewFeatureToggle"></cluster-sidepanel-overview>',
              },
              'header@hds-cluster-details': {
                templateUrl: 'modules/hercules/cluster-sidepanel/cluster-sidepanel-overview/cluster-sidepanel-overview-header.html',
              },
            },
            data: {
              displayName: 'Overview',
            },
            params: {
              clusterId: null,
              connectorType: null,
            },
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
              connectorType: /* @ngInject */ function ($stateParams) {
                return $stateParams.connectorType;
              },
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('hds-cluster-details.host-details', {
            templateUrl: 'modules/hercules/cluster-sidepanel/host-details/host-details.html',
            controller: 'HybridServicesHostDetailsController',
            controllerAs: 'hostDetailsCtrl',
            data: {
              displayName: 'Node',
            },
            params: {
              host: null,
              hostSerial: null,
            },
            resolve: {
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('hds-cluster-details.alarm-details', {
            template: '<alarm-details-sidepanel alarm="$resolve.alarm"></alarm-details-sidepanel>',
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              alarm: null,
            },
            resolve: {
              alarm: /* @ngInject */ function ($stateParams) {
                return $stateParams.alarm;
              },
            },
          })
          .state('hds-cluster', {
            abstract: true,
            url: '/services/cluster/hds/:id',
            parent: 'main',
            template: '<hybrid-services-cluster-page cluster-id="$resolve.id" has-nodes-view-feature-toggle="$resolve.hasNodesViewFeatureToggle"></hybrid-services-cluster-page>',
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.id;
              },
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('hds-cluster.nodes', {
            url: '/nodes',
            template: '<hybrid-services-nodes-page cluster-id="$resolve.id"></hybrid-services-nodes-page>',
          })
          .state('hds-cluster.settings', {
            url: '/settings',
            template: '<hybrid-data-security-cluster-settings cluster-id="$resolve.id"></hybrid-data-security-cluster-settings>',
          })
          .state('mediafusion-cluster', {
            abstract: true,
            url: '/services/cluster/mediafusion/:id',
            parent: 'main',
            template: '<hybrid-services-cluster-page cluster-id="$resolve.id" has-nodes-view-feature-toggle="$resolve.hasNodesViewFeatureToggle"></hybrid-services-cluster-page>',
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.id;
              },
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('mediafusion-cluster.nodes', {
            url: '/nodes',
            template: '<hybrid-services-nodes-page cluster-id="$resolve.id"></hybrid-services-nodes-page>',
          })
          .state('mediafusion-cluster.settings', {
            url: '/settings',
            templateUrl: 'modules/hercules/fusion-pages/mediafusion-settings.html',
            controller: 'MediafusionClusterSettingsController',
            controllerAs: 'clusterSettings',
            resolve: {
              hasMFFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasMediaServicePhaseTwo);
              },
            },
          })
          .state('cucm-cluster', {
            abstract: true,
            url: '/services/cluster/cucm/:id',
            parent: 'main',
            template: '<hybrid-services-cluster-page cluster-id="$resolve.id" has-nodes-view-feature-toggle="$resolve.hasNodesViewFeatureToggle"></hybrid-services-cluster-page>',
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.id;
              },
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('cucm-cluster.nodes', {
            url: '/nodes',
            template: '<hybrid-services-nodes-page cluster-id="$resolve.id"></hybrid-services-nodes-page>',
          })
          .state('cucm-cluster.settings', {
            url: '/settings',
            template: '<cucm-cluster-settings cluster-id="$resolve.id"></cucm-cluster-settings>',
          })
          // Add Resource modal
          .state('add-resource', {
            abstract: true,
          })
          .state('add-resource.type-selector', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'TypeSelectorController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/common/type-selector.html',
              },
            },
            params: {
              wizard: null,
            },
            resolve: {
              hasCucmSupportFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridCucmSupport);
              },
            },
          })
          .state('add-resource.expressway', {
            abstract: true,
          })
          .state('add-resource.expressway.service-selector', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'ExpresswayServiceSelectorController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/expressway/service-selector.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.expressway.hostname', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'ExpresswayEnterHostnameController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/expressway/enter-hostname.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.expressway.name', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'ExpresswayEnterNameController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/expressway/enter-name.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.expressway.resource-group', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'ExpresswaySelectResourceGroupController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/expressway/select-resource-group.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.expressway.end', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'ExpresswayEndController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/expressway/end.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.mediafusion', {
            abstract: true,
          })
          .state('add-resource.mediafusion.hostname', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'AddResourceControllerClusterViewV2',
                controllerAs: 'redirectResource',
                templateUrl: 'modules/mediafusion/media-service-v2/add-resources/add-resource-dialog.html',
                modalClass: 'redirect-add-resource',
              },
            },
            params: {
              wizard: null,
              firstTimeSetup: false,
              yesProceed: false,
              fromClusters: true,
            },
          })
          .state('add-resource.mediafusion.name', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'MediafusionEnterNameController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/mediafusion/enter-name.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.mediafusion.end', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'MediafusionEndController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/mediafusion/end.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.context', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                templateUrl: 'modules/hercules/fusion-pages/add-resource/context/context.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.cucm', {
            abstract: true,
          })
          .state('add-resource.cucm.hostname', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'CucmHostnameController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/cucm/cucm-hostname.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.cucm.name', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'CucmClusterNameController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/cucm/cucm-cluster-name.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('add-resource.cucm.end', {
            parent: 'modalSmall',
            views: {
              'modal@': {
                controller: 'CucmEndController',
                controllerAs: 'vm',
                templateUrl: 'modules/hercules/fusion-pages/add-resource/cucm/cucm-end.html',
              },
            },
            params: {
              wizard: null,
            },
          })
          .state('calendar-service', {
            templateUrl: 'modules/hercules/service-specific-pages/calendar-service-pages/calendar-service-container.html',
            controller: 'CalendarServiceContainerController',
            controllerAs: 'vm',
            params: {
              clusterId: null,
            },
            parent: 'main',
            abstract: true,
          })
          .state('calendar-service.list', {
            url: '/services/calendar',
            views: {
              calendarServiceView: {
                templateUrl: 'modules/hercules/service-specific-pages/calendar-service-pages/calendar-service-resources.html',
                controller: /* @ngInject */ function (Analytics) {
                  return Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_CAL_EXC_LIST);
                },
              },
            },
            params: {
              clusterId: null,
            },
          })
          .state('calendar-service.settings', {
            url: '/services/calendar/settings',
            views: {
              calendarServiceView: {
                controllerAs: 'calendarSettings',
                controller: 'CalendarSettingsController',
                templateUrl: 'modules/hercules/service-settings/calendar-service-settings.html',
              },
            },
          })
          .state('google-calendar-service', {
            abstract: true,
            parent: 'main',
            template: '<div ui-view></div>',
            resolve: {
              hasGoogleCalendarFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHerculesGoogleCalendar);
              },
            },
          })
          .state('google-calendar-service.settings', {
            url: '/services/google-calendar/settings',
            template: '<google-calendar-settings-page ng-if="$resolve.hasGoogleCalendarFeatureToggle"></google-calendar-settings-page>',
            controller: /* @ngInject */ function (Analytics) {
              return Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_CAL_GOOG_SETTINGS);
            },
          })
          .state('call-service', {
            templateUrl: 'modules/hercules/service-specific-pages/call-service-pages/call-service-container.html',
            controller: 'CallServiceContainerController',
            controllerAs: 'vm',
            params: {
              clusterId: null,
            },
            parent: 'main',
          })
          .state('call-service.list', {
            url: '/services/call',
            views: {
              callServiceView: {
                templateUrl: 'modules/hercules/service-specific-pages/call-service-pages/call-service-resources.html',
              },
              controller: /* @ngInject */ function (Analytics) {
                return Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_CALL_LIST);
              },
            },
            params: {
              clusterId: null,
            },
          })
          .state('call-service.settings', {
            url: '/services/call/settings',
            views: {
              callServiceView: {
                controllerAs: 'callServiceSettings',
                controller: 'CallServiceSettingsController',
                templateUrl: 'modules/hercules/service-settings/call-service-settings.html',
              },
            },
            resolve: {
              hasVoicemailFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridVoicemail);
              },
              hasAtlasHybridCallDiagnosticTool: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridCallDiagnosticTool);
              },
            },
          })
          .state('private-trunk-sidepanel', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<private-trunk-sidepanel trunk-id="$resolve.trunkId"></private-trunk-sidepanel>',
              },
              'header@private-trunk-sidepanel': {
                templateUrl: 'modules/hercules/private-trunk/private-trunk-sidepanel/private-trunk-sidepanel-header.html',
              },
            },
            data: {},
            params: {
              clusterId: null,
            },
            resolve: {
              trunkId: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId; // Deliberately "renaming" clusterId to trunkId here
              },
            },
          })
          .state('private-trunk-sidepanel.alarm-details', {
            template: '<alarm-details-sidepanel alarm="$resolve.alarm"></alarm-details-sidepanel>',
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              alarm: null,
            },
            resolve: {
              alarm: /* @ngInject */ function ($stateParams) {
                return $stateParams.alarm;
              },
            },
          })
          .state('expressway-cluster-sidepanel', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<cluster-sidepanel-overview cluster-type="\'c_mgmt\'" cluster-id="$resolve.id" connector-type="$resolve.connectorType" has-nodes-view-feature-toggle="$resolve.hasNodesViewFeatureToggle"></cluster-sidepanel-overview>',
              },
              'header@expressway-cluster-sidepanel': {
                templateUrl: 'modules/hercules/cluster-sidepanel/cluster-sidepanel-overview/cluster-sidepanel-overview-header.html',
              },
            },
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              clusterId: null,
              connectorType: null,
            },
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
              connectorType: /* @ngInject */ function ($stateParams) {
                return $stateParams.connectorType;
              },
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('expressway-cluster-sidepanel.host-details', {
            templateUrl: 'modules/hercules/cluster-sidepanel/host-details/host-details.html',
            controller: 'HybridServicesHostDetailsController',
            controllerAs: 'hostDetailsCtrl',
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              host: null,
              hostSerial: null,
              // we inherit params from the parent, and because of management connectors we shouldn't override
              // the parent connectorType param…
              specificType: null,
            },
            resolve: {
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('expressway-cluster-sidepanel.alarm-details', {
            template: '<alarm-details-sidepanel alarm="$resolve.alarm"></alarm-details-sidepanel>',
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              alarm: null,
            },
            resolve: {
              alarm: /* @ngInject */ function ($stateParams) {
                return $stateParams.alarm;
              },
            },
          })
          .state('resource-group-settings', {
            url: '/services/resourceGroups/:id/settings',
            templateUrl: 'modules/hercules/fusion-pages/resource-group-settings/resource-group-settings.html',
            controller: 'ResourceGroupSettingsController',
            controllerAs: 'rgsCtrl',
            parent: 'main',
          });

        $stateProvider

        //V2 API changes
          .state('media-cluster-details', {
            parent: 'sidepanel',
            views: {
              'sidepanel@': {
                template: '<cluster-sidepanel-overview cluster-type="\'mf_mgmt\'" cluster-id="$resolve.id" connector-type="$resolve.connectorType"></cluster-sidepanel-overview>',
              },
              'header@media-cluster-details': {
                templateUrl: 'modules/hercules/cluster-sidepanel/cluster-sidepanel-overview/cluster-sidepanel-overview-header.html',
              },
            },
            data: {
              displayName: 'Overview',
            },
            params: {
              clusterId: null,
              connectorType: null,
            },
            resolve: {
              id: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
              connectorType: /* @ngInject */ function ($stateParams) {
                return $stateParams.connectorType;
              },
            },
          })
          .state('media-cluster-details.host-details', {
            templateUrl: 'modules/hercules/cluster-sidepanel/host-details/host-details.html',
            controller: 'HybridServicesHostDetailsController',
            controllerAs: 'hostDetailsCtrl',
            data: {
              displayName: 'Node',
            },
            params: {
              host: null,
              hostSerial: null,
            },
            resolve: {
              hasNodesViewFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasHybridNodesView);
              },
            },
          })
          .state('media-cluster-details.alarm-details', {
            template: '<alarm-details-sidepanel alarm="$resolve.alarm"></alarm-details-sidepanel>',
            // If data not present, $state.current.data.displayName can't be changed
            data: {},
            params: {
              alarm: null,
            },
            resolve: {
              alarm: /* @ngInject */ function ($stateParams) {
                return $stateParams.alarm;
              },
            },
          })

          .state('media-service-v2', {
            templateUrl: 'modules/mediafusion/media-service-v2/media-service-overview.html',
            controller: 'MediaServiceControllerV2',
            controllerAs: 'med',
            parent: 'main',
          })
          .state('media-service-v2.list', {
            url: '/mediaserviceV2',
            views: {
              'fullPane': {
                template: '<hybrid-service-cluster-list service-id="\'squared-fusion-media\'" cluster-id="$resolve.clusterId"></hybrid-service-cluster-list>',
                controller: /* @ngInject */ function (Analytics) {
                  return Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_MEDIA_LIST);
                },
              },
            },
            params: {
              clusterId: null,
            },
            resolve: {
              clusterId: /* @ngInject */ function ($stateParams) {
                return $stateParams.clusterId;
              },
            },
          })
          .state('media-service-v2.settings', {
            url: '/mediaserviceV2/settings',
            views: {
              'fullPane': {
                controllerAs: 'mediaServiceSettings',
                controller: 'MediaServiceSettingsControllerV2',
                templateUrl: 'modules/mediafusion/media-service-v2/settings/media-service-settings.html',
              },
            },
            controller: /* @ngInject */ function (Analytics) {
              return Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_MEDIA_SETTINGS);
            },
            resolve: {
              hasMFVIdeoFeatureToggle: /* @ngInject */ function (FeatureToggleService) {
                return FeatureToggleService.supports(FeatureToggleService.features.atlasMediaServiceVideo);
              },
            },
          });

        $stateProvider
          .state('ediscovery-main', {
            parent: 'mainLazyLoad',
            views: {
              'main@': {
                templateUrl: 'modules/ediscovery/ediscovery.tpl.html',
              },
            },
            abstract: true,
            sticky: true,
          })
          .state('ediscovery', {
            url: '/ediscovery',
            template: '<div ui-view></div>',
            parent: 'ediscovery-main',
          })
          .state('ediscovery.search', {
            url: '/search',
            controller: 'EdiscoverySearchController',
            controllerAs: 'ediscoverySearchCtrl',
            templateUrl: 'modules/ediscovery/ediscovery-search.html',
            params: {
              report: null,
              reRun: false,
            },
          })
          .state('ediscovery.reports', {
            url: '/reports',
            controller: 'EdiscoveryReportsController',
            controllerAs: 'ediscoveryCtrl',
            templateUrl: 'modules/ediscovery/ediscovery-reports.html',
          });

        $stateProvider
          .state('messenger', {
            parent: 'main',
            url: '/messenger',
            templateUrl: 'modules/messenger/ci-sync/ciSync.tpl.html',
            controller: 'CiSyncCtrl',
            controllerAs: 'sync',
          });

        $stateProvider
          .state('care', {
            parent: 'main',
            abstract: true,
          })
          .state('care.DetailsBase', {
            parent: 'main',
            abstract: true,
            templateUrl: 'modules/sunlight/details/details.tpl.html',
          })
          .state('care.Details', {
            url: '/services/careDetails',
            parent: 'care.DetailsBase',
            views: {
              'header': {
                templateUrl: 'modules/sunlight/details/detailsHeader.tpl.html',
                controller: 'DetailsHeaderCtrl',
                controllerAs: 'header',
              },
              'main': {
                template: '<div ui-view></div>',
              },
            },
          })
          .state('care.Settings', {
            url: '/settings',
            parent: 'care.Details',
            templateUrl: 'modules/sunlight/settings/careSettings.tpl.html',
            controller: 'CareLocalSettingsCtrl',
            controllerAs: 'localCareSettings',
          })
          .state('care.Features', {
            url: '/features',
            parent: 'care.Details',
            templateUrl: 'modules/sunlight/features/featureLanding/careFeatures.tpl.html',
            controller: 'CareFeaturesCtrl',
            controllerAs: 'careFeaturesCtrl',
          })
          .state('care.setupAssistant', {
            url: '/setupAssistant/:type',
            parent: 'care.Details',
            templateUrl: 'modules/sunlight/features/template/ctSetupAssistant.tpl.html',
            controller: 'CareSetupAssistantCtrl',
            controllerAs: 'careSetupAssistant',
            params: {
              template: null,
              isEditFeature: null,
            },
          })
          .state('care.Features.DeleteFeature', {
            parent: 'modalDialog',
            views: {
              'modal@': {
                controller: 'CareFeaturesDeleteCtrl',
                controllerAs: 'careFeaturesDeleteCtrl',
                templateUrl: 'modules/sunlight/features/featureLanding/careFeaturesDeleteModal.tpl.html',
              },
            },
            params: {
              deleteFeatureName: null,
              deleteFeatureId: null,
              deleteFeatureType: null,
            },
          });

        $stateProvider
          .state('gss', {
            url: '/gss',
            templateUrl: 'modules/gss/gssIframe/gssIframe.tpl.html',
            controller: 'GssIframeCtrl',
            controllerAs: 'gssIframeCtrl',
            parent: 'main',
          })
          .state('gss.dashboard', {
            url: '/dashboard',
            templateUrl: 'modules/gss/dashboard/dashboard.tpl.html',
            controller: 'DashboardCtrl',
            controllerAs: 'dashboardCtrl',
          })
          .state('gss.components', {
            url: '/components',
            templateUrl: 'modules/gss/components/components.tpl.html',
            controller: 'ComponentsCtrl',
            controllerAs: 'componentsCtrl',
          })
          .state('gss.components.deleteComponent', {
            url: '/delete',
            parent: 'gss.components',
            views: {
              '@gss': {
                controller: 'DelComponentCtrl',
                controllerAs: 'delComponentCtrl',
                templateUrl: 'modules/gss/components/deleteComponent/deleteComponent.tpl.html',
              },
            },
            params: {
              component: null,
            },
          })
          .state('gss.services', {
            url: '/services',
            templateUrl: 'modules/gss/services/services.tpl.html',
            controller: 'GSSServicesCtrl',
            controllerAs: 'gssServicesCtrl',
          })
          .state('gss.services.delete', {
            url: '/delete',
            views: {
              '@gss': {
                templateUrl: 'modules/gss/services/deleteService/deleteService.tpl.html',
                controller: 'DeleteServiceCtrl',
                controllerAs: 'deleteServiceCtrl',
              },
            },
            params: {
              service: null,
            },
          })
          .state('gss.incidents', {
            url: '/incidents',
            templateUrl: 'modules/gss/incidents/incidents.tpl.html',
            controller: 'IncidentsCtrl',
            controllerAs: 'incidentsCtrl',
          })
          .state('gss.incidents.new', {
            url: '/new',
            views: {
              '@gss': {
                templateUrl: 'modules/gss/incidents/createIncident/createIncident.tpl.html',
                controller: 'CreateIncidentCtrl',
                controllerAs: 'createIncidentCtrl',
              },
            },
          })
          .state('gss.incidents.delete', {
            url: '/delete',
            views: {
              '@gss': {
                templateUrl: 'modules/gss/incidents/deleteIncident/deleteIncident.tpl.html',
                controller: 'DeleteIncidentCtrl',
                controllerAs: 'deleteIncidentCtrl',
              },
            },
            params: {
              incident: null,
            },
          })
          .state('gss.incidents.update', {
            url: '/update',
            views: {
              '@gss': {
                templateUrl: 'modules/gss/incidents/updateIncident/updateIncident.tpl.html',
                controller: 'UpdateIncidentCtrl',
                controllerAs: 'updateIncidentCtrl',
              },
            },
            params: {
              incident: null,
              actionType: null,
            },
          });
      },
    ]);
})();
