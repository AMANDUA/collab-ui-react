'use strict';

describe('Controller: ExternalNumberDetailCtrl', function () {
  var controller, $controller, $interval, $intervalSpy, $q, $scope, $state, $stateParams,
    ModalService, ExternalNumberService, DialPlanService, Notification, ExternalNumberPool;

  var externalNumbers, modalDefer;

  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function ($rootScope, _$controller_, _$interval_, _$stateParams_, _$q_, _$state_,
      _ModalService_, _ExternalNumberService_, _DialPlanService_, _Notification_, _ExternalNumberPool_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $state = _$state_;
    $stateParams = _$stateParams_;
    ModalService = _ModalService_;
    ExternalNumberService = _ExternalNumberService_;
    DialPlanService = _DialPlanService_;
    Notification = _Notification_;
    ExternalNumberPool = _ExternalNumberPool_;
    $q = _$q_;
    $interval = _$interval_;

    $stateParams.currentCustomer = {
      customerOrgId: '5555-6666'
    };

    externalNumbers = [{
      'pattern': '123'
    }, {
      'pattern': '456'
    }];

    modalDefer = $q.defer();
    spyOn($interval, 'cancel').and.callThrough();
    spyOn($state, 'go');
    $intervalSpy = jasmine.createSpy('$interval', $interval);
    $intervalSpy.and.callThrough();
    spyOn(ExternalNumberService, 'getAllNumbers').and.returnValue(externalNumbers);
    spyOn(ExternalNumberService, 'refreshNumbers').and.returnValue($q.when());
    spyOn(ExternalNumberService, 'deleteNumber').and.returnValue($q.when());
    spyOn(ExternalNumberService, 'isTerminusCustomer').and.returnValue($q.when());
    spyOn(ExternalNumberService, 'setAllNumbers');
    spyOn(ModalService, 'open').and.returnValue({
      result: modalDefer.promise
    });
    spyOn(Notification, 'success');
    spyOn(Notification, 'errorResponse');
    spyOn(DialPlanService, 'getCustomerDialPlanCountryCode').and.returnValue($q.when('+1'));

    controller = $controller('ExternalNumberDetailCtrl', {
      $scope: $scope,
      $interval: $intervalSpy
    });

    $scope.$apply();
  }));

  afterEach(function () {
    controller = undefined;
    $controller = undefined;
    $interval = undefined;
    $intervalSpy = undefined;
    $q = undefined;
    $scope = undefined;
    $state = undefined;
    $stateParams = undefined;
    ModalService = undefined;
    ExternalNumberService = undefined;
    DialPlanService = undefined;
    Notification = undefined;
    ExternalNumberPool = undefined;
    externalNumbers = undefined;
    modalDefer = undefined;
  });

  it('should load all the phone numbers', function () {
    expect(controller.allNumbers).toEqual(externalNumbers);
  });

  describe('listPhoneNumbers', function () {
    it('should query for all number types', function () {
      controller.listPhoneNumbers();
      $scope.$apply();

      expect(ExternalNumberService.refreshNumbers).toHaveBeenCalledWith(
        $stateParams.currentCustomer.customerOrgId,
        ExternalNumberPool.ALL_EXTERNAL_NUMBER_TYPES);
    });
  });

  it('should refresh list of phone numbers', function () {
    var newNumbers = externalNumbers.concat([{
      'pattern': '789'
    }, {
      'pattern': '000'
    }]);
    ExternalNumberService.getAllNumbers.and.returnValue(newNumbers);
    controller.listPhoneNumbers();
    $scope.$apply();
    expect(controller.allNumbers.length).toEqual(4);
  });

  it('should show no numbers on error', function () {
    ExternalNumberService.refreshNumbers.and.returnValue($q.reject());
    ExternalNumberService.getAllNumbers.and.returnValue([]);
    controller.listPhoneNumbers();
    $scope.$apply();
    expect(Notification.errorResponse).toHaveBeenCalled();
    expect(controller.allNumbers).toEqual([]);
  });

  it('should show no numbers if no customer found', function () {
    ExternalNumberService.getAllNumbers.and.callThrough();
    delete $stateParams.currentCustomer.customerOrgId;
    controller = $controller('ExternalNumberDetailCtrl', {
      $scope: $scope
    });
    $scope.$apply();
    expect(controller.allNumbers).toEqual([]);
  });

  it('should delete number on modal close', function () {
    controller.deleteNumber(externalNumbers[0]);
    modalDefer.resolve();
    $scope.$apply();

    expect(ExternalNumberService.setAllNumbers).toHaveBeenCalledWith([externalNumbers[1]]);
    expect(Notification.success).toHaveBeenCalled();
  });

  it('should notify error when delete fails', function () {
    ExternalNumberService.deleteNumber.and.returnValue($q.reject());
    controller.deleteNumber(externalNumbers[0]);
    modalDefer.resolve();
    $scope.$apply();

    expect(controller.allNumbers.length).toEqual(2);
    expect(Notification.errorResponse).toHaveBeenCalled();
  });

  it('should not delete number on modal dismiss', function () {
    controller.deleteNumber(externalNumbers[0]);
    modalDefer.reject();
    $scope.$apply();

    expect(controller.allNumbers.length).toEqual(2);
    expect(Notification.success).not.toHaveBeenCalled();
  });

  it('should cancel( the timeout on destroy method', function () {
    $scope.$destroy();
    expect($intervalSpy.cancel.calls.count()).toEqual(1);
  });
});
