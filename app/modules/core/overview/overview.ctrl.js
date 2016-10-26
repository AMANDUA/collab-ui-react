(function () {
  'use strict';

  var Masonry = require('masonry-layout');

  angular
    .module('Core')
    .controller('OverviewCtrl', OverviewCtrl);

  /* @ngInject */
  function OverviewCtrl($rootScope, $scope, $timeout, $translate, Authinfo, Config, FeatureToggleService, FusionClusterService, hasCareFeatureToggle, Log, Notification, Orgservice, OverviewCardFactory, OverviewNotificationFactory, ReportsService, SunlightReportService, TrialService, UrlConfig) {
    var vm = this;

    vm.pageTitle = $translate.instant('overview.pageTitle');
    vm.isCSB = Authinfo.isCSB();

    vm.cards = [
      OverviewCardFactory.createMessageCard(),
      OverviewCardFactory.createMeetingCard(),
      OverviewCardFactory.createCallCard(),
      OverviewCardFactory.createRoomSystemsCard(),
      OverviewCardFactory.createHybridServicesCard(),
      OverviewCardFactory.createUsersCard()
    ];
    // TODO Need to be removed once Care is graduated on atlas.
    if (hasCareFeatureToggle) {
      // Add care card after call card
      vm.cards.splice(3, 0, OverviewCardFactory.createCareCard());
    }

    vm.notifications = [];
    vm.trialDaysLeft = undefined;
    vm.dismissNotification = dismissNotification;

    vm.hasMediaFeatureToggle = false;
    FeatureToggleService.supports(FeatureToggleService.features.atlasMediaServiceOnboarding)
      .then(function (reply) {
        vm.hasMediaFeatureToggle = reply;
      });

    // for smaller screens where the notifications are on top, the layout needs to resize after the notifications are loaded
    function resizeNotifications() {
      $timeout(function () {
        var $cardlayout = new Masonry('.fourth.cs-card-layout', {
          itemSelector: '.cs-card',
          columnWidth: '.cs-card',
          resize: true,
          percentPosition: true,
        });
        $cardlayout.layout();
      });
    }

    function init() {
      findAnyUrgentUpgradeInHybridServices();
      removeCardUserTitle();
      if (!Authinfo.isSetupDone() && Authinfo.isCustomerAdmin()) {
        vm.notifications.push(OverviewNotificationFactory.createSetupNotification());
        resizeNotifications();
      }
      Orgservice.getHybridServiceAcknowledged().then(function (response) {
        if (response.status === 200) {
          angular.forEach(response.data.items, function (item) {
            if (!item.acknowledged) {
              if (item.id === Config.entitlements.fusion_cal) {
                vm.notifications.push(OverviewNotificationFactory.createCalendarNotification());
              } else if (item.id === Config.entitlements.fusion_uc) {
                vm.notifications.push(OverviewNotificationFactory.createCallAwareNotification());
              } else if (item.id === Config.entitlements.fusion_ec) {
                vm.notifications.push(OverviewNotificationFactory.createCallConnectNotification());
              } else if (item.id === Config.entitlements.mediafusion && vm.hasMediaFeatureToggle) {
                vm.notifications.push(OverviewNotificationFactory.createHybridMediaNotification());
              }
            }
          });
          resizeNotifications();
        } else {
          Log.error("Error in GET service acknowledged status");
        }
      });
      Orgservice.getOrg(function (data, status) {
        if (status === 200) {
          if (!data.orgSettings.sipCloudDomain) {
            vm.notifications.push(OverviewNotificationFactory.createCloudSipUriNotification());
          }
        } else {
          Log.debug('Get existing org failed. Status: ' + status);
          Notification.error('firstTimeWizard.sparkDomainManagementServiceErrorMessage');
        }
      });
      FeatureToggleService.atlasDarlingGetStatus().then(function (toggle) {
        if (toggle) {
          Orgservice.getAdminOrgUsage()
            .then(function (response) {
              var sharedDevicesUsage = -1;
              var seaGullsUsage = -1;
              _.each(response.data, function (subscription) {
                _.each(subscription, function (licenses) {
                  _.each(licenses, function (license) {
                    if (license.status === Config.licenseStatus.ACTIVE) {
                      if (license.offerName === Config.offerCodes.SD) {
                        sharedDevicesUsage = license.usage;
                      } else if (license.offerName === Config.offerCodes.SB) {
                        seaGullsUsage = license.usage;
                      }
                    }
                  });
                });
              });
              if (sharedDevicesUsage === 0 || seaGullsUsage === 0) {
                setRoomSystemEnabledDevice(true);
                if (sharedDevicesUsage === 0 && seaGullsUsage === 0) {
                  vm.notifications.push(OverviewNotificationFactory.createDevicesNotification('homePage.setUpDevices'));
                } else if (seaGullsUsage === 0) {
                  vm.notifications.push(OverviewNotificationFactory.createDevicesNotification('homePage.setUpSeaGullDevices'));
                } else {
                  vm.notifications.push(OverviewNotificationFactory.createDevicesNotification('homePage.setUpSharedDevices'));
                }
              } else {
                setRoomSystemEnabledDevice(false);
              }
            });
        }
      });

      FeatureToggleService.atlasPMRonM2GetStatus().then(function (toggle) {
        if (toggle) {
          vm.notifications.push(OverviewNotificationFactory.createPMRNotification());
        }
      });

      TrialService.getDaysLeftForCurrentUser().then(function (daysLeft) {
        vm.trialDaysLeft = daysLeft;
      });
    }

    function findAnyUrgentUpgradeInHybridServices() {
      FusionClusterService.getAll()
        .then(function (clusters) {
          var clusterWithUrgentUpgrade = _.find(clusters, function (cluster) {
            return _.some(cluster.provisioning, function (p) {
              return p.availablePackageIsUrgent && p.connectorType !== 'c_mgmt';
            });
          });
          if (clusterWithUrgentUpgrade) {
            vm.notifications.push(OverviewNotificationFactory.createUrgentUpgradeNotification(clusterWithUrgentUpgrade));
          }
        });
    }

    function removeCardUserTitle() {
      if (vm.isCSB) {
        _.remove(vm.cards, {
          name: 'overview.cards.users.title'
        });
      }
    }

    function setRoomSystemEnabledDevice(isDeviceEnabled) {
      (_.find(vm.cards, function (card) {
        return card.name === 'overview.cards.roomSystem.title';
      })).isDeviceEnabled = isDeviceEnabled;
    }

    function dismissNotification(notification) {
      vm.notifications = _.reject(vm.notifications, {
        name: notification.name
      });
      notification.dismiss();
    }

    function forwardEvent(handlerName) {
      var eventArgs = [].slice.call(arguments, 1);
      _.each(vm.cards, function (card) {
        if (typeof (card[handlerName]) === 'function') {
          card[handlerName].apply(card, eventArgs);
        }
      });
    }

    forwardEvent('licenseEventHandler', Authinfo.getLicenses());

    vm.statusPageUrl = UrlConfig.getStatusPageUrl();

    _.each(['oneOnOneCallsLoaded', 'groupCallsLoaded', 'conversationsLoaded', 'activeRoomsLoaded', 'incomingChatTasksLoaded'], function (eventType) {
      $scope.$on(eventType, _.partial(forwardEvent, 'reportDataEventHandler'));
    });

    ReportsService.getOverviewMetrics(true);

    SunlightReportService.getOverviewData();

    Orgservice.getAdminOrg(_.partial(forwardEvent, 'orgEventHandler'), false, true);

    Orgservice.getUnlicensedUsers(_.partial(forwardEvent, 'unlicensedUsersHandler'));

    ReportsService.healthMonitor(_.partial(forwardEvent, 'healthStatusUpdatedHandler'));

    init();

    $scope.$on('DISMISS_SIP_NOTIFICATION', function () {
      vm.notifications = _.reject(vm.notifications, {
        name: 'cloudSipUri'
      });
    });

    $rootScope.$watch('ssoEnabled', function () {
      Orgservice.getAdminOrg(_.partial(forwardEvent, 'orgEventHandler'), false, true);
    });
  }
})();
