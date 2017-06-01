'use strict';

describe('DeactivateServiceModalView', function () {
  beforeEach(angular.mock.module('Hercules'));
  var $scope;
  var view;
  var html;

  afterEach(function () {
    if (view) {
      view.remove();
    }
    view = undefined;
  });

  beforeEach(inject(function ($rootScope, $templateCache, $compile) {
    $scope = $rootScope.$new();
    html = $templateCache.get("modules/hercules/resource-settings/deactivate-service-on-expressway-modal.html");
    view = $compile(angular.element(html))($scope);
    $scope.$apply();
  }));

  it('should call deactivateService() when Confirm is clicked', function () {

    $scope.deactivateServiceOnExpresswayModal = {
      deactivateService: jasmine.createSpy('deactivateService'),
    };

    view.find("#confirm").click();
    expect($scope.deactivateServiceOnExpresswayModal.deactivateService.calls.count()).toBe(1);

  });
});
