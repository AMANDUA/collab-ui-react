'use strict';

describe('SparkDomainManagementService: Service', function () {
  beforeEach(angular.mock.module('Core'));

  var authInfo = {
    getOrgId: jasmine.createSpy('getOrgId').and.returnValue('bcd7afcd-839d-4c61-a7a8-31c6c7f016d7'),
  };

  beforeEach(angular.mock.module(function ($provide) {
    $provide.value("Authinfo", authInfo);
  }));

  var $httpBackend, SparkDomainManagementService;
  var sparkDomainRegex = /.*\/settings\/domain\.*/;

  beforeEach(inject(function (_$httpBackend_, _SparkDomainManagementService_) {
    $httpBackend = _$httpBackend_;
    SparkDomainManagementService = _SparkDomainManagementService_;
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should verify that a domain is passed for checkAvailability and addSipDomain calls', function () {
    SparkDomainManagementService.checkDomainAvailability().catch(function (response) {
      expect(response).toBe('A SIP Domain input value must be entered');
    });

    SparkDomainManagementService.addSipDomain().catch(function (response) {
      expect(response).toBe('A SIP Domain input value must be entered');
    });
  });

  it('should present that the domain is not available', function () {
    $httpBackend.whenPOST(sparkDomainRegex).respond(function () {
      var data = {
        'isDomainAvailable': false,
        'isDomainReserved': true,
      };
      return [200, data];
    });

    SparkDomainManagementService.checkDomainAvailability('amtest2').then(function (response) {
      expect(response.data.isDomainReserved).toBe(true);
      expect(response.data.isDomainAvailable).toBe(false);
    });

    $httpBackend.flush();
  });

  it('should present that the domain is available', function () {
    $httpBackend.whenPOST(sparkDomainRegex).respond(function () {
      var data = {
        'isDomainAvailable': true,
        'isDomainReserved': false,
      };
      return [200, data];
    });

    SparkDomainManagementService.checkDomainAvailability('shafiTest3').then(function (response) {
      expect(response.data.isDomainReserved).toBe(false);
      expect(response.data.isDomainAvailable).toBe(true);
    });

    $httpBackend.flush();
  });

  it('should add a Sip Domain', function () {
    $httpBackend.whenPOST(sparkDomainRegex).respond(function () {
      var data = {
        'isDomainAvailable': false,
        'isDomainReserved': true,
      };
      return [200, data];
    });

    SparkDomainManagementService.addSipDomain('shafiTest3').then(function (response) {
      expect(response.data.isDomainReserved).toBe(true);
      expect(response.data.isDomainAvailable).toBe(false);
    });

    $httpBackend.flush();
  });
});
