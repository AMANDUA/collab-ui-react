'use strict';

describe('Service: ExternalNumberService', function () {
  var $rootScope, $httpBackend, $translate, $q, ExternalNumberService, HuronConfig, PstnService, ExternalNumberPool;
  var allNumbers, pendingNumbers, pendingOrders, unassignedNumbers, assignedNumbers, externalNumbers, numberResponse, noNumberResponse, pendingList, pendingAdvanceOrder, malformedAdvanceOrder, malformedAdvanceOrderLabel;
  var customerId, externalNumber, carrierId;

  beforeEach(angular.mock.module('huron.externalNumberService'));

  beforeEach(inject(function (_$rootScope_, _$httpBackend_, _$translate_, _$q_, _ExternalNumberService_, _HuronConfig_, _PstnService_, _ExternalNumberPool_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $translate = _$translate_;
    $q = _$q_;
    ExternalNumberService = _ExternalNumberService_;
    PstnService = _PstnService_;
    ExternalNumberPool = _ExternalNumberPool_;
    HuronConfig = _HuronConfig_;

    customerId = '12345-67890-12345';
    carrierId = '987-654-321';
    externalNumber = {
      uuid: '22222-33333',
      number: '+14795552233',
    };

    pendingNumbers = [{
      pattern: '123',
    }, {
      pattern: '456',
    }];

    pendingOrders = [{
      pattern: '(123) XXX-XXXX',
      quantity: 1,
    }];

    unassignedNumbers = [{
      uuid: '55555555',
      pattern: '555',
    }, {
      uuid: '66666666',
      pattern: '666',
      directoryNumber: null,
    }];

    assignedNumbers = [{
      uuid: '77777777',
      pattern: '777',
      directoryNumber: {
        uuid: '7777-7777',
      },
    }, {
      uuid: '88888888',
      pattern: '888',
      directoryNumber: {
        uuid: '8888-8888',
      },
    }];

    numberResponse = {
      numbers: [1, 2, 3],
    };

    noNumberResponse = {
      numbers: [],
    };

    malformedAdvanceOrder = {
      orderNumber: 654987,
    };

    pendingAdvanceOrder = '(123) XXX-XXXX Quantity: 1';

    malformedAdvanceOrderLabel = 'Order Number 654987';

    externalNumbers = unassignedNumbers.concat(assignedNumbers);
    allNumbers = pendingNumbers.concat(externalNumbers);
    pendingList = pendingNumbers.concat(pendingOrders);

    spyOn(PstnService, 'listPendingNumbers').and.returnValue($q.resolve(pendingList));
    spyOn(PstnService, 'isCarrierSwivel').and.returnValue($q.resolve(false));
    spyOn(PstnService, 'getCustomerV2').and.returnValue($q.resolve({ pstnCarrierId: carrierId }));
    spyOn(PstnService, 'deleteNumber');
    spyOn(ExternalNumberPool, 'deletePool');
    spyOn(ExternalNumberPool, 'getExternalNumbers').and.returnValue($q.resolve(externalNumbers));
    spyOn($translate, 'instant');
  }));

  describe('refreshNumbers', function () {
    it('should query for did (fixed line) numbers only by default', function () {
      ExternalNumberService.refreshNumbers(customerId);
      $rootScope.$apply();

      expect(ExternalNumberPool.getExternalNumbers).toHaveBeenCalledWith(
        customerId,
        ExternalNumberPool.NO_PATTERN_MATCHING,
        ExternalNumberPool.ASSIGNED_AND_UNASSIGNED_NUMBERS,
        ExternalNumberPool.FIXED_LINE_OR_MOBILE);
    });

    it('should query for did numbers only when FIXED_LINE_OR_MOBILE is used', function () {
      ExternalNumberService.refreshNumbers(customerId, ExternalNumberPool.FIXED_LINE_OR_MOBILE);
      $rootScope.$apply();

      expect(ExternalNumberPool.getExternalNumbers).toHaveBeenCalledWith(
        customerId,
        ExternalNumberPool.NO_PATTERN_MATCHING,
        ExternalNumberPool.ASSIGNED_AND_UNASSIGNED_NUMBERS,
        ExternalNumberPool.FIXED_LINE_OR_MOBILE);
    });

    it('should query for all number types when ALL_EXTERNAL_NUMBER_TYPES is used', function () {
      ExternalNumberService.refreshNumbers(customerId, ExternalNumberPool.ALL_EXTERNAL_NUMBER_TYPES);
      $rootScope.$apply();

      expect(ExternalNumberPool.getExternalNumbers).toHaveBeenCalledWith(
        customerId,
        ExternalNumberPool.NO_PATTERN_MATCHING,
        ExternalNumberPool.ASSIGNED_AND_UNASSIGNED_NUMBERS,
        ExternalNumberPool.ALL_EXTERNAL_NUMBER_TYPES);
    });

    it('should query for toll free numbers when TOLL_FREE is used', function () {
      ExternalNumberService.refreshNumbers(customerId, ExternalNumberPool.TOLL_FREE);
      $rootScope.$apply();

      expect(ExternalNumberPool.getExternalNumbers).toHaveBeenCalledWith(
        customerId,
        ExternalNumberPool.NO_PATTERN_MATCHING,
        ExternalNumberPool.ASSIGNED_AND_UNASSIGNED_NUMBERS,
        ExternalNumberPool.TOLL_FREE);
    });
  });

  it('should only retrieve external numbers if not a terminus customer', function () {
    $httpBackend.expectGET(HuronConfig.getCmiV2Url() + '/customers/' + customerId + '/numbers?type=external').respond(numberResponse);
    PstnService.getCustomerV2.and.returnValue($q.reject());

    ExternalNumberService.refreshNumbers(customerId);
    $httpBackend.flush();

    expect(ExternalNumberService.getAllNumbers()).toEqual(externalNumbers);
    expect(ExternalNumberService.getPendingNumbers()).toEqual([]);
    expect(ExternalNumberService.getUnassignedNumbers()).toEqual(unassignedNumbers);
  });

  it('should refresh numbers', function () {
    $translate.instant.and.returnValue('Quantity');
    ExternalNumberService.refreshNumbers();

    $rootScope.$apply();
    expect(ExternalNumberService.getAllNumbers()).toEqual(allNumbers);
    expect(ExternalNumberService.getAssignedNumbers()).toEqual(assignedNumbers);
    expect(ExternalNumberService.getPendingNumbers()).toEqual(pendingNumbers);
    expect(ExternalNumberService.getUnassignedNumbers()).toEqual(unassignedNumbers);
    expect(ExternalNumberService.getPendingOrders()).toContain(jasmine.objectContaining({
      label: pendingAdvanceOrder,
    }));
    expect(ExternalNumberService.getPendingOrderQuantity()).toEqual(1);
  });

  it('should refresh numbers', function () {
    ExternalNumberService.refreshNumbers();
    $rootScope.$apply();

    expect(ExternalNumberService.getQuantity('all')).toEqual(7);
    expect(ExternalNumberService.getQuantity('pending')).toEqual(3);
    expect(ExternalNumberService.getQuantity('unassigned')).toEqual(2);
  });

  it('should refresh numbers and get order number for malformed advance order', function () {
    pendingList.push(malformedAdvanceOrder);
    $translate.instant.and.returnValue('Order Number');
    ExternalNumberService.refreshNumbers();

    $rootScope.$apply();
    expect(ExternalNumberService.getPendingOrders()).toContain(jasmine.objectContaining({
      label: malformedAdvanceOrderLabel,
    }));
  });

  it('should get unassigned numbers that aren\'t pending', function () {
    var unassignedAndPendingNumbers = unassignedNumbers.concat(pendingNumbers);
    var externalNumbers = unassignedAndPendingNumbers.concat(assignedNumbers);
    ExternalNumberPool.getExternalNumbers.and.returnValue($q.resolve(externalNumbers));

    ExternalNumberService.refreshNumbers();

    $rootScope.$apply();
    expect(ExternalNumberService.getAllNumbers()).toEqual(allNumbers);
    expect(ExternalNumberService.getPendingNumbers()).toEqual(pendingNumbers);
    expect(ExternalNumberService.getUnassignedNumbers()).toEqual(unassignedAndPendingNumbers);
    expect(ExternalNumberService.getUnassignedNumbersWithoutPending()).toEqual(unassignedNumbers);
  });

  it('should clear numbers on pending error', function () {
    PstnService.listPendingNumbers.and.returnValue($q.reject({}));
    ExternalNumberService.refreshNumbers();

    $rootScope.$apply();
    expect(ExternalNumberService.getAllNumbers()).toEqual([]);
    expect(ExternalNumberService.getPendingNumbers()).toEqual([]);
    expect(ExternalNumberService.getUnassignedNumbers()).toEqual([]);
  });

  it('should clear only pending numbers on pending 404', function () {
    PstnService.listPendingNumbers.and.returnValue($q.reject({
      status: 404,
    }));
    ExternalNumberService.refreshNumbers();

    $rootScope.$apply();
    expect(ExternalNumberService.getAllNumbers()).toEqual(externalNumbers);
    expect(ExternalNumberService.getPendingNumbers()).toEqual([]);
    expect(ExternalNumberService.getUnassignedNumbers()).toEqual(unassignedNumbers);
  });

  it('should clear numbers on external number error', function () {
    ExternalNumberPool.getExternalNumbers.and.returnValue($q.reject({}));
    ExternalNumberService.refreshNumbers();

    $rootScope.$apply();
    expect(ExternalNumberService.getAllNumbers()).toEqual([]);
    expect(ExternalNumberService.getPendingNumbers()).toEqual([]);
    expect(ExternalNumberService.getUnassignedNumbers()).toEqual([]);
  });

  it('should delete numbers from terminus', function () {
    ExternalNumberService.deleteNumber(customerId, externalNumber);
    $rootScope.$apply();

    expect(PstnService.deleteNumber).toHaveBeenCalledWith(customerId, externalNumber.number);
    expect(ExternalNumberPool.deletePool).not.toHaveBeenCalled();
  });

  it('should delete numbers from cmi instead of Terminus', function () {
    $httpBackend.expectGET(HuronConfig.getCmiV2Url() + '/customers/' + customerId + '/numbers?type=external').respond(numberResponse);
    PstnService.getCustomerV2.and.returnValue($q.reject());

    ExternalNumberService.deleteNumber(customerId, externalNumber);
    $httpBackend.flush();

    expect(PstnService.deleteNumber).not.toHaveBeenCalled();
    expect(ExternalNumberPool.deletePool).toHaveBeenCalledWith(customerId, externalNumber.uuid);
  });

  describe('isTerminus customer function', function () {
    it('should return true for existing Terminus customer', function () {
      var carrierInfo = { "apiImplementation": "INTELEPEER" };
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/carriers/' + carrierId).respond(carrierInfo);
      ExternalNumberService.isTerminusCustomer(customerId).then(function (response) {
        expect(response).toBe(true);
        var result = ExternalNumberService.getCarrierInfo(customerId);
        expect(result).toEqual(carrierInfo);
      });
    });

    it('should return true for no Terminus customer and has no numbers', function () {
      $httpBackend.expectGET(HuronConfig.getCmiV2Url() + '/customers/' + customerId + '/numbers?type=external').respond(noNumberResponse);
      PstnService.getCustomerV2.and.returnValue($q.reject());
      var value = ExternalNumberService.isTerminusCustomer(customerId);
      $httpBackend.flush();
      $q.resolve(value).then(function (response) {
        expect(response).toBe(true);
      });
    });

    it('should return false for no Terminus customer and has numbers', function () {
      $httpBackend.expectGET(HuronConfig.getCmiV2Url() + '/customers/' + customerId + '/numbers?type=external').respond(numberResponse);
      PstnService.getCustomerV2.and.returnValue($q.reject());
      var value = ExternalNumberService.isTerminusCustomer(customerId);
      $httpBackend.flush();
      $q.resolve(value).then(function (response) {
        expect(response).toBe(false);
      });
    });
  });

});
