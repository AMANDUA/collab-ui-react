require('./_user-add.scss');

(function () {
  'use strict';

  //TODO refactor this into OnboardCtrl, BulkUserCtrl, AssignServicesCtrl
  angular.module('Core')
    .controller('OnboardCtrl', OnboardCtrl);

  /*@ngInject*/
  function OnboardCtrl($modal, $previousState, $q, $rootScope, $scope, $state, $stateParams, $timeout, $translate, addressparser, Analytics, Authinfo, chartColors, Config, DialPlanService, FeatureToggleService, Log, LogMetricsService, NAME_DELIMITER, Notification, OnboardService, Orgservice, SunlightConfigService, TelephonyInfoService, Userservice, Utils, UserCsvService, UserListService, WebExUtilsFact, ServiceSetup, ExternalNumberPool, DirSyncService) {
    var vm = this;

    $scope.hasAccount = Authinfo.hasAccount();
    $scope.usrlist = [];
    $scope.internalNumberPool = [];
    $scope.externalNumberPool = [];
    $scope.telephonyInfo = {};
    $scope.cmrLicensesForMetric = {};
    $scope.currentUserCount = 0;

    vm.maxUsersInManual = OnboardService.maxUsersInManual;

    $scope.searchStr = '';
    $scope.timeoutVal = 1000;
    $scope.timer = 0;
    $scope.searchPlaceholder = $translate.instant('usersPage.convertUserSearch');
    $scope.manageUsers = $stateParams.manageUsers;

    $scope.loadInternalNumberPool = loadInternalNumberPool;
    $scope.loadExternalNumberPool = loadExternalNumberPool;
    $scope.checkDnOverlapsSteeringDigit = checkDnOverlapsSteeringDigit;
    $scope.assignDNForUserList = assignDNForUserList;
    $scope.assignMapUserList = assignMapUserList;
    $scope.checkDidDnDupes = checkDidDnDupes;
    $scope.returnInternalNumberlist = returnInternalNumberlist;
    $scope.mapDidToDn = mapDidToDn;
    $scope.resetDns = resetDns;
    $scope.syncGridDidDn = syncGridDidDn;
    $scope.filterList = filterList;
    $scope.isMapped = false;
    $scope.isMapInProgress = false;
    $scope.isResetInProgress = false;
    $scope.isMapEnabled = true;
    $scope.processing = false;
    $scope.PATTERN_LIMIT = 50;
    $scope.messagingLicenseAvailability = 0;
    $scope.communicationsLicenseAvailability = 0;
    $scope.conferencingLicenseAvailability = 0;
    $scope.dirSyncConnectorDownload = "https://7f3b835a2983943a12b7-f3ec652549fc8fa11516a139bfb29b79.ssl.cf5.rackcdn.com/CloudConnectorManager/DirectoryConnector.zip";

    var isFTW = false;
    $scope.isSharedMeetingsEnabled = false;
    $scope.isReset = false;
    $scope.showExtensions = true;
    $scope.isResetEnabled = false;

    $scope.convertUsersFlow = false;
    $scope.editServicesFlow = false;
    $scope.hasSite = false;

    // model can be removed after switching to controllerAs
    $scope.model = {
      userInputOption: 0,
      uploadProgress: 0,
    };

    $scope.strFirstName = $translate.instant('usersPage.firstNamePlaceHolder');
    $scope.strLastName = $translate.instant('usersPage.lastNamePlaceHolder');
    $scope.strEmailAddress = $translate.instant('usersPage.emailAddressPlaceHolder');
    var strNameAndEmailAdress = $translate.instant('usersPage.nameAndEmailAddress');
    $scope.placeholder = $translate.instant('directoryNumberPanel.chooseNumber');
    $scope.inputPlaceholder = $translate.instant('directoryNumberPanel.searchNumber');
    $scope.userInputOptions = [{
      label: $scope.strEmailAddress,
      value: 0,
      name: 'radioOption',
      id: 'radioEmail',
    }, {
      label: strNameAndEmailAdress,
      value: 1,
      name: 'radioOption',
      id: 'radioNamesAndEmail',
    }];

    OnboardService.huronCallEntitlement = false;

    $scope.shouldAddCallService = shouldAddCallService;
    $scope.cancelModal = cancelModal;
    var currentUserHasCall = false;

    $scope.isCareEnabled = Authinfo.isCare();
    $scope.enableCareService = true;

    $scope.sharedMeetingsFeatureDefaultToggle = { default: true, defaultValue: true };
    if (_.get($scope, 'sharedMeetingsFeatureDefaultToggle.default')) {
      $scope.isSharedMeetingsEnabled = _.get($scope, 'sharedMeetingsFeatureDefaultToggle.defaultValue');
    } else {
      FeatureToggleService.atlasSharedMeetingsGetStatus().then(function (smpStatus) {
        $scope.isSharedMeetingsEnabled = smpStatus;
      });
    }

    $scope.controlCare = controlCare;

    initController();

    /****************************** License Enforcement START *******************************/
    //***
    //***
    //***********************************************************************************/

    function setLicenseAvailability() {
      return Orgservice.getLicensesUsage()
        .then(function (result) {
          $scope.licenses = result[0].licenses;
          _.forEach($scope.licenses, function (license) {
            switch (license.licenseType) {
              case Config.licenseTypes.MESSAGING:
                $scope.messagingLicenseAvailability = license.volume - license.usage;
                break;
              case Config.licenseTypes.COMMUNICATION:
                $scope.communicationLicenseAvailability = license.volume - license.usage;
                break;
              case Config.licenseTypes.CONFERENCING:
                $scope.conferencingLicenseAvailability = license.volume - license.usage;
                break;
              default:
                break;
            }
          });
        });
    }

    $scope.checkLicenseAvailability = function (licenseName, licenseModel) {
      if (!licenseName || !licenseModel) {
        return;
      }
      var licenseNamePrefix = licenseName.toLowerCase();
      if ($scope[licenseNamePrefix + 'LicenseAvailability'] < $scope.currentUserCount) {
        $scope.licenseCheckModal();
      }

    };

    $scope.licenseCheckModal = function () {
      if (Authinfo.isOnline()) {
        $modal.open({
          type: "dialog",
          templateUrl: "modules/core/users/userAdd/licenseErrorModal.tpl.html",
        }).result.then(function () {
          $previousState.forget('modalMemo');
          $state.go('my-company.subscriptions');
        });
      }
    };

    $scope.goToManageUsers = function () {
      $state.go('users.manage.picker');
    };

    /****************************** License Enforcement END *******************************/
    //***
    //***
    //***********************************************************************************/
    function initController() {
      $scope.currentUserCount = 1;
      setLicenseAvailability();
      checkSite();
      initResults();
    }

    function initResults() {
      $scope.results = {
        resultList: [],
        errors: [],
        warnings: [],
      };
    }

    var rootState = $previousState.get().state.name;
    $scope.onBack = function (state) {
      var goToState = state || rootState;
      Analytics.trackAddUsers(Analytics.eventNames.BACK, Analytics.sections.ADD_USERS.uploadMethods.MANUAL, { emailEntryMethod: Analytics.sections.ADD_USERS.manualMethods[$scope.model.userInputOption.toString()] });
      $state.go(goToState);
    };

    // initiate the bulkSave operation for ADSync
    $scope.bulkSave = bulkSave;

    /****************************** Did to Dn Mapping START *******************************/
    //***
    //***
    //***********************************************************************************/

    function activateDID() {
      $q.all([loadInternalNumberPool(), loadExternalNumberPool(), toggleShowExtensions(), loadPrimarySiteInfo()])
        .finally(function () {
          if ($scope.showExtensions === true) {
            assignDNForUserList();
            $scope.validateDnForUser();
          } else {
            mapDidToDn();
          }
          $scope.processing = false;
        });
    }

    function loadPrimarySiteInfo() {
      return TelephonyInfoService.getPrimarySiteInfo().then(function (telephonyInfo) {
        $scope.telephonyInfo = telephonyInfo;
      }).catch(function (response) {
        Notification.errorResponse(response, 'directoryNumberPanel.siteError');
      });
    }

    // Check to see if the currently selected directory number's first digit is
    // the same as the company steering digit.
    function checkDnOverlapsSteeringDigit(userEntity) {
      return _.startsWith(_.get(userEntity, 'assignedDn.pattern'), _.get($scope, 'telephonyInfo.steeringDigit'));
    }

    function returnInternalNumberlist(pattern) {
      if (pattern) {
        loadInternalNumberPool(pattern);
      } else {
        return $scope.internalNumberPool;
      }
    }

    function loadInternalNumberPool(pattern) {
      return TelephonyInfoService.loadInternalNumberPool(pattern, $scope.PATTERN_LIMIT).then(function (internalNumberPool) {
        $scope.internalNumberPool = internalNumberPool;
      }).catch(function (response) {
        $scope.internalNumberPool = [];
        Notification.errorResponse(response, 'directoryNumberPanel.internalNumberPoolError');
      });
    }

    function loadExternalNumberPool(pattern) {
      // Numbers loaded here should be limited to standard DID numbers. No Toll-Free numbers.
      return TelephonyInfoService.loadExternalNumberPool(pattern, ExternalNumberPool.FIXED_LINE_OR_MOBILE)
        .then(function (externalNumberPool) {
          $scope.externalNumberPool = externalNumberPool;
        }).catch(function (response) {
          $scope.externalNumberPool = [{
            uuid: 'none',
            pattern: $translate.instant('directoryNumberPanel.none'),
          }];
          Notification.errorResponse(response, 'directoryNumberPanel.externalNumberPoolError');
        });
    }

    function mapDidToDn() {
      $scope.isMapInProgress = true;
      $scope.isMapEnabled = false;
      var count = $scope.usrlist.length;

      // Numbers loaded here should be limited to standard DID numbers. No Toll-Free numbers.
      TelephonyInfoService.loadExtPoolWithMapping(count, ExternalNumberPool.FIXED_LINE_OR_MOBILE)
        .then(function (externalNumberMapping) {
          $scope.externalNumberMapping = externalNumberMapping;
          assignMapUserList(count, externalNumberMapping);
          $scope.isMapped = true;
          $scope.isMapInProgress = false;
          $scope.validateDnForUser();
        }).catch(function (response) {
          $scope.isMapInProgress = false;
          $scope.isMapped = false;
          $scope.isMapEnabled = true;
          $scope.externalNumberMapping = [];
          Notification.errorResponse(response, 'directoryNumberPanel.externalNumberMappingError');
        });
    }

    function assignDNForUserList() {
      _.forEach($scope.usrlist, function (user, index) {
        user.assignedDn = $scope.internalNumberPool[index];
      });

      // don't select any DID on loading the page
      _.forEach($scope.usrlist, function (user) {
        user.externalNumber = $scope.externalNumberPool[0];
        user.didDnMapMsg = undefined;
      });
    }

    function resetDns() {
      $scope.isResetInProgress = true;
      $scope.isResetEnabled = false;
      loadInternalNumberPool().then(function () {
        assignDNForUserList();
        $scope.validateDnForUser();
        $scope.isReset = true;
        $scope.isResetInProgress = false;
      }).catch(function () {
        $scope.isResetInProgress = false;
        $scope.validateDnForUser();
      });
    }

    function assignMapUserList(count, externalNumberMappings) {

      for (var i = 0; i < $scope.usrlist.length; i++) {
        if (i <= externalNumberMappings.length - 1) {
          if (externalNumberMappings[i].directoryNumber !== null) {
            $scope.usrlist[i].externalNumber = externalNumberMappings[i];
            $scope.usrlist[i].assignedDn = externalNumberMappings[i].directoryNumber;
          } else {
            $scope.usrlist[i].externalNumber = externalNumberMappings[i];
            $scope.usrlist[i].didDnMapMsg = 'usersPage.noExtMappingAvail';
          }
        } else {
          $scope.usrlist[i].externalNumber = $scope.externalNumberPool[0];
          $scope.usrlist[i].didDnMapMsg = 'usersPage.noExternalNumberAvail';
        }
      }

    }

    function checkDidDnDupes() {
      var didDnDupe = {
        didDupe: false,
        dnDupe: false,
      };
      for (var i = 0; i < $scope.usrlist.length - 1; i++) {
        for (var j = i + 1; j < $scope.usrlist.length; j++) {
          if (!_.isUndefined($scope.usrlist[i].assignedDn) && !_.isUndefined($scope.usrlist[j].assignedDn) && ($scope.usrlist[i].assignedDn.uuid !== 'none') && ($scope.usrlist[i].assignedDn.pattern === $scope.usrlist[j].assignedDn.pattern)) {
            didDnDupe.dnDupe = true;
          }
          if (!_.isUndefined($scope.usrlist[i].externalNumber) && !_.isUndefined($scope.usrlist[j].externalNumber) && ($scope.usrlist[i].externalNumber.uuid !== 'none') && ($scope.usrlist[i].externalNumber.pattern === $scope.usrlist[j].externalNumber.pattern)) {
            didDnDupe.didDupe = true;
          }
          if (didDnDupe.dnDupe && didDnDupe.didDupe) {
            break;
          }
        }
        if (didDnDupe.dnDupe && didDnDupe.didDupe) {
          break;
        }
      }
      return didDnDupe;
    }

    $scope.isDnNotAvailable = function () {
      for (var i = 0; i < $scope.usrlist.length; i++) {
        if ($scope.usrlist[i].assignedDn === undefined) {
          return true;
        }
      }
      return false;
    };

    $scope.assignServicesSave = function () {
      if (shouldAddCallService()) {
        $scope.processing = true;
        activateDID();
        $state.go('users.add.services.dn');
      } else {
        $scope.onboardUsers(true);
      }
    };

    $scope.editServicesSave = function () {
      for (var licenseId in $scope.cmrLicensesForMetric) {
        if ($scope.cmrLicensesForMetric[licenseId]) {
          Analytics.trackUserOnboarding(Analytics.sections.USER_ONBOARDING.eventNames.CMR_CHECKBOX, $state.current.name, Authinfo.getOrgId(), { licenseId: licenseId });

        }
      }
      if (shouldAddCallService()) {
        $scope.processing = true;
        $scope.editServicesFlow = true;
        $scope.convertUsersFlow = false;

        // Populate list with single user for updateUserLicense()
        $scope.usrlist = [{
          address: _.get($scope, 'currentUser.userName', ''),
        }];
        activateDID();
        $state.go('editService.dn');
      } else {
        $scope.updateUserLicense();
      }

    };

    function toggleShowExtensions() {
      return DialPlanService.getCustomerDialPlanDetails().then(function (response) {
        var indexOfDidColumn = _.findIndex($scope.addDnGridOptions.columnDefs, {
          field: 'externalNumber',
        });
        var indexOfDnColumn = _.findIndex($scope.addDnGridOptions.columnDefs, {
          field: 'internalExtension',
        });
        if (response.extensionGenerated === "true") {
          $scope.showExtensions = false;
          $scope.addDnGridOptions.columnDefs[indexOfDidColumn].visible = false;
          $scope.addDnGridOptions.columnDefs[indexOfDnColumn].displayName = $translate.instant('usersPage.directLineHeader');
        } else {
          $scope.showExtensions = true;
          $scope.addDnGridOptions.columnDefs[indexOfDidColumn].visible = true;
          $scope.addDnGridOptions.columnDefs[indexOfDnColumn].displayName = $translate.instant('usersPage.extensionHeader');
        }
      }).catch(function (response) {
        Notification.errorResponse(response, 'serviceSetupModal.customerDialPlanDetailsGetError');
      });
    }

    // Synchronize the DIDs and DNs on the Assign Numbers page when selections change
    function syncGridDidDn(rowEntity, modifiedFieldName) {
      if ($scope.showExtensions === false) {
        var dnLength = rowEntity.assignedDn.pattern.length;
        // if the internalNumber was changed, find a matching DID and set the externalNumber to match
        if (modifiedFieldName === "internalNumber") {
          var matchingDid = _.find($scope.externalNumberPool, function (extNum) {
            return extNum.pattern.substr(-dnLength) === rowEntity.assignedDn.pattern;
          });
          if (matchingDid) {
            rowEntity.externalNumber = matchingDid;
          }
        }
        // if the externalNumber was changed, find a matching DN and set the internalNumber to match
        if (modifiedFieldName === "externalNumber") {
          var matchingDn = _.find($scope.internalNumberPool, {
            pattern: rowEntity.externalNumber.pattern.substr(-dnLength),
          });
          if (matchingDn) {
            rowEntity.assignedDn = matchingDn;
          }
        }
      }
    }

    /****************************** Did to Dn Mapping END *******************************/
    //***
    //***
    //***********************************************************************************/

    function clearNameAndEmailFields() {
      $scope.model.firstName = '';
      $scope.model.lastName = '';
      $scope.model.emailAddress = '';
      $scope.model.userInfoValid = false;
    }

    function ServiceFeature(label, value, name, license) {
      this.label = label;
      this.value = value;
      this.name = name;
      this.license = license;
    }

    function FakeLicense(type) {
      this.licenseType = type;
      this.features = Config.getDefaultEntitlements();
    }

    $scope.confirmAdditionalServiceSetup = function () {
      $modal.open({
        type: 'dialog',
        templateUrl: 'modules/core/users/userAdd/confirmLeavingDialog.tpl.html',
      }).result.then(function () {
        $state.go('firsttimewizard');
      });
    };

    $scope.disableCommFeatureAssignment = function () {
      // disable the communication feature assignment unless the UserAdd is part of the First Time Setup Wizard work flow
      return (!Authinfo.isSetupDone() && ((typeof $state.current.data === 'undefined') || (!$state.current.data.firstTimeSetup)));
    };

    function checkSite() {
      ServiceSetup.listSites().then(function () {
        $scope.hasSite = (ServiceSetup.sites.length !== 0);
      });
    }

    var userEnts = null;
    var userLicenseIds = null;
    var userInvites = null;
    $scope.cmrFeature = null;
    $scope.messageFeatures = [];
    $scope.conferenceFeatures = [];
    $scope.communicationFeatures = [];
    $scope.careFeatures = [];
    $scope.licenses = [];
    $scope.licenseStatus = [];
    $scope.populateConf = populateConf;
    $scope.disableCheckbox = disableCheckbox;
    $scope.populateConfInvitations = populateConfInvitations;
    $scope.getAccountLicenses = getAccountLicenses;
    $scope.checkMessageVisibility = checkMessageVisibility;
    var convertUsersCount = 0;
    var convertStartTime = 0;
    var convertCancelled = false;
    var convertBacked = false;
    var convertPending = false;

    $scope.messageFeatures.push(new ServiceFeature($translate.instant('onboardModal.msgFree'), 0, 'msgRadio', new FakeLicense('freeTeamRoom')));
    $scope.conferenceFeatures.push(new ServiceFeature($translate.instant('onboardModal.mtgFree'), 0, 'confRadio', new FakeLicense('freeConferencing')));
    $scope.communicationFeatures.push(new ServiceFeature($translate.instant('onboardModal.callFree'), 0, 'commRadio', new FakeLicense('advancedCommunication')));
    $scope.careFeatures.push(new ServiceFeature($translate.instant('onboardModal.careFree'), 0, 'careRadio', new FakeLicense('freeCareService')));
    $scope.currentUser = $stateParams.currentUser;

    $scope.currentUserDisplayName = function () {
      if (_.isObject($scope.currentUser)) {
        if (!_.isEmpty($scope.currentUser.displayName)) {
          return _.trim($scope.currentUser.displayName);
        } else if (_.isObject($scope.currentUser.name) && (!_.isEmpty($scope.currentUser.name.givenName) || !_.isEmpty($scope.currentUser.name.familyName))) {
          return _.trim(($scope.currentUser.name.givenName || '') + ' ' + ($scope.currentUser.name.familyName || ''));
        } else if (!_.isEmpty($scope.currentUser.userName)) {
          return _.trim($scope.currentUser.userName);
        }
      }
      // if all else fails, return Unknown
      return _.trim($translate.instant('common.unknown'));
    };

    if ($scope.currentUser) {
      userEnts = $scope.currentUser.entitlements;
      userLicenseIds = $scope.currentUser.licenseID;
      userInvites = $scope.currentUser.invitations;
      $scope.hybridCallServiceAware = userEnts && userEnts.indexOf('squared-fusion-uc') > -1;
    }

    function checkMessageVisibility(licenses, selectedSubscription) {
      if (licenses.length === 1) {
        var license = licenses[0];
        if (license.billingServiceId && selectedSubscription) {
          return license.billingServiceId === selectedSubscription;
        }
        return true;
      }
      return false;
    }

    function disableCheckbox(lic) {
      if (_.isArray(lic)) {
        return _.get(lic[0], 'status') === 'DISABLED';
      } else {
        return _.get(lic, 'status') === 'DISABLED';
      }
    }

    function populateConf() {
      if (userLicenseIds) {

        _.forEach(userLicenseIds, function (userLicenseId) {
          _.forEach($scope.allLicenses, function (siteObj) {
            if (siteObj.siteUrl === '' && !siteObj.confModel) {
              siteObj.confModel = siteObj.licenseId === userLicenseId;
            }
            siteObj.confLic = _.map(siteObj.confLic, function (conf) {
              if (!conf.confModel) {
                conf.confModel = conf.licenseId === userLicenseId;
              }
              return conf;
            });
            siteObj.cmrLic = _.map(siteObj.cmrLic, function (cmr) {
              if (!cmr.cmrModel) {
                cmr.cmrModel = cmr.licenseId === userLicenseId;
              }
              return cmr;
            });
          });
        });
      }
    }

    function populateConfInvitations() {
      if (userInvites && userInvites.cf) {
        _.forEach($scope.allLicenses, function (siteObj) {
          if (siteObj.siteUrl === '' && !siteObj.confModel) {
            siteObj.confModel = siteObj.licenseId === userInvites.cf;
          }
          siteObj.confLic = _.map(siteObj.confLic, function (conf) {
            if (!conf.confModel) {
              conf.confModel = conf.licenseId === userInvites.cf;
            }
            return conf;
          });
        });
      }
    }

    $scope.radioStates = {
      commRadio: false,
      msgRadio: false,
      careRadio: false,
      initialCareRadioState: false, // For generating Metrics
    };

    function getSelectedKeys(obj) {
      var result = _.reduce(obj, function (result, v, k) {
        if (v === true) {
          result.push(k);
        }
        return result;
      }, []);
      return result;
    }


    function createPropertiesForAnalyltics() {
      return {
        numberOfErrors: $scope.results.errors.length,
        usersAdded: $scope.numAddedUsers,
        usersUpdated: $scope.numUpdatedUsers,
        servicesSelected: getSelectedKeys(),
      };
    }

    if (userEnts) {
      for (var x = 0; x < userEnts.length; x++) {
        if (userEnts[x] === 'ciscouc') {
          $scope.radioStates.commRadio = true;
          currentUserHasCall = true;
        } else if (userEnts[x] === 'squared-room-moderation') {
          $scope.radioStates.msgRadio = true;
        } else if (userEnts[x] === 'cloud-contact-center') {
          setCareSevice();
        }
      }
    }

    if (userInvites) {
      if (userInvites.ms) {
        $scope.radioStates.msgRadio = true;
      }
      if (userInvites.cc) {
        setCareSevice();
      }
    }

    function setCareSevice() {
      if (getServiceDetails('CD')) {
        SunlightConfigService.getUserInfo($scope.currentUser.id)
          .then(function () {
            Userservice.getUser($scope.currentUser.id, true, function (data) {
              if (data.success) {
                var hasSyncKms = _.find(data.roles, function (r) {
                  return r === Config.backend_roles.spark_synckms;
                });
                var hasContextServiceEntitlement = _.find(data.entitlements, function (r) {
                  return r === Config.entitlements.context;
                });
                if (hasSyncKms && hasContextServiceEntitlement) {
                  $scope.radioStates.careRadio = true;
                  $scope.radioStates.initialCareRadioState = true;
                  $scope.enableCareService = true;
                }
              }
            });
          },
          function () {
            $scope.radioStates.careRadio = false;
          });
      }
    }

    function getServiceDetails(licensePrefix) {
      var hasLicense = _.find($scope.currentUser.licenseID, function (userLicense) {
        return (userLicense.substring(0, 2) === licensePrefix);
      });
      return hasLicense;
    }


    function shouldAddCallService() {
      return !currentUserHasCall && ($scope.radioStates.commRadio || $scope.entitlements.ciscoUC);
    }

    function createFeatures(obj) {
      return {
        siteUrl: _.get(obj, 'license.siteUrl', ''),
        billing: _.get(obj, 'license.billingServiceId', ''),
        volume: _.get(obj, 'license.volume', ''),
        licenseId: _.get(obj, 'license.licenseId', ''),
        licenseModel: _.get(obj, 'license.licenseModel', ''),
        offerName: _.get(obj, 'license.offerName', ''),
        label: obj.label,
        isTrial: _.get(obj, 'license.isTrial', false),
        status: _.get(obj, 'license.status', ''),
        confModel: false,
        cmrModel: false,
      };
    }

    $scope.checkCMR = function (cfLic, cmrLics) {
      if (cfLic.offerName === 'MC' || cfLic.offerName === 'EE') {
        cmrLics.forEach(function (cmrLic) {
          cmrLic.cmrModel = cfLic.confModel;
        });
      }
    };

    $scope.updateCmrLicensesForMetric = function (cmrModel, licenseId) {
      $scope.cmrLicensesForMetric[licenseId] = !cmrModel;
    };

    var generateConfChk = function (confs, cmrs) {
      $scope.confChk = [];
      $scope.allLicenses = [];
      $scope.basicLicenses = [];
      $scope.advancedLicenses = [];

      var formatLicense = function (site) {
        var confMatches = _.filter(confFeatures, {
          siteUrl: site,
        });
        var cmrMatches = _.filter(cmrFeatures, {
          siteUrl: site,
        });
        var isCISiteFlag = WebExUtilsFact.isCIEnabledSite(site);
        return {
          site: site,
          billing: _.uniq(_.map(cmrMatches, 'billing').concat(_.map(confMatches, 'billing'))),
          confLic: confMatches,
          cmrLic: cmrMatches,
          isCISite: isCISiteFlag,
          siteAdminUrl: (isCISiteFlag ? '' : WebExUtilsFact.getSiteAdminUrl(site)),
        };
      };

      for (var i in confs) {
        var temp = {
          confFeature: confs[i],
          confModel: false,
          confId: 'conf-' + i,
        };

        var confNoUrl = _.chain(confs)
          .filter(function (conf) {
            return conf.license.licenseType !== 'freeConferencing';
          })
          .filter(function (conf) {
            return !_.has(conf, 'license.siteUrl');
          })
          .map(createFeatures)
          .remove(undefined)
          .value();

        var confFeatures = _.chain(confs)
          .filter('license.siteUrl')
          .map(createFeatures)
          .remove(undefined)
          .value();
        var cmrFeatures = _.chain(cmrs)
          .filter('license.siteUrl')
          .map(createFeatures)
          .remove(undefined)
          .value();

        var siteUrls = _.map(confFeatures, function (lic) {
          return lic.siteUrl;
        });
        siteUrls = _.uniq(siteUrls);

        $scope.allLicenses = _.map(siteUrls, formatLicense);
        $scope.allLicenses = _.union(confNoUrl, $scope.allLicenses);

        for (var j in cmrs) {
          if (!_.isUndefined(cmrs[j]) && !_.isNull(cmrs[j]) && !_.isUndefined(confs[i].license.siteUrl)) {
            if (_.isEqual(confs[i].license.siteUrl, cmrs[j].license.siteUrl) && _.isEqual(confs[i].license.billingServiceId, cmrs[j].license.billingServiceId)) {
              temp.cmrFeature = cmrs[j];
              temp.cmrModel = false;
              temp.cmrId = 'cmr-' + j;
            }
          }
        }

        $scope.confChk.push(temp);
      }

      // Distinguish between basic license and advanced license types
      _.forEach($scope.allLicenses, function (license) {
        if (license.site) {
          $scope.advancedLicenses.push(license);
        } else {
          $scope.basicLicenses.push(license);
        }
      });

      $scope.hasBasicLicenses = !_.isEmpty($scope.basicLicenses);
      $scope.hasAdvancedLicenses = !_.isEmpty($scope.advancedLicenses);

      populateConf();
      populateConfInvitations();
    };

    /* TODO: Refactor this functions into MultipleSubscriptions Controller */
    $scope.selectedSubscriptionHasBasicLicenses = function (subscriptionId) {
      if (subscriptionId && subscriptionId !== Config.subscriptionState.trial) {
        return _.some($scope.basicLicenses, function (service) {
          if (_.get(service, 'billing') === subscriptionId) {
            return !_.has(service, 'site');
          }
        });
      } else {
        return $scope.hasBasicLicenses;
      }
    };

    /* TODO: Refactor this functions into MultipleSubscriptions Controller */
    $scope.selectedSubscriptionHasAdvancedLicenses = function (subscriptionId) {
      var advancedLicensesInSubscription = _.filter($scope.advancedLicenses, { confLic: [{ billing: subscriptionId }] });
      if (subscriptionId && subscriptionId !== Config.subscriptionState.trial) {
        return _.some(advancedLicensesInSubscription, function (service) {
          return _.has(service, 'site');
        });
      } else {
        return $scope.hasAdvancedLicenses;
      }
    };

    $scope.isSharedMeetingsLicense = function (license) {
      return _.lowerCase(_.get(license, 'confLic[0].licenseModel', '')) === Config.licenseModel.cloudSharedMeeting;
    };

    $scope.determineLicenseType = function (license) {
      return $scope.isSharedMeetingsLicense(license) ? $translate.instant('firstTimeWizard.sharedLicense') : $translate.instant('firstTimeWizard.namedLicense');
    };

    $scope.generateLicenseTooltip = function (license) {
      return $scope.isSharedMeetingsLicense(license) ? '<div class="license-tooltip-html">' + $translate.instant('firstTimeWizard.sharedLicenseTooltip') + '</div>' : '<div class="license-tooltip-html">' + $translate.instant('firstTimeWizard.namedLicenseTooltip') + '</div>';
    };

    $scope.isSubscribeable = function (license) {
      if (license.status === 'ACTIVE' || license.status === 'PENDING') {
        return (license.volume > 0);
      }
      return false;
    };

    // [Services] -> [Services] (merges Service[s] w/ same license)
    var mergeMultipleLicenseSubscriptions = function (fetched) {

      // Construct a mapping from License to (array of) Service object(s)
      var services = fetched.reduce(function (object, service) {
        var key = service.license.licenseType;
        if (key in object) {
          object[key].push(service);
        } else {
          object[key] = [service];
        }
        return object;
      }, {});

      // Merge all services with the same License into a single Service
      return _.values(services).map(function (array) {
        var result = {
          licenses: [],
        };
        array.forEach(function (service) {
          var copy = _.cloneDeep(service);
          copy.licenses = [copy.license];
          delete copy.license;
          _.mergeWith(result, copy, function (left, right) {
            if (_.isArray(left)) return left.concat(right);
          });
        });
        return result;
      });

    };

    var getAccountServices = function () {
      var services = {
        message: Authinfo.getMessageServices(),
        conference: Authinfo.getConferenceServices(),
        communication: Authinfo.getCommunicationServices(),
        care: Authinfo.getCareServices(),
      };
      if (services.message) {
        services.message = mergeMultipleLicenseSubscriptions(services.message);
        $scope.messageFeatures = $scope.messageFeatures.concat(services.message);
        if (userLicenseIds) {
          _.forEach($scope.messageFeatures[1].licenses, function (license) {
            license.model = userLicenseIds.indexOf(license.licenseId) >= 0;
          });
        }

        if ($scope.messageFeatures[1].licenses.length > 1) {
          $scope.radioStates.msgRadio = true;
        }
      }
      if (services.conference) {
        $scope.cmrFeatures = Authinfo.getCmrServices();
        $scope.conferenceFeatures = $scope.conferenceFeatures.concat(services.conference);
        generateConfChk($scope.conferenceFeatures, $scope.cmrFeatures);
      }
      if (services.communication) {
        $scope.communicationFeatures = $scope.communicationFeatures.concat(services.communication);
      }
      if (services.care) {
        $scope.careFeatures = $scope.careFeatures.concat(services.care);
      }
    };

    if (Authinfo.isInitialized()) {
      getAccountServices();
    }

    $scope.collabRadio1 = {
      label: $translate.instant('onboardModal.enableCollab'),
      value: 1,
      name: 'collabRadio',
      id: 'collabRadio1',
    };

    $scope.collabRadio2 = {
      label: $translate.instant('onboardModal.enableCollabGroup'),
      value: 2,
      name: 'collabRadio',
      id: 'collabRadio2',
    };

    $scope.tableOptions = {
      cursorcolor: chartColors.gray,
      cursorminheight: 50,
      cursorborder: "0px",
      cursorwidth: "7px",
      railpadding: {
        top: 0,
        right: 3,
        left: 0,
        bottom: 0,
      },
      autohidemode: "leave",
    };

    var nameTemplate = '<div class="ui-grid-cell-contents"><span class="name-display-style">{{row.entity.name}}</span>' +
      '<span class="email-display-style">{{row.entity.address}}</span></div>';

    var internalExtensionTemplate = '<div ng-show="row.entity.assignedDn !== undefined"> ' +
      '<cs-select name="internalNumber" ' +
      'ng-model="row.entity.assignedDn" options="grid.appScope.internalNumberPool" ' +
      'refresh-data-fn="grid.appScope.returnInternalNumberlist(filter)" wait-time="0" ' +
      'placeholder="placeholder" input-placeholder="inputPlaceholder" ' +
      'on-change-fn="grid.appScope.syncGridDidDn(row.entity, \'internalNumber\')"' +
      'labelfield="pattern" valuefield="uuid" required="true" filter="true"' +
      ' is-warn="{{grid.appScope.checkDnOverlapsSteeringDigit(row.entity)}}" warn-msg="{{\'usersPage.steeringDigitOverlapWarning\' | translate: { steeringDigitInTranslation: telephonyInfo.steeringDigit } }}" > </cs-select></div>' +
      '<div ng-show="row.entity.assignedDn === undefined"> ' +
      '<cs-select name="noInternalNumber" ' +
      'ng-model="grid.appScope.noExtInPool" labelfield="grid.appScope.noExtInPool" is-disabled="true" > </cs-select>' +
      '<span class="error">{{\'usersPage.noExtensionInPool\' | translate }}</span> </div> ';

    var externalExtensionTemplate = '<div ng-show="row.entity.didDnMapMsg === undefined"> ' +
      '<cs-select name="externalNumber" ' +
      'ng-model="row.entity.externalNumber" options="grid.appScope.externalNumberPool" ' +
      'refresh-data-fn="grid.appScope.loadExternalNumberPool(filter)" wait-time="0" ' +
      'placeholder= "placeholder" input-placeholder="inputPlaceholder" ' +
      'on-change-fn="grid.appScope.syncGridDidDn(row.entity, \'externalNumber\')"' +
      'labelfield="pattern" valuefield="uuid" required="true" filter="true"> </cs-select></div> ' +
      '<div ng-show="row.entity.didDnMapMsg !== undefined"> ' +
      '<cs-select name="grid.appScope.noExternalNumber" ' +
      'ng-model="row.entity.externalNumber" options="grid.appScope.externalNumberPool" class="select-warning"' +
      'labelfield="pattern" valuefield="uuid" required="true" filter="true"> </cs-select>' +
      '<span class="warning did-map-error">{{row.entity.didDnMapMsg | translate }}</span> </div> ';

    $scope.noExtInPool = $translate.instant('usersPage.notApplicable');
    $scope.noExternalNum = $translate.instant('usersPage.notApplicable');

    $scope.$watch('model.userList', function (newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.usrlist = addressparser.parse($scope.model.userList);
      }
    });

    // To differentiate the user list change made by map operation
    //  and other manual/reset operation.
    $scope.$watch('usrlist', function () {
      if ($scope.isMapped) {
        $scope.isMapped = false;
      } else {
        $scope.isMapEnabled = true;
      }

      if ($scope.isReset) {
        $scope.isReset = false;
      } else {
        $scope.isResetEnabled = true;
      }
    }, true);

    $scope.$watch('radioStates.commRadio', function (newVal, oldVal) {
      if (newVal != oldVal) {
        // Store value of checkbox in service (cast to bool)
        OnboardService.huronCallEntitlement = !!newVal;

        // Do not change wizard text when configuring bulk user services
        if (!_.isUndefined($scope.wizard) && !($scope.wizard.current.step.name === 'csvServices' || $scope.wizard.current.step.name === 'dirsyncServices')) {
          if (shouldAddCallService()) {
            $scope.$emit('wizardNextText', 'next');
          } else {
            $scope.$emit('wizardNextText', 'finish');
          }
        }
      }
      // Control Care behavior
      $scope.controlCare();
    });

    $scope.$watch('wizard.current.step', function () {
      if (!_.isUndefined($scope.wizard) && $scope.wizard.current.step.name === 'assignServices') {
        if (shouldAddCallService()) {
          $scope.$emit('wizardNextText', 'next');
        } else {
          $scope.$emit('wizardNextText', 'finish');
        }
      } else if (!_.isUndefined($scope.wizard) && $scope.wizard.current.step.name === 'assignDnAndDirectLines') {
        if (!shouldAddCallService()) {
          // we don't have call service, so skip to previous step
          $scope.wizard.previousStep();
        } else {
          $scope.isResetEnabled = false;
          $scope.validateDnForUser();
        }
      }
    });

    $scope.$watch('radioStates.msgRadio', function () {
      // Control Care behavior
      $scope.controlCare();
    });

    $scope.validateDnForUser = function () {
      if ($scope.isDnNotAvailable()) {
        $scope.$emit('wizardNextButtonDisable', true);
      } else {
        $scope.$emit('wizardNextButtonDisable', false);
      }
    };

    $scope.isResetEnabled = false;
    $scope.validateDnForUser();

    $scope.addDnGridOptions = {
      data: 'usrlist',
      enableHorizontalScrollbar: 0,
      enableRowSelection: false,
      multiSelect: false,
      rowHeight: 45,
      enableRowHeaderSelection: false,
      enableColumnResize: true,
      enableColumnMenus: false,
      columnDefs: [{
        field: 'name',
        displayName: $translate.instant('usersPage.nameHeader'),
        sortable: false,
        cellTemplate: nameTemplate,
        width: '*',
      }, {
        field: 'externalNumber',
        displayName: $translate.instant('usersPage.directLineHeader'),
        sortable: false,
        cellTemplate: externalExtensionTemplate,
        maxWidth: 220,
        minWidth: 140,
        width: '*',
      }, {
        field: 'internalExtension',
        displayName: $translate.instant('usersPage.extensionHeader'),
        sortable: false,
        cellTemplate: internalExtensionTemplate,
        maxWidth: 220,
        minWidth: 140,
        width: '*',
      }],
    };
    $scope.collabRadio = 1;

    $scope.onboardUsers = onboardUsers;

    var usersList = [];

    /**
     * get the current license settings for the CF_ licenses
     *
     * @param {string[]} state - return license list based on matching state (checked = true)
     */
    var getConfIdList = function (state) {
      var idList = [];

      _.forEach($scope.allLicenses, function (license) {
        if (!_.isArray(license) && license.confModel === state) {
          idList.push(license.licenseId);
        }
        idList = idList.concat(_(license.confLic)
          .filter({
            confModel: state,
          })
          .map('licenseId')
          .remove(undefined)
          .value()
        );

        idList = idList.concat(_(license.cmrLic)
          .filter({
            cmrModel: state,
          })
          .map('licenseId')
          .remove(undefined)
          .value()
        );

      });

      return idList;
    };

    function filterList(str) {
      if ($scope.timer) {
        $timeout.cancel($scope.timer);
        $scope.timer = 0;
      }

      $scope.timer = $timeout(function () {
        if (str.length >= 3 || str === '') {
          $scope.searchStr = str;
          getUnlicensedUsers();
          Analytics.trackUserOnboarding(Analytics.sections.USER_ONBOARDING.eventNames.CONVERT_USER, $state.current.name, Authinfo.getOrgId());
        }
      }, $scope.timeoutVal);
    }

    /**
     * get the list of selected account licenses on the dialog
     *
     * @param {null|Object[]} action - 'additive' - add new licenses only, 'patch' - remove any licenses not specified
     */
    function getAccountLicenses(action) {
      var licenseList = [];
      if (Authinfo.hasAccount()) {
        var msgIndex = $scope.radioStates.msgRadio ? 1 : 0;
        var selMsgService = $scope.messageFeatures[msgIndex];
        var licenses = selMsgService.license || selMsgService.licenses;
        // Messaging: prefer selected subscription, if specified
        if (_.isArray(licenses)) {
          if (licenses.length > 1) {
            _.forEach(licenses, function (license) {
              licenseList.push(new LicenseFeature(license.licenseId, license.model));
            });
          } else {
            licenseList.push(new LicenseFeature(licenses[0].licenseId, true));
          }
        } else {
          if ('licenseId' in licenses) {
            // Add new licenses
            licenseList.push(new LicenseFeature(licenses.licenseId, true));
          } else if ((action === 'patch') && ($scope.messageFeatures.length > 1) && ('licenseId' in $scope.messageFeatures[1].licenses[0])) {
            // Remove existing license
            licenseList.push(new LicenseFeature($scope.messageFeatures[1].licenses[0].licenseId, false));
          }
        }

        // Conferencing: depends on model (standard vs. CMR)
        var cidListAdd = getConfIdList(true);
        for (var i = 0; i < cidListAdd.length; i++) {
          licenseList.push(new LicenseFeature(cidListAdd[i], true));
        }
        if (action === 'patch') {
          var cidListRemove = getConfIdList(false);
          for (i = 0; i < cidListRemove.length; i++) {
            licenseList.push(new LicenseFeature(cidListRemove[i], false));
          }
        }

        // Communication: straightforward license, for now
        var commIndex = $scope.radioStates.commRadio ? 1 : 0;
        var selCommService = $scope.communicationFeatures[commIndex];
        if ('licenseId' in selCommService.license) {
          licenseList.push(new LicenseFeature(selCommService.license.licenseId, true));
        } else if ((action === 'patch') && ($scope.communicationFeatures.length > 1) && ('licenseId' in $scope.communicationFeatures[1].license)) {
          licenseList.push(new LicenseFeature($scope.communicationFeatures[1].license.licenseId, false));
        }

        // Care: straightforward license, for now
        var careIndex = $scope.radioStates.careRadio ? 1 : 0;
        var selCareService = $scope.careFeatures[careIndex];
        var licenseId = _.get(selCareService, 'license.licenseId', null);
        if (licenseId) {
          licenseList.push(new LicenseFeature(licenseId, true));
        } else if (action === 'patch') {
          licenseId = _.get($scope, 'careFeatures[1].license.licenseId', null);
          if (licenseId) {
            licenseList.push(new LicenseFeature(licenseId, false));
          }
        }

        // Metrics for care entitlement for users
        if ($scope.radioStates.careRadio !== $scope.radioStates.initialCareRadioState) {
          if ($scope.radioStates.careRadio) {
            LogMetricsService.logMetrics('Enabling care for user', LogMetricsService.getEventType('careEnabled'), LogMetricsService.getEventAction('buttonClick'), 200, moment(), 1, null);
          } else {
            LogMetricsService.logMetrics('Disabling care for user', LogMetricsService.getEventType('careDisabled'), LogMetricsService.getEventAction('buttonClick'), 200, moment(), 1, null);
          }
        }
      }

      return licenseList.length === 0 ? null : licenseList;
    }

    var getEntitlements = function (action) {
      var entitleList = [];
      var state = null;
      for (var key in $scope.entitlements) {
        state = $scope.entitlements[key];
        if ((action === 'add' && state) || (action === 'entitle' && state)) {
          entitleList.push(new Feature(key, state));
        }
      }

      Log.debug(entitleList);
      return entitleList;
    };

    // Hybrid Services entitlements
    var getExtensionEntitlements = function (action) {
      return _.chain($scope.extensionEntitlements)
        .filter(function (entry) {
          return action === 'add' && entry.entitlementState === 'ACTIVE';
        })
        .map(function (entry) {
          return new Feature(entry.entitlementName, entry.entitlementState);
        })
        .value();
    };

    $scope.updateUserLicense = function () {
      var users = [];
      if (_.get($scope, 'usrlist.length')) {
        users = $scope.usrlist;
      } else if ($scope.currentUser) {
        usersList = [];
        var userObj = {
          'address': $scope.currentUser.userName,
          'name': $scope.currentUser.name,
        };
        users.push(userObj);
        usersList.push(users);
      }
      $scope.btnSaveEntLoad = true;

      // make sure we have any internal extension and direct line set up for the users
      _.forEach(users, function (user) {
        user.internalExtension = _.get(user, 'assignedDn.pattern');
        if (user.externalNumber && user.externalNumber.uuid && user.externalNumber.uuid !== 'none') {
          user.directLine = user.externalNumber.pattern;
        }
      });

      Userservice.onboardUsers(users, null, getAccountLicenses('patch'))
        .then(successCallback)
        .catch(errorCallback);

      function successCallback(response) {
        // adapt response to call existing entitleUserCallback
        var rdata = response.data || {};
        rdata.success = true;
        $rootScope.$broadcast('Userservice::updateUsers');
        entitleUserCallback(rdata, response.status, 'updateUserLicense', response.headers);
      }

      function errorCallback(response) {
        var rdata = response || {};
        rdata.success = false;
        rdata.status = response.status || false;
        entitleUserCallback(rdata, response.status, 'updateUserLicense', response.headers);
      }

    };

    //****************MODAL INIT FUNCTION FOR INVITE AND ADD***************
    //***
    //***
    //*********************************************************************

    function Feature(name, state) {
      this.entitlementName = name;
      this.entitlementState = state ? 'ACTIVE' : 'INACTIVE';
      this.properties = {};
    }

    function LicenseFeature(name, bAdd) {
      return {
        id: name.toString(),
        idOperation: bAdd ? 'ADD' : 'REMOVE',
        properties: {},
      };
    }

    $scope.isAddEnabled = function () {
      return Authinfo.isAddUserEnabled();
    };

    $scope.isEntitleEnabled = function () {
      return Authinfo.isEntitleUserEnabled();
    };

    //email validation logic
    var validateEmail = function (input) {
      var emailregex = /\S+@\S+\.\S+/;
      var emailregexbrackets = /<\s*\S+@\S+\.\S+\s*>/;
      var emailregexquotes = /"\s*\S+@\S+\.\S+\s*"/;
      var valid = false;

      if (/[<>]/.test(input) && emailregexbrackets.test(input)) {
        valid = true;
      } else if (/["]/.test(input) && emailregexquotes.test(input)) {
        valid = true;
      } else if (!/[<>]/.test(input) && !/["]/.test(input) && emailregex.test(input)) {
        valid = true;
      }

      return valid;
    };

    var wizardNextText = function () {
      var userCount = angular.element('.token-label').length;
      var action = 'finish';
      if (userCount > 0) {
        $scope.currentUserCount = userCount;
        action = 'next';
      }
      $scope.$emit('wizardNextText', action);
    };

    $scope.invalidcount = 0;
    $scope.invalidDirSyncUsersCount = 0;
    $scope.tokenfieldid = "usersfield";
    $scope.tokenplaceholder = $translate.instant('usersPage.userInput');
    $scope.tokenoptions = {
      delimiter: [',', ';'],
      createTokensOnBlur: true,
    };
    var isDuplicate = false;

    $scope.isDirSyncEnabled = DirSyncService.isDirSyncEnabled();

    function setInvalidToken(token) {
      angular.element(token.relatedTarget).addClass('invalid');
      $scope.invalidcount++;
    }

    function validateDirSyncUser(e) {
      if ($scope.isDirSyncEnabled) {
        UserListService.queryUser(e.attrs.value)
          .catch(function () {
            setInvalidToken(e);
            sortTokens();
            $scope.invalidDirSyncUsersCount++;
          });
      }
    }

    $scope.getNumUsersInTokenField = function () {
      return angular.element('#usersfield').tokenfield('getTokens').length;
    };

    $scope.hasErrors = function () {
      var haserr = ($scope.invalidcount > 0);
      if ($scope.getNumUsersInTokenField() >= vm.maxUsersInManual) {
        haserr = true;
      }
      return haserr;
    };

    $scope.tokenmethods = {
      createtoken: function (e) {
        //Removing anything in brackets from user data
        var value = _.replace(e.attrs.value, /\s*\([^)]*\)\s*/g, ' ');
        e.attrs.value = value;
        isDuplicate = false;
        if (isEmailAlreadyPresent(e.attrs.value)) {
          isDuplicate = true;
        }
      },
      createdtoken: function (e) {
        if (!validateEmail(e.attrs.value) || isDuplicate) {
          setInvalidToken(e);
        } else {
          validateDirSyncUser(e);
        }
        sortTokens();
        wizardNextText();
        checkPlaceholder();
      },
      edittoken: function (e) {
        if (angular.element(e.relatedTarget).hasClass('invalid')) {
          $scope.invalidcount--;
        }
      },
      removedtoken: function () {
        // Reset the token list and validate all tokens
        $timeout(function () {
          $scope.invalidcount = 0;
          $scope.invalidDirSyncUsersCount = 0;
          angular.element('#usersfield').tokenfield('setTokens', $scope.model.userList);
        }).then(function () {
          sortTokens();
          wizardNextText();
          checkPlaceholder();
        });
      },
    };

    function isEmailAlreadyPresent(input) {
      var inputEmail = getEmailAddress(input).toLowerCase();
      if (inputEmail) {
        var userEmails = getTokenEmailArray();
        var userEmailsLower = [];
        for (var i = 0; i < userEmails.length; i++) {
          userEmailsLower[i] = userEmails[i].toLowerCase();
        }
        return userEmailsLower.indexOf(inputEmail) >= 0;
      } else {
        return false;
      }
    }

    function getTokenEmailArray() {
      var tokens = angular.element('#usersfield').tokenfield('getTokens');
      return tokens.map(function (token) {
        return getEmailAddress(token.value);
      });
    }

    function getEmailAddress(input) {
      var retString = "";
      input.split(" ").forEach(function (str) {
        if (str.indexOf("@") >= 0) {
          retString = str;
        }
      });
      return retString;
    }

    function removeEmailFromTokenfield(email) {
      $scope.model.userList = $scope.model.userList.split(', ').filter(function (token) {
        return token.indexOf(email) === -1;
      }).join(', ');
    }

    var setPlaceholder = function (placeholder) {
      angular.element('.tokenfield.form-control #usersfield-tokenfield').attr('placeholder', placeholder);
    };

    //placeholder logic
    function checkPlaceholder() {
      if (angular.element('.token-label').length > 0) {
        setPlaceholder('');
      } else {
        setPlaceholder($translate.instant('usersPage.userInput'));
      }
    }

    // sort the token list so that error tokens appear first in the list
    function sortTokens() {
      // this is just a sh*tty way of sorting this.  The only info we have
      // if a token has an error is if it has an 'invalid' class on the element.
      // the model.userList SHOULD contain this info, but it doesn't.  So,
      // in order to sort all of the invalid tokens to the front of the list,
      // we need to do this in the DOM directly. Thankfully, tokenfield doesn't
      // break when we do this.
      var start = $(angular.element('.tokenfield input[type=text]')[0]);
      if (start.length > 0) {

        var tokens = start.siblings('.token');
        tokens.sort(function (a, b) {
          var ainvalid = $(a).hasClass('invalid');
          var binvalid = $(b).hasClass('invalid');
          if (ainvalid && !binvalid) {
            return -1;
          } else if (!ainvalid && binvalid) {
            return 1;
          } else {
            return 0;
          }
        });

        tokens.detach().insertAfter(start);
      }
    }

    var getUsersList = function () {
      return addressparser.parse($scope.model.userList);
    };

    $scope.validateTokensBtn = function () {
      var usersListLength = angular.element('.token-label').length;
      $scope.validateTokens().then(function () {
        if ($scope.invalidcount === 0 && usersListLength > 0) {
          $scope.currentUserCount = usersListLength;
          Analytics.trackAddUsers(Analytics.sections.ADD_USERS.eventNames.MANUAL_EMAIL,
            Analytics.sections.ADD_USERS.uploadMethods.MANUAL, {
              emailEntryMethod: Analytics.sections.ADD_USERS.manualMethods[$scope.model.userInputOption.toString()],
            }
          );
          $state.go('users.add.services');
        } else if (usersListLength === 0) {
          Log.debug('No users entered.');
          Notification.error('usersPage.noUsersInput');
          Analytics.trackAddUsers(Analytics.sections.ADD_USERS.eventNames.MANUAL_EMAIL,
            Analytics.sections.ADD_USERS.uploadMethods.MANUAL, {
              emailEntryMethod: Analytics.sections.ADD_USERS.manualMethods[$scope.model.userInputOption.toString()],
              error: 'no users',
            }
          );
        } else {
          Log.debug('Invalid users entered.');
          Analytics.trackAddUsers(Analytics.sections.ADD_USERS.eventNames.MANUAL_EMAIL,
            Analytics.sections.ADD_USERS.uploadMethods.MANUAL, {
              emailEntryMethod: Analytics.sections.ADD_USERS.manualMethods[$scope.model.userInputOption.toString()],
              error: 'invalid users',
            }
          );
          Notification.error('usersPage.validEmailInput');
        }
      });
    };

    $scope.allowNext = function () {
      return ($scope.model.userList && !$scope.hasErrors());
    };

    $scope.validateTokens = function () {
      wizardNextText();
      return $timeout(function () {
        //reset the invalid count
        $scope.invalidcount = 0;
        angular.element('#usersfield').tokenfield('setTokens', $scope.model.userList);
      }, 100);
    };

    $scope.addToUsersfield = function () {
      if ($scope.model.userForm.$valid && $scope.model.userInfoValid) {
        var userInfo = $scope.model.firstName + NAME_DELIMITER + $scope.model.lastName + ' ' + $scope.model.emailAddress;
        angular.element('#usersfield').tokenfield('createToken', userInfo);
        clearNameAndEmailFields();
        angular.element('#firstName').focus();
      }
    };

    $scope.validateEmailField = function () {
      if ($scope.model.emailAddress) {
        $scope.model.userInfoValid = validateEmail($scope.model.emailAddress);
      } else {
        $scope.model.userInfoValid = false;
      }
    };

    $scope.onEnterKey = function (keyEvent) {
      if (keyEvent.which === 13) {
        $scope.addToUsersfield();
      }
    };

    var resetUsersfield = function () {
      angular.element('#usersfield').tokenfield('setTokens', ' ');
      $scope.model.userList = '';
      checkPlaceholder();
      $scope.invalidcount = 0;
      $scope.invalidDirSyncUsersCount = 0;
    };

    $scope.clearPanel = function () {
      resetUsersfield();
      initResults();
    };

    function onboardUsers(optionalOnboard) {
      var deferred = $q.defer();
      initResults();
      usersList = getUsersList();
      Log.debug('Entitlements: ', usersList);

      var successCallback = function (response) {
        Log.info('User onboard request returned:', response.data);
        $rootScope.$broadcast('USER_LIST_UPDATED');
        $scope.numAddedUsers = 0;
        $scope.numUpdatedUsers = 0;
        _.forEach(response.data.userResponse, function (user) {
          var userResult = {
            email: user.email,
            alertType: null,
          };

          var httpStatus = user.httpStatus;

          switch (httpStatus) {
            case 200:
            case 201: {
              userResult.message = $translate.instant('usersPage.onboardSuccess', {
                email: userResult.email,
              });
              userResult.alertType = 'success';
              if (httpStatus === 200) {
                $scope.numUpdatedUsers++;
              } else {
                $scope.numAddedUsers++;
              }
              if (user.message === '700000') {
                userResult.message = $translate.instant('usersPage.onboardedWithoutLicense', {
                  email: userResult.email,
                });
                userResult.alertType = 'warning';
              }
              break;
            }
            case 409: {
              userResult.message = userResult.email + ' ' + user.message;
              break;
            }
            case 403: {
              switch (user.message) {
                case Config.messageErrors.userExistsError: {
                  userResult.message = $translate.instant('usersPage.userExistsError', {
                    email: userResult.email,
                  });
                  break;
                }
                case Config.messageErrors.userPatchError:
                case Config.messageErrors.claimedDomainError: {
                  userResult.message = $translate.instant('usersPage.claimedDomainError', {
                    email: userResult.email,
                    domain: userResult.email.split('@')[1],
                  });
                  break;
                }
                case Config.messageErrors.userExistsInDiffOrgError: {
                  userResult.message = $translate.instant('usersPage.userExistsInDiffOrgError', {
                    email: userResult.email,
                  });
                  break;
                }
                case Config.messageErrors.notSetupForManUserAddError: {
                  userResult.message = $translate.instant('usersPage.notSetupForManUserAddError', {
                    email: userResult.email,
                  });
                  break;
                }
                case Config.messageErrors.userExistsDomainClaimError: {
                  userResult.message = $translate.instant('usersPage.userExistsDomainClaimError', {
                    email: userResult.email,
                  });
                  break;
                }
                case Config.messageErrors.unknownCreateUserError: {
                  userResult.message = $translate.instant('usersPage.unknownCreateUserError');
                  break;
                }
                case Config.messageErrors.unableToMigrateError: {
                  userResult.message = $translate.instant('usersPage.unableToMigrateError', {
                    email: userResult.email,
                  });
                  break;
                }
                case Config.messageErrors.insufficientEntitlementsError: {
                  userResult.message = $translate.instant('usersPage.insufficientEntitlementsError', {
                    email: userResult.email,
                  });
                  break;
                }
                default: {
                  userResult.message = $translate.instant('usersPage.accessDeniedError', {
                    email: userResult.email,
                  });
                  break;
                }
              }
              break;
            }
            case 400: {
              switch (user.message) {
                case Config.messageErrors.hybridServicesError: {
                  userResult.message = $translate.instant('usersPage.hybridServicesError');
                  break;
                }
                case Config.messageErrors.hybridServicesComboError: {
                  userResult.message = $translate.instant('usersPage.hybridServicesComboError');
                  break;
                }
                default: {
                  userResult.message = $translate.instant('usersPage.onboardError', {
                    email: userResult.email,
                    status: httpStatus,
                  });
                  break;
                }
              }
              break;
            }
            default: {
              userResult.message = $translate.instant('usersPage.onboardError', {
                email: userResult.email,
                status: httpStatus,
              });
              break;
            }
          }

          if (httpStatus !== 200 && httpStatus !== 201) {
            userResult.alertType = 'danger';
          }

          $scope.results.resultList.push(userResult);

        });

        if ($scope.numAddedUsers > 0) {
          var msg = 'Invited ' + $scope.numAddedUsers + ' users';
          LogMetricsService.logMetrics(msg, LogMetricsService.getEventType('inviteUsers'), LogMetricsService.getEventAction('buttonClick'), 200, moment(), $scope.numAddedUsers, null);
        }

        //concatenating the results in an array of strings for notify function
        $scope.results.errors = [];
        $scope.results.warnings = [];
        for (var idx in $scope.results.resultList) {
          if ($scope.results.resultList[idx].alertType === 'success' && $scope.results.resultList[idx].email) {
            removeEmailFromTokenfield($scope.results.resultList[idx].email);
          } else if ($scope.results.resultList[idx].alertType === 'warning' && $scope.results.resultList[idx].email) {
            $scope.results.warnings.push(UserCsvService.addErrorWithTrackingID($scope.results.resultList[idx].message, response));
          } else {
            $scope.results.errors.push(UserCsvService.addErrorWithTrackingID($scope.results.resultList[idx].message, response));
          }
        }

        $scope.skipErrorsOrFinish = function () {
          if ($scope.results.errors.length > 0) {
            return 'usersPage.skipErrorsAndFinish';
          } else {
            return 'common.finish';
          }
        };

        $scope.goToUsersPage = function () {
          $previousState.forget('modalMemo');
          Analytics.trackAddUsers(Analytics.sections.ADD_USERS.eventNames.FINISH, null, createPropertiesForAnalyltics());
          $state.go('users.list');
        };

        $scope.fixBulkErrors = function () {
          if (isFTW) {
            $scope.wizard.goToStep('manualEntry');
          } else {
            Analytics.trackAddUsers(Analytics.sections.ADD_USERS.eventNames.GO_BACK_FIX, null, createPropertiesForAnalyltics());
            $state.go('users.add');
          }
        };

        //Displaying notifications
        if ($scope.results.resultList.length === usersList.length) {
          $scope.btnOnboardLoading = false;
          if (isFTW) {
            deferred.resolve();
          } else {
            Analytics.trackAddUsers(Analytics.eventNames.SAVE, null, createPropertiesForAnalyltics());
            $state.go('users.add.results');
          }
        }


      };

      var errorCallback = function (response) {
        Notification.errorResponse(response);
        $scope.btnOnboardLoading = false;
        deferred.reject();
      };

      if (_.isArray(usersList) && usersList.length > 0) {
        $scope.btnOnboardLoading = true;

        _.each(usersList, function (userItem) {
          var userAndDnObj = $scope.usrlist.filter(function (user) {
            return (user.address == userItem.address);
          });

          if (userAndDnObj[0].assignedDn && userAndDnObj[0].assignedDn.pattern.length > 0) {
            userItem.internalExtension = userAndDnObj[0].assignedDn.pattern;
          }
          if (userAndDnObj[0].externalNumber && userAndDnObj[0].externalNumber.uuid !== 'none') {
            userItem.directLine = userAndDnObj[0].externalNumber.pattern;
          }
        });

        var tempUserArray = [],
          entitleList = [],
          licenseList = [],
          chunk = Config.batchSize;
        if (Authinfo.hasAccount() && $scope.collabRadio === 1) {
          licenseList = getAccountLicenses('additive');
        } else {
          entitleList = getEntitlements('add');
        }
        entitleList = entitleList.concat(getExtensionEntitlements('add'));

        for (var i = 0; i < usersList.length; i += chunk) {
          tempUserArray = usersList.slice(i, i + chunk);
          Userservice.onboardUsers(tempUserArray, entitleList, licenseList)
            .then(successCallback)
            .catch(errorCallback);
        }
      } else if (!optionalOnboard) {
        Notification.error('usersPage.validEmailInput');
        deferred.reject();
      } else {
        deferred.resolve();
      }
      return deferred.promise;
    }

    $scope.extensionEntitlements = [];
    $scope.updateExtensionEntitlements = function (entitlements) {
      $scope.hybridCallServiceAware = _.some(entitlements, {
        entitlementName: 'squaredFusionUC',
        entitlementState: 'ACTIVE',
      });
      $scope.extensionEntitlements = entitlements;
    };

    function entitleUserCallback(data, status, method, headers) {
      initResults();
      $scope.numAddedUsers = 0;
      $scope.numUpdatedUsers = 0;
      var isComplete = true;

      $rootScope.$broadcast('USER_LIST_UPDATED');
      if (data.success) {
        Log.info('User successfully updated', data);

        var userResponseArray = _.get(data, 'userResponse');
        _.forEach(userResponseArray, function (userResponseItem) {
          var userResult = {
            email: userResponseItem.email,
            alertType: null,
          };

          var httpStatus = userResponseItem.status;

          switch (httpStatus) {
            case 200:
            case 201: {
              userResult.message = $translate.instant('onboardModal.result.200');
              userResult.alertType = 'success';
              if (httpStatus === 200) {
                $scope.numUpdatedUsers++;
              } else if (httpStatus === 201) {
                $scope.numAddedUsers++;
              }
              break;
            }
            case 404: {
              userResult.message = $translate.instant('onboardModal.result.404');
              userResult.alertType = 'danger';
              isComplete = false;
              break;
            }
            case 409: {
              userResult.message = $translate.instant('onboardModal.result.409');
              userResult.alertType = 'danger';
              isComplete = false;
              break;
            }
            default: {
              if (userResponseItem.message === Config.messageErrors.hybridServicesComboError) {
                userResult.message = $translate.instant('onboardModal.result.400094', {
                  status: httpStatus,
                });
                userResult.alertType = 'danger';
                isComplete = false;
              } else if (_.includes(userResponseItem.message, 'DN_IS_FALLBACK')) {
                userResult.message = $translate.instant('onboardModal.result.deleteUserDnFallbackError');
                userResult.alertType = 'danger';
                isComplete = false;
              } else {
                userResult.message = $translate.instant('onboardModal.result.other', {
                  status: httpStatus,
                });
                userResult.alertType = 'danger';
                isComplete = false;
              }
              break;
            }
          }

          $scope.results.resultList.push(userResult);
          if (method !== 'convertUser') {
            $scope.$dismiss();
          }
        });


        for (var idx in $scope.results.resultList) {
          if ($scope.results.resultList[idx].alertType !== 'success') {
            $scope.results.errors.push(UserCsvService.addErrorWithTrackingID($scope.results.resultList[idx].email + ' ' + $scope.results.resultList[idx].message, null, headers));
          }
        }

        //Displaying notifications
        if (method !== 'convertUser') {
          if ($scope.results.errors.length) {
            $scope.btnOnboardLoading = false;
            $scope.btnSaveEntLoad = false;
            Notification.notify($scope.results.errors, 'error');
          }
        }

      } else {
        Log.warn('Could not entitle the user', data);
        var error = null;
        if (status) {
          error = $translate.instant('errors.statusError', {
            status: status,
          });
          if (data && _.isString(data.message)) {
            error += ' ' + $translate.instant('usersPage.messageError', {
              message: data.message,
            });
          }
        } else {
          error = 'Request failed.';
          if (_.isString(data)) {
            error += ' ' + data;
          }
        }
        error = UserCsvService.addErrorWithTrackingID(error, null, headers);
        if (method !== 'convertUser') {
          Notification.notify([error], 'error');
          isComplete = false;
          $scope.btnOnboardLoading = false;
          $scope.btnSaveEntLoad = false;
        } else {
          $scope.results.errors.push(error);
        }
      }

      if (method !== 'convertUser') {
        if (isComplete) {
          resetUsersfield();
        }
      } else {
        if ($scope.convertSelectedList.length > 0 && convertCancelled === false && convertBacked === false) {
          convertUsersInBatch();
        } else {
          if (convertBacked === false) {
            $scope.btnConvertLoad = false;
            $state.go('users.convert.results');
          } else {
            $state.go('users.convert', {});
          }
          var msg = 'Migrated ' + $scope.numUpdatedUsers + ' users';
          var migratedata = {
            totalUsers: convertUsersCount,
            successfullyConverted: $scope.numUpdatedUsers,
          };
          LogMetricsService.logMetrics(msg, LogMetricsService.getEventType('convertUsers'), LogMetricsService.getEventAction('buttonClick'), 200, convertStartTime, $scope.numUpdatedUsers, migratedata);
        }
      }

    }

    //radio group
    $scope.entitlements = {};
    var setEntitlementList = function () {
      if (_.isArray($rootScope.services)) {
        for (var i = 0; i < $rootScope.services.length; i++) {
          var svc = $rootScope.services[i].serviceId;

          $scope.entitlements[svc] = false;
          if (svc === 'webExSquared') {
            $scope.entitlements[svc] = true;
          }
        }
      }
      $scope.entitlementsKeys = Object.keys($scope.entitlements).sort().reverse();
    };

    $scope.$on('AuthinfoUpdated', function () {
      if (_.isArray($rootScope.services) && $rootScope.services.length === 0) {
        $rootScope.services = Authinfo.getServices();
      }
      setEntitlementList();
    });

    // Wizard hook for next button
    $scope.manualEntryNext = function () {
      isFTW = true;
      var deferred = $q.defer();

      if (getUsersList().length === 0) {
        $q.resolve($scope.wizard.nextTab()).then(function () {
          deferred.reject();
        });
      } else {
        if ($scope.invalidcount === 0) {
          deferred.resolve();
        } else {
          Notification.error('usersPage.validEmailInput');
          deferred.reject();
        }
      }
      return deferred.promise;
    };

    // Wizard hook for save button
    $scope.assignServicesNext = function () {
      var deferred = $q.defer();

      if (shouldAddCallService()) {
        $scope.processing = true;
        activateDID();
        deferred.resolve();
      } else {
        onboardUsers(true).then(function () {
          deferred.reject(); // prevent the wizard from going forward
          $scope.wizard.goToStep('addUsersResults');
        });
      }
      return deferred.promise;
    };

    $scope.getServicesNextText = function () {
      if (shouldAddCallService()) {
        return 'common.next';
      } else {
        return 'common.save';
      }
    };

    // Wizard hook for modal save button
    $scope.assignDnAndDirectLinesNext = function () {
      var deferred = $q.defer();
      var didDnDupes = checkDidDnDupes();
      // check for DiD duplicates
      if (didDnDupes.didDupe) {
        Log.debug('Duplicate Direct Line entered.');
        Notification.error('usersPage.duplicateDidFound');
        deferred.reject();
        return deferred.promise;
      }
      // check for Dn duplicates
      if (didDnDupes.dnDupe) {
        Log.debug('Duplicate Internal Extension entered.');
        Notification.error('usersPage.duplicateDnFound');
        deferred.reject();
        return deferred.promise;
      }
      return onboardUsers(true);
    };

    $scope.isServiceAllowed = function (service) {
      return Authinfo.isServiceAllowed(service);
    };

    $scope.getServiceName = function (service) {
      for (var i = 0; i < _.get($rootScope, 'services', []).length; i++) {
        var svc = $rootScope.services[i];
        if (svc.serviceId === service) {
          return svc.displayName;
        }
      }
    };

    $scope.shouldAddIndent = function (key, reference) {
      return key !== reference;
    };

    var watchCheckboxes = function () {
      $timeout(function () { });
      var flag = false;
      $scope.$watchCollection('entitlements', function (newEntitlements, oldEntitlements) {
        if (flag) {
          flag = false;
          return;
        }
        var changedKey = Utils.changedKey(newEntitlements, oldEntitlements);
        if (changedKey === 'webExSquared' && !newEntitlements.webExSquared && Utils.areEntitlementsActive($scope.entitlements)) {
          for (var key in $scope.entitlements) {
            if (key !== 'webExSquared') {
              $scope.entitlements[key] = false;
              flag = true;
            }
          }
          $scope.saveDisabled = false;
        } else if (!$scope.entitlements.webExSquared && !oldEntitlements[changedKey] && changedKey !== 'webExSquared') {
          $scope.entitlements.webExSquared = true;
          $scope.saveDisabled = false;
        } else if (newEntitlements !== oldEntitlements) {
          $scope.saveDisabled = false;
        }

        if (changedKey === 'ciscoUC' && newEntitlements[changedKey]) {
          $scope.$emit('wizardNextText', 'next');
        } else if (changedKey === 'ciscoUC') {
          $scope.$emit('wizardNextText', 'finish');
        }

      });
    };

    //set intitially when loading the page
    //on initial login the AuthinfoUpdated broadcast may not be caught if not on user page
    setEntitlementList();
    watchCheckboxes();

    $scope.cancelConvert = function () {
      if (convertPending === true) {
        convertCancelled = true;
      } else {
        $scope.$dismiss();
      }
    };

    $scope.goToConvertUsers = function () {
      if (convertPending === true) {
        convertBacked = true;
      } else {
        $state.go('users.convert', {});
      }
    };

    $scope.assignDNForConvertUsers = function () {
      var didDnDupes = checkDidDnDupes();
      // check for DiD duplicates
      if (didDnDupes.didDupe) {
        Log.debug('Duplicate Direct Line entered.');
        Notification.error('usersPage.duplicateDidFound');
        return;
      }
      // check for Dn duplicates
      if (didDnDupes.dnDupe) {
        Log.debug('Duplicate Internal Extension entered.');
        Notification.error('usersPage.duplicateDnFound');
        return;
      }

      // copy numbers to convertSelectedList
      _.forEach($scope.usrlist, function (user) {
        var userArray = $scope.convertSelectedList.filter(function (selectedUser) {
          return user.address === selectedUser.userName;
        });
        userArray[0].assignedDn = user.assignedDn;
        userArray[0].externalNumber = user.externalNumber;
      });

      return $scope.convertUsers();
    };

    $scope.saveConvertList = function () {
      $scope.selectedState = $scope.gridApi.saveState.save();
      $scope.convertSelectedList = $scope.gridApi.selection.getSelectedRows();
      convertUsersCount = $scope.convertSelectedList.length;
      $scope.convertUsersFlow = true;
      convertPending = false;
      $state.go('users.convert.services', {});
    };

    $scope.convertUsersNext = function () {
      if (shouldAddCallService()) {
        $scope.processing = true;
        // Copying selected users to user list
        $scope.usrlist = [];
        _.forEach($scope.convertSelectedList, function (selectedUser) {
          var user = {};
          var givenName = "";
          var familyName = "";
          if (!_.isUndefined(selectedUser.name)) {
            if (!_.isUndefined(selectedUser.name.givenName)) {
              givenName = selectedUser.name.givenName;
            }
            if (!_.isUndefined(selectedUser.name.familyName)) {
              familyName = selectedUser.name.familyName;
            }
          }
          if (!_.isUndefined(givenName) || !_.isUndefined(familyName)) {
            user.name = givenName + ' ' + familyName;
          }
          user.address = selectedUser.userName;
          $scope.usrlist.push(user);
        });
        activateDID();
        $state.go('users.convert.services.dn');
      } else {
        $scope.convertUsers();
      }
    };

    $scope.convertUsers = function () {
      $scope.btnConvertLoad = true;
      convertPending = true;
      convertCancelled = false;
      convertBacked = false;
      $scope.numAddedUsers = 0;
      $scope.numUpdatedUsers = 0;
      convertStartTime = moment();
      convertUsersInBatch();
    };

    function convertUsersInBatch() {
      var batch = $scope.convertSelectedList.slice(0, Config.batchSize);
      $scope.convertSelectedList = $scope.convertSelectedList.slice(Config.batchSize);
      Userservice.migrateUsers(batch, function (data) {
        var successMovedUsers = [];
        var match = function (batchObj) {
          return user.address === batchObj.userName;
        };
        for (var i = 0; i < data.userResponse.length; i++) {
          if (data.userResponse[i].status !== 200) {
            $scope.results.errors.push(data.userResponse[i].email + $translate.instant('homePage.convertError'));
          } else {
            var user = {
              'address': data.userResponse[i].email,
            };
            var userArray = batch.filter(match);
            user.assignedDn = userArray[0].assignedDn;
            user.externalNumber = userArray[0].externalNumber;
            successMovedUsers.push(user);
          }
        }

        if (successMovedUsers.length > 0) {
          var entitleList = [];
          var licenseList = [];
          if (Authinfo.hasAccount() && $scope.collabRadio === 1) {
            licenseList = getAccountLicenses('patch');
          } else {
            entitleList = getEntitlements('add');
          }
          entitleList = entitleList.concat(getExtensionEntitlements('add'));
          convertPending = false;
          Userservice.updateUsers(successMovedUsers, licenseList, entitleList, 'convertUser', entitleUserCallback);
        } else {
          if ($scope.convertSelectedList.length > 0 && convertCancelled === false && convertBacked === false) {
            convertUsersInBatch();
          } else {
            convertPending = false;
            if (convertBacked === false) {
              $scope.btnConvertLoad = false;
              $state.go('users.convert.results');
            } else {
              $state.go('users.convert', {});
            }
            var msg = 'Migrated ' + $scope.numUpdatedUsers + ' users';
            var migratedata = {
              totalUsers: convertUsersCount,
              successfullyConverted: $scope.numUpdatedUsers,
            };
            LogMetricsService.logMetrics(msg, LogMetricsService.getEventType('convertUsers'), LogMetricsService.getEventAction('buttonClick'), 200, convertStartTime, $scope.numUpdatedUsers, migratedata);
          }
        }
      });
    }

    var getUnlicensedUsers = function () {
      $scope.showSearch = false;
      Orgservice.getUnlicensedUsers(function (data) {
        $scope.unlicensed = 0;
        $scope.unlicensedUsersList = null;
        $scope.showSearch = true;
        if (data.success) {
          if (data.totalResults) {
            $scope.unlicensed = data.totalResults;
            $scope.unlicensedUsersList = data.resources;
          }
        }
      }, null, $scope.searchStr);
    };

    $scope.convertDisabled = function () {
      return $scope.gridApi.selection.getSelectedRows().length === 0;
    };

    getUnlicensedUsers();

    $scope.convertGridOptions = {
      data: 'unlicensedUsersList',
      rowHeight: 45,
      enableHorizontalScrollbar: 0,
      selectionRowHeaderWidth: 50,
      enableRowHeaderSelection: true,
      enableFullRowSelection: true,
      useExternalSorting: false,
      enableColumnMenus: false,
      showFilter: false,
      saveSelection: true,
      onRegisterApi: function (gridApi) {
        $scope.gridApi = gridApi;
        if ($scope.selectedState) {
          $timeout(function () {
            gridApi.saveState.restore($scope, $scope.selectedState);
          }, 100);
        }
      },
      columnDefs: [{

        field: 'displayName',
        displayName: $translate.instant('usersPage.displayNameHeader'),
        resizable: false,
        sortable: true,
        minWidth: 449,
        maxWidth: 449,
      }, {
        field: 'userName',
        displayName: $translate.instant('homePage.emailAddress'),
        resizable: false,
        sort: {
          direction: 'desc',
          priority: 0,
          minWidth: 449,
          maxWidth: 449,
        },
        sortCellFiltered: true,
      }],
    };

    /////////////////////////////////
    // DirSync Bulk Onboarding logic
    var userArray = [];
    var cancelDeferred;
    var saveDeferred;
    $scope.initBulkMetric = initBulkMetric;
    $scope.sendBulkMetric = sendBulkMetric;

    var bulkStartLog = moment();

    function initBulkMetric() {
      bulkStartLog = moment();
    }

    function sendBulkMetric() {
      var eType = LogMetricsService.getEventType('bulkCsvUsers');
      var currentStepName = _.get($scope, 'wizard.current.step.name', 'csvResult');
      if (currentStepName === 'dirsyncResult') {
        eType = LogMetricsService.getEventType('bulkDirSyncUsers');
      }
      var data = {
        'newUsersCount': $scope.model.numNewUsers || 0,
        'updatedUsersCount': $scope.model.numExistingUsers || 0,
        'errorUsersCount': _.isArray($scope.model.userErrorArray) ? $scope.model.userErrorArray.length : 0,
      };
      LogMetricsService.logMetrics('Finished bulk processing', eType, LogMetricsService.getEventAction('buttonClick'), 200, bulkStartLog, 1, data);
    }

    $scope.cancelProcessCsv = function () {
      cancelDeferred.resolve();
      saveDeferred.resolve();
    };

    /////////////////////////////////
    // Bulk DirSync Onboarding logic
    // Wizard hooks
    $scope.installConnectorNext = function () {
      return DirSyncService.refreshStatus().then(function () {
        return $q(function (resolve, reject) {
          if (DirSyncService.isDirSyncEnabled()) {
            // getStatus() is in the parent scope - AddUserCtrl
            if (_.isFunction($scope.getStatus)) {
              return $scope.getStatus().then(function () {
                resolve();
              });
            } else {
              reject();
            }
          } else {
            $scope.dirsyncStatus = $translate.instant('firstTimeWizard.syncNotConfigured');
            $scope.numUsersInSync = '';
            $scope.dirsyncUserCountText = '';
            resolve();
          }
        });
      });
    };

    $scope.syncStatusNext = function () {
      return $q(function (resolve, reject) {
        if (!$scope.wizard.isLastStep()) {
          userArray = [];
          if ($scope.userList && $scope.userList.length > 0) {
            userArray = $scope.userList.map(function (user) {
              return user.Email;
            });
          }
          if (userArray.length === 0) {
            Notification.error('firstTimeWizard.uploadDirSyncEmpty');
            reject();
          } else {
            $scope.model.numMaxUsers = userArray.length;
            resolve();
          }
        } else {
          resolve();
        }
      });
    };

    // hack to allow adding services when exiting the users.manage.advanced.add.ob.syncStatus state
    $scope.dirsyncInitForServices = function () {
      userArray = [];
      if ($scope.userList && $scope.userList.length > 0) {
        userArray = $scope.userList.map(function (user) {
          return user.Email;
        });
      }

      if (userArray.length === 0) {
        Notification.error('firstTimeWizard.uploadDirSyncEmpty');
      } else {
        $scope.model.numMaxUsers = userArray.length;
      }
    };

    $scope.dirsyncProcessingNext = bulkSave;

    function bulkSave() {
      saveDeferred = $q.defer();
      cancelDeferred = $q.defer();

      $scope.model.userErrorArray = [];
      $scope.model.numMaxUsers = userArray.length;
      $scope.model.processProgress = $scope.model.numTotalUsers = $scope.model.numNewUsers = $scope.model.numExistingUsers = 0;
      $scope.model.isProcessing = true;
      $scope.model.cancelProcessCsv = $scope.cancelProcessCsv;

      function addUserError(row, email, errorMsg) {
        $scope.model.userErrorArray.push({
          row: row,
          email: email,
          error: errorMsg,
        });
        UserCsvService.setCsvStat({
          userErrorArray: [{
            row: row,
            email: email,
            error: errorMsg,
          }],
        });
      }

      function addUserErrorWithTrackingID(row, errorMsg, response, email) {
        errorMsg = UserCsvService.addErrorWithTrackingID(errorMsg, response);
        addUserError(row, (email || ''), _.trim(errorMsg));
      }

      function successCallback(response, startIndex, length) {
        if (_.isArray(response.data.userResponse)) {
          var addedUsersList = [];

          _.forEach(response.data.userResponse, function (user, index) {
            if (user.httpStatus === 200 || user.httpStatus === 201) {
              if (user.httpStatus === 200) {
                $scope.model.numExistingUsers++;
              } else {
                $scope.model.numNewUsers++;
              }
              // Build list of successful onboards and patches
              var addItem = {
                address: user.email,
              };
              if (addItem.address.length > 0) {
                addedUsersList.push(addItem);
              }
            } else {
              addUserErrorWithTrackingID(startIndex + index + 1, UserCsvService.getBulkErrorResponse(user.httpStatus, user.message, user.email), response, user.email);
            }
          });
        } else {
          for (var i = 0; i < length; i++) {
            addUserErrorWithTrackingID(startIndex + i + 1, $translate.instant('firstTimeWizard.processBulkResponseError'), response);
          }
        }
      }

      function errorCallback(response, startIndex, length) {
        for (var k = 0; k < length; k++) {
          var email = (response.config && response.config.data && _.isArray(response.config.data.users) ? response.config.data.users[k].email : null);
          var responseMessage = UserCsvService.getBulkErrorResponse(response.status, null, email);
          addUserErrorWithTrackingID(startIndex + k + 1, responseMessage, response, email);
        }
      }

      // Get license/entitlements
      var entitleList = [];
      var licenseList = [];
      var isCommunicationSelected;
      if (Authinfo.hasAccount() && $scope.collabRadio === 1) {
        licenseList = getAccountLicenses('additive') || [];
        isCommunicationSelected = !!_.find(licenseList, function (license) {
          return _.startsWith(license.id, 'CO_');
        });
      } else {
        entitleList = getEntitlements('add');
        isCommunicationSelected = !!_.find(entitleList, {
          entitlementName: 'ciscoUC',
        });
      }
      entitleList = entitleList.concat(getExtensionEntitlements('add'));

      function onboardCsvUsers(startIndex, userArray, entitlementArray, licenseArray, csvPromise) {
        return csvPromise.then(function () {
          return $q(function (resolve) {
            if (userArray.length > 0) {
              Userservice.onboardUsers(userArray, entitlementArray, licenseArray, cancelDeferred.promise).then(function (response) {
                successCallback(response, (startIndex - userArray.length) + 1, userArray.length);
              }).catch(function (response) {
                errorCallback(response, (startIndex - userArray.length) + 1, userArray.length);
              }).finally(function () {
                calculateProcessProgress();
                resolve();
              });
            } else {
              resolve();
            }
          });
        });
      }

      function calculateProcessProgress() {
        $scope.model.numTotalUsers = $scope.model.numNewUsers + $scope.model.numExistingUsers + $scope.model.userErrorArray.length;
        $scope.model.processProgress = Math.round(($scope.model.numTotalUsers / userArray.length) * 100);
        $scope.model.importCompletedAt = Date.now();

        if ($scope.model.numTotalUsers >= userArray.length) {
          $scope.model.userErrorArray.sort(function (a, b) {
            return a.row - b.row;
          });
          $rootScope.$broadcast('USER_LIST_UPDATED');
          saveDeferred.resolve();
          $scope.model.isProcessing = false;
          $scope.$broadcast('timer-stop');
        }
      }

      // Onboard users in chunks
      // Separate chunks on invalid rows
      var csvChunk = isCommunicationSelected ? 2 : 10; // Rate limit for Huron
      var csvPromise = $q.resolve();
      var tempUserArray = [];
      var uniqueEmails = [];
      var processingError;
      _.forEach(userArray, function (userEmail, j) {
        processingError = false;
        // If we haven't met the chunk size, process the next user
        if (tempUserArray.length < csvChunk) {
          // Validate content in the row
          if (_.includes(uniqueEmails, userEmail)) {
            // Report a duplicate email
            processingError = true;
            addUserError(j + 1, $translate.instant('firstTimeWizard.csvDuplicateEmail'));
          } else {
            uniqueEmails.push(userEmail);
            tempUserArray.push({
              address: userEmail,
              name: NAME_DELIMITER,
              displayName: '',
              internalExtension: '',
              directLine: '',
            });
          }
        }
        // Onboard all the previous users in the temp array if there was an error processing a row
        if (processingError) {
          csvPromise = onboardCsvUsers(j - 1, tempUserArray, entitleList, licenseList, csvPromise);
          tempUserArray = [];
        } else if (tempUserArray.length === csvChunk || j === (userArray.length - 1)) {
          // Onboard the current temp array if we've met the chunk size or is the last user in list
          csvPromise = onboardCsvUsers(j, tempUserArray, entitleList, licenseList, csvPromise);
          tempUserArray = [];
        }
      });

      calculateProcessProgress();

      return saveDeferred.promise;
    }

    function cancelModal() {
      Analytics.trackAddUsers(Analytics.eventNames.CANCEL_MODAL);
      $state.modal.dismiss();
    }

    function controlCare() {
      if ($scope.radioStates.msgRadio) {
        $scope.enableCareService = true;
      } else {
        $scope.enableCareService = false;
        $scope.radioStates.careRadio = false;
      }
    }

  }
})();
