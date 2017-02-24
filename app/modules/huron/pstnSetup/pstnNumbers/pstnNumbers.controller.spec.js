'use strict';

describe('Controller: PstnNumbersCtrl', function () {
  var controller, $compile, $scope, $state, $q, $translate, PstnSetupService, PstnSetup, Notification, PstnSetupStatesService, FeatureToggleService;
  var element;

  var customer = getJSONFixture('huron/json/pstnSetup/customer.json');
  var customerCarrierList = getJSONFixture('huron/json/pstnSetup/customerCarrierList.json');
  var orderCart = getJSONFixture('huron/json/pstnSetup/orderCart.json');

  var singleOrder = {
    "data": {
      "numbers": "+12145551000",
    },
    "numberType": "DID",
    "orderType": "NUMBER_ORDER",
  };
  var consecutiveOrder = {
    "data": {
      "numbers": [
        "+12145551000",
        "+12145551001",
      ],
    },
    "numberType": "DID",
    "orderType": "NUMBER_ORDER",
  };
  var nonconsecutiveOrder = {
    "data": {
      "numbers": [
        "+12145551234",
        "+12145551678",
      ],
    },
    "numberType": "DID",
    "orderType": "NUMBER_ORDER",
  };
  var portOrder = {
    "data": {
      "numbers": [
        "+12145557001",
        "+12145557002",
      ],
    },
    "orderType": "PORT_ORDER",
  };
  var advancedOrder = {
    data: {
      areaCode: 321,
      length: 2,
      consecutive: false,
    },
    numberType: "DID",
    orderType: "BLOCK_ORDER",
  };
  var advancedNxxOrder = {
    data: {
      areaCode: 321,
      length: 2,
      nxx: 201,
      consecutive: false,
    },
    numberType: "DID",
    orderType: "BLOCK_ORDER",
  };
  var advancedTollFreeOrder = {
    data: {
      areaCode: 800,
      length: 3,
      consecutive: false,
    },
    numberType: "TOLLFREE",
    orderType: "BLOCK_ORDER",
  };

  var states = [{
    name: 'Texas',
    abbreviation: 'TX',
  }];

  var response = {
    areaCodes: [{
      code: '123',
      count: 15,
    }, {
      code: '456',
      count: 30,
    }],
  };

  var serviceAddress = {
    address1: '123 example st',
    address2: '',
    city: 'Sample',
    state: 'TX',
    zip: '77777',
  };

  afterEach(function () {
    if (element) {
      element.remove();
    }
    element = undefined;
  });

  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight')); // Remove this when FeatureToggleService is removed.

  beforeEach(inject(function ($rootScope, _$compile_, _$state_, _$q_, _$translate_, _PstnSetupService_, _PstnSetup_, _Notification_, _PstnSetupStatesService_, _FeatureToggleService_) {
    $scope = $rootScope.$new();
    $compile = _$compile_;
    $state = _$state_;
    $q = _$q_;
    $translate = _$translate_;
    PstnSetupService = _PstnSetupService_;
    PstnSetup = _PstnSetup_;
    Notification = _Notification_;
    PstnSetupStatesService = _PstnSetupStatesService_;
    FeatureToggleService = _FeatureToggleService_;

    PstnSetup.setCustomerId(customer.uuid);
    PstnSetup.setCustomerName(customer.name);
    PstnSetup.setProvider(customerCarrierList[0]);

    spyOn(PstnSetupService, 'releaseCarrierInventory').and.returnValue($q.resolve());
    spyOn(PstnSetupService, 'releaseCarrierInventoryV2').and.returnValue($q.resolve());
    spyOn(PstnSetupService, 'getCarrierInventory').and.returnValue($q.resolve(response));
    spyOn(PstnSetupService, 'getCarrierTollFreeInventory').and.returnValue($q.resolve(response));
    spyOn(PstnSetup, 'getServiceAddress').and.returnValue(serviceAddress);
    spyOn(Notification, 'error');
    spyOn($state, 'go');
    spyOn(PstnSetupStatesService, 'getProvinces').and.returnValue($q.resolve(states));
    spyOn(PstnSetupStatesService, 'getStates').and.returnValue($q.resolve(states));
    spyOn($translate, 'instant').and.callThrough();
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(false));

    controller = compileTemplate();
  }));

  afterEach(function () {
    controller = undefined;
    $compile = undefined;
    $scope = undefined;
    $state = undefined;
    $q = undefined;
    $translate = undefined;
    PstnSetupService = undefined;
    PstnSetup = undefined;
    Notification = undefined;
    PstnSetupStatesService = undefined;
    FeatureToggleService = undefined;
  });

  afterAll(function () {
    customer = undefined;
    customerCarrierList = undefined;
    orderCart = undefined;
    singleOrder = undefined;
    consecutiveOrder = undefined;
    nonconsecutiveOrder = undefined;
    portOrder = undefined;
    advancedOrder = undefined;
    advancedNxxOrder = undefined;
    advancedTollFreeOrder = undefined;
    states = undefined;
    response = undefined;
    serviceAddress = undefined;
  });

  function compileTemplate() {
    var template = '<div><div ng-controller="PstnNumbersCtrl as pstnNumbers" ng-include="\'modules/huron/pstnSetup/pstnNumbers/pstnNumbers.tpl.html\'"></div></div>';
    element = $compile(template)($scope);
    $scope.$apply();
    $translate.instant.calls.reset();
    return _.get(element.scope(), '$$childTail.pstnNumbers');
  }

  describe('initial/default data', function () {
    it('should not have an areaCodeOptions array', function () {
      expect(controller.model.pstn.areaCodeOptions).toBeDefined();
      expect(controller.model.tollFree.areaCodeOptions).toBeDefined();
    });

    it('should have 1 quantity', function () {
      expect(controller.model.pstn.quantity).toEqual(null);
      expect(controller.model.tollFree.quantity).toEqual(1);
    });

    it('should have state set through pstnSetupService on first time', function () {
      expect(controller.model.pstn.state).toEqual(states[0]);
    });

    it('should have showTollFreeNumbers set to false if feature toggle returns false', function () {
      $scope.$apply();
      expect(controller.showTollFreeNumbers).toBe(false);
    });
  });

  describe('orderNumbers', function () {
    it('should default to no orders', function () {
      expect(controller.orderCart).toEqual([]);
      expect(controller.orderNumbersTotal).toEqual(0);
    });

    it('should notify error on Next button action', function () {
      controller.goToReview();
      expect(Notification.error).toHaveBeenCalledWith('pstnSetup.orderNumbersPrompt');
    });

    it('should update with new numbers', function () {
      controller.orderCart = orderCart;
      $scope.$apply();
      expect(controller.orderNumbersTotal).toEqual(6);
      controller.goToReview();
      expect($state.go).toHaveBeenCalledWith('pstnSetup.review');
    });
  });

  describe('showOrderQuantity', function () {
    it('should not show quantity for single order', function () {
      expect(controller.showOrderQuantity(singleOrder)).toBeFalsy();
    });

    it('should not show quantity if is a consecutive order', function () {
      expect(controller.showOrderQuantity(consecutiveOrder)).toBeFalsy();
    });

    it('should show quantity if is nonconsecutive order', function () {
      expect(controller.showOrderQuantity(nonconsecutiveOrder)).toBeTruthy();
    });

    it('should show quantity if is a port order', function () {
      expect(controller.showOrderQuantity(portOrder)).toBeTruthy();
    });

    it('should show quantity if is an advanced order', function () {
      expect(controller.showOrderQuantity(advancedOrder)).toBeTruthy();
    });
  });

  describe('formatTelephoneNumber', function () {
    it('should format a single order', function () {
      expect(controller.formatTelephoneNumber(singleOrder)).toEqual('(214) 555-1000');
    });

    it('should format a consecutive order', function () {
      expect(controller.formatTelephoneNumber(consecutiveOrder)).toEqual('(214) 555-1000 - 1001');
    });

    it('should format a nonconsecutive order', function () {
      expect(controller.formatTelephoneNumber(nonconsecutiveOrder)).toEqual('(214) 555-1XXX');
    });

    it('should format a port order', function () {
      expect(controller.formatTelephoneNumber(portOrder)).toEqual('pstnSetup.portNumbersLabel');
    });

    it('should format an advanced order', function () {
      expect(controller.formatTelephoneNumber(advancedOrder)).toEqual('(' + advancedOrder.data.areaCode + ') XXX-XXXX');
    });

    it('should format an advanced order with nxx', function () {
      expect(controller.formatTelephoneNumber(advancedNxxOrder)).toEqual('(' + advancedNxxOrder.data.areaCode + ') ' + advancedNxxOrder.data.nxx + '-XXXX');
    });
  });

  describe('removeOrder', function () {
    beforeEach(function () {
      controller.orderCart = [singleOrder, consecutiveOrder, nonconsecutiveOrder, portOrder, advancedOrder];
    });

    it('should remove a single order', function () {
      controller.removeOrder(singleOrder);
      $scope.$apply();

      expect(controller.orderCart).not.toContain(singleOrder);
    });

    it('should remove a consecutive order', function () {
      controller.removeOrder(consecutiveOrder);
      $scope.$apply();

      expect(controller.orderCart).not.toContain(consecutiveOrder);
    });

    it('should remove a nonconsecutive order', function () {
      controller.removeOrder(nonconsecutiveOrder);
      $scope.$apply();

      expect(controller.orderCart).not.toContain(nonconsecutiveOrder);
    });

    it('should remove a port order', function () {
      controller.removeOrder(portOrder);
      $scope.$apply();

      expect(controller.orderCart).not.toContain(portOrder);
    });

    it('should remove an advanced order', function () {
      controller.removeOrder(advancedOrder);
      $scope.$apply();

      expect(controller.orderCart).not.toContain(advancedOrder);
    });
  });

  describe('addOrders', function () {
    it('should add an advanced PSTN order', function () {
      controller.model.pstn.areaCode = {
        code: advancedOrder.data.areaCode,
      };
      controller.model.pstn.quantity = advancedOrder.data.length;
      controller.model.pstn.consecutive = advancedOrder.data.consecutive;
      controller.addToCart(PstnSetupService.BLOCK_ORDER, PstnSetupService.NUMTYPE_DID);
      expect(controller.orderCart).toContain({
        data: {
          areaCode: advancedOrder.data.areaCode,
          length: advancedOrder.data.length,
          consecutive: advancedOrder.data.consecutive,
        },
        numberType: PstnSetupService.NUMTYPE_DID,
        orderType: PstnSetupService.BLOCK_ORDER,
      });
    });

    it('should add an advanced toll-free order', function () {
      controller.model.tollFree.areaCode = {
        code: advancedTollFreeOrder.data.areaCode,
      };
      controller.model.tollFree.quantity = advancedTollFreeOrder.data.length;
      controller.model.tollFree.consecutive = advancedTollFreeOrder.data.consecutive;
      controller.addToCart(PstnSetupService.BLOCK_ORDER, PstnSetupService.NUMTYPE_TOLLFREE);
      expect(controller.orderCart).toContain({
        data: {
          areaCode: advancedTollFreeOrder.data.areaCode,
          length: advancedTollFreeOrder.data.length,
          consecutive: advancedTollFreeOrder.data.consecutive,
        },
        numberType: PstnSetupService.NUMTYPE_TOLLFREE,
        orderType: PstnSetupService.BLOCK_ORDER,
      });
    });
  });

});
