'use strict';

describe('Controller: SubscriptionHeaderCtrl', function () {
  let $scope, rootscope, controller, Authinfo;

  beforeEach(angular.mock.module('Core'));

  beforeEach(inject(function ($rootScope, $controller, _Authinfo_) {
    rootscope = $rootScope;
    $scope = $rootScope.$new();
    Authinfo = _Authinfo_;

    spyOn(Authinfo, 'isOnline').and.returnValue(true);

    controller = $controller('SubscriptionHeaderCtrl', {
      $scope: $scope,
      Authinfo: Authinfo,
    });
    $scope.$apply();
  }));

  it('should default to all false or undefined', function () {
    expect(controller.isTrial).toBeFalsy();
    expect(controller.isOnline).toBeTruthy();
    expect(controller.upgradeUrl).toBe(undefined);
  });

  it('should update on broadcast', function () {
    rootscope.$broadcast('SUBSCRIPTION::upgradeData', {
      isTrial: true,
      productInstanceId: 'productInstanceId',
      upgradeTrialUrl: 'Url',
    });
    expect(controller.isTrial).toBeTruthy();
    expect(controller.productInstanceId).toBe('productInstanceId');
    expect(controller.upgradeTrialUrl).toBe('Url');
  });
});
