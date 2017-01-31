(function () {
  'use strict';

  angular.module('core.trial')
    .controller('TrialAddCtrl', TrialAddCtrl);

  /* @ngInject */
  function TrialAddCtrl($q, $scope, $state, $translate, $window, Analytics, Config, FeatureToggleService, HuronCountryService, HuronCustomer, Notification, TrialContextService, TrialPstnService, TrialService, ValidationService, Orgservice) {
    var vm = this;
    var _roomSystemDefaultQuantity = 5;
    var _careDefaultQuantity = 15;
    var _licenseCountDefaultQuantity = 0;
    var messageTemplateOptionId = 'messageTrial';
    var meetingTemplateOptionId = 'meetingTrial';
    var webexTemplateOptionId = 'webexTrial';
    var callTemplateOptionId = 'callTrial';
    var roomSystemsTemplateOptionId = 'roomSystemsTrial';
    var sparkBoardTemplateOptionId = 'sparkBoardTrial';
    var debounceTimeout = 2000;

    vm.trialData = TrialService.getData();
    $scope.trialData = vm.trialData;
    vm.uniqueName = false;
    vm.uniqueEmail = false;
    vm.customerOrgId = undefined;
    vm.showRoomSystems = false;
    vm.showCare = false;
    vm.details = vm.trialData.details;
    vm.messageTrial = vm.trialData.trials.messageTrial;
    vm.meetingTrial = vm.trialData.trials.meetingTrial;
    vm.webexTrial = vm.trialData.trials.webexTrial;
    vm.callTrial = vm.trialData.trials.callTrial;
    vm.careTrial = vm.trialData.trials.careTrial;
    vm.roomSystemTrial = vm.trialData.trials.roomSystemTrial;
    vm.sparkBoardTrial = vm.trialData.trials.sparkBoardTrial;
    vm.pstnTrial = vm.trialData.trials.pstnTrial;
    vm.contextTrial = vm.trialData.trials.contextTrial;
    _licenseCountDefaultQuantity = vm.trialData.details.licenseCount;
    vm.trialStates = [{
      name: 'trialAdd.webex',
      trials: [vm.webexTrial],
      enabled: true,
    }, {
      name: 'trialAdd.call',
      trials: [vm.callTrial, vm.roomSystemTrial],
      enabled: true,
    }, {
      name: 'trialAdd.pstn',
      trials: [vm.pstnTrial],
      enabled: true,
    }, {
      name: 'trialAdd.emergAddress',
      trials: [vm.pstnTrial],
      enabled: true,
    }];
    // Navigate trial modal in this order
    vm.navOrder = ['trialAdd.info', 'trialAdd.webex', 'trialAdd.pstn', 'trialAdd.emergAddress', 'trialAdd.call'];
    vm.navStates = ['trialAdd.info'];
    vm.startTrial = startTrial;
    vm.setDeviceModal = setDeviceModal;
    vm.devicesModal = _.find(vm.trialStates, {
      name: 'trialAdd.call'
    });
    vm.setDefaultCountry = setDefaultCountry;

    function validateField($viewValue, scope, key, uniqueFlag, errorMsg) {
      // Show loading glyph
      vm.loading = true;
      vm[errorMsg] = null;

      // Fetch list of trials based on email in edit box...
      return TrialService.shallowValidation(key, $viewValue).then(function (response) {
        vm.loading = false;
        if (!_.isUndefined(response.unique)) {
          // name unique
          vm[uniqueFlag] = true;
          return true;
        }

        // Name in use, or API call failed
        vm[errorMsg] = response.error;
        scope.options.validation.show = true;
        return false;
      });
    }

    function errorMessage(key) {
      if (_.isUndefined(vm[key]) || vm[key] === '') {
        vm[key] = 'trialModal.errorFailSafe';
      }
      return $translate.instant(vm[key]);
    }

    vm.custInfoFields = [{
      model: vm.details,
      key: 'customerName',
      type: 'cs-input',
      templateOptions: {
        label: $translate.instant('partnerHomePage.customerName'),
        required: true,
        maxlength: 50,
        onInput: function (value, options) {
          options.validation.show = false;
          vm.uniqueName = false;
        },
        onBlur: function (value, options) {
          options.validation.show = null;
        }
      },
      asyncValidators: {
        uniqueName: {
          expression: function ($viewValue, $modelValue, scope) {
            return $q(function (resolve, reject) {
              validateField($viewValue, scope, 'organizationName', 'uniqueName', 'uniqueNameError').then(function (valid) {
                if (valid) {
                  resolve();
                } else {
                  reject();
                }
              });
            });
          },
          message: function () {
            return errorMessage('uniqueNameError');
          },
        }
      },
      modelOptions: {
        updateOn: 'default blur',
        debounce: {
          default: debounceTimeout,
          blur: 0
        },
      }
    }, {
      model: vm.details,
      key: 'customerEmail',
      type: 'cs-input',
      templateOptions: {
        label: $translate.instant('partnerHomePage.customerEmail'),
        type: 'email',
        required: true,
        onInput: function (value, options) {
          options.validation.show = false;
          vm.uniqueEmail = false;
        },
        onBlur: function (value, options) {
          options.validation.show = null;
        }
      },
      asyncValidators: {
        uniqueEmail: {
          expression: function ($viewValue, $modelValue, scope) {
            return $q(function (resolve, reject) {
              validateField($viewValue, scope, 'endCustomerEmail', 'uniqueEmail', 'uniqueEmailError').then(function (valid) {
                if (valid) {
                  resolve();
                } else {
                  reject();
                }
              });
            });
          },
          message: function () {
            return errorMessage('uniqueEmailError');
          }
        }
      },
      modelOptions: {
        updateOn: 'default blur',
        debounce: {
          default: debounceTimeout,
          blur: 0
        },
      }
    }];

    vm.nonTrialServices = [{
      // Context Service Trial
      model: vm.contextTrial,
      key: 'enabled',
      type: 'checkbox',
      templateOptions: {
        label: $translate.instant('trials.context'),
        id: 'contextTrial'
      }
    }];

    vm.messageFields = [{
      // Message Trial
      model: vm.messageTrial,
      key: 'enabled',
      type: 'checkbox',
      className: '',
      templateOptions: {
        id: messageTemplateOptionId,
        label: $translate.instant('trials.message')
      },
    }];

    vm.meetingFields = [{
      // Meeting Trial
      model: vm.meetingTrial,
      key: 'enabled',
      type: 'checkbox',
      className: '',
      templateOptions: {
        id: meetingTemplateOptionId,
        label: $translate.instant('trials.meeting')
      },
    }, {
      // Webex Trial
      model: vm.webexTrial,
      key: 'enabled',
      type: 'checkbox',
      className: '',
      templateOptions: {
        id: webexTemplateOptionId,
        label: $translate.instant('trials.webex')
      },
    }];

    vm.callFields = [{
      // Call Trial
      model: vm.callTrial,
      key: 'enabled',
      type: 'checkbox',
      className: '',
      templateOptions: {
        id: callTemplateOptionId,
        label: $translate.instant('trials.call')
      },
      hideExpression: function () {
        return !vm.hasCallEntitlement;
      }
    }];

    // Room Systems Trial
    vm.roomSystemFields = [{
      model: vm.roomSystemTrial,
      key: 'enabled',
      type: 'checkbox',
      className: '',
      templateOptions: {
        id: roomSystemsTemplateOptionId,
        label: $translate.instant('trials.roomSystem')
      },
      watcher: {
        listener: function (field, newValue, oldValue) {
          if (newValue !== oldValue) {
            field.model.details.quantity = newValue ? _roomSystemDefaultQuantity : 0;
          }
        }
      }
    }, {
      model: vm.roomSystemTrial.details,
      key: 'quantity',
      type: 'input',
      className: '',
      templateOptions: {
        id: 'trialRoomSystemsAmount',
        inputClass: 'medium-5 small-offset-1',
        secondaryLabel: $translate.instant('trials.licenses'),
        type: 'number'
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.roomSystemTrial.enabled;
        },
        'templateOptions.disabled': function () {
          return !vm.roomSystemTrial.enabled;
        },
      },
      validators: {
        quantity: {
          expression: function ($viewValue, $modelValue) {
            return !vm.roomSystemTrial.enabled || ValidationService.trialRoomSystemQuantity($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('partnerHomePage.invalidTrialRoomSystemQuantity');
          }
        }
      }
    }];

    vm.sparkBoardFields = [{
      model: vm.sparkBoardTrial,
      key: 'enabled',
      type: 'checkbox',
      className: '',
      templateOptions: {
        id: sparkBoardTemplateOptionId,
        label: $translate.instant('trials.sparkBoardSystem')
      },
      watcher: {
        listener: function (field, newValue, oldValue) {
          if (newValue !== oldValue) {
            field.model.details.quantity = newValue ? _roomSystemDefaultQuantity : 0;
          }
        }
      }
    }, {
      model: vm.sparkBoardTrial.details,
      key: 'quantity',
      type: 'input',
      className: '',
      templateOptions: {
        id: 'trialSparkBoardAmount',
        inputClass: 'medium-5 small-offset-1',
        secondaryLabel: $translate.instant('trials.licenses'),
        type: 'number'
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.sparkBoardTrial.enabled;
        },
        'templateOptions.disabled': function () {
          return !vm.sparkBoardTrial.enabled;
        },
      },
      validators: {
        quantity: {
          expression: function ($viewValue, $modelValue) {
            return !vm.sparkBoardTrial.enabled || ValidationService.trialRoomSystemQuantity($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('partnerHomePage.invalidTrialSparkBoardQuantity');
          }
        }
      }
    }];

    // Care Trial
    vm.careFields = [{
      model: vm.careTrial,
      key: 'enabled',
      type: 'checkbox',
      className: '',
      templateOptions: {
        id: 'careTrial',
        label: $translate.instant('trials.care')
      },
      hideExpression: function () {
        return !vm.showCare;
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return (vm.messageTrial.enabled && vm.callTrial.enabled); // Since, it depends on Message and Call Offer
        },
        'templateOptions.disabled': function () {
          return vm.messageOfferDisabledExpression() || vm.callOfferDisabledExpression();
        }
      }
    }, {
      model: vm.careTrial.details,
      key: 'quantity',
      type: 'input',
      className: '',
      templateOptions: {
        id: 'trialCareLicenseCount',
        inputClass: 'medium-5 small-offset-1',
        secondaryLabel: $translate.instant('trials.licenses'),
        type: 'number'
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.careTrial.enabled;
        },
        'templateOptions.disabled': function () {
          return vm.careLicenseInputDisabledExpression();
        }
      },
      modelOptions: {
        allowInvalid: true
      },
      validators: {
        quantity: {
          expression: function ($viewValue, $modelValue) {
            return vm.validateCareLicense($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('partnerHomePage.invalidTrialCareQuantity');
          }
        }
      },
      watcher: {
        expression: function () {
          return vm.details.licenseCount;
        },
        listener: function (field, newValue, oldValue) {
          if (newValue !== oldValue) {
            field.formControl.$validate();
          }
        }
      }
    }];

    vm.licenseCountFields = [{
      model: vm.details,
      key: 'licenseCount',
      type: 'input',
      className: '',
      templateOptions: {
        label: $translate.instant('trials.licenseQuantity'),
        inputClass: 'medium-5',
        type: 'number',
        secondaryLabel: $translate.instant('trials.users'),
      },
      modelOptions: {
        allowInvalid: true
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return hasUserServices();
        },
        'templateOptions.disabled': function () {
          return !hasUserServices();
        },

        'model.licenseCount': function ($viewValue) {
          if (hasUserServices()) {
            return ($viewValue === 0) ? _licenseCountDefaultQuantity : $viewValue;
          } else {
            return 0;
          }
        }
      },
      validators: {
        count: {
          expression: function ($viewValue, $modelValue) {
            return !hasUserServices() || ValidationService.trialLicenseCount($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('partnerHomePage.invalidTrialLicenseCount');
          },
        },
        countWithCare: {
          expression: function () {
            return vm.careLicenseCountLessThanTotalCount();
          },
          message: function () {
            return $translate.instant('partnerHomePage.careLicenseCountExceedsTotalCount');
          }
        }
      },
      watcher: {
        expression: function () {
          return vm.careTrial.details.quantity;
        },
        listener: function (field, newValue, oldValue) {
          if (newValue !== oldValue) {
            field.formControl.$validate();
          }
        }
      }
    }];

    vm.trialTermsFields = [{
      model: vm.details,
      key: 'licenseDuration',
      type: 'select',
      defaultValue: 30,
      templateOptions: {
        labelfield: 'label',
        required: true,
        label: $translate.instant('partnerHomePage.duration'),
        secondaryLabel: $translate.instant('partnerHomePage.durationHelp'),
        inputClass: 'medium-4',
        options: [30, 60, 90],
      },
    }];

    vm.hasCallEntitlement = true; // US12171 - always entitle call (previously Authinfo.isSquaredUC())
    vm.hasTrial = hasTrial;
    vm.hasNextStep = hasNextStep;
    vm.previousStep = previousStep;
    vm.nextStep = nextStep;
    vm.finishSetup = finishSetup;
    vm.closeDialogBox = closeDialogBox;
    vm.launchCustomerPortal = launchCustomerPortal;
    vm.showDefaultFinish = showDefaultFinish;
    vm.getNextState = getNextState;
    vm.hasUserServices = hasUserServices;

    vm.messageOfferDisabledExpression = messageOfferDisabledExpression;
    vm.callOfferDisabledExpression = callOfferDisabledExpression;
    vm.careLicenseInputDisabledExpression = careLicenseInputDisabledExpression;
    vm.validateCareLicense = validateCareLicense;
    vm.careLicenseCountLessThanTotalCount = careLicenseCountLessThanTotalCount;
    vm.cancelModal = cancelModal;
    init();

    ///////////////////////

    function init() {
      $q.all({
        atlasCareTrials: FeatureToggleService.atlasCareTrialsGetStatus(),
        atlasContextServiceTrials: FeatureToggleService.atlasContextServiceTrialsGetStatus(),
        atlasTrialsShipDevices: FeatureToggleService.atlasTrialsShipDevicesGetStatus(),
        huronCountryList: HuronCountryService.getCountryList(),
      })
        .then(function (results) {
          vm.showRoomSystems = true;
          vm.roomSystemTrial.enabled = true;
          vm.sparkBoardTrial.enabled = true;
          vm.webexTrial.enabled = true; // TODO: we enable globally by defaulting to 'true' here, but will revisit and refactor codepaths in a subsequent PR
          vm.callTrial.enabled = vm.hasCallEntitlement;
          vm.pstnTrial.enabled = vm.hasCallEntitlement;
          vm.messageTrial.enabled = true;
          vm.meetingTrial.enabled = true;
          vm.showContextServiceTrial = true;
          vm.atlasTrialsShipDevicesEnabled = results.atlasTrialsShipDevices;
          vm.defaultCountryList = results.huronCountryList;
          updateTrialService(messageTemplateOptionId);

          vm.showCare = results.atlasCareTrials;
          vm.careTrial.enabled = results.atlasCareTrials;
          // TODO: US12063 overrides using this var but requests code to be left in for now
          //var devicesModal = _.find(vm.trialStates, {
          //  name: 'trialAdd.call'
          // });
          var meetingModal = _.find(vm.trialStates, {
            name: 'trialAdd.webex'
          });
          var pstnModal = _.find(vm.trialStates, {
            name: 'trialAdd.pstn'
          });
          var emergAddressModal = _.find(vm.trialStates, {
            name: 'trialAdd.emergAddress'
          });

          pstnModal.enabled = vm.pstnTrial.enabled;
          emergAddressModal.enabled = vm.pstnTrial.enabled;
          // TODO: we enable globally by defaulting to 'true' here, but will revisit and refactor codepaths in a subsequent PR

          meetingModal.enabled = true;

          setDeviceModal();
        })
        .finally(function () {
          $scope.$watch(function () {
            return vm.trialData.trials;
          }, function (newVal, oldVal) {
            if (newVal !== oldVal) {
              toggleTrial();
            }
          }, true);

          // Capture modal close and clear service
          if ($state.modal) {
            $state.modal.result.finally(function () {
              TrialService.reset();
            });
          }

          //room system licence quantity
          vm.roomSystemFields[1].model.quantity = vm.roomSystemTrial.enabled ? _roomSystemDefaultQuantity : 0;
          //spark board licence quantity
          vm.sparkBoardFields[1].model.quantity = vm.sparkBoardTrial.enabled ? _roomSystemDefaultQuantity : 0;
          toggleTrial();
        });
    }

    function messageOfferDisabledExpression() {
      if (!vm.messageTrial.enabled) {
        vm.careTrial.enabled = false;
      }
      return !vm.messageTrial.enabled;
    }

    function callOfferDisabledExpression() {
      if (!vm.callTrial.enabled) {
        vm.careTrial.enabled = false;
      }
      return !vm.callTrial.enabled;
    }

    function careLicenseInputDisabledExpression() {
      if (vm.careTrial.enabled) {
        resetToDefaultIfNeeded();
      } else {
        vm.careTrial.details.quantity = 0;
      }
      return !vm.careTrial.enabled;
    }

    function resetToDefaultIfNeeded() {
      if (vm.careTrial.details.quantity === 0) {
        vm.careTrial.details.quantity = _careDefaultQuantity;
      }
    }

    function validateCareLicense($viewValue, $modelValue) {
      return !vm.careTrial.enabled || ValidationService.trialCareQuantity(
        $viewValue, $modelValue, vm.details.licenseCount);
    }

    function careLicenseCountLessThanTotalCount() {
      return (!vm.careTrial.enabled || +vm.details.licenseCount >= +vm.careTrial.details.quantity);
    }

    function hasUserServices() {
      var services = [vm.callTrial, vm.meetingTrial, vm.webexTrial, vm.messageTrial];
      var result = _.some(services, {
        enabled: true
      });
      return result;
    }

    // Update offer and label for Meetings/WebEx trial.
    function updateTrialService(templateOptionsId) {
      var index = _.findIndex(vm.messageFields, function (individualService) {
        return individualService.templateOptions.id === templateOptionsId;
      });
      if (index) {
        switch (templateOptionsId) {
          case messageTemplateOptionId:
            vm.messageFields[index].model.type = Config.offerTypes.message;
            vm.messageFields[index].templateOptions.label = $translate.instant('trials.message');
            break;
        }
      }
    }

    function toggleTrial() {
      if (!vm.callTrial.enabled && !vm.roomSystemTrial.enabled) {
        vm.pstnTrial.enabled = false;
      }
      if ((vm.callTrial.enabled || vm.roomSystemTrial.enabled) && vm.hasCallEntitlement && !vm.pstnTrial.skipped) {
        vm.pstnTrial.enabled = true;
      }

      addRemoveStates();
    }

    function addRemoveStates() {
      _.forEach(vm.trialStates, function (state) {
        if (!state.enabled || _.every(state.trials, {
          enabled: false
        })) {
          removeNavState(state.name);
        } else {
          addNavState(state.name);
        }
      });
    }

    function hasTrial() {
      // Context is a non-trial service. We don't want the Next/Start
      // Trial button to be enabled if only Context is checked
      return _.some(vm.trialData.trials, function (service) {
        return service.enabled && service.type !== Config.offerTypes.context;
      });
    }

    function hasNextStep() {
      return !_.isUndefined(getNextState());
    }

    function finishSetup() {
      sendToAnalytics(Analytics.sections.TRIAL.eventNames.FINISH);
      $state.go('trialAdd.finishSetup');
    }

    function previousStep() {
      var state = getBackState();
      if (state) {
        sendToAnalytics(Analytics.eventNames.BACK);
        $state.go(state);
      }
    }

    function getBackState() {
      return _.chain(vm.navStates)
        .indexOf($state.current.name)
        .thru(function (index) {
          return _.slice(vm.navStates, 0, index);
        })
        .findLast(function (state) {
          return !_.isUndefined(state);
        })
        .value();
    }

    function nextStep(callback) {
      if (!hasNextStep()) {
        return startTrial(callback);
      } else {
        sendToAnalytics(Analytics.eventNames.NEXT);
        return $state.go(getNextState());
      }
    }

    /**
     * Changed to chain and slice the navOrder instead of navStates
     * so that if you choose to skip a step that you are on
     * and that state gets removed from the order, the fucntion can
     * still find the next state and index won't find -1
     * when trying to find the next one
     */
    function getNextState() {
      return _.chain(vm.navOrder)
        .indexOf($state.current.name)
        .thru(function (index) {
          return _.slice(vm.navOrder, index + 1);
        })
        .find(_.partial(_.includes, vm.navStates))
        .value();
    }

    function addNavState(state) {
      vm.navStates[_.indexOf(vm.navOrder, state)] = state;
    }

    function removeNavState(state) {
      // just null out the position in array
      delete vm.navStates[_.indexOf(vm.navStates, state)];
    }

    function startTrial(addNumbersCallback) {
      vm.loading = true;
      sendToAnalytics(Analytics.sections.TRIAL.eventNames.START_TRIAL);

      return TrialService.startTrial()
        .catch(function (response) {
          Notification.errorResponse(response, 'trialModal.addError', {
            customerName: vm.details.customerName
          });
          return $q.reject(response);
        })
        .then(function (response) {
          vm.customerOrgId = response.data.customerOrgId;
          return response;
        })
        .then(function (response) {
          if (vm.callTrial.enabled || vm.roomSystemTrial.enabled) {
            return HuronCustomer.create(vm.customerOrgId, response.data.customerName, response.data.customerEmail)
              .catch(function (response) {
                Notification.errorResponse(response, 'trialModal.squareducError');
                return $q.reject(response);
              }).then(function () {
                if (vm.pstnTrial.enabled) {
                  return TrialPstnService.createPstnEntityV2(vm.customerOrgId, response.data.customerName);
                }
              });
          }
        })
        .then(function () {
          if (vm.contextTrial.enabled) {
            return TrialContextService.addService(vm.customerOrgId)
              .catch(function (response) {
                Notification.errorResponse(response, 'trialModal.startTrialContextServiceError');
                return $q.reject(response);
              });
          }
        })
        .then(function () {
          sendToAnalytics(Analytics.sections.TRIAL.eventNames.FINISH);
          Notification.success('trialModal.addSuccess', {
            customerName: vm.details.customerName
          });

          if (_.isFunction(addNumbersCallback)) {
            return addNumbersCallback(vm.customerOrgId)
              .catch(_.noop); //don't throw an error
          }
        })
        .then(function () {
          vm.finishSetup();
          return {
            customerOrgId: vm.customerOrgId
          };
        })
        .finally(function () {
          vm.loading = false;
        });
    }

    function closeDialogBox() {
      sendToAnalytics(Analytics.eventNames.NO);
      $state.modal.close();
    }

    function launchCustomerPortal() {
      sendToAnalytics(Analytics.eventNames.YES);
      $window.open($state.href('login_swap', {
        customerOrgId: vm.customerOrgId,
        customerOrgName: vm.details.customerName
      }));
      $state.modal.close();
    }

    function showDefaultFinish() {
      return !vm.webexTrial.enabled;
    }

    function setDeviceModal() {
      var overrideTestOrg = vm.atlasTrialsShipDevicesEnabled;
      var isTestOrg = false;

      Orgservice.getAdminOrg(_.noop).then(function (results) {
        if (results.data.success) {
          isTestOrg = results.data.isTestOrg;
        }
      }).finally(function () {
        // Display devices modal if not a test org or if toggle is set
        vm.devicesModal.enabled = !isTestOrg || overrideTestOrg;
      });
    }

    function cancelModal() {
      $state.modal.dismiss();
      sendToAnalytics(Analytics.eventNames.CANCEL_MODAL);
    }

    function sendToAnalytics(eventName, extraData) {
      Analytics.trackTrialSteps(eventName, vm.trialData, extraData);
    }

    function setDefaultCountry(country) {
      vm.details.country = country;
    }
  }
})();
