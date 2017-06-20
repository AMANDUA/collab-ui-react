'use strict';

describe('Controller: PstnNextStepsCtrl', function () {
  var controller, $controller, $scope, $window, $state, $httpBackend, PstnModel, HuronConfig;

  var customer = getJSONFixture('huron/json/pstnSetup/customer.json');

  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function ($rootScope, _$controller_, _$window_, _$state_, _$httpBackend_, _PstnModel_, _HuronConfig_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $window = _$window_;
    $state = _$state_;
    PstnModel = _PstnModel_;
    $httpBackend = _$httpBackend_;
    HuronConfig = _HuronConfig_;

    PstnModel.setCustomerId(customer.uuid);
    PstnModel.setCustomerName(customer.name);

    spyOn($state, 'href');
    spyOn($window, 'open');

    controller = $controller('PstnNextStepsCtrl', {
      $scope: $scope,
    });

    $httpBackend
      .expectGET(HuronConfig.getTerminusUrl() + '/customers/' + customer.uuid + '/orders?type=PSTN')
      .respond(200);

    $scope.$apply();
  }));

  describe('nextSteps', function () {
    beforeEach(function () {
      controller.launchCustomerPortal();
    });
    it('should create proper url', function () {
      expect($state.href).toHaveBeenCalledWith('login', {
        customerOrgId: customer.uuid,
        customerOrgName: customer.name,
      });
    });

    it('should call $window.open', function () {
      expect($window.open).toHaveBeenCalled();
    });
  });
});
