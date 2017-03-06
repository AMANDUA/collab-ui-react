'use strict';

describe('Controller: LineListCtrl', function () {
  var controller, $controller, $q, $scope, $timeout, FeatureToggleService, LineListService, Notification;

  var lines = getJSONFixture('huron/json/lines/numbers.json');

  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$q_, $rootScope, _$controller_, _$timeout_, _FeatureToggleService_, _LineListService_, _Notification_) {
    $q = _$q_;
    $timeout = _$timeout_;
    $controller = _$controller_;
    $scope = $rootScope.$new();
    FeatureToggleService = _FeatureToggleService_;
    LineListService = _LineListService_;
    Notification = _Notification_;

    spyOn(Notification, 'errorResponse');
    spyOn(Notification, 'error');

    spyOn(LineListService, 'getLineList').and.returnValue($q.resolve(lines));
    spyOn(FeatureToggleService, 'supports');

    controller = $controller('LinesListCtrl', {
      $scope: $scope,
    });

    $scope.$apply();
    $timeout.flush();
  }));

  describe('after initialization', function () {
    it('LineListCtrl should be created successfully', function () {
      expect(controller).toBeDefined();
    });

    it('should have filters and placeholders', function () {
      expect(controller.filters).toBeDefined();
      expect(controller.placeholder).toBeDefined();
    });

    it('should have grid data', function () {
      expect($scope.gridData.length).toBe(3);
    });
  });

  describe('filter', function () {
    beforeEach(function () {
      LineListService.getLineList.calls.reset();
    });

    it('should exist', function () {
      expect(controller.setFilter).toBeDefined();
    });

    it('should call getLineList with filter assignedLines', function () {
      FeatureToggleService.supports.and.returnValue($q.resolve(true));

      controller.setFilter('assignedLines');
      $scope.$apply();

      expect(LineListService.getLineList.calls.count()).toEqual(1);
      expect(LineListService.getLineList).toHaveBeenCalledWith(0, 100, 'userid', '-asc', '', 'assignedLines', $scope.gridData);
    });

    it('should call getLineList with filter unassignedLines', function () {
      FeatureToggleService.supports.and.returnValue($q.resolve(true));

      controller.setFilter('unassignedLines');
      $scope.$apply();

      expect(LineListService.getLineList.calls.count()).toEqual(1);
      expect(LineListService.getLineList).toHaveBeenCalledWith(0, 100, 'userid', '-asc', '', 'unassignedLines', $scope.gridData);
    });
  });

  describe('getLineList with exception', function () {
    it('should display notification on exception', function () {
      LineListService.getLineList.and.returnValue($q.reject());
      controller = $controller('LinesListCtrl', {
        $scope: $scope,
      });
      $scope.$apply();
      expect(Notification.errorResponse).toHaveBeenCalled();
    });
  });

  describe('getLineList sort event', function () {
    it('should getLineList with sort parameters', function () {
      LineListService.getLineList.calls.reset();

      var sortColumns = [{
        'name': 'internalnumber',
        'sort': {
          'direction': 'asc',
        },
      }];

      controller.sortColumn($scope, sortColumns);
      expect(LineListService.getLineList.calls.count()).toEqual(1);
      expect(LineListService.getLineList).toHaveBeenCalledWith(0, 100, 'internalnumber', '-asc', '', 'all', $scope.gridData);
    });
  });

  describe('search pattern filter', function () {
    beforeEach(function () {
      LineListService.getLineList.calls.reset();
    });

    it('should exist', function () {
      expect(controller.filterList).toBeDefined();
    });

    it('should call getLineList with filter', function () {
      controller.filterList('abc');
      $timeout.flush();

      expect(LineListService.getLineList.calls.count()).toEqual(1);
      expect(LineListService.getLineList).toHaveBeenCalledWith(0, 100, 'userid', '-asc', 'abc', 'all', $scope.gridData);
    });
  });

});
