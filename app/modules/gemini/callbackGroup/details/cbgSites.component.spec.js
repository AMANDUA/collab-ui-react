'use strict';

describe('Component: cbgSites', function () {
  var $q, $modal, $window, $state, $scope, $componentCtrl;
  var ctrl, cbgService, PreviousState, Notification;
  var cbgs = getJSONFixture('gemini/callbackGroups.json');
  var preData = getJSONFixture('gemini/common.json');

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Gemini'));
  beforeEach(inject(dependencies));
  beforeEach(initSpies);
  beforeEach(initController);

  afterEach(function () {
    $q = $modal = $window = $state = $scope = $componentCtrl = ctrl = cbgService = PreviousState = Notification = undefined;
  });
  afterAll(function () {
    cbgs = preData = undefined;
  });

  function dependencies(_$q_, _$state_, _$rootScope_, _$componentController_, _$modal_, _$window_, _cbgService_, _PreviousState_, _Notification_) {
    $q = _$q_;
    $state = _$state_;
    $modal = _$modal_;
    $window = _$window_;
    cbgService = _cbgService_;
    $scope = _$rootScope_.$new();
    Notification = _Notification_;
    PreviousState = _PreviousState_;
    $componentCtrl = _$componentController_;
  }

  function initSpies() {
    spyOn($window, 'open');
    spyOn(PreviousState, 'go');
    spyOn(Notification, 'notify');
    spyOn(cbgService, 'moveSite').and.returnValue($q.resolve());
    spyOn($modal, 'open').and.returnValue({ result: $q.resolve() });
  }

  function initController() {
    $state.current.data = {};
    ctrl = $componentCtrl('cbgSites', { $scope: $scope, $state: $state });
  }

  it('$onInit', function () {
    ctrl.cbgs = cbgs.content.data.body;
    ctrl.$onInit();
    $scope.$apply();
    expect($state.current.data.displayName).toBeDefined();
  });

  describe('click event', function () {
    it('should moveSite', function () {
      var moveSiteResponse = preData.common;
      moveSiteResponse.content.data.returnCode = 0;
      var site = {
        siteId: 'ff808081582992dd01589a5b232410bb',
        siteUrl: 'atlascca1.qa.webex.com'
      };
      ctrl.sites = [
        {
          siteId: 'ff808081582992dd01589a5b232410bb',
          siteUrl: 'atlascca1.qa.webex.com'
        },
        {
          siteId: 'ff808081582992dd01589a5b232ccccc',
          siteUrl: 'atlascca2.qa.webex.com'
        }
      ];
      var toGroupId = 'ff8080815708077601581a417ded1a1e';
      cbgService.moveSite.and.returnValue($q.resolve(moveSiteResponse));
      ctrl.onClick(site, toGroupId);
      $scope.$apply();
      expect(ctrl.sites.length).toBe(1);
    });

    it('should call Notification.notify in onmoveSite', function () {
      var moveSiteResponse = preData.common;
      moveSiteResponse.content.data.returnCode = 1000;
      var site = {
        siteId: 'ff808081582992dd01589a5b232410bb',
        siteUrl: 'atlascca1.qa.webex.com'
      };
      var toGroupId = 'ff8080815708077601581a417ded1a1e';
      cbgService.moveSite.and.returnValue($q.resolve(moveSiteResponse));
      ctrl.onClick(site, toGroupId);
      $scope.$apply();
      expect(Notification.notify).toHaveBeenCalled();
    });

    it('should cann PreviousState.go in oncancel', function () {
      ctrl.onCancel();
      $scope.$apply();
      expect(PreviousState.go).toHaveBeenCalled();
    });
  });
});
