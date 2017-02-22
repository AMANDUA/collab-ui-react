'use strict';

describe('Controller: OrganizationFeaturesCtrl', function () {
  var controller, $scope, $stateParams, $q, FeatureToggleService, Notification;
  var featureToggles = [{
    key: 'feature-toggle',
    val: true,
  }];

  var data = {
    featureToggles: featureToggles,
  };

  var currentOrg = {
    id: 1,
  };

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$stateParams_, $rootScope, _FeatureToggleService_, _Notification_, _$q_, $controller) {
    $scope = $rootScope.$new();
    $stateParams = _$stateParams_;
    FeatureToggleService = _FeatureToggleService_;
    Notification = _Notification_;
    $q = _$q_;

    $stateParams.currentOrganization = currentOrg;

    spyOn(Notification, 'error');
    spyOn(FeatureToggleService, 'getFeaturesForOrg');
    spyOn(FeatureToggleService, 'generateFeatureToggleRule');
    spyOn(FeatureToggleService, 'setFeatureToggles');
    FeatureToggleService.getFeaturesForOrg = jasmine.createSpy().and.returnValue($q.resolve(data));
    FeatureToggleService.generateFeatureToggleRule = jasmine.createSpy().and.returnValue({});

    controller = $controller('OrganizationFeaturesCtrl', {
      $stateParams: $stateParams,
      $scope: $scope,
      $q: $q,
      FeatureToggleService: FeatureToggleService,
      Notification: Notification,
    });
    $scope.$apply();
  }));

  it('should set the defaults to match the current state', function () {
    expect(controller.defaults.length).toBe(controller.toggles.length);
  });

  it('should auto-fire a post to the service on toggle state change', function () {
    FeatureToggleService.setFeatureToggles = jasmine.createSpy().and.returnValue($q.resolve());
    // mock click action
    var toggle = controller.toggles[0];
    toggle.model = !toggle.model;

    // invoke click callback
    controller.handleClick(toggle);
    expect(FeatureToggleService.generateFeatureToggleRule).toHaveBeenCalled();
    expect(FeatureToggleService.setFeatureToggles).toHaveBeenCalled();
  });
});
