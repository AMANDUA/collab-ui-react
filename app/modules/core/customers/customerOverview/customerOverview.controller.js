(function () {
  'use strict';

  angular
    .module('Core')
    .controller('CustomerOverviewCtrl', CustomerOverviewCtrl);

  /* @ngInject */
  function CustomerOverviewCtrl($modal, $q, $state, $stateParams, $translate, $window, AccountOrgService, Authinfo, BrandService, Config, FeatureToggleService, identityCustomer, Log, newCustomerViewToggle, Notification, Orgservice, PartnerService, TrialService, Userservice) {
    var vm = this;

    vm.currentCustomer = $stateParams.currentCustomer;
    vm.customerName = vm.currentCustomer.customerName;
    vm.customerOrgId = vm.currentCustomer.customerOrgId;

    vm.reset = reset;
    vm.saveLogoSettings = saveLogoSettings;
    vm.launchCustomerPortal = launchCustomerPortal;
    vm.openEditTrialModal = openEditTrialModal;
    vm.getDaysLeft = getDaysLeft;
    vm.isSquaredUC = isSquaredUC();
    vm.getIsSetupDone = getIsSetupDone;
    vm.isOwnOrg = isOwnOrg;
    vm.deleteTestOrg = deleteTestOrg;
    vm.isPartnerCreator = isPartnerCreator;
    vm.hasSubviews = hasSubviews;
    vm.hasSubview = hasSubview;
    vm.goToSubview = goToSubview;

    vm.uuid = '';
    vm.logoOverride = false;
    vm.showRoomSystems = false;
    vm.usePartnerLogo = true;
    vm.allowCustomerLogos = false;
    vm.allowCustomerLogoOrig = false;
    vm.isTest = false;
    vm.isDeleting = false;
    vm.isOrgSetup = false;
    vm.isUpdateStatusEnabled = false;

    vm.partnerOrgId = Authinfo.getOrgId();
    vm.partnerOrgName = Authinfo.getOrgName();
    vm.isPartnerAdmin = Authinfo.isPartnerAdmin();
    vm.currentAdminId = Authinfo.getUserId();

    vm.freeOrPaidServices = [];
    vm.trialActions = [];

    vm.newCustomerViewToggle = newCustomerViewToggle;

    var QTY = _.toUpper($translate.instant('common.quantity'));
    var FREE = _.toUpper($translate.instant('customerPage.free'));

    FeatureToggleService.atlasCareTrialsGetStatus()
      .then(function (result) {
        if (_.find(vm.currentCustomer.offers, { id: Config.offerTypes.roomSystems })) {
          vm.showRoomSystems = true;
        }
        var isCareEnabled = result && Authinfo.isCare();
        setOffers(isCareEnabled);
      });


    FeatureToggleService.atlasCustomerListUpdateGetStatus()
      .then(function (result) {
        vm.isUpdateStatusEnabled = result;
      });

    function setOffers(isCareEnabled) {
      var licAndOffers = PartnerService.parseLicensesAndOffers(vm.currentCustomer, { isCareEnabled: isCareEnabled,
        isTrial: true });
      vm.offer = vm.currentCustomer.offer = _.get(licAndOffers, 'offer');
      vm.trialServices = _.chain(vm.currentCustomer.offer)
        .get('trialServices')
        .map(function (trialService) {
          return _.assign({}, trialService, {
            detail: trialService.qty + ' ' + QTY,
            actionAvailable: hasSubview(trialService)
          });
        })
        .value();
      if (vm.newCustomerViewToggle) {
        vm.freeOrPaidServices = _.map(PartnerService.getFreeOrActiveServices(vm.currentCustomer, { isCareEnabled: isCareEnabled,
          isTrial: false }), function (service) {
          return _.assign({}, service, {
            detail: service.free ? FREE : service.qty + ' ' + QTY,
            actionAvailable: hasSubview(service)
          });
        });
      }
    }

    init();

    vm.toggleAllowCustomerLogos = _.debounce(function (value) {
      if (value) {
        BrandService.enableCustomerLogos(vm.customerOrgId);
      } else {
        BrandService.disableCustomerLogos(vm.customerOrgId);
      }
    }, 2000, {
      'leading': true,
      'trailing': false
    });

    function init() {
      initCustomer();
      initTrialActions();
      getLogoSettings();
      getIsTestOrg();
      getIsSetupDone();
    }

    function initTrialActions() {
      vm.trialActions.push({
        actionKey: 'customerPage.edit',
        actionFunction: openEditTrialModal
      });
    }

    function resetForm() {
      if (vm.form) {
        vm.allowCustomerLogos = vm.allowCustomerLogoOrig;
        vm.form.$setPristine();
        vm.form.$setUntouched();
      }
    }

    function reset() {
      resetForm();
    }

    function saveLogoSettings() {
      vm.toggleAllowCustomerLogos(vm.allowCustomerLogos);
      vm.form.$setPristine();
      vm.form.$setUntouched();
    }

    function initCustomer() {
      if (angular.isUndefined(vm.currentCustomer.customerEmail)) {
        vm.currentCustomer.customerEmail = identityCustomer.email;
      }
    }

    function getLogoSettings() {
      BrandService.getSettings(Authinfo.getOrgId())
        .then(function (settings) {
          vm.logoOverride = settings.allowCustomerLogos;
        });
      BrandService.getSettings(vm.customerOrgId)
        .then(function (settings) {
          vm.usePartnerLogo = settings.usePartnerLogo;
          vm.allowCustomerLogos = settings.allowCustomerLogos;
          vm.allowCustomerLogoOrig = settings.allowCustomerLogos;
        });
    }

    // TODO: understand why this is needed
    function LicenseFeature(name, bAdd) {
      this['id'] = name.toString();
      this['idOperation'] = bAdd ? 'ADD' : 'REMOVE';
      this['properties'] = null;
    }

    // TODO: understand why this is needed and possibly move this somewhere more appropriate
    function collectLicenseIdsForWebexSites(liclist) {
      var licIds = [];
      var i = 0;
      if (_.isUndefined(liclist)) {
        liclist = [];
      }
      for (i = 0; i < liclist.length; i++) {
        var lic = liclist[i];
        var licId = lic.licenseId;
        var lictype = lic.licenseType;
        var isConfType = lictype === "CONFERENCING";
        if (isConfType) {
          licIds.push(new LicenseFeature(licId, (_.isUndefined(lic.siteUrl) === false)));
        }
      }
      return licIds;
    } //collectLicenses

    function launchCustomerPortal() {
      // TODO: revisit this function
      // - a simpler version was implemented in '649c251aeaefdedd57620e9fd3f4cd488b87b1f5'
      //   ...however, it did not include the logic to make the appropriate call to
      //   'Userservice.updateUsers()'
      // - this call is required in order to patch the partner-admin user as appropriate such that
      //   admin access to webex sites is enabled
      var liclist = vm.currentCustomer.licenseList;
      var licIds = collectLicenseIdsForWebexSites(liclist);
      var partnerEmail = Authinfo.getPrimaryEmail();
      var emailObj = {
        'address': partnerEmail
      };
      var promise = $q.when();
      if (vm.isPartnerAdmin) {
        promise = PartnerService.modifyManagedOrgs(vm.customerOrgId);
      }
      promise.then(function () {
        if (licIds.length > 0) {
          Userservice.updateUsers([emailObj], licIds, null, 'updateUserLicense', _.noop);
          openCustomerPortal();
        } else {
          AccountOrgService.getAccount(vm.customerOrgId).then(function (response) {
            var accountsLength = _.get(response, 'data.accounts.length');
            if (accountsLength) {
              var updateUsersList = [];
              for (var i = 0; i < accountsLength; i++) {
                var account = response.data.accounts[i];
                var lics = account.licenses;
                var licIds = collectLicenseIdsForWebexSites(lics);
                updateUsersList.push(Userservice.updateUsers([emailObj], licIds, null, 'updateUserLicense', _.noop));
              }
              $q.all(updateUsersList).then(openCustomerPortal);
            } else {
              openCustomerPortal();
            }
          });
        }
      })
      .catch(function (response) {
        Notification.errorWithTrackingId(response, 'customerPage.launchCustomerPortalError');
        return response;
      });
    }

    function openCustomerPortal() {
      $window.open($state.href('login_swap', {
        customerOrgId: vm.customerOrgId,
        customerOrgName: vm.customerName
      }));
    }

    function openEditTrialModal() {
      TrialService.getTrial(vm.currentCustomer.trialId).then(function (response) {
        $state.go('trialEdit.info', {
          currentTrial: vm.currentCustomer,
          details: response
        })
          .then(function () {
            $state.modal.result.then(function () {
              $state.go('partnercustomers.list', {}, {
                reload: true
              });
            });
          });
      });
    }

    function getDaysLeft(daysLeft) {
      if (daysLeft < 0) {
        return $translate.instant('customerPage.expired');
      } else if (daysLeft === 0) {
        return $translate.instant('customerPage.expiresToday');
      } else {
        return daysLeft;
      }
    }

    function isSquaredUC() {
      if (angular.isArray(identityCustomer.services)) {
        return _.includes(identityCustomer.services, Config.entitlements.huron);
      }
      return false;
    }

    function isPartnerCreator() {
      return TrialService.getTrial(vm.currentCustomer.trialId)
        .then(function (response) {
          return response.createdBy === vm.currentAdminId;
        })
        .catch(function (error) {
          Notification.error('customerPage.errGetTrial', {
            customer: vm.customerName,
            message: error.data.message
          });
          return false;
        });
    }

    function hasSubviews(services) {
      return _.some(services, function (service) {
        return hasSubview(service);
      });
    }

    function hasSubview(service) {
      var hasWebexOrMultMeeting = (service.hasWebex === true || service.isMeeting);
      if (!newCustomerViewToggle) {
        return false;
      } else {
        return hasWebexOrMultMeeting;
      }
    }

    function goToSubview(service, options) {
      if (service.hasWebex || service.isMeeting) {
        var isTrial = _.get(options, 'isTrial', false);
        var services = isTrial ? PartnerService.getTrialMeetingServices(vm.currentCustomer.licenseList) : service.sub;
        $state.go('customer-overview.meetingDetail', { meetingLicenses: services });
      }
    }

    function getIsSetupDone() {
      Orgservice.isSetupDone(vm.customerOrgId)
        .then(function (results) {
          vm.isOrgSetup = results;
        })
        .catch(function (error) {
          // Allow trials created by another partner admin to pass through this error.
          // The trial will not generate the error once the View/Setup Customer button
          // is pressed. See US11827
          isPartnerCreator()
            .then(function (isPartnerCreator) {
              if (isPartnerCreator) {
                Notification.error('customerPage.isSetupDoneError', {
                  orgName: vm.customerName,
                  message: error.data.message
                });
              }
            });
        });
    }

    function isOwnOrg() {
      return vm.customerName === Authinfo.getOrgName();
    }

    function getIsTestOrg() {
      Orgservice.getOrg(function (data, status) {
        if (data.success) {
          vm.isTest = data.isTestOrg;
        } else {
          Log.error('Query org info failed. Status: ' + status);
        }
      }, vm.customerOrgId);
    }

    function deleteTestOrg() {
      if (vm.isTest) {
        $modal.open({
          type: 'dialog',
          templateUrl: 'modules/core/customers/customerOverview/customerDeleteConfirm.tpl.html',
          controller: function () {
            var ctrl = this;
            ctrl.orgName = vm.customerName;
          },
          controllerAs: 'ctrl'
        }).result.then(function () {
          // delete the customer
          vm.isDeleting = true;
          Orgservice.deleteOrg(vm.customerOrgId).then(function () {
            $state.go('partnercustomers.list');
            Notification.success('customerPage.deleteOrgSuccess', {
              orgName: vm.customerName
            });
          }).catch(function (error) {
            vm.isDeleting = false;
            Notification.error('customerPage.deleteOrgError', {
              orgName: vm.customerName,
              message: error.data.message
            });
          });
        });
      }
    }

  }
})();
