'use strict';

describe('Controller: HelpdeskController', function () {
  beforeEach(angular.mock.module('Squared'));

  var HelpdeskService, HelpdeskHuronService, LicenseService, $controller, q, $translate, $scope, httpBackend, controller,
    HelpdeskSearchHistoryService, Config, Authinfo, FeatureToggleService;

  var createUserMockData = function (name, orgId) {
    return {
      "active": true,
      "id": "dcba4321_" + name,
      "organization": {
        id: orgId,
      },
      "userName": name,
      "displayName": name.replace(".", " "),
    };
  };

  var createOrgMockData = function (name, orgId) {
    return {
      "id": orgId,
      "displayName": name,
      "isPartner": false,
      "isTestOrg": false,
    };
  };

  var expectToShowOnlyUserAndOrgsResult = function () {
    expect(controller.showUsersResultPane()).toBeTruthy();
    expect(controller.showOrgsResultPane()).toBeTruthy();
    expect(controller.showDeviceResultPane()).toBeFalsy();
  };

  var validSearchString = "bill gates";
  var lessThanThreeCharacterSearchString = "bi";

  beforeEach(inject(function (_$translate_, $httpBackend, _$rootScope_, _HelpdeskService_, _HelpdeskSearchHistoryService_, _$controller_, _$q_, _HelpdeskHuronService_, _LicenseService_, _Config_, _Authinfo_, _FeatureToggleService_) {
    HelpdeskService = _HelpdeskService_;
    FeatureToggleService = _FeatureToggleService_;
    HelpdeskSearchHistoryService = _HelpdeskSearchHistoryService_;
    q = _$q_;
    $scope = _$rootScope_.$new();
    $controller = _$controller_;
    httpBackend = $httpBackend;
    $translate = _$translate_;
    HelpdeskHuronService = _HelpdeskHuronService_;
    LicenseService = _LicenseService_;
    Config = _Config_;
    Authinfo = _Authinfo_;

    httpBackend
      .when('GET', 'https://ciscospark.statuspage.io/index.json')
      .respond({});
  }));

  afterEach(function () {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  describe("user and org searches", function () {

    var userSearchResult = [{
      "active": true,
      "id": "ddb4dd78-26a2-45a2-8ad8-4c181c5b3f0a",
      "organization": {
        id: "e6ac8f0b-6cea-492d-875d-8edf159a844c",
      },
      "userName": "bill.gates",
      "displayName": "Bill Gates",
      "phoneNumbers": [{
        "type": "work",
        "value": "+47 67 51 14 67",
      }, {
        "type": "mobile",
        "value": "+47 92 01 30 30",
      }],
      "url": "whatever.com",
    }];

    var orgSearchResult = [{
      "url": "https://atlas-intb.ciscospark.com/admin/api/v1/helpdesk/organizations/e6ac8f0b-6cea-492d-875d-8edf159a844c",
      "id": "e6ac8f0b-6cea-492d-875d-8edf159a844c",
      "displayName": "Bill Gates Foundation",
      "isPartner": false,
      "isTestOrg": false,
    }];

    var orgLookupResult = {
      "id": "e6ac8f0b-6cea-492d-875d-8edf159a844c",
      "displayName": "Bill Gates Foundation",
      "services": ['spark-room-system'],
    };

    var cloudberryDevices = {
      "https://csdm-a.wbx2.com/csdm/api/v1/organization/4214d345-7caf-4e32-b015-34de878d1158/devices/94b3e13c-b1dd-5e2a-9b64-e3ca02de51d3": {
        "displayName": "Toms Love Shack",
        "cisUuid": "f50d76ed-b6d3-49fb-9b40-8cf4d993b7f6",
        "url": "https://csdm-a.wbx2.com/csdm/api/v1/organization/4214d345-7caf-4e32-b015-34de878d1158/devices/94b3e13c-b1dd-5e2a-9b64-e3ca02de51d3",
        "serial": "FTT1927036F",
        "mac": "18:8B:9D:D4:52:02",
        "product": "Cisco TelePresence SX10",
      },
      "https://csdm-a.wbx2.com/csdm/api/v1/organization/4214d345-7caf-4e32-b015-34de878d1158/devices/56c6a1f4-1e9d-50fc-b560-21496452ba72": {
        "displayName": "Ladidadi Room",
        "cisUuid": "1f2c2b8e-463e-40db-b07c-c6ed2cea0284",
        "url": "https://csdm-a.wbx2.com/csdm/api/v1/organization/4214d345-7caf-4e32-b015-34de878d1158/devices/56c6a1f4-1e9d-50fc-b560-21496452ba72",
        "serial": "FTT173601WA",
        "mac": "E8:ED:F3:B5:DB:8F",
        "product": "Cisco TelePresence SX20",
        "state": "CLAIMED",
      },
    };

    var huronDevices = [{
      "uuid": "17a6e2be-0e22-4ae9-8a29-f9ab05b5da09",
      "url": null,
      "displayName": "SEP1CDEA7DBF740",
      "description": "373323613@qq.com (Cisco 8861 SIP)",
      "product": "Cisco 8861",
      "model": "Cisco 8861",
      "ownerUser": {
        "uuid": "74c2ca8d-99ca-4bdf-b6b9-a142d503f024",
        "userId": "58852083@qq.com",
      },
    }, {
      "uuid": "18a6e2be-0e22-4ae9-8a29-f9ab05b5da09",
      "url": null,
      "displayName": "SEP74A02FC0A15F",
      "description": "58852083 (Cisco 8865 SIP)",
      "product": "Cisco 8865",
      "model": "Cisco 8865",
      "ownerUser": {
        "uuid": "74c2ca8d-99ca-4bdf-b6b9-a142d503f024",
        "userId": "58852083@qq.com",
      },
    }];

    var orderSearchResult = [{
      "accountId": "4895afc9-83e9-44cb-b78a-05e541d41661",
      "externalOrderId": "67891234",
      "lastModified": "2016-09-27T22:56:51.839Z",
      "orderReceived": "2016-09-27T22:56:30.051Z",
      "orderStatus": "PROVISIONED",
      "orderUuid": "3e54548d-12ff-43f4-9aff-10c2fcc64130",
      "orderingTool": "CCW",
      "serviceId": "Sub1234-5678",
      "serviceProvisioningId": "SPID-Atlas_Test_int_001",
    }];

    var orderSearchResult2 = [{
      "accountId": "4895afc9-83e9-44cb-b78a-05e541d41661",
      "externalOrderId": "67891234",
      "lastModified": "2016-09-27T22:56:51.839Z",
      "orderReceived": "2016-09-27T22:56:30.051Z",
      "orderStatus": "REJECTED",
      "orderUuid": "3e54548d-12ff-43f4-9aff-10c2fcc64130",
      "orderingTool": "CCW",
      "serviceId": "Sub1234-5678",
      "serviceProvisioningId": "SPID-Atlas_Test_int_001",
    }];

    beforeEach(function () {
      sinon.stub(HelpdeskService, 'searchUsers');
      sinon.stub(HelpdeskService, 'searchOrgs');
      sinon.stub(HelpdeskService, 'searchOrders');
      sinon.stub(HelpdeskService, 'searchCloudberryDevices');
      sinon.stub(HelpdeskService, 'findAndResolveOrgsForUserResults');
      sinon.stub(HelpdeskService, 'getOrg');
      sinon.stub(HelpdeskHuronService, 'searchDevices');
      sinon.stub(HelpdeskHuronService, 'findDevicesMatchingNumber');
      sinon.stub(Authinfo, 'isInDelegatedAdministrationOrg');
      sinon.stub(Authinfo, 'getOrgId');
      sinon.stub(Authinfo, 'getOrgName');
      sinon.stub(FeatureToggleService, 'atlasHelpDeskOrderSearchGetStatus').returns(q.resolve(true));

      var deferredUserResult = q.defer();
      deferredUserResult.resolve(userSearchResult);
      HelpdeskService.searchUsers.returns(deferredUserResult.promise);

      var deferredOrgsResult = q.defer();
      deferredOrgsResult.resolve(orgSearchResult);
      HelpdeskService.searchOrgs.returns(deferredOrgsResult.promise);

      var deferredCloudberryDeviceResult = q.defer();
      deferredCloudberryDeviceResult.resolve(cloudberryDevices);
      HelpdeskService.searchCloudberryDevices.returns(deferredCloudberryDeviceResult.promise);

      var deferredHuronDeviceResult = q.defer();
      deferredHuronDeviceResult.resolve(huronDevices);
      HelpdeskHuronService.searchDevices.returns(deferredHuronDeviceResult.promise);

      HelpdeskService.findAndResolveOrgsForUserResults.returns(deferredUserResult.promise);

      var deferredfindDevicesMatchingNumberResult = q.defer();
      deferredfindDevicesMatchingNumberResult.resolve([]);
      HelpdeskHuronService.findDevicesMatchingNumber.returns(deferredfindDevicesMatchingNumberResult.promise);

      var deferredOrgLookupResult = q.defer();
      deferredOrgLookupResult.resolve(orgLookupResult);
      HelpdeskService.getOrg.returns(deferredOrgLookupResult.promise);

      Authinfo.isInDelegatedAdministrationOrg.returns(true);
      Authinfo.getOrgId.returns('foo');
      Authinfo.getOrgName.returns('bar');

      controller = $controller('HelpdeskController', {
        HelpdeskService: HelpdeskService,
        $translate: $translate,
        $scope: $scope,
        HelpdeskSearchHistoryService: HelpdeskSearchHistoryService,
        HelpdeskHuronService: HelpdeskHuronService,
        LicenseService: LicenseService,
        Config: Config,
        Authinfo: Authinfo,
      });

      controller.initSearchWithoutOrgFilter();

    });

    it('simple search with single hits shows search result for users and orgs', function () {
      expect(controller.showUsersResultPane()).toBeFalsy();
      expect(controller.showOrgsResultPane()).toBeFalsy();
      expect(controller.showDeviceResultPane()).toBeFalsy();

      expect(controller.searchingForUsers).toBeFalsy();
      expect(controller.searchingForOrgs).toBeFalsy();

      controller.searchString = "bill gates";
      controller.search();

      expect(controller.searchingForUsers).toBeTruthy();
      expect(controller.searchingForOrgs).toBeTruthy();
      $scope.$apply();
      expect(controller.searchingForUsers).toBeFalsy();
      expect(controller.searchingForOrgs).toBeFalsy();
      expect(controller.currentSearch.userSearchResults[0].displayName).toEqual("Bill Gates");
      expect(controller.currentSearch.orgSearchResults[0].displayName).toEqual("Bill Gates Foundation");

      expectToShowOnlyUserAndOrgsResult();
    });

    it('only a search within org searches for devices and shows device result (cloudberry only)', function () {
      controller.initSearchWithoutOrgFilter();
      expect(controller.showDeviceResultPane()).toBeFalsy();
      controller.searchString = "Whatever";
      controller.search();
      expect(controller.searchingForDevices).toBeFalsy();
      expect(controller.showDeviceResultPane()).toBeFalsy();

      $scope.$apply();
      expect(controller.searchingForDevices).toBeFalsy();
      expect(controller.showDeviceResultPane()).toBeFalsy();

      controller.initSearchWithOrgFilter({
        "id": "e6ac8f0b-6cea-492d-875d-8edf159a844c",
      });
      expect(controller.lookingUpOrgFilter).toBeTruthy();
      $scope.$apply();
      expect(controller.lookingUpOrgFilter).toBeFalsy();
      expect(controller.showDeviceResultPane()).toBeFalsy();
      controller.searchString = "Whatever";
      controller.search();
      expect(controller.searchingForDevices).toBeTruthy();
      expect(controller.showDeviceResultPane()).toBeTruthy();

      $scope.$apply();
      expect(controller.searchingForDevices).toBeFalsy();
      expect(controller.showDeviceResultPane()).toBeTruthy();
      expect(controller.currentSearch.orgFilter.id).toEqual("e6ac8f0b-6cea-492d-875d-8edf159a844c");
      expect(controller.currentSearch.deviceSearchResults.length).toEqual(2);
    });

    it('search within org searches for devices should mix cloudberry and huron devices', function () {
      var deferredOrgLookupResult = q.defer();
      deferredOrgLookupResult.resolve({
        "id": "e6ac8f0b-6cea-492d-875d-8edf159a844c",
        "displayName": "Bill Gates Foundation",
        "services": ['spark-room-system', 'ciscouc'],
      });
      HelpdeskService.getOrg.returns(deferredOrgLookupResult.promise);

      controller.initSearchWithOrgFilter({
        "id": "e6ac8f0b-6cea-492d-875d-8edf159a844c",
      });
      expect(controller.lookingUpOrgFilter).toBeTruthy();
      $scope.$apply();
      expect(controller.lookingUpOrgFilter).toBeFalsy();
      expect(controller.showDeviceResultPane()).toBeFalsy();
      controller.searchString = "Whatever";
      controller.search();
      expect(controller.searchingForDevices).toBeTruthy();
      expect(controller.showDeviceResultPane()).toBeTruthy();

      $scope.$apply();
      expect(controller.searchingForDevices).toBeFalsy();
      expect(controller.showDeviceResultPane()).toBeTruthy();
      expect(controller.currentSearch.orgFilter.id).toEqual("e6ac8f0b-6cea-492d-875d-8edf159a844c");
      expect(controller.currentSearch.deviceSearchResults.length).toEqual(4);
    });

    it('simple search with less than three characters shows search failure directly', function () {
      controller.searchString = lessThanThreeCharacterSearchString;
      controller.search();
      expect(controller.searchingForUsers).toBeFalsy();
      expect(controller.searchingForOrgs).toBeFalsy();

      expect(controller.showUsersResultPane()).toBeTruthy();
      expect(controller.showOrgsResultPane()).toBeTruthy();
      expect(controller.showDeviceResultPane()).toBeFalsy();

      expect(controller.currentSearch.userSearchFailure).toEqual("helpdesk.badUserSearchInput");
      expect(controller.currentSearch.orgSearchFailure).toEqual("helpdesk.badOrgSearchInput");

      expectToShowOnlyUserAndOrgsResult();
    });

    it('multiple search results are shown', function () {
      userSearchResult.push(createUserMockData("bill.gate", "11ac8f0b-6cea-492d-875d-8edf159a844c"));
      userSearchResult.push(createUserMockData("bill.gator", "22ac8f0b-6cea-492d-875d-8edf159a844c"));
      userSearchResult.push(createUserMockData("bill.gattar", "33ac8f0b-6cea-492d-875d-8edf159a844c"));
      userSearchResult.push(createUserMockData("bil.gattes", "44ac8f0b-6cea-492d-875d-8edf159a844c"));

      orgSearchResult.push(createOrgMockData("Bill Gate Foundation", "11ac8f0b-6cea-492d-875d-8edf159a844c"));
      orgSearchResult.push(createOrgMockData("Bill Gator Foundation", "22ac8f0b-6cea-492d-875d-8edf159a844c"));
      orgSearchResult.push(createOrgMockData("Bill Gat Healthcare", "66ac8f0b-6cea-492d-875d-8edf159a844c"));
      controller.searchString = validSearchString;
      controller.search();

      expect(controller.searchingForUsers).toBeTruthy();
      expect(controller.searchingForOrgs).toBeTruthy();
      $scope.$apply();
      expect(controller.searchingForUsers).toBeFalsy();
      expect(controller.searchingForOrgs).toBeFalsy();

      expect(controller.currentSearch.userSearchResults.length).toEqual(5);
      expect(controller.currentSearch.orgSearchResults.length).toEqual(4);
    });

    it('customer help desk gets the orgFiltered search set', function () {
      Authinfo.isInDelegatedAdministrationOrg.returns(false);

      controller = $controller('HelpdeskController', {
        HelpdeskService: HelpdeskService,
        $translate: $translate,
        $scope: $scope,
        HelpdeskSearchHistoryService: HelpdeskSearchHistoryService,
        HelpdeskHuronService: HelpdeskHuronService,
        LicenseService: LicenseService,
        Config: Config,
        Authinfo: Authinfo,
      });

      expect(controller.isCustomerHelpDesk).toBeTruthy();
      expect(controller.currentSearch.orgFilter.id).toEqual("foo");
      expect(controller.currentSearch.orgFilter.displayName).toEqual("bar");

      controller.searchString = "Whatever";
      controller.search();
      expect(controller.searchingForUsers).toBeTruthy();
      expect(controller.searchingForOrgs).toBeFalsy();
    });

    it('simple search with single hit shows search result for order', function () {
      controller.isOrderSearchEnabled = true;
      var deferredOrdersResult = q.defer();
      deferredOrdersResult.resolve(orderSearchResult);
      HelpdeskService.searchOrders.returns(deferredOrdersResult.promise);

      expect(controller.showOrdersResultPane()).toBeFalsy();
      expect(controller.searchingForOrders).toBeFalsy();
      controller.searchString = "67891234";
      controller.search();
      $scope.$apply();
      expect(controller.searchingForOrders).toBeFalsy();
      expect(controller.currentSearch.orderSearchResults[0].externalOrderId).toEqual("67891234");
    });

    it('simple search with Rejected order', function () {
      controller.isOrderSearchEnabled = true;
      var deferredOrdersResult = q.defer();
      deferredOrdersResult.resolve(orderSearchResult2);
      HelpdeskService.searchOrders.returns(deferredOrdersResult.promise);

      expect(controller.showOrdersResultPane()).toBeFalsy();
      expect(controller.searchingForOrders).toBeFalsy();
      controller.searchString = "67891234";
      controller.search();
      $scope.$apply();
      expect(controller.searchingForOrders).toBeFalsy();

      expect(controller.currentSearch.orderSearchFailure).toEqual("helpdesk.noSearchHits");
    });

    it('simple search with less than eight characters shows search failure directly', function () {
      controller.isOrderSearchEnabled = true;
      // Search string is 7 numeric string, and should fail the lower limit of 8 digits.
      controller.searchString = "6789123";
      controller.search();
      expect(controller.searchingForOrders).toBeFalsy();
      $scope.$apply();
      expect(controller.showUsersResultPane()).toBeTruthy();
      expect(controller.showOrgsResultPane()).toBeTruthy();
      expect(controller.showOrdersResultPane()).toBeTruthy();
      expect(controller.showDeviceResultPane()).toBeFalsy();
      expect(controller.currentSearch.orderSearchFailure).toEqual("helpdesk.badOrderSearchInput");
    });

    it('simple search with prefix different from "ssw" shows search failure directly', function () {
      controller.isOrderSearchEnabled = true;
      controller.searchString = "ssx67891234";
      controller.search();
      expect(controller.searchingForOrders).toBeFalsy();
      $scope.$apply();
      expect(controller.showUsersResultPane()).toBeTruthy();
      expect(controller.showOrgsResultPane()).toBeTruthy();
      expect(controller.showOrdersResultPane()).toBeTruthy();
      expect(controller.showDeviceResultPane()).toBeFalsy();
      expect(controller.currentSearch.orderSearchFailure).toEqual("helpdesk.badOrderSearchInput");
    });
  });

  describe("backend http error", function () {

    beforeEach(function () {
      sinon.stub(HelpdeskService, 'searchUsers');
      sinon.stub(HelpdeskService, 'searchOrgs');
      sinon.stub(Authinfo, 'isInDelegatedAdministrationOrg');
      sinon.stub(FeatureToggleService, 'atlasHelpDeskOrderSearchGetStatus').returns(q.resolve(true));

      Authinfo.isInDelegatedAdministrationOrg.returns(true);

    });

    it('400 gives badUserSearchInput message', function () {
      var deferred = q.defer();
      deferred.reject({
        "status": 400,
      });
      HelpdeskService.searchUsers.returns(deferred.promise);
      HelpdeskService.searchOrgs.returns(deferred.promise);

      controller = $controller('HelpdeskController', {
        HelpdeskService: HelpdeskService,
        $translate: $translate,
        $scope: $scope,
        HelpdeskSearchHistoryService: HelpdeskSearchHistoryService,
        HelpdeskHuronService: HelpdeskHuronService,
        LicenseService: LicenseService,
        Config: Config,
      });

      controller.searchString = validSearchString;
      controller.search();
      expect(controller.searchingForUsers).toBeTruthy();
      expect(controller.searchingForOrgs).toBeTruthy();
      $scope.$apply();
      expect(controller.currentSearch.userSearchFailure).toEqual("helpdesk.badUserSearchInput");
      expect(controller.searchingForUsers).toBeFalsy();
      expect(controller.searchingForOrgs).toBeFalsy();
      expectToShowOnlyUserAndOrgsResult();
    });

    it('error codes other that 400 gives unexpectedError message', function () {
      var deferred = q.defer();
      deferred.reject({
        "status": 401,
      });
      HelpdeskService.searchUsers.returns(deferred.promise);
      HelpdeskService.searchOrgs.returns(deferred.promise);

      controller = $controller('HelpdeskController', {
        HelpdeskService: HelpdeskService,
        $translate: $translate,
        $scope: $scope,
        HelpdeskSearchHistoryService: HelpdeskSearchHistoryService,
        HelpdeskHuronService: HelpdeskHuronService,
        LicenseService: LicenseService,
        Config: Config,
      });

      controller.searchString = validSearchString;
      controller.search();
      expect(controller.searchingForUsers).toBeTruthy();
      expect(controller.searchingForOrgs).toBeTruthy();
      $scope.$apply();
      expect(controller.currentSearch.userSearchFailure).toEqual("helpdesk.unexpectedError");
      expect(controller.searchingForUsers).toBeFalsy();
      expect(controller.searchingForOrgs).toBeFalsy();
      expectToShowOnlyUserAndOrgsResult();
    });

  });

});
