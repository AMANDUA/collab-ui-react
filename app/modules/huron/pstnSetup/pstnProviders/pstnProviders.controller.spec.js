'use strict';

describe('Controller: PstnProvidersCtrl', function () {
  var controller, $controller, $scope, $q, $state, PstnSetup, PstnSetupService, PstnServiceAddressService, Notification, FeatureToggleService;

  var carrierList = getJSONFixture('huron/json/pstnSetup/carrierList.json');
  var customer = getJSONFixture('huron/json/pstnSetup/customer.json');
  var customerCarrierList = getJSONFixture('huron/json/pstnSetup/customerCarrierList.json');
  var swivelCustomerCarrierList = getJSONFixture('huron/json/pstnSetup/swivelCustomerCarrierList.json');
  var resellerCarrierList = getJSONFixture('huron/json/pstnSetup/resellerCarrierList.json');
  var customerSiteList = getJSONFixture('huron/json/pstnSetup/customerSiteList.json');
  var INTELEPEER = require('modules/huron/pstn').INTELEPEER;
  var TATA = require('modules/huron/pstn').TATA;
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function ($rootScope, _$controller_, _$q_, _$state_, _PstnSetup_, _PstnSetupService_, _PstnServiceAddressService_, _Notification_, _FeatureToggleService_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $q = _$q_;
    $state = _$state_;
    PstnSetup = _PstnSetup_;
    PstnSetupService = _PstnSetupService_;
    PstnServiceAddressService = _PstnServiceAddressService_;
    Notification = _Notification_;
    FeatureToggleService = _FeatureToggleService_;

    PstnSetup.setCustomerId(customer.uuid);
    PstnSetup.setCustomerName(customer.name);

    spyOn(PstnSetupService, 'getCustomer').and.returnValue($q.resolve());
    spyOn(PstnSetupService, 'listCustomerCarriers').and.returnValue($q.resolve(customerCarrierList));
    spyOn(PstnSetupService, 'listResellerCarriers').and.returnValue($q.resolve(resellerCarrierList));
    spyOn(PstnSetupService, 'listDefaultCarriers').and.returnValue($q.resolve(carrierList));
    spyOn(PstnServiceAddressService, 'listCustomerSites').and.returnValue($q.resolve(customerSiteList));
    spyOn(PstnSetup, 'setSingleCarrierReseller');
    spyOn(PstnSetup, 'clearProviderSpecificData');
    spyOn(Notification, 'errorResponse');
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(false));
    spyOn($state, 'go');
  }));

  describe('init', function () {
    it('should be initialized with customers carrier Intelepeer and transition to numbers state', function () {
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers).toEqual([jasmine.objectContaining({
        name: INTELEPEER,
        vendor: INTELEPEER,
      })]);
      expect($state.go).toHaveBeenCalledWith('pstnSetup.orderNumbers');
      expect(PstnSetup.isCustomerExists()).toEqual(true);
      expect(PstnSetup.isCarrierExists()).toEqual(true);
      expect(PstnSetup.isResellerExists()).toEqual(false);
      expect(PstnSetup.isSiteExists()).toEqual(true);
    });

    it('should be initialized Intelepeer-Swivel and transition to swivel state', function () {
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      PstnSetupService.listCustomerCarriers.and.returnValue($q.resolve(swivelCustomerCarrierList));
      $scope.$apply();

      expect(controller.providers).toEqual([jasmine.objectContaining({
        name: 'INTELEPEER-SWIVEL',
        vendor: INTELEPEER,
      })]);
      expect($state.go).toHaveBeenCalledWith('pstnSetup.swivelNumbers');
      expect(PstnSetup.isCustomerExists()).toEqual(true);
      expect(PstnSetup.isCarrierExists()).toEqual(true);
      expect(PstnSetup.isResellerExists()).toEqual(false);
      expect(PstnSetup.isSiteExists()).toEqual(true);
    });

    it('should be initialized with customers carrier Intelepeer and transition to service address if site doesn\'t exist', function () {
      PstnServiceAddressService.listCustomerSites.and.returnValue($q.resolve([]));
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers).toEqual([jasmine.objectContaining({
        name: INTELEPEER,
        vendor: INTELEPEER,
      })]);
      expect($state.go).toHaveBeenCalledWith('pstnSetup.serviceAddress');
      expect(PstnSetup.isCustomerExists()).toEqual(true);
      expect(PstnSetup.isCarrierExists()).toEqual(true);
      expect(PstnSetup.isResellerExists()).toEqual(false);
      expect(PstnSetup.isSiteExists()).toEqual(false);
    });

    it('should be initialized with default carriers if customer doesnt exist', function () {
      PstnSetupService.getCustomer.and.returnValue($q.reject({
        status: 404,
      }));
      PstnSetupService.listResellerCarriers.and.returnValue($q.resolve([]));
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers).toEqual([jasmine.objectContaining({
        name: INTELEPEER,
        vendor: INTELEPEER,
      }), jasmine.objectContaining({
        name: TATA,
        vendor: TATA,
      })]);
      expect($state.go).not.toHaveBeenCalled();
      expect(PstnSetup.isCustomerExists()).toEqual(false);
      expect(PstnSetup.isCarrierExists()).toEqual(false);
      expect(PstnSetup.isResellerExists()).toEqual(true);
      expect(PstnSetup.isSiteExists()).toEqual(true);
    });

    it('should be initialized with default carriers if customer and reseller carriers don\'t exist', function () {
      PstnSetupService.listCustomerCarriers.and.returnValue($q.reject({
        status: 404,
      }));
      PstnSetupService.listResellerCarriers.and.returnValue($q.reject({
        status: 404,
      }));
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers).toEqual([jasmine.objectContaining({
        name: INTELEPEER,
        vendor: INTELEPEER,
      }), jasmine.objectContaining({
        name: TATA,
        vendor: TATA,
      })]);
      expect($state.go).not.toHaveBeenCalled();
      expect(PstnSetup.isCustomerExists()).toEqual(true);
      expect(PstnSetup.isCarrierExists()).toEqual(false);
      expect(PstnSetup.isResellerExists()).toEqual(false);
      expect(PstnSetup.isSiteExists()).toEqual(true);
    });

    it('should clear provider data when switching between provider selections', function () {
      PstnSetupService.listCustomerCarriers.and.returnValue($q.reject({
        status: 404,
      }));
      PstnSetupService.listResellerCarriers.and.returnValue($q.resolve([]));
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers.length).toEqual(2);
      expect(PstnSetup.clearProviderSpecificData).not.toHaveBeenCalled();
      PstnSetup.clearProviderSpecificData.calls.reset();

      controller.selectProvider(controller.providers[0]);
      expect(PstnSetup.clearProviderSpecificData).toHaveBeenCalled();
      PstnSetup.clearProviderSpecificData.calls.reset();

      controller.selectProvider(controller.providers[0]);
      expect(PstnSetup.clearProviderSpecificData).not.toHaveBeenCalled();
      PstnSetup.clearProviderSpecificData.calls.reset();

      controller.selectProvider(controller.providers[1]);
      expect(PstnSetup.clearProviderSpecificData).toHaveBeenCalled();
    });

    it('should be initalized with single reseller carrier and skip provider selection, going to contract info', function () {
      PstnSetupService.getCustomer.and.returnValue($q.reject({
        status: 404,
      }));
      PstnSetupService.listResellerCarriers.and.returnValue($q.resolve(resellerCarrierList));
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers).toEqual([jasmine.objectContaining({
        name: INTELEPEER,
        vendor: INTELEPEER,
      })]);
      expect(PstnSetup.setSingleCarrierReseller).toHaveBeenCalledWith(true);
      expect($state.go).toHaveBeenCalledWith('pstnSetup.contractInfo');
      expect(PstnSetup.isCustomerExists()).toEqual(false);
      expect(PstnSetup.isCarrierExists()).toEqual(false);
      expect(PstnSetup.isResellerExists()).toEqual(true);
      expect(PstnSetup.isSiteExists()).toEqual(true);
    });

    it('should notify an error if customer carriers fail to load', function () {
      PstnSetupService.listCustomerCarriers.and.returnValue($q.reject({}));
      PstnSetupService.listResellerCarriers.and.returnValue($q.resolve([]));
      PstnSetupService.listDefaultCarriers.and.returnValue($q.resolve([]));
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers).toEqual([]);
      expect(Notification.errorResponse).toHaveBeenCalled();
      expect(PstnSetup.isCustomerExists()).toEqual(true);
      expect(PstnSetup.isCarrierExists()).toEqual(false);
      expect(PstnSetup.isResellerExists()).toEqual(false);
      expect(PstnSetup.isSiteExists()).toEqual(true);
    });

    it('should notify an error if customer doesnt exist and reseller carriers fail to load', function () {
      PstnSetupService.getCustomer.and.returnValue($q.reject({
        status: 404,
      }));
      PstnSetupService.listResellerCarriers.and.returnValue($q.reject());
      controller = $controller('PstnProvidersCtrl', {
        $scope: $scope,
      });
      $scope.$apply();

      expect(controller.providers).toEqual([]);
      expect(Notification.errorResponse).toHaveBeenCalled();
      expect(PstnSetup.isCustomerExists()).toEqual(false);
      expect(PstnSetup.isCarrierExists()).toEqual(false);
      expect(PstnSetup.isResellerExists()).toEqual(false);
      expect(PstnSetup.isSiteExists()).toEqual(true);
    });
  });

});
