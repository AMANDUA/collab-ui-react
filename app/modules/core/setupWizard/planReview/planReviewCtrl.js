(function () {
  'use strict';

  angular
    .module('Core')
    .controller('PlanReviewCtrl', PlanReviewCtrl);

  /* @ngInject */
  function PlanReviewCtrl($translate, Authinfo, Config, FeatureToggleService, TrialService, WebExUtilsFact) {
    var vm = this;
    var classes = {
      userService: 'user-service-',
      hasRoomSys: 'has-room-systems'
    };

    vm.messagingServices = {
      isNewTrial: false,
      services: []
    };

    vm.confServices = {
      isNewTrial: false,
      services: []
    };

    vm.commServices = {
      isNewTrial: false,
      services: []
    };

    vm.careServices = {
      isNewTrial: false,
      services: Authinfo.getCareServices() || []
    };

    vm.cmrServices = {
      isNewTrial: false,
      services: []
    };

    vm.roomServices = {
      isNewTrial: false,
      services: []
    };

    vm.roomSystemsCount = 0;
    vm.trialId = '';
    vm.trial = {};
    vm.trialExists = false;
    vm.trialDaysRemaining = 0;
    vm.trialUsedPercentage = 0;
    vm.isInitialized = false; // invert the logic and initialize to false so the template doesn't flicker before spinner
    vm.getUserServiceRowClass = getUserServiceRowClass;
    vm._helpers = {
      maxServiceRows: maxServiceRows
    };
    vm.isCareEnabled = false;

    //TODO this function has to be removed when atlas-care-trials feature is removed
    vm.getGridColumnClassName = function () {
      return vm.isCareEnabled ? 'small-3' : 'small-4';
    };

    /* TODO For now we are using the site url to determine if the license is an SMP license. This logic will change;
    we will be looking at licenseModel inside the licenses payload to determine if the license is SMP instead of the siteUrl. */
    vm.isSharedMultiPartyLicense = function (siteUrl) {
      return _.first(_.split(siteUrl, '.')) === 'smp';
    };

    // This logic needs to be changed to look for the provided audio type from license usage call when payload is ready from the backend
    vm.determineLicenseAudio = function (siteUrl) {
      return vm.isSharedMultiPartyLicense(siteUrl) ? $translate.instant('firstTimeWizard.partnerProvidedAudio') : $translate.instant('firstTimeWizard.webexProvidedAudio');
    };

    // This logic will be changed to look for the 'licenseModel' key when the payload is ready from the backend
    vm.determineLicenseType = function (siteUrl) {
      return vm.isSharedMultiPartyLicense(siteUrl) ? $translate.instant('firstTimeWizard.sharedLicenses') : $translate.instant('firstTimeWizard.assignedLicenses');
    };

    init();

    function getUserServiceRowClass(hasRoomSystem) {
      //determine how many vertical entrees there is going to be
      var returnClass = (hasRoomSystem) ? classes.hasRoomSys + ' ' + classes.userService : classes.userService;
      var serviceRows = vm._helpers.maxServiceRows();
      return returnClass + serviceRows;
    }

    function maxServiceRows() {
      var confLength = _.get(vm.confServices, 'services.length', 0) + _.get(vm.cmrServices, 'services.length', 0);
      return _.max([confLength, vm.messagingServices.services.length, vm.commServices.services.length]);
    }

    function init() {

      FeatureToggleService.atlasCareTrialsGetStatus().then(function (careStatus) {
        vm.isCareEnabled = careStatus && Authinfo.isCare();
      });

      FeatureToggleService.atlasSMPGetStatus().then(function (smpStatus) {
        vm.isSharedMultiPartyEnabled = smpStatus;
      });

      vm.messagingServices.services = Authinfo.getMessageServices() || [];
      _.forEach(vm.messagingServices.services, function (service) {
        if (service.license.isTrial) {
          vm.trialExists = true;
          vm.trialId = service.license.trialId;

          if (service.license.status === Config.licenseStatus.PENDING) {
            vm.messagingServices.isNewTrial = true;
          }
        }
      });

      vm.confServices.services = Authinfo.getConferenceServices() || [];
      _.forEach(vm.confServices.services, function (service) {
        var siteUrl = service.license.siteUrl;
        var isCISite = WebExUtilsFact.isCIEnabledSite(siteUrl);

        service.license.isCI = isCISite;

        if (service.label.indexOf('Meeting Center') != -1) {
          service.label = $translate.instant('onboardModal.meetingCenter') + ' ' + service.license.capacity;
          service.license.siteAdminUrl = WebExUtilsFact.getSiteAdminUrl(siteUrl);
        }
        if (service.license.isTrial) {
          vm.trialExists = true;
          vm.trialId = service.license.trialId;
          if (service.license.status === Config.licenseStatus.PENDING) {
            vm.confServices.isNewTrial = true;
          }
        }
      });

      vm.commServices.services = Authinfo.getCommunicationServices() || [];
      _.forEach(vm.commServices.services, function (service) {
        if (service.license.isTrial) {
          vm.trialExists = true;
          vm.trialId = service.license.trialId;

          if (service.license.status === Config.licenseStatus.PENDING) {
            vm.commServices.isNewTrial = true;
          }
        }
      });

      var isNewCareTrial = _.chain(vm.careServices.services)
        .map('license')
        .filter(function (license) {
          if (license.isTrial) {
            vm.trialExists = true;
            vm.trialId = license.trialId;
            return true;
          }
          return false;
        }).filter(function (license) {
          return license.status === Config.licenseStatus.PENDING;
        })
        .value();

      if (isNewCareTrial.length) {
        vm.careServices.isNewTrial = true;
      }

      vm.roomServices.services = Authinfo.getLicenses() || [];
      _.forEach(vm.roomServices.services, function (service) {
        if (service.licenseType === Config.licenseTypes.SHARED_DEVICES) {
          vm.roomSystemsCount += service.volume;
          if (service.isTrial) {
            vm.trialExists = true;
            vm.trialId = service.trialId;

            if (service.status === Config.licenseStatus.PENDING) {
              vm.roomServices.isNewTrial = true;
            }
          }
        }
      });

      //check if the trial exists
      if (vm.trialExists) {
        TrialService.getTrial(vm.trialId).then(function (trial) {
          populateTrialData(trial);
        }).finally(function () {
          vm.isInitialized = true;
        });
      } else {
        vm.isInitialized = true;
      }

      vm.cmrServices.services = Authinfo.getCmrServices();

      vm.sites = {};
      _.forEach(vm.confServices.services, function (service) {
        if (service.license) {
          if (service.license.siteUrl) {
            if (!vm.sites[service.license.siteUrl]) {
              vm.sites[service.license.siteUrl] = [];
            }
            vm.sites[service.license.siteUrl].push(service);
          }
        }
      });

      if (Object.prototype.toString.call(vm.cmrServices.services) == '[object Array]') {
        _.forEach(vm.cmrServices.services, function (service) {
          if (service.license) {
            if (service.license.siteUrl) {
              if (!vm.sites[service.license.siteUrl]) {
                vm.sites[service.license.siteUrl] = [];
              }
              service.label = $translate.instant('onboardModal.cmr') + ' ' + service.license.capacity;
              vm.sites[service.license.siteUrl].push(service);
            }
          }
        });
      } else {
        var cmrService = vm.cmrServices.services;
        if (cmrService && cmrService.license) {
          if (!vm.sites[cmrService.license.siteUrl]) {
            vm.sites[cmrService.license.siteUrl] = [];
          }
          cmrService.label = $translate.instant('onboardModal.cmr') + ' ' + cmrService.license.capacity;
          vm.sites[cmrService.license.siteUrl].push(cmrService);
        }
      }
    }
    /////////////////

    function populateTrialData(trial) {
      vm.trial = trial;
      var now = moment().startOf('day');
      var start = moment(vm.trial.startDate).startOf('day');
      var daysUsed = moment(now).diff(start, 'days');
      var daysLeft = vm.trial.trialPeriod - daysUsed;
      vm.trialDaysRemaining = daysLeft < 0 ? 0 : daysLeft;
      vm.trialUsedPercentage = Math.round((daysUsed / vm.trial.trialPeriod) * 100);
    }

  }
})();
