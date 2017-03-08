'use strict';

describe('Controller: FusionClusterListController', function () {
  var controller, $controller, $q, $rootScope, Analytics, Authinfo, FusionClusterService, Notification;

  beforeEach(angular.mock.module('Squared'));
  beforeEach(angular.mock.module('Hercules'));
  beforeEach(inject(dependencies));
  beforeEach(initSpies);

  function dependencies(_$rootScope_, _$controller_, _$q_, _Analytics_, _Authinfo_, _FusionClusterService_, _Notification_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $q = _$q_;
    Analytics = _Analytics_;
    Authinfo = _Authinfo_;
    FusionClusterService = _FusionClusterService_;
    Notification = _Notification_;
  }

  function initSpies() {
    spyOn(FusionClusterService, 'getAll');
    spyOn(Analytics, 'trackHSNavigation');
    spyOn(Notification, 'errorWithTrackingId');
    spyOn(Authinfo, 'isEntitled').and.returnValue(true);
  }

  function initController() {
    controller = $controller('FusionClusterListController', {
      hasResourceGroupFeatureToggle: false,
      hasCucmSupportFeatureToggle: true,
    });
  }

  describe('init', function () {
    beforeEach(function () {
      FusionClusterService.getAll.and.returnValue($q.resolve());
      initController();
    });

    it('should be loading', function () {
      expect(controller.loading).toBe(true);
    });

    it('should have 0 clusters to be displayed', function () {
      expect(controller.displayedClusters).toEqual([]);
    });
  });

  describe('after loading clusters', function () {
    it('should call Notification.errorWithTrackingId if loading failed', function () {
      FusionClusterService.getAll.and.returnValue($q.reject());
      initController();
      expect(controller.loading).toBe(true);
      expect(Notification.errorWithTrackingId).not.toHaveBeenCalled();
      $rootScope.$apply(); // force FusionClusterService.getAll() to return
      expect(controller.loading).toBe(false);
      expect(Notification.errorWithTrackingId).toHaveBeenCalled();
    });

    it('should update filters and displayed clusters', function () {
      FusionClusterService.getAll.and.returnValue($q.resolve([{
        targetType: 'c_mgmt',
        connectors: [{
          alarms: [],
          connectorType: 'c_mgmt',
          runningState: 'running',
          hostname: 'a.elg.no',
        }],
      }, {
        targetType: 'mf_mgmt',
        connectors: [{
          alarms: [],
          connectorType: 'mf_mgmt',
          runningState: 'running',
          hostname: 'a.elg.no',
        }],
      }, {
        targetType: 'cs_mgmt',
        connectors: [{
          alarms: [],
          connectorType: 'cs_mgmt',
          runningState: 'running',
          hostname: 'a.elg.no',
        }],
      }, {
        targetType: 'ucm_mgmt',
        connectors: [{
          alarms: [],
          connectorType: 'ucm_mgmt',
          runningState: 'running',
          hostname: 'a.elg.no',
        }],
      }]));
      initController();
      expect(controller.filters[0].count).toBe(0);
      expect(controller.filters[1].count).toBe(0);
      expect(controller.filters[2].count).toBe(0);
      expect(controller.filters[3].count).toBe(0);
      expect(controller.filters[4].count).toBe(0);
      expect(controller.displayedClusters.length).toBe(0);
      $rootScope.$apply(); // force FusionClusterService.getAll() to return
      expect(controller.filters[0].count).toBe(1);
      expect(controller.filters[1].count).toBe(1);
      expect(controller.filters[2].count).toBe(0);
      expect(controller.filters[3].count).toBe(1);
      expect(controller.filters[4].count).toBe(1);
      expect(controller.displayedClusters.length).toBe(4);
    });

  });

});
