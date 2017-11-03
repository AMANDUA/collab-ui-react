'use strict';

var ediscoveryModule = require('./ediscovery.module');
describe('Controller: EdiscoveryReportsController', function () {
  beforeEach(angular.mock.module(ediscoveryModule));

  var $controller, $q, $scope, $translate, Analytics, Authinfo, controller, EdiscoveryService, TrialService;
  var getReportsWithCreated, getReportsWithCompleted;

  beforeEach(inject(function (_$controller_, _$q_, _$rootScope_, _$translate_, _Analytics_, _Authinfo_, _EdiscoveryService_, _TrialService_) {
    $scope = _$rootScope_.$new();
    $controller = _$controller_;
    $translate = _$translate_;
    $q = _$q_;
    Analytics = _Analytics_;
    Authinfo = _Authinfo_;
    EdiscoveryService = _EdiscoveryService_;
    TrialService = _TrialService_;

    spyOn(Analytics, 'trackEvent').and.returnValue($q.resolve({}));
    spyOn(Authinfo, 'getOrgId');
    spyOn(EdiscoveryService, 'getReports').and.returnValue($q.resolve({}));
    spyOn(TrialService, 'getDaysLeftForCurrentUser');

    Authinfo.getOrgId.and.returnValue('ce8d17f8-1734-4a54-8510-fae65acc505e');

    controller = $controller('EdiscoveryReportsController', {
      $translate: $translate,
      $scope: $scope,
      EdiscoveryService: EdiscoveryService,
    });
  }));

  afterEach(function () {
    $controller = undefined;
    $q = undefined;
    $scope = undefined;
    $translate = undefined;
    Authinfo = undefined;
  });

  describe('pollAvalonReport should', function () {
    beforeEach(function () {
      getReportsWithCreated = $q.resolve({
        paging: {
          count: 16,
          limit: 10,
          next: 'n.a',
          pages: 2,
        },
        reports: [{
          displayName: 'test123',
          id: 12345678,
          state: 'CREATED',
        }, {
          displayName: 'test456',
          id: 910111213,
          state: 'COMPLETED',
        }],
      });

      getReportsWithCompleted = $q.resolve({
        paging: {
          count: 16,
          limit: 10,
          next: 'n.a',
          pages: 2,
        },
        reports: [{
          displayName: 'test123',
          id: 12345678,
          state: 'COMPLETED',
        }, {
          displayName: 'test456',
          id: 910111213,
          state: 'COMPLETED',
        }],
      });
    });

    it('initially', function () {
      expect(controller.readingReports).toBeTruthy();
      $scope.$apply();
      expect(EdiscoveryService.getReports.calls.count()).toBe(1);
      expect(controller.readingReports).toBeFalsy();
    });

    it('have isReportGenerating return true when reports[0].state is CREATED', function () {
      EdiscoveryService.getReports.and.returnValue(getReportsWithCreated);
      controller.pollAvalonReport();
      $scope.$apply();
      expect(controller.isReportGenerating).toBe(true);
    });

    it('have isReportGenerating return false when reports[0].state is COMPLETED', function () {
      EdiscoveryService.getReports.and.returnValue(getReportsWithCompleted);
      controller.pollAvalonReport();
      $scope.$apply();
      expect(controller.isReportGenerating).toBe(false);
    });
  });
});
