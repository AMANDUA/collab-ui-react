'use strict';

describe('LeaderBoard', function () {
  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('WebExApp'));

  var $controller, $q, $scope, controller, Orgservice, TrialService, WebExUtilsFact;
  var usageOnlySharedDevicesFixture = getJSONFixture('core/json/organizations/usageOnlySharedDevices.json');

  afterEach(function () {
    $controller = $q = $scope = controller = Orgservice = TrialService = WebExUtilsFact = undefined;
  });

  afterAll(function () {
    usageOnlySharedDevicesFixture = undefined;
  });

  beforeEach(inject(function (_$controller_, _$q_, $rootScope, _Orgservice_, _TrialService_, _WebExUtilsFact_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $q = _$q_;
    Orgservice = _Orgservice_;
    TrialService = _TrialService_;
    WebExUtilsFact = _WebExUtilsFact_;

    spyOn(Orgservice, 'getLicensesUsage').and.returnValue($q.when(usageOnlySharedDevicesFixture));
    spyOn(TrialService, 'getDaysLeftForCurrentUser').and.returnValue($q.when());
    spyOn(WebExUtilsFact, 'isCIEnabledSite').and.returnValue(false);
    spyOn(WebExUtilsFact, 'getSiteAdminUrl').and.returnValue('https://siteAdminUrl.junk.com');
  }));

  function initController() {
    controller = $controller('leaderBoardCtrl', {
      $scope: $scope
    });
    $scope.$apply();
  }

  describe('when organization has only Shared Devices', function () {
    beforeEach(initController);

    it('should aggregate the Shared Devices volume', function () {
      expect(controller.roomSystemsCount).toBe(20);
    });
  });
});
