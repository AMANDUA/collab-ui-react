/* globals $controller, $httpBackend, $q, $rootScope, Analytics, FeatureToggleService, Notification, Orgservice, TrialDeviceController, TrialCallService, TrialDeviceService, TrialRoomSystemService*/

'use strict';

describe('Controller: TrialDeviceController', function () {
  var controller, scope;
  var trialData = getJSONFixture('core/json/trials/trialData.json');
  var limitData = {};

  afterEach(function () {
    controller = scope = undefined;
  });

  afterAll(function () {
    trialData = limitData = undefined;
  });

  beforeEach(angular.mock.module('core.trial'));
  beforeEach(angular.mock.module('Core'));
  // TODO - check for removal of Huron and Sunlight when MX300 are officially supported
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(function () {
    // TODO - check for removal of $httpBackend and FeatureToggleService when MX300 are officially supported
    bard.inject(this, '$controller', '$httpBackend', '$q', '$rootScope', 'Analytics', 'FeatureToggleService', 'Notification', 'Orgservice', 'TrialCallService', 'TrialDeviceService', 'TrialRoomSystemService');
  });

  beforeEach(function () {
    // TODO - remove $httpBackend when MX300 are officially supported
    $httpBackend
      .when('GET', 'https://identity.webex.com/identity/scim/null/v1/Users/me')
      .respond({});
    spyOn(Orgservice, 'getOrg');
    limitData = TrialDeviceService.getDeviceLimit();
    spyOn(Analytics, 'trackTrialSteps');
    initController();
  });

  function initController() {
    scope = $rootScope.$new();
    scope.trialData = trialData.enabled;
    controller = $controller('TrialDeviceController', { $scope: scope.$new() });
    $rootScope.$apply();
  }

  describe('controller data', function () {
    it('should be created successfully', function () {
      expect(controller).toBeDefined();
    });

    it('should have nothing enabled', function () {
      var roomSystems = _.find(controller.details.roomSystems, {
        enabled: true
      });
      var phones = _.filter(controller.details.phones, {
        enabled: true
      });
      var shippingInfo = _.find(controller.details.shippingInfo, {
        enabled: true
      });

      expect(roomSystems).toBeUndefined();
      expect(phones.length).toBe(0);
      expect(shippingInfo).toBeUndefined();
    });

    // TODO: remove when MX300 support is official
    describe('feature toggle for displaying new room systems', function () {
      it('should show MX300 when feature toggle is true', function () {
        spyOn(FeatureToggleService, 'supports').and.returnValue($q.when(true));
        initController();

        expect(controller.showNewRoomSystems).toBe(true);
        expect(FeatureToggleService.supports).toHaveBeenCalled();
      });

      it('should show MX300 when feature toggle is false', function () {
        spyOn(FeatureToggleService, 'supports').and.returnValue($q.when(false));
        initController();

        expect(controller.showNewRoomSystems).toBe(true);
        expect(FeatureToggleService.supports).toHaveBeenCalled();
      });
    });

    // the back end expects this as an enum and enums cant start with numbers
    it('should have all devices starting with \'CISCO_\'', function () {
      for (var i = 0; i < controller.details.roomSystems.length; i++) {
        var rsModel = controller.details.roomSystems[i].model;
        expect(_.startsWith(rsModel, 'CISCO_')).toBeTruthy();
      }
      for (var j = 0; j < controller.details.phones.length; j++) {
        var phoneModel = controller.details.phones[j].model;
        expect(_.startsWith(phoneModel, 'CISCO_')).toBeTruthy();
      }
    });

    it('should always have a recipient type === PARTNER || CUSTOMER', function () {
      var type = controller.shippingInfo.type;
      expect(controller.shippingInfo.type).toBeDefined();

      expect(type === 'CUSTOMER' || type === 'PARTNER').toBeTruthy();
    });

    it('should calculate quantity of devices', function () {
      var devices1 = [{
        model: 'CISCO_SX10',
        enabled: true,
        quantity: 2,
        readonly: false,
        valid: true
      }, {
        model: 'CISCO_DX80',
        enabled: true,
        quantity: 1,
        readonly: false,
        valid: true
      }, {
        model: 'CISCO_8865',
        enabled: false,
        quantity: 2,
        readonly: false,
        valid: true

      }];
      var devices2 = [{
        model: 'CISCO_SX10',
        enabled: true,
        quantity: 4,
        readonly: false,
        valid: true

      }];
      var devices3 = [{
        model: 'CISCO_SX10',
        enabled: false,
        quantity: 2,
        readonly: false,
        valid: true

      }, {
        model: 'CISCO_MX300',
        enabled: false,
        quantity: 2,
        readonly: false,
        valid: true
      }, {
        model: 'CISCO_8865',
        enabled: false,
        quantity: 2,
        readonly: false,
        valid: true

      }];

      expect(controller.calcQuantity(devices1)).toEqual(3);
      expect(controller.calcQuantity(devices1, devices2)).toEqual(7);
      expect(controller.calcQuantity(devices3)).toEqual(0);
    });

    it('should set quantity to current value', function () {
      var deviceModel = {
        enabled: true,
        quantity: 3,
        readonly: false

      };

      controller.setQuantity(deviceModel);

      expect(deviceModel.quantity).toBe(3);
      expect(deviceModel.enabled).toBe(true);
      expect(deviceModel.readonly).toBe(false);
    });

    it('should set quantity to $paramValue value', function () {
      var deviceModel = {
        enabled: false,
        quantity: 0,
        readonly: false

      };
      spyOn(controller, 'getQuantity').and.returnValue(2);

      controller.setQuantity(deviceModel);

      expect(deviceModel.quantity).toBe(2);
      expect(deviceModel.enabled).toBe(true);
      expect(deviceModel.readonly).toBe(true);
    });

    it('should set device trial limits', function () {
      bard.mockService(TrialDeviceService, {
        getData: trialData.enabled.trials.deviceTrial,
        getLimitsPromise: $q.when({
          activeDeviceTrials: 17,
          maxDeviceTrials: 20
        }),
        getDeviceLimit: limitData
      });
      initController();

      expect(controller.activeTrials).toEqual(17);
      expect(controller.maxTrials).toEqual(20);
      expect(controller.limitReached).toBe(false);
    });

    it('should set limitReached', function () {
      bard.mockService(TrialDeviceService, {
        getData: trialData.enabled.trials.deviceTrial,
        getLimitsPromise: $q.when({
          activeDeviceTrials: 20,
          maxDeviceTrials: 20
        }),
        getDeviceLimit: limitData
      });
      initController();

      expect(controller.activeTrials).toEqual(20);
      expect(controller.maxTrials).toEqual(20);
      expect(controller.limitReached).toBe(true);
    });

    it('should set limitsError', function () {
      bard.mockService(TrialDeviceService, {
        getData: trialData.enabled.trials.deviceTrial,
        getLimitsPromise: $q.reject(),
        getDeviceLimit: limitData
      });
      initController();

      expect(controller.limitsError).toBe(true);
      expect(controller.limitReached).toBe(true);
    });

    it('should notify limit approaching', function () {
      spyOn(Notification, 'warning');
      bard.mockService(TrialDeviceService, {
        getData: trialData.enabled.trials.deviceTrial,
        getLimitsPromise: $q.when({
          activeDeviceTrials: 17,
          maxDeviceTrials: 20
        }),
        getDeviceLimit: limitData
      });
      initController();

      expect(Notification.warning).toHaveBeenCalled();
    });
  });

  describe('input quantity default setting', function () {

    it('should change the quantity to 0 when disabled', function () {
      var device = {
        model: 'CISCO_SX10',
        enabled: false,
        quantity: 3,
        readonly: false,
        valid: true,
        minQuantity: 1,
        maxQuantity: 3
      };
      device.quantity = controller.getQuantityInputDefault(device);
      expect(device.quantity).toBe(0);
    });

    it('should change the quantity to default when enabled and has quantity 0', function () {
      var device = {
        model: 'CISCO_SX10',
        enabled: true,
        quantity: 0,
        readonly: false,
        valid: true,
        minQuantity: 1,
        maxQuantity: 3
      };
      device.quantity = controller.getQuantityInputDefault(device);
      expect(device.quantity).toBe(1);
    });

    it('should not change the quantity when enabled and has quantity other than 0', function () {
      var device = {
        model: 'CISCO_SX10',
        enabled: true,
        quantity: 3,
        readonly: false,
        valid: true,
        minQuantity: 1,
        maxQuantity: 3
      };
      device.quantity = controller.getQuantityInputDefault(device, 1);
      expect(device.quantity).toBe(3);
    });

  });

  describe('input quantity validation', function () {
    it('should validate when device is not enabled', function () {
      var valid = controller.validateInputQuantity(2, 2, {
        model: {
          enabled: false,
          minQuantity: 1,
          maxQuantity: 3
        }
      });
      expect(valid).toBe(true);
    });

    it('should validate quantity between 1 and 4 for new trial', function () {
      var valid1 = controller.validateInputQuantity(1, 1, {
        model: {
          enabled: true,
          model: 'CISCO_8865'
        }
      });
      var valid2 = controller.validateInputQuantity(4, 4, {
        model: {
          enabled: true,
          model: 'CISCO_8865'
        }
      });

      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });


    it('should validate quantity between 1 and 5 for trial prior to 9/1/2016', function () {
      var stateParams = {
        currentTrial: {
          startDate: new Date(2016, 7, 1)
        }
      };

      var controller = $controller('TrialDeviceController', { $scope: scope.$new(), $stateParams: stateParams });

      var valid1 = controller.validateInputQuantity(1, 1, {
        model: {
          enabled: true,
          model: 'CISCO_8845'
        }
      });
      var valid2 = controller.validateInputQuantity(5, 5, {
        model: {
          enabled: true,
          model: 'CISCO_8845'
        }
      });

      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });

    it('should not validate quantity below 1 and above 5', function () {
      var valid1 = controller.validateInputQuantity(0, 0, {
        model: {
          enabled: true,
          model: 'CISCO_8845'
        }
      });
      var valid2 = controller.validateInputQuantity(6, 6, {
        model: {
          enabled: true,
          model: 'CISCO_8845'
        }
      });

      expect(valid1).toBe(false);
      expect(valid2).toBe(false);
    });


    it('should not validate quantity above 1 for mx300', function () {
      var valid1 = controller.validateInputQuantity(1, 1, {
        model: {
          enabled: true,
          model: 'CISCO_MX300'
        }
      });
      var valid2 = controller.validateInputQuantity(2, 2, {
        model: {
          enabled: true,
          model: 'CISCO_MX300'
        }
      });
      expect(valid1).toBe(true);
      expect(valid2).toBe(false);
    });
  });

  describe('total quantity validation', function () {
    var model = {
      model: {
        enabled: true
      }
    };

    it('should validate when quantity is between 1 and 5 for new trial', function () {
      spyOn(controller, 'calcQuantity').and.returnValues(0, 1, 0, 5);

      var valid1 = controller.validateTotalQuantity(null, null, model);
      var valid2 = controller.validateTotalQuantity(null, null, model);

      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });

    it('should validate when quantity is between 1 and 7 for trial prior to 9/1/2016', function () {
      var stateParams = {
        currentTrial: {
          startDate: new Date(2016, 7, 1)
        }
      };

      var controller = $controller('TrialDeviceController', { $scope: scope.$new(), $stateParams: stateParams });
      spyOn(controller, 'calcQuantity').and.returnValues(0, 1, 0, 7);

      var valid1 = controller.validateTotalQuantity(null, null, model);
      var valid2 = controller.validateTotalQuantity(null, null, model);

      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });

    // less than 1 condition is handled in controller by _getQuantityInputDefault
    it('should not validate when quantity is greater than 7', function () {
      spyOn(controller, 'calcQuantity').and.returnValues(0, 8);

      var valid1 = controller.validateTotalQuantity(null, null, model);

      expect(valid1).toBe(false);
    });

    it('should validate when device is not enabled', function () {
      var valid = controller.validateTotalQuantity(null, null, {
        model: {
          enabled: false
        }
      });
      expect(valid).toBe(true);
    });
  });

  describe('room systems quantity validation', function () {
    var model = {
      model: {
        enabled: true,
        model: 'CISCO_DX80'
      }
    };

    it('should validate when quantity is 3 or less', function () {
      spyOn(controller, 'calcQuantity').and.returnValue(3);

      var valid = controller.validateTypeQuantity(null, null, model);

      expect(valid).toBe(true);
    });

    it('should not validate when quantity is greater than 5', function () {
      spyOn(controller, 'calcQuantity').and.returnValue(6);

      var valid = controller.validateTypeQuantity(null, null, model);

      expect(valid).toBe(false);
    });

    it('should not validate when quantity is less than 1', function () {
      spyOn(controller, 'calcQuantity').and.returnValue(0);

      var valid = controller.validateTypeQuantity(null, null, model);

      expect(valid).toBe(false);
    });

    it('should validate when device is not enabled', function () {
      var valid = controller.validateTypeQuantity(null, null, {
        model: {
          enabled: false
        }
      });
      expect(valid).toBe(true);
    });
  });

  describe('phones quantity validation', function () {
    var model = {
      model: {
        enabled: true,
        model: 'CISCO_8865',
      }
    };

    it('should validate when quantity is 4 or less for new trial', function () {
      spyOn(controller, 'calcQuantity').and.returnValue(4);

      var valid = controller.validateTypeQuantity(null, null, model);

      expect(valid).toBe(true);
    });

    it('should validate when quantity is 5 or less for trial prior to 9/1/16', function () {

      var stateParams = {
        currentTrial: {
          startDate: new Date(2016, 7, 1)
        }
      };

      var controller = $controller('TrialDeviceController', { $scope: scope.$new(), $stateParams: stateParams });

      spyOn(controller, 'calcQuantity').and.returnValue(5);

      var valid = controller.validateTypeQuantity(null, null, model);

      expect(valid).toBe(true);
    });

    it('should not validate when quantity is greater than 5', function () {
      spyOn(controller, 'calcQuantity').and.returnValue(6);

      var valid = controller.validateTypeQuantity(null, null, model);

      expect(valid).toBe(false);
    });

    it('should not validate when phone quantity is less than 1', function () {
      spyOn(controller, 'calcQuantity').and.returnValue(0);

      var valid = controller.validateTypeQuantity(null, null, model);

      expect(valid).toBe(false);
    });

    it('should validate when device is not enabled', function () {
      var valid = controller.validateTypeQuantity(null, null, {
        model: {
          enabled: false
        }
      });
      expect(valid).toBe(true);
    });

  });

  describe('total device quantity calculation', function () {

    it('should calculate total quantity 0 when nothing is enabled', function () {

      var total = controller.getTotalQuantity();
      expect(total).toBe(0);
    });

    it('should calculate total quantity correcty when not 0', function () {

      // default data has quality 3 of CISCO_8865 and 2 of CISCO_SX10
      bard.mockService(TrialCallService, {
        getData: trialData.enabled.trials.callTrial,
      });

      bard.mockService(TrialRoomSystemService, {
        getData: trialData.enabled.trials.roomSystemTrial,
      });

      initController();
      $rootScope.$apply();

      var total = controller.getTotalQuantity();
      expect(total).toBe(5);

    });
  });

  describe('checkbox validation', function () {
    it('should validate when model valid is true', function () {
      var valid = controller.validateChecks(null, null, {
        model: {
          valid: true
        }
      });
      expect(valid).toBe(true);
    });

    it('should validate when one or more checkboxes are enabled true', function () {
      var valid = controller.validateChecks(null, null, {
        model: {
          enabled: true,
          valid: true
        }
      });
      expect(valid).toBe(true);
    });

    it('should not validate when all checkboxes are enabled false', function () {
      var valid = controller.validateChecks(null, null, {
        model: {
          enabled: false,
          valid: false
        }
      });
      expect(valid).toBe(false);
    });
  });

  describe('areAdditionalDevicesAllowed  function ', function () {
    it('should return false when limit is reached', function () {

      bard.mockService(TrialDeviceService, {
        getData: trialData.enabled.trials.deviceTrial,
        getLimitsPromise: $q.when({
          activeDeviceTrials: 20,
          maxDeviceTrials: 20
        }),
        getDeviceLimit: limitData
      });

      initController();
      controller.canAddMoreDevices = false;
      $rootScope.$apply();

      var result = controller.areAdditionalDevicesAllowed();
      expect(result).toBe(false);
    });

    it('should return true when the limit is not reached', function () {
      bard.mockService(TrialDeviceService, {
        getData: trialData.enabled.trials.deviceTrial,
        getLimitsPromise: $q.when({
          activeDeviceTrials: 15,
          maxDeviceTrials: 20
        }),
        getDeviceLimit: limitData
      });
      initController();
      controller.canAddMoreDevices = false;
      $rootScope.$apply();

      var result = controller.areAdditionalDevicesAllowed();
      expect(result).toBe(true);
    });
  });

  describe('areTemplateOptionsDisabled function', function () {
    it('should set to true if device.enabled is false', function () {
      var device = {
        model: 'CISCO_SX10',
        enabled: false,
        quantity: 3,
        readonly: false,
        valid: true
      };

      expect(controller.areTemplateOptionsDisabled(device)).toBeTruthy();
    });

    it('should set to false if device.enabled is true', function () {
      var device = {
        model: 'CISCO_DX80',
        enabled: true,
        quantity: 3,
        readonly: false,
        valid: true
      };
      expect(controller.areTemplateOptionsDisabled(device)).toBeFalsy();
    });

    it('should set to false if device.readonly is true', function () {
      var device = {
        model: 'CISCO_MX300',
        enabled: false,
        quantity: 3,
        readonly: true,
        valid: true
      };
      expect(controller.areTemplateOptionsDisabled(device)).toBeTruthy();
    });
  });

  describe('Shipping to additional countries ', function () {
    it('should show a larger list of countries when only CISCO_SX10 is selected', function () {
      controller.sx10.enabled = true;
      controller.sx10.quantity = 1;
      var countryList = controller.getCountriesForSelectedDevices();
      expect(countryList.length).toBeGreaterThan(1);
    });
    it('should have a list of countries to be US only when CISCO_SX10 and phone is selected', function () {
      controller.sx10.enabled = true;
      controller.sx10.quantity = 1;
      controller.phone8865.enabled = true;
      controller.phone8865.quantity = 1;
      var countryList = controller.getCountriesForSelectedDevices();
      expect(countryList.length).toBe(1);
      expect(countryList).toContain({ country: 'United States' });
    });
  });
});
