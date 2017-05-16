'use strict';

describe('DirSyncServiceOld', function () {
  beforeEach(angular.mock.module('Core'));
  describe('getDirSyncStatus', function () {

    var $httpBackend, DirSyncServiceOld, UrlConfig, Authinfo, Log;

    beforeEach(function () {
      angular.mock.module(function ($provide) {
        UrlConfig = {
          getAdminServiceUrl: function () {
            return '/foo/';
          },
          getOauth2Url: jasmine.createSpy('Url'),
        };
        Authinfo = {
          getOrgId: function () {
            return 'bar';
          },
        };
        Log = {
          debug: jasmine.createSpy('debug'),
        };
        $provide.value('Log', Log);
        $provide.value('UrlConfig', UrlConfig);
        $provide.value('Authinfo', Authinfo);
      });
    });

    beforeEach(inject(function ($injector, _DirSyncServiceOld_) {
      DirSyncServiceOld = _DirSyncServiceOld_;
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.when('GET', 'l10n/en_US.json').respond({});
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingRequest();
      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('should set status to false when request fail', function () {
      $httpBackend
        .when(
          'GET',
          '/foo/organization/bar/dirsync/status'
        )
        .respond(500);

      var callback = jasmine.createSpy('callback');
      DirSyncServiceOld.getDirSyncStatus(callback);

      $httpBackend.flush();

      expect(callback.calls.count()).toBe(1);
      expect(callback.calls.argsFor(0)[0].success).toBe(false);
    });

    it('should set status to true when request succeed', function () {
      $httpBackend
        .when(
          'GET',
          '/foo/organization/bar/dirsync/status'
        )
        .respond({
          serviceMode: 'ENABLED',
        });

      var callback = jasmine.createSpy('callback');
      DirSyncServiceOld.getDirSyncStatus(callback);

      $httpBackend.flush();

      expect(callback.calls.count()).toBe(1);
      expect(callback.calls.argsFor(0)[0].success).toBe(true);
      expect(callback.calls.argsFor(0)[0].serviceMode).toBe('ENABLED');
    });

  });
});
