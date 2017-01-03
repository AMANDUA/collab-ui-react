'use strict';

describe('Controller: LaunchSiteCtrl', function () {

  // load the controller's module
  beforeEach(angular.mock.module('Core'));

  var scope;

  afterEach(function () {
    scope = undefined;
  });

  // Initialize the controller and mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    $controller('LaunchSiteCtrl', {
      $scope: scope
    });
  }));

  it('should get a proper ID from "http://atlas.test.com:123"', function () {
    expect(scope.getId('http://atlas.test.com:123')).toEqual('atlas-test-com');
  });
});
