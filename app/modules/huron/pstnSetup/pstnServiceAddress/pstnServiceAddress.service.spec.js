'use strict';

var testModule = require('./pstnServiceAddress.service');

describe('Service: PstnServiceAddressService', function () {
  beforeEach(angular.mock.module(testModule));

  var $httpBackend, HuronConfig, PstnServiceAddressService;

  var customerId = '744d58c5-9205-47d6-b7de-a176e3ca431f';
  var siteId = '29c63c1f-83b0-42b9-98ee-85624e4c9234';
  var carrierId = '4f5f5bf7-0034-4ade-8b1c-db63777f062c';

  var customerSiteList = getJSONFixture('huron/json/pstnSetup/customerSiteList.json');
  var customerSite = getJSONFixture('huron/json/pstnSetup/customerSite.json');

  var address, terminusAddress, serviceAddress;

  beforeEach(inject(function (_$httpBackend_, _HuronConfig_, _PstnServiceAddressService_) {
    $httpBackend = _$httpBackend_;
    HuronConfig = _HuronConfig_;
    PstnServiceAddressService = _PstnServiceAddressService_;

    address = {
      streetAddress: '123 My Street Drive',
      unit: 'Apt 100',
      city: 'Richardson',
      state: 'TX',
      zip: '75082',
    };

    terminusAddress = {
      address1: '123 My Street Drive',
      address2: 'Apt 100',
      city: 'Richardson',
      state: 'TX',
      zip: '75082',
    };

    serviceAddress = {
      serviceName: 'Test Customer Site',
      serviceStreetNumber: '123',
      serviceStreetDirection: '',
      serviceStreetName: 'My Street Drive',
      serviceStreetSuffix: '',
      serviceAddressSub: 'Apt 100',
      serviceCity: 'Richardson',
      serviceState: 'TX',
      serviceZip: '75082',
    };
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should lookup an address through terminus using V2 API', function () {
    $httpBackend.expectPOST(HuronConfig.getTerminusV2Url() + '/carriers/' + carrierId + '/e911/lookup').respond({
      addresses: [terminusAddress],
    });
    PstnServiceAddressService.lookupAddressV2(address, carrierId).then(function (response) {
      expect(response).toEqual(jasmine.objectContaining(address));
    });
    $httpBackend.flush();
  });

  it('should list customer sites', function () {
    $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites').respond(customerSiteList);
    $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites/' + siteId).respond(customerSite);
    PstnServiceAddressService.listCustomerSites(customerId).then(function (response) {
      expect(response).toEqual([jasmine.objectContaining({
        uuid: '29c63c1f-83b0-42b9-98ee-85624e4c9234',
        name: 'Test Customer Site',
        serviceAddress: {
          serviceName: '',
          serviceStreetNumber: '123',
          serviceStreetDirection: '',
          serviceStreetName: 'My Street',
          serviceStreetSuffix: 'Drive',
          serviceAddressSub: 'Apt 100',
          serviceCity: 'Richardson',
          serviceState: 'TX',
          serviceZip: '75082',
        },
      })]);
    });
    $httpBackend.flush();
  });

  it('should create a customer site', function () {
    $httpBackend.expectPOST(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites', {
      name: 'Test Customer Site',
      serviceAddress: serviceAddress,
    }).respond(201);
    PstnServiceAddressService.createCustomerSite(customerId, 'Test Customer Site', address);
    $httpBackend.flush();
  });

  it('should get a customer\'s address', function () {
    $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites').respond(customerSiteList);
    $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites/' + siteId).respond(customerSite);
    PstnServiceAddressService.getAddress(customerId).then(function (response) {
      expect(response).toEqual(address);
    });
    $httpBackend.flush();
  });

  it('should enter an irregular address and correctly parse', function () {
    var irregularAddress = {
      streetAddress: 'N95W18000 Appleton Ave',
      unit: '',
      city: 'Menomonee Falls',
      state: 'WI',
      zip: '53051',
    };

    var irregularServiceAddress = {
      serviceName: 'Irregular Test Customer Site',
      serviceStreetNumber: 'N95W18000',
      serviceStreetDirection: '',
      serviceStreetName: 'Appleton Ave',
      serviceStreetSuffix: '',
      serviceAddressSub: '',
      serviceCity: 'Menomonee Falls',
      serviceState: 'WI',
      serviceZip: '53051',
    };

    $httpBackend.expectPOST(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites', {
      name: 'Irregular Test Customer Site',
      serviceAddress: irregularServiceAddress,
    }).respond(201);
    PstnServiceAddressService.createCustomerSite(customerId, 'Irregular Test Customer Site', irregularAddress);
    $httpBackend.flush();
  });

  describe('update street address', function () {
    beforeEach(function () {
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites').respond(customerSiteList);
      $httpBackend.expectGET(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites/' + siteId).respond(customerSite);
      $httpBackend.expectPUT(HuronConfig.getTerminusUrl() + '/customers/' + customerId + '/sites/' + siteId, {
        serviceAddress: serviceAddress,
      }).respond(200);
    });
    afterEach(function () {
      PstnServiceAddressService.updateAddress(customerId, address);
      $httpBackend.flush();
    });

    it('should update address with a nondescript address and no suffix', function () {
      address.streetAddress = '123 Lexi Petal';

      // Expected values
      serviceAddress.serviceStreetNumber = '123';
      serviceAddress.serviceStreetName = 'Lexi Petal';
    });

    it('should update address with a street address containing possible suffix', function () {
      address.streetAddress = '123 My Street';

      // Expected values
      serviceAddress.serviceStreetNumber = '123';
      serviceAddress.serviceStreetName = 'My Street';
    });

    it('should update address with a suffix', function () {
      address.streetAddress = '123 My Street Drive';

      // Expected values
      serviceAddress.serviceStreetNumber = '123';
      serviceAddress.serviceStreetName = 'My Street Drive';
    });
  });
});
