'use strict';

describe('MultipleSubscriptionsCtrl: Ctrl', function () {
  var $scope, $httpBackend, controller, $q, Orgservice, Authinfo;
  var getLicensesUsage;
  var $controller;

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function ($rootScope, _$controller_, _$httpBackend_, _$q_, _Orgservice_, _Authinfo_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    Orgservice = _Orgservice_;
    Authinfo = _Authinfo_;

    getLicensesUsage = getJSONFixture('core/json/organizations/Orgservice.json').getLicensesUsage;
    spyOn(Orgservice, 'getLicensesUsage').and.returnValue($q.resolve());
    spyOn(Authinfo, 'getLicenses').and.returnValue('anything');
  }));

  function initController() {
    controller = $controller('MultipleSubscriptionsCtrl', {
      $scope: $scope,
    });

    $scope.$apply();
  }

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('MultipleSubscriptionsCtrl controller', function () {

    describe('for single subscriptions', function () {
      beforeEach(function () {
        Orgservice.getLicensesUsage.and.returnValue($q.resolve(getLicensesUsage.singleSub));
        initController();
      });

      it('should verify that there is one subscriptionId', function () {
        expect('getLicenses').toBeDefined();
        expect(Orgservice.getLicensesUsage).toHaveBeenCalled();
        expect(controller.oneBilling).toEqual(true);
        expect(controller.subscriptionOptions).toEqual(['srvcid-integ-uitest-1a']);
        expect(controller.showLicenses('srvcid-integ-uitest-1a', false)).toEqual(true);
      });
    });

    describe('for multiple subscriptions', function () {
      beforeEach(function () {
        Orgservice.getLicensesUsage.and.returnValue($q.resolve(getLicensesUsage.multiSub));
        initController();
      });

      it('should verify that there are multiple subscriptionIds', function () {
        expect(controller.oneBilling).toEqual(false);
        expect(controller.subscriptionOptions).toEqual(['svcid-integ-sunnyway-1a', 'svcid-integ-sunnyway-1']);
        expect(controller.selectedSubscription).toEqual('svcid-integ-sunnyway-1a');
        expect(controller.showLicenses('svcid-integ-sunnyway-1a', false)).toEqual(true);
      });

    });

    describe('for trial subscriptions', function () {
      beforeEach(function () {
        Orgservice.getLicensesUsage.and.returnValue($q.resolve(getLicensesUsage.trialSub));
        initController();
      });

      it('should verify there is a trial subscription', function () {
        expect(controller.oneBilling).toEqual(false);
        expect(controller.showLicenses('', true)).toEqual(true);
      });
    });

    describe('for care trial subscriptions', function () {
      beforeEach(function () {
        initController();
      });

      it('should verify that there is a trial subscription', function () {
        expect(controller.oneBilling).toEqual(false);
        expect(controller.showCareLicenses(getLicensesUsage.careK1K2TrialSub)).toEqual(true);
        expect(controller.showCareLicenses(getLicensesUsage.careK1TrialSub)).toEqual(true);
        expect(controller.showCareLicenses(getLicensesUsage.careK2TrialSub)).toEqual(true);
      });

      it('should verify that there is no trial subscription', function () {
        controller.selectedSubscription = 'xyz';
        expect(controller.oneBilling).toEqual(false);
        expect(controller.showCareLicenses(getLicensesUsage.careFakeTrialSub)).toEqual(undefined);
      });
    });


  });
});
