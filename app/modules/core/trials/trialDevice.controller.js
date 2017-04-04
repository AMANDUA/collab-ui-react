(function () {
  'use strict';

  angular
    .module('core.trial')
    .controller('TrialDeviceController', TrialDeviceController);

  /* @ngInject */
  // TODO - check for removal of $q and FeatureToggleService when MX300 are officially supported
  function TrialDeviceController($scope, $stateParams, $translate, Analytics, FeatureToggleService, Notification, TrialCallService, TrialDeviceService, TrialRoomSystemService, ValidationService) {
    var vm = this;

    var _trialCallData = TrialCallService.getData();
    var _trialRoomSystemData = TrialRoomSystemService.getData();
    var _trialDeviceData = TrialDeviceService.getData();
    // used if the default contry list associated with the device needs to be patched
    // with a different value like in case of a feature toggle. If there are no shipping FTs - should be empty
    var _shipCountryListReplacement = [{
      default: TrialDeviceService.listTypes.ROLLOUT2,
      override: TrialDeviceService.listTypes.US_ONLY,
    }];
    vm.deviceLimit = TrialDeviceService.getDeviceLimit();

    var trialStartDate = _.get($stateParams, 'currentTrial.startDate');
    var grandfatherMaxDeviceDate = new Date(2016, 8, 1);

    vm.parentTrialData = $scope.trialData;
    // merge is apparently not pass-by-reference
    vm.details = _.merge(_trialCallData.details, _trialRoomSystemData.details);
    vm.skipDevices = _trialDeviceData.skipDevices;
    vm.deviceTrialTip = $translate.instant('trialModal.call.deviceTrialTip');
    vm.limitsError = false;
    vm.activeDeviceLink = $translate.instant('trialModal.call.activeDeviceTrial');

    vm.isEditing = _.get($stateParams, 'isEditing');
    vm.canAddCallDevice = TrialCallService.canAddCallDevice(_.get($stateParams, 'details.details'), _trialCallData.enabled);
    vm.canAddRoomSystemDevice = TrialRoomSystemService.canAddRoomSystemDevice(_.get($stateParams, 'details.details'), _trialRoomSystemData.enabled);
    vm.validateInputQuantity = validateInputQuantity;
    vm.validateTypeQuantity = validateTypeQuantity;
    vm.validateTotalQuantity = validateTotalQuantity;
    vm.getTotalQuantity = getTotalQuantity;
    vm.calcQuantity = calcQuantity;
    vm.calcRelativeQuantity = calcRelativeQuantity;
    vm.skip = skip;
    vm.getQuantity = getQuantity;
    vm.setQuantity = setQuantity;
    vm.validateChecks = validateChecks;
    vm.disabledChecks = disabledChecks;
    vm.hasExistingDevices = hasExistingDevices;
    vm.notifyLimits = notifyLimits;
    vm.getQuantityInputDefault = _getQuantityInputDefault;
    vm.areAdditionalDevicesAllowed = areAdditionalDevicesAllowed;
    vm.areTemplateOptionsDisabled = _areTemplateOptionsDisabled;
    vm.getCountriesForSelectedDevices = getCountriesForSelectedDevices;
    // TODO - Remove vm.showNewRoomSystems when MX300 are officially supported
    vm.showNewRoomSystems = true;
    vm.selectedCountryCode = null;

    if (_.has($stateParams, 'details.details.shippingInformation.country')) {
        // nothing was supplied to us and we have something from the backend
      _trialDeviceData.shippingInfo = $stateParams.details.details.shippingInformation;
    }

    if (_.get(_trialDeviceData, 'shippingInfo.country') === '') {
      // always default to USA
      _trialDeviceData.shippingInfo.country = 'United States';
      vm.selectedCountryCode = 'US';
    } else {
      vm.selectedCountryCode = TrialDeviceService.getCountryCodeByName(_trialDeviceData.shippingInfo.country);
    }

    vm.shippingInfo = _trialDeviceData.shippingInfo;
    if (_.has($stateParams, 'currentTrial.dealId')) {
      vm.shippingInfo.dealId = $stateParams.currentTrial.dealId;
    }

    vm.sx10 = _.find(_trialRoomSystemData.details.roomSystems, {
      model: 'CISCO_SX10',
    });
    vm.dx80 = _.find(_trialRoomSystemData.details.roomSystems, {
      model: 'CISCO_DX80',
    });
    vm.mx300 = _.find(_trialRoomSystemData.details.roomSystems, {
      model: 'CISCO_MX300',
    });
    vm.phone8865 = _.find(_trialCallData.details.phones, {
      model: 'CISCO_8865',
    });
    vm.phone8845 = _.find(_trialCallData.details.phones, {
      model: 'CISCO_8845',
    });
    vm.phone8841 = _.find(_trialCallData.details.phones, {
      model: 'CISCO_8841',
    });
    vm.phone7841 = _.find(_trialCallData.details.phones, {
      model: 'CISCO_7841',
    });

    vm.setQuantity(vm.sx10);
    vm.setQuantity(vm.dx80);
    vm.setQuantity(vm.mx300);
    vm.setQuantity(vm.phone8865);
    vm.setQuantity(vm.phone8845);
    vm.setQuantity(vm.phone8841);
    vm.setQuantity(vm.phone7841);

    vm.roomSystemFields = [{
      model: vm.sx10,
      key: 'enabled',
      type: 'checkbox',
      className: 'pull-left medium-6 medium-offset-1',
      templateOptions: {
        label: $translate.instant('trialModal.call.sx10'),
        id: 'cameraSX10',
        labelClass: 'medium-offset-1',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canAddRoomSystemDevice;
        },
      },
      validators: _checkValidators(),
    }, {
      model: vm.sx10,
      key: 'quantity',
      type: 'input',
      className: 'pull-left medium-5',
      templateOptions: {
        labelfield: 'label',
        label: $translate.instant('trialModal.call.quantity'),
        labelClass: 'pull-left medium-6 text-right',
        inputClass: 'pull-left medium-5 medium-offset-1 ui--mt-',
        type: 'number',
        max: vm.deviceLimit.CISCO_SX10.max,
        min: vm.deviceLimit.CISCO_SX10.min,
        disabled: true,
      },
      modelOptions: {
        allowInvalid: true,
      },
      validation: {
        show: true,
      },

      expressionProperties: {
        'templateOptions.required': function () {
          return vm.sx10.enabled;
        },
        'templateOptions.disabled': function () {
          return vm.areTemplateOptionsDisabled(vm.sx10);
        },
        'model.quantity': function () {
          return vm.getQuantityInputDefault(vm.sx10);
        },

      },
      watcher: _addWatcher(),
      validators: _addDeviceQuantityValidators(vm.deviceLimit.CISCO_SX10, vm.deviceLimit.roomSystems),
    }, {
      model: vm.dx80,
      key: 'enabled',
      type: 'checkbox',
      className: 'pull-left medium-6 medium-offset-1',
      templateOptions: {
        label: $translate.instant('trialModal.call.dx80') + $translate.instant('trialModal.call.dx80Delay'),
        id: 'cameraDX80',
        labelClass: 'medium-offset-1',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canAddRoomSystemDevice;
        },
      },
      validators: _checkValidators(),
    }, {
      model: vm.dx80,
      key: 'quantity',
      type: 'input',
      className: 'pull-left medium-5',
      templateOptions: {
        labelfield: 'label',
        label: $translate.instant('trialModal.call.quantity'),
        labelClass: 'pull-left medium-6 text-right',
        inputClass: 'pull-left medium-5 medium-offset-1 ui--mt-',
        type: 'number',
        max: vm.deviceLimit.CISCO_DX80.max,
        min: vm.deviceLimit.CISCO_DX80.min,
        disabled: true,
      },
      modelOptions: {
        allowInvalid: true,
      },
      validation: {
        show: true,
      },

      expressionProperties: {
        'templateOptions.required': function () {
          return vm.dx80.enabled;
        },
        'templateOptions.disabled': function () {
          return vm.areTemplateOptionsDisabled(vm.dx80);
        },
        'model.quantity': function () {
          return vm.getQuantityInputDefault(vm.dx80);
        },
      },
      watcher: _addWatcher(),
      validators: _addDeviceQuantityValidators(vm.deviceLimit.CISCO_DX80, vm.deviceLimit.roomSystems),
    }, {
      model: vm.mx300,
      key: 'enabled',
      type: 'checkbox',
      className: 'pull-left medium-6 medium-offset-1',
      templateOptions: {
        label: $translate.instant('trialModal.call.mx300', { max: vm.deviceLimit.CISCO_MX300.max }),
        id: 'cameraMX300',
        labelClass: 'medium-offset-1',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canAddRoomSystemDevice;
        },
      },
      // TODO - remove hideExpression when MX300 are officially supported
      hideExpression: function () {
        return !vm.showNewRoomSystems;
      },
      validators: _checkValidators(),
    }, {
      model: vm.mx300,
      key: 'quantity',
      type: 'input',
      className: 'pull-left medium-5',
      templateOptions: {
        labelfield: 'label',
        label: $translate.instant('trialModal.call.quantity'),
        labelClass: 'pull-left medium-6 text-right',
        inputClass: 'pull-left medium-5 medium-offset-1 ui--mt-',
        type: 'number',
        max: vm.deviceLimit.CISCO_MX300.max,
        min: vm.deviceLimit.CISCO_MX300.min,
        disabled: true,
      },
      modelOptions: {
        allowInvalid: true,
      },
      validation: {
        show: true,
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.mx300.enabled;
        },
        'templateOptions.disabled': function () {
          return vm.areTemplateOptionsDisabled(vm.mx300);
        },
        'model.quantity': function () {
          return vm.getQuantityInputDefault(vm.mx300);
        },
      },
      // TODO - remove hideExpression when MX300 are officially supported
      hideExpression: function () {
        return !vm.showNewRoomSystems;
      },
      watcher: _addWatcher(),
      validators: _addDeviceQuantityValidators(vm.deviceLimit.CISCO_MX300, vm.deviceLimit.roomSystems),
    }];

    vm.deskPhoneFields = [{
      model: vm.phone8865,
      key: 'enabled',
      type: 'checkbox',
      className: 'pull-left medium-6 medium-offset-1',
      templateOptions: {
        label: $translate.instant('trialModal.call.phone8865'),
        id: 'phone8865',
        labelClass: 'medium-offset-1',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canAddCallDevice;
        },
      },
      validators: _checkValidators(),
    }, {
      model: vm.phone8865,
      key: 'quantity',
      type: 'input',
      className: 'pull-left medium-5',
      templateOptions: {
        labelfield: 'label',
        label: $translate.instant('trialModal.call.quantity'),
        labelClass: 'pull-left medium-6 text-right',
        inputClass: 'pull-left medium-5 medium-offset-1 ui--mt-',
        type: 'number',
        max: vm.deviceLimit.CISCO_8865.max,
        min: vm.deviceLimit.CISCO_8865.min,
        disabled: true,
      },
      modelOptions: {
        allowInvalid: true,
      },
      validation: {
        show: true,
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.phone8865.enabled;
        },
        'templateOptions.disabled': function () {
          return !vm.phone8865.enabled || vm.phone8865.readonly;
        },
        'model.quantity': function () {
          return vm.getQuantityInputDefault(vm.phone8865);
        },
      },
      watcher: _addWatcher(),
      validators: _addDeviceQuantityValidators(vm.deviceLimit.CISCO_8865, vm.deviceLimit.callDevices),
    }, {
      model: vm.phone8845,
      key: 'enabled',
      type: 'checkbox',
      className: 'pull-left medium-6 medium-offset-1',
      templateOptions: {
        label: $translate.instant('trialModal.call.phone8845'),
        id: 'phone8845',
        labelClass: 'medium-offset-1',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canAddCallDevice;
        },
      },
      validators: _checkValidators(),
    }, {
      model: vm.phone8845,
      key: 'quantity',
      type: 'input',
      className: 'pull-left medium-5',
      templateOptions: {
        labelfield: 'label',
        label: $translate.instant('trialModal.call.quantity'),
        labelClass: 'pull-left medium-6 text-right',
        inputClass: 'pull-left medium-5 medium-offset-1 ui--mt-',
        type: 'number',
        max: vm.deviceLimit.CISCO_8845.max,
        min: vm.deviceLimit.CISCO_8845.min,
        disabled: true,
      },
      modelOptions: {
        allowInvalid: true,
      },
      validation: {
        show: true,
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.phone8845.enabled;
        },
        'templateOptions.disabled': function () {
          return !vm.phone8845.enabled || vm.phone8845.readonly;
        },
        'model.quantity': function () {
          return vm.getQuantityInputDefault(vm.phone8845);
        },

      },
      watcher: _addWatcher(),
      validators: _addDeviceQuantityValidators(vm.deviceLimit.CISCO_8845, vm.deviceLimit.callDevices),
    }, {
      model: vm.phone8841,
      key: 'enabled',
      type: 'checkbox',
      className: 'pull-left medium-6 medium-offset-1',
      templateOptions: {
        label: $translate.instant('trialModal.call.phone8841'),
        id: 'phone8841',
        labelClass: 'medium-offset-1',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canAddCallDevice;
        },
      },
      validators: _checkValidators(),
    }, {
      model: vm.phone8841,
      key: 'quantity',
      type: 'input',
      className: 'pull-left medium-5',
      templateOptions: {
        labelfield: 'label',
        label: $translate.instant('trialModal.call.quantity'),
        labelClass: 'pull-left medium-6 text-right',
        inputClass: 'pull-left medium-5 medium-offset-1 ui--mt-',
        type: 'number',
        max: vm.deviceLimit.CISCO_8841.max,
        min: vm.deviceLimit.CISCO_8841.min,
        disabled: true,
      },
      modelOptions: {
        allowInvalid: true,
      },
      validation: {
        show: true,
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.phone8841.enabled;
        },
        'templateOptions.disabled': function () {
          return !vm.phone8841.enabled || vm.phone8841.readonly;
        },
        'model.quantity': function () {
          return vm.getQuantityInputDefault(vm.phone8841);
        },
      },
      watcher: _addWatcher(),
      validators: _addDeviceQuantityValidators(vm.deviceLimit.CISCO_8841, vm.deviceLimit.callDevices),
    }, {
      model: vm.phone7841,
      key: 'enabled',
      type: 'checkbox',
      className: 'pull-left medium-6 medium-offset-1',
      templateOptions: {
        label: $translate.instant('trialModal.call.phone7841'),
        id: 'phone7841',
        labelClass: 'medium-offset-1',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canAddCallDevice;
        },
      },
      validators: _checkValidators(),
    }, {
      model: vm.phone7841,
      key: 'quantity',
      type: 'input',
      className: 'pull-left medium-5',
      templateOptions: {
        labelfield: 'label',
        label: $translate.instant('trialModal.call.quantity'),
        labelClass: 'pull-left medium-6 text-right',
        inputClass: 'pull-left medium-5 medium-offset-1 ui--mt-',
        type: 'number',
        max: vm.deviceLimit.CISCO_7841.max,
        min: vm.deviceLimit.CISCO_7841.min,
        disabled: true,
      },
      modelOptions: {
        allowInvalid: true,
      },
      validation: {
        show: true,
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.phone7841.enabled;
        },
        'templateOptions.disabled': function () {
          return !vm.phone7841.enabled || vm.phone7841.readonly;
        },
        'model.quantity': function () {
          return vm.getQuantityInputDefault(vm.phone7841);
        },
      },
      watcher: _addWatcher(),
      validators: _addDeviceQuantityValidators(vm.deviceLimit.CISCO_7841, vm.deviceLimit.callDevices),
    }];

    vm.shippingFields = [{
      model: vm.shippingInfo,
      key: 'name',
      type: 'input',
      className: 'pull-left medium-8 with-slim-offset',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.name'),
        type: 'text',
        required: true,
      },
    }, {
      model: vm.shippingInfo,
      key: 'phoneNumber',
      type: 'input',
      className: 'pull-left medium-4 with-slim-offset offset-l',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.phone'),
        type: 'text',
        required: true,
      },
      validators: {
        phoneNumber: {
          expression: function ($viewValue, $modelValue) {
            return ValidationService.phoneAny($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('common.invalidPhoneNumber');
          },
        },
      },

      watcher: {
        expression: function (field) {
          return field.model.country;
        },
        listener: function (field, newValue, oldValue) {
          if (newValue !== oldValue && field.formControl) {
            field.formControl.$validate();
          }
        },
      },
    }, {
      model: vm.shippingInfo,
      key: 'addressLine1',
      type: 'input',
      className: 'pull-left medium-9 with-slim-offset',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.address'),
        type: 'text',
        required: true,
      },
    }, {
      model: vm.shippingInfo,
      key: 'addressLine2',
      type: 'input',
      className: 'pull-left medium-3 with-slim-offset offset-l',
      templateOptions: {
        labelClass: '',
        inputClass: '',

        label: $translate.instant('trialModal.call.unit'),
        type: 'text',
      },
    }, {
      model: vm.shippingInfo,
      key: 'city',
      type: 'input',
      className: 'medium-12 ',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.city'),
        type: 'text',
        required: true,
      },
    }, {
      model: vm.shippingInfo,
      key: 'state',
      type: 'select',
      defaultValue: _.find(TrialDeviceService.getStates(), {
        country: vm.shippingInfo.state,
      }),
      className: 'pull-left medium-8 with-slim-offset',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.state'),
        required: true,
        labelfield: 'abbr',
        valuefield: 'abbr',
        labelProp: 'abbr',
        valueProp: 'state',
        filter: true,

      },
      expressionProperties: {
        'templateOptions.options': function () {
          return _.map(TrialDeviceService.getStates(), 'abbr');
        },
        'templateOptions.required': function () {
          return vm.selectedCountryCode === 'US';
        },
      },
      hideExpression: function () {
        return vm.selectedCountryCode !== 'US';
      },
    },
    {
      model: vm.shippingInfo,
      key: 'state',
      type: 'input',
      className: 'pull-left medium-8 with-slim-offset',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.province'),
        type: 'text',
      },
      hideExpression: function () {
        return vm.selectedCountryCode === 'US';
      },
    },
    {
      model: vm.shippingInfo,
      key: 'postalCode',
      type: 'input',
      className: 'pull-left medium-4 with-slim-offset offset-l',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.zip'),
        type: 'text',
        max: 99999,
        min: 0,
        required: true,
      },
      expressionProperties: {
        'templateOptions.pattern': function () {
          if (vm.selectedCountryCode === 'US') {
            return '\\d{5}';
          }
        },
      },
      validation: {
        messages: {
          pattern: function () {
            return $translate.instant('common.invalidZipCode');
          },
        },
      },
    },
    {
      model: vm.shippingInfo,
      key: 'country',
      type: 'select',
      defaultValue: _.find(getCountriesForSelectedDevices(), {
        country: vm.shippingInfo.country,
      }),
      className: '',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.country'),
        type: 'text',
        required: true,
        labelfield: 'country',
        value: 'code',
        onChange: function (value, options) {
          vm.selectedCountryCode = TrialDeviceService.getCountryCodeByName(value);
          options.model.country = value;
          options.model.state = null;
        },
      },
      watcher: _countryWatcher(),
      expressionProperties: {
        'templateOptions.options': function () {
          return _.map(getCountriesForSelectedDevices(), 'country');
        },
      },
    },
    {
      model: vm.shippingInfo,
      key: 'dealId',
      type: 'input',
      className: '',
      templateOptions: {
        labelClass: '',
        inputClass: '',
        label: $translate.instant('trialModal.call.dealId'),
        type: 'text',
        required: false,
        pattern: '\\d{1,10}',
      },
      validation: {
        messages: {
          pattern: function () {
            return $translate.instant('trialModal.call.invalidDealId');
          },
        },
      },
    }];

    init();

    ////////////////
    function getCountriesForSelectedDevices() {
      var selectedDevices = _.chain(_.union(vm.roomSystemFields, vm.deskPhoneFields))
      .filter(function (device) {
        return device.model.quantity > 0 && device.model.enabled === true && device.key === 'quantity';
      })
      .map(function (device) {
        return device.model.model;
      }).value();
      return TrialDeviceService.getCountries(selectedDevices, _shipCountryListReplacement);
    }

    function init() {

      var limitsPromise = TrialDeviceService.getLimitsPromise();
      Analytics.trackTrialSteps(Analytics.eventNames.ENTER_SCREEN, vm.parentTrialData);

      // TODO - remove feature toggle code and checks. MX300 is now officially supported
      // Hides the MX300 under a feature toggle
      FeatureToggleService.supports(FeatureToggleService.features.atlasNewRoomSystems)
        .then(function () {
          vm.showNewRoomSystems = true;
        }).catch(function () {
          vm.showNewRoomSystems = true;
        });

      FeatureToggleService.atlasPhonesCanadaGetStatus().then(function (result) {
        if (result) {
          _shipCountryListReplacement = [];
        }
      });

      vm.canAddMoreDevices = vm.isEditing && vm.hasExistingDevices();
      if (!_.isUndefined(limitsPromise)) {
        limitsPromise.then(function (data) {
          vm.activeTrials = data.activeDeviceTrials;
          vm.maxTrials = data.maxDeviceTrials;
          vm.limitReached = vm.activeTrials >= vm.maxTrials;
        })
          .catch(function () {
            vm.limitsError = true;
            vm.limitReached = true;
          })
          .finally(function () {
            // Only show notification for new device trials
            if (!vm.canAddMoreDevices) {
              vm.notifyLimits();
            }
          });
      }
      trialStartDate = Date.parse(trialStartDate);
      if (trialStartDate && (trialStartDate < grandfatherMaxDeviceDate)) {
        vm.deviceLimit.callDevices.max = 5;
        vm.deviceLimit.totalDevices.max = 7;
        //bump up max to 5 for all call devices
        _.each(_.filter(vm.deviceLimit, { type: 'CALL_DEVICES' }), function (limit) {
          limit.max = 5;
        });

      }
    }

    function notifyLimits() {
      var remainingTrials = vm.maxTrials - vm.activeTrials;
      if (_.inRange(remainingTrials, 1, 4)) {
        Notification.warning('trialModal.call.remainingDeviceTrials', {
          number: remainingTrials,
        });
      }
    }

    function areAdditionalDevicesAllowed() {
      var result = vm.canAddMoreDevices || !vm.limitReached;
      return result;
    }

    function skip(skipped) {
      Analytics.trackTrialSteps(Analytics.eventNames.SKIP, vm.parentTrialData);
      _trialDeviceData.skipDevices = skipped;
    }

    function getTotalQuantity() {
      var quantity = calcRelativeQuantity(_trialRoomSystemData.details.roomSystems, _trialCallData.details.phones);
      return quantity;
    }

    /*TODO: this is not a correct way to do it. Now that we have diff. max for diff. devices
    we should store those in the object with the model and compare against that */

    function validateInputQuantity($viewValue, $modelValue, scope) {
      var quantity = $modelValue || $viewValue;
      var model = _.get(scope, 'model.model');
      var limit = vm.deviceLimit[model] || { min: 0, max: 0 };
      var device = scope.model;
      if (!device.enabled) {
        return true;
      } else {
        return (quantity >= limit.min && quantity <= limit.max);
      }
    }

    function validateTypeQuantity($viewValue, $modelValue, scope) {
      var model = _.get(scope, 'model.model');
      var limit = vm.deviceLimit[model] || { type: 'CALL_DEVICES' };
      if (limit.type === 'ROOM_SYSTEMS') {
        return _validateTypeQuantity(scope, _trialRoomSystemData.details.roomSystems, vm.deviceLimit.roomSystems.min,
        vm.deviceLimit.roomSystems.max);
      } else {
        return _validateTypeQuantity(scope, _trialCallData.details.phones, vm.deviceLimit.callDevices.min, vm.deviceLimit.callDevices.max);
      }
    }

    function validateTotalQuantity($viewValue, $modelValue, scope) {
      var quantity = calcRelativeQuantity(_trialRoomSystemData.details.roomSystems, _trialCallData.details.phones);
      var device = scope.model;
      // If quantity is 0, _getQuantityInputDefault will set quantity to minimum allowed value, so it is never 0.
      // So when relative quantity equals 0, validation can be skipped.
      if (!device.enabled || quantity === 0) {
        return true;
      } else {
        return !(quantity < vm.deviceLimit.totalDevices.min || quantity > vm.deviceLimit.totalDevices.max);
      }
    }

    function calcRelativeQuantity() {
      var devicesValue = _(Array.prototype.slice.call(arguments))
        .flatten()
        .value();
      var storedQuantity = vm.calcQuantity(_.filter(devicesValue, {
        readonly: true,
      }));
      var totalQuantity = vm.calcQuantity(devicesValue);
      var quantity = totalQuantity - storedQuantity;
      return quantity;
    }

    function calcQuantity() {
      var devices = Array.prototype.slice.call(arguments);
      return _(devices)
        .flatten()
        .filter({
          enabled: true,
        })
        .map('quantity')
        .reduce(_.add) || 0;
    }

    function _areTemplateOptionsDisabled(device) {
      return !device.enabled || device.readonly;
    }

    function _getQuantityInputDefault(device) {
      var limit = vm.deviceLimit[device.model] || { min: 0 };
      var disabled = !device.enabled;
      if (disabled) {
        return 0;
      } else if (device.quantity === 0) {
        return limit.min;
      } else {
        return device.quantity;
      }
    }

    function _validateTypeQuantity(scope, deviceType, min, max) {
      var quantity = vm.calcQuantity(deviceType);
      var device = scope.model;
      if (!device.enabled) {
        return true;
      } else {
        return !(quantity < min || quantity > max);
      }
    }

    function _addWatcher() {
      return {
        expression: function () {

          return vm.calcQuantity(_trialRoomSystemData.details.roomSystems, _trialCallData.details.phones);
        },
        listener: function (field, newValue, oldValue) {
          if (newValue !== oldValue && field.formControl) {
            field.formControl.$validate();
          }
        },
      };
    }


    function _countryWatcher() {
      return {
        expression: function () {
          return vm.calcQuantity(_trialRoomSystemData.details.roomSystems, _trialCallData.details.phones);
        },
        listener: function (field, newValue, oldValue) {
          if (newValue !== oldValue) {
            field.templateOptions.options = _.map(getCountriesForSelectedDevices(), 'country');
            if (_.indexOf(field.templateOptions.options, field.model.country) === -1) {
              field.model.country = null;
            }
          }
        },
      };
    }

    function _addDeviceQuantityValidators(deviceLimit, groupLimit) {
      return {
        inputQuantity: {
          expression: vm.validateInputQuantity,
          message: function () {
            if (deviceLimit.model === 'CISCO_MX300') {
              return $translate.instant('trialModal.call.invalidQuantityMx300', { qty: deviceLimit.max });
            } else {
              return $translate.instant('trialModal.call.invalidQuantity', { min: deviceLimit.min, max: deviceLimit.max });
            }
          },
        },
        typeQuantity: {
          expression: vm.validateTypeQuantity,
          message: function () {
            return $translate.instant(groupLimit.errorMessage, { max: groupLimit.max });
          },
        },
        totalQuantity: {
          expression: vm.validateTotalQuantity,
          message: function () {
            return $translate.instant('trialModal.call.invalidTotalQuantity', { min: vm.deviceLimit.totalDevices.min, max: vm.deviceLimit.totalDevices.max });
          },
        },
      };
    }

    function setQuantity(deviceModel) {
      var localQuantity = deviceModel.quantity;
      var storedQuantity = vm.getQuantity(deviceModel);

      // Get current quantity for addTrial else get from $stateParams
      deviceModel.quantity = localQuantity || storedQuantity;
      deviceModel.enabled = !!deviceModel.quantity;
      deviceModel.readonly = !!storedQuantity;
    }

    function getQuantity(deviceModel) {
      return _.get(_.find(_.get($stateParams, 'details.details.devices', []), {
        model: deviceModel.model,
      }), 'quantity', 0);
    }

    function disabledChecks() {
      return !_.chain(_trialCallData.details.phones)
        .concat(_trialRoomSystemData.details.roomSystems)
        .flatten()
        .filter({
          enabled: true,
        })
        .isEmpty()
        .value();
    }

    function validateChecks($viewValue, $modelValue, scope) {
      return _.get(scope, 'model.valid', disabledChecks());
    }

    function _checkValidators() {
      return {
        checkbox: {
          expression: vm.validateChecks,
        },
      };
    }

    function hasExistingDevices() {
      var devices = _.get($stateParams, 'details.details.devices');
      return !_.every(devices, {
        quantity: 0,
      });
    }
  }
})();
