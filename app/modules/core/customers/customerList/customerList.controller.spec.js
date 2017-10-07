'use strict';

describe('Controller: CustomerListCtrl', function () {
  var $httpBackend, $q, $controller, $state, $scope, Analytics, Authinfo, Config, HuronConfig, FeatureToggleService, Notification, Orgservice, PartnerService, TrialService;
  var controller;

  var adminJSONFixture = getJSONFixture('core/json/organizations/adminServices.json');
  var partnerService = getJSONFixture('core/json/partner/partner.service.json');
  var managedOrgsResponse = partnerService.managedOrgsResponse;
  var authinfoLicenses = partnerService.authinfoLicenses;
  var orgId = 'b93b10ad-ae24-4abf-9c21-76e8b86faf01';
  var orgName = 'testOrg';
  var testOrg = {
    customerOrgId: '1234-34534-afdagfg-425345-afaf',
    customerName: 'ControllerTestOrg',
    customerEmail: 'customer@cisco.com',
    daysLeft: -1,
    communications: {
      isTrial: false,
      volume: 5,
    },
    licenseList: [{
      isTrial: false,
      volume: 5,
      name: 'communications',
    }],
  };
  var noNumberResponse = {
    numbers: [],
  };

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$controller_, _$httpBackend_, _$q_, $rootScope, _$state_, _Analytics_, _Authinfo_, _Config_, _HuronConfig_, _FeatureToggleService_, _Notification_, _Orgservice_, _PartnerService_, _TrialService_) {
    $controller = _$controller_;
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    $scope = $rootScope.$new();
    $state = _$state_;
    Analytics = _Analytics_;
    Authinfo = _Authinfo_;
    Config = _Config_;
    HuronConfig = _HuronConfig_;
    Notification = _Notification_;
    FeatureToggleService = _FeatureToggleService_;
    Orgservice = _Orgservice_;
    PartnerService = _PartnerService_;
    TrialService = _TrialService_;
    $scope.timeoutVal = 1;
    $rootScope.typeOfExport = {
      USER: 1,
      CUSTOMER: 2,
    };

    spyOn(Analytics, 'trackPremiumEvent');
    spyOn($state, 'go');
    spyOn(Notification, 'error');

    spyOn(Authinfo, 'getOrgId').and.returnValue(orgId);
    spyOn(Authinfo, 'getOrgName').and.returnValue(orgName);
    spyOn(Authinfo, 'getLicenses').and.returnValue(authinfoLicenses);
    spyOn(Authinfo, 'isPartnerAdmin').and.returnValue(true);

    spyOn(PartnerService, 'getManagedOrgsList').and.returnValue($q.resolve(managedOrgsResponse));
    spyOn(PartnerService, 'modifyManagedOrgs').and.returnValue($q.resolve({}));

    spyOn(FeatureToggleService, 'atlasCareTrialsGetStatus').and.returnValue($q.resolve(false));
    spyOn(FeatureToggleService, 'atlasCareInboundTrialsGetStatus').and.returnValue($q.resolve(false));
    spyOn(FeatureToggleService, 'atlasITProPackGetStatus').and.returnValue($q.resolve(false));

    spyOn(Orgservice, 'getAdminOrg').and.callFake(function (callback) {
      callback(adminJSONFixture.getAdminOrg, 200);
    });
    spyOn(Orgservice, 'getOrg').and.callFake(function (callback) {
      callback(getJSONFixture('core/json/organizations/Orgservice.json').getOrg, 200);
    });
    spyOn(Orgservice, 'isTestOrg').and.returnValue($q.resolve(true));

    spyOn(TrialService, 'getTrial').and.returnValue($q.resolve());
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(true));
  }));

  function initController() {
    controller = $controller('CustomerListCtrl', {
      $scope: $scope,
      $state: $state,
      Authinfo: Authinfo,
      Config: Config,
    });

    $scope.$apply();
  }

  describe('Controller', function () {
    beforeEach(initController);
    it('should initialize', function () {
      expect(controller.activeFilter).toBe('all');
    });
  });

  describe('grid column display', function () {
    var testTrialData = {};
    beforeEach(initController);
    beforeEach(function () {
      testTrialData = {
        customerOrgId: '1234-34534-afdagfg-425345-acac',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer123@cisco.com',
        daysLeft: 50,
        numUsers: 10,
        activeUsers: 3,
        communications: {
          isTrial: true,
        },
        licenses: 10,
        deviceLicenses: 5,
        licenseList: [{
          isTrial: false,
          volume: 5,
          name: 'communications',
        }],
      };
    });

    function setTestDataTrial() {
      testTrialData.daysLeft = 30;
      testTrialData.communications.isTrial = true;
    }

    function setTestDataExpired() {
      testTrialData.daysLeft = -10;
      testTrialData.communications.isTrial = true;
    }

    function setTestDataActive() {
      testTrialData.daysLeft = -1;
      testTrialData.communications.isTrial = false;
    }

    it('should properly calculate trials past the grace period', function () {
      setTestDataExpired();
      testTrialData.daysLeft = -99;
      expect(controller.isPastGracePeriod(testTrialData)).toBe(true);
      setTestDataActive();
      expect(controller.isPastGracePeriod(testTrialData)).toBe(false);
      setTestDataTrial();
      expect(controller.isPastGracePeriod(testTrialData)).toBe(false);
    });

    xit('should display N/A when trial is past grace period', function () {
      setTestDataExpired();
      testTrialData.daysLeft = -99;
      expect(controller.getLicenseCountColumnText(testTrialData)).toBe('common.notAvailable');
      expect(controller.getUserCountColumnText(testTrialData)).toBe('common.notAvailable');
    });

    it('should return the correct text for user count', function () {
      setTestDataTrial();
      expect(controller.getUserCountColumnText(testTrialData)).toBe(testTrialData.activeUsers + ' / ' + testTrialData.numUsers);
    });

    it('should return the correct account status', function () {
      setTestDataExpired();
      expect(controller.getAccountStatus(testTrialData)).toBe('expired');
      setTestDataTrial();
      expect(controller.getAccountStatus(testTrialData)).toBe('trial');
      setTestDataActive();
      expect(controller.getAccountStatus(testTrialData)).toBe('active');
    });
  });

  describe('myOrg appears first in orgList', function () {
    beforeEach(initController);

    function verifyPartnerOrgServiceObjects(myPartnerOrg) {
      var expectedServiceObjects = {
        messaging: 'MS',
        sparkConferencing: 'CF',
        communications: 'CO',
        webexEEConferencing: 'EE',
        roomSystems: 'SD',
        sparkBoard: 'SB',
        care: 'CDC',
        advanceCare: 'CVC',
      };

      _.forEach(Object.keys(expectedServiceObjects), function (serviceType) {
        var serviceObject = myPartnerOrg[serviceType];
        expect(serviceObject).toBeDefined();
        expect(serviceObject.offerName).toBeDefined();
        expect(serviceObject.offerName).toBe(expectedServiceObjects[serviceType]);
      });
    }

    it('should check if it is its own org', function () {
      expect(controller.isOwnOrg(controller.managedOrgsList[0])).toBe(true);
    });

    it('if myOrg not in managedOrgsList, myOrg should be added to the top of managedOrgsList ', function () {
      Authinfo.getOrgId.and.returnValue('wqeqwe21');
      initController();
      expect(controller.managedOrgsList).toBeDefined();
      expect(controller.managedOrgsList[0].customerName).toBe('testOrg');
      expect(controller.managedOrgsList.length).toBe(6);
      expect(controller.managedOrgsList[1].customerName).toBe('Atlas_Test_Trial_vt453w4p8d');
      expect(controller.totalOrgs).toBe(6);
    });

    it('check service objects, where isCareEnabled false, of myOrg being added to the top of manangedOrgsList', function () {
      Authinfo.getOrgId.and.returnValue('wqeqwe21');
      Authinfo.getLicenses.and.returnValue(authinfoLicenses);
      initController();
      verifyPartnerOrgServiceObjects(controller.managedOrgsList[0]);
      // Since isCareEnabled is false, care service gets ignored. So, we expect 6 services.
      expect(controller.managedOrgsList[0].orderedServices.servicesManagedByCurrentPartner.length).toBe(6);
    });

    it('check service objects, where isCareEnabled true, of myOrg being added to the top of manangedOrgsList', function () {
      Authinfo.getOrgId.and.returnValue('wqeqwe21');
      Authinfo.getLicenses.and.returnValue(authinfoLicenses);
      FeatureToggleService.atlasCareTrialsGetStatus.and.returnValue($q.resolve(true));
      initController();
      verifyPartnerOrgServiceObjects(controller.managedOrgsList[0]);
      // Since isCareEnabled is true, care service gets included. So, we expect 7 services.
      expect(controller.managedOrgsList[0].orderedServices.servicesManagedByCurrentPartner.length).toBe(7);
    });

    it('check service objects, where isCareEnabled and isAdvanceCareEnabled true, of myOrg being added to the top of manangedOrgsList', function () {
      Authinfo.getOrgId.and.returnValue('wqeqwe21');
      Authinfo.getLicenses.and.returnValue(authinfoLicenses);
      FeatureToggleService.atlasCareTrialsGetStatus.and.returnValue($q.resolve(true));
      FeatureToggleService.atlasCareInboundTrialsGetStatus.and.returnValue($q.resolve(true));
      initController();
      verifyPartnerOrgServiceObjects(controller.managedOrgsList[0]);
      // Since isCareEnabled and isAdvanceCareEnabled is true, care service gets included. So, we expect 8 services.
      expect(controller.managedOrgsList[0].orderedServices.servicesManagedByCurrentPartner.length).toBe(8);
    });

    it('if myOrg is in managedOrgsList, myOrg should not be added to the list', function () {
      initController();
      expect(controller.managedOrgsList).toBeDefined();
      expect(controller.managedOrgsList.length).toBe(5);
      expect(controller.totalOrgs).toBe(5);
    });
  });

  describe('Click setup PSTN', function () {
    beforeEach(initController);

    it('not Terminus customer and has no e164 numbers, should route to PSTN setup', function () {
      $httpBackend.expectGET(HuronConfig.getTerminusV2Url() + '/customers/' + testOrg.customerOrgId).respond(404);
      $httpBackend.expectGET(HuronConfig.getCmiV2Url() + '/customers/' + testOrg.customerOrgId + '/numbers?type=external').respond(noNumberResponse);
      controller.addNumbers(testOrg);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: testOrg.customerOrgId,
        customerName: testOrg.customerName,
        customerEmail: testOrg.customerEmail,
        customerCommunicationLicenseIsTrial: testOrg.communications.isTrial,
        customerRoomSystemsLicenseIsTrial: true,
      });
    });

    it('exists as Terminus customer, should route to PSTN setup', function () {
      $httpBackend.expectGET(HuronConfig.getTerminusV2Url() + '/customers/' + testOrg.customerOrgId).respond(200);
      controller.addNumbers(testOrg);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: testOrg.customerOrgId,
        customerName: testOrg.customerName,
        customerEmail: testOrg.customerEmail,
        customerCommunicationLicenseIsTrial: testOrg.communications.isTrial,
        customerRoomSystemsLicenseIsTrial: true,
      });
    });
  });

  describe('filterAction', function () {
    beforeEach(initController);

    it('a proper query should call out to partnerService and trialservice', function () {
      controller.filterAction('1234');
      expect(controller.searchStr).toBe('1234');
      //this tests that getManagedOrgsList is  called , it is called once at init , so the count is expected to be 2 here
      expect(PartnerService.getManagedOrgsList.calls.count()).toEqual(2);
      expect(PartnerService.getManagedOrgsList).toHaveBeenCalledWith('1234');
    });
  });

  describe('filterColumns', function () {
    it('return 9 items in the filter list without Care with care FT turned off', function () {
      initController();
      expect(controller.filter.options.length).toBe(9);
      expect(controller.filter.options).toContain(jasmine.objectContaining({
        value: 'sparkBoard',
      }));
      expect(controller.filter.options).not.toContain(jasmine.objectContaining({
        value: 'care',
      }));
      expect(controller.filter.options).not.toContain(jasmine.objectContaining({
        value: 'premium',
      }));
      expect(controller.filter.options).not.toContain(jasmine.objectContaining({
        value: 'standard',
      }));
    });

    it('show care in the filter list with care FT on', function () {
      FeatureToggleService.atlasCareTrialsGetStatus.and.returnValue($q.resolve(true));
      initController();
      expect(controller.filter.options.length).toBe(10);
      expect(controller.filter.options).toContain(jasmine.objectContaining({
        value: 'care',
      }));
      expect(controller.filter.options).toContain(jasmine.objectContaining({
        value: 'sparkBoard',
      }));
    });

    it('show Pro Pack in the filter list with correct FT on', function () {
      FeatureToggleService.atlasITProPackGetStatus.and.returnValue($q.resolve(true));
      initController();
      expect(controller.filter.options.length).toBe(11);
      expect(controller.filter.options).toContain(jasmine.objectContaining({
        value: 'premium',
      }));
      expect(controller.filter.options).toContain(jasmine.objectContaining({
        value: 'standard',
      }));
    });
  });

  describe('updateResultCount function', function () {
    it('should update the count on the filters based on the number of rows that met the criteria', function () {
      initController();
      controller.filter.options = [{
        value: 'trial',
        label: '',
        isSelected: false,
        isAccountFilter: true,
        isPremiumFilter: false,
        count: 0,
      }];

      controller._helpers.updateResultCount(controller.gridOptions.data);
      var activeFilter = _.find(controller.filter.options, { value: 'trial' });
      expect(activeFilter.count).toBe(2);
    });

    it('should fire a call to analytics only when the premium filter is first selected, not unselected', function () {
      FeatureToggleService.atlasITProPackGetStatus.and.returnValue($q.resolve(true));
      initController();
      controller.filter.options = [{
        value: 'premium',
        label: '',
        isSelected: true,
        isAccountFilter: false,
        isPremiumFilter: true,
        previousState: false,
        count: 0,
      }];

      controller._helpers.updateResultCount(controller.gridOptions.data);
      expect(Analytics.trackPremiumEvent).toHaveBeenCalledWith(Analytics.sections.PREMIUM.eventNames.PREMIUM_FILTER);
      Analytics.trackPremiumEvent.calls.reset();

      controller._helpers.updateResultCount(controller.gridOptions.data);
      expect(Analytics.trackPremiumEvent).not.toHaveBeenCalled();

      controller.filter.options[0].isSelected = false;
      controller._helpers.updateResultCount(controller.gridOptions.data);
      expect(Analytics.trackPremiumEvent).not.toHaveBeenCalled();
    });
  });

  describe('updateOrgService function', function () {
    var compareObject, src, licenses;
    beforeEach(function () {
      initController();
      compareObject = {
        licenseType: 'MESSAGING',
      };
      src = {
        status: undefined,
        customerName: '47ciscocomCmiPartnerOrg',
        sortOrder: 0,
      };
      licenses = _.cloneDeep(managedOrgsResponse.data.organizations[0].licenses);
    });

    it('should enhance the source object with additional license data', function () {
      var result = controller._helpers.updateServiceForOrg(src, licenses, compareObject);
      expect(result.trialId).toBe('7db0f7c1-a961-41dd-995e-ef4eb204cc72');
      expect(result.licenseId).toBe('MS_8171ee27-424e-4ac2-ae98-4508f12ae8d4');
      expect(result.volume).toBe(100);
    });

    it('should sum the quantities if several services of the given type are present', function () {
      var additionalLicense = {
        licenseId: 'MS_8171ee27-424e-4ac2-ae98-4508f12ae8d5',
        offerName: 'MS',
        licenseType: 'MESSAGING',
        volume: 200,
        isTrial: true,
      };
      licenses.push(additionalLicense);

      var result = controller._helpers.updateServiceForOrg(src, licenses, compareObject);
      expect(result.volume).toBe(300);
    });
  });

  describe('getSubfields', function () {
    beforeEach(initController);

    it('should return the column from columnGroup for single column group', function () {
      var entry = {
        licenseList: [{
          licenseId: 'MS_3c4b0cda-7315-430d-b3d6-97fd5b09991b',
          licenseType: 'MESSAGING',
        }, {
          licenseId: 'CF_14aee12e-62f0-431b-afe0-58554d064ec3',
          licenseType: 'CONFERENCING',
        }],
      };

      var result = controller.getSubfields(entry, 'meeting');
      expect(result[0].columnGroup).toBe('conferencing');
    });

    it('should return the EE for 2nd webex column if there is no webex license', function () {
      var entry = {
        licenseList: [{}],
      };

      var result = controller.getSubfields(entry, 'meeting');
      expect(result[1].offerCode).toBe('EE');
    });

    it('should return webex with license for 2nd webex column if there is one', function () {
      var entry = {
        licenseList: [{
          offerName: 'MC',
          licenseType: 'CONFERENCING',
          status: 'ACTIVE',
        }, {
          licenseId: 'CMR_34302adb-1cb4-4501-a6aa-69b31b7e9558_algendel01.webex.com',
          offerName: 'CMR',
          licenseType: 'CMR',
          status: 'ACTIVE',
        }],
      };

      var result = controller.getSubfields(entry, 'meeting');
      expect(result[1].offerCode).toBe('CMR');
    });
  });

  describe('customerCommunicationLicenseIsTrial flag', function () {
    beforeEach(initController);

    it('should be true if communication license is a trial.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com',
        communications: {
          isTrial: true,
        },
      };
      $httpBackend.expectGET(HuronConfig.getTerminusV2Url() + '/customers/' + org.customerOrgId).respond(200);
      controller.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: true,
        customerRoomSystemsLicenseIsTrial: true,
      });
    });

    it('should be false if communication license is not a trial.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com',
        communications: {
          isTrial: false,
        },
      };
      $httpBackend.expectGET(HuronConfig.getTerminusV2Url() + '/customers/' + org.customerOrgId).respond(200);
      controller.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: false,
        customerRoomSystemsLicenseIsTrial: true,
      });
    });

    it('should be true if trial data is missing.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com',
      };
      $httpBackend.expectGET(HuronConfig.getTerminusV2Url() + '/customers/' + org.customerOrgId).respond(200);
      controller.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: true,
        customerRoomSystemsLicenseIsTrial: true,
      });
    });

    it('should always be false if isPartner is true.', function () {
      var org = {
        customerOrgId: '1234-34534-afdagfg-425345-afaf',
        customerName: 'ControllerTestOrg',
        customerEmail: 'customer@cisco.com',
        isPartner: true,
        communications: {
          isTrial: true,
        },
      };
      $httpBackend.expectGET(HuronConfig.getTerminusV2Url() + '/customers/' + org.customerOrgId).respond(200);
      controller.addNumbers(org);
      $httpBackend.flush();
      expect($state.go).toHaveBeenCalledWith('pstnSetup', {
        customerId: org.customerOrgId,
        customerName: org.customerName,
        customerEmail: org.customerEmail,
        customerCommunicationLicenseIsTrial: false,
        customerRoomSystemsLicenseIsTrial: false,
      });
    });
  });

  describe('modifyManagedOrgs should be called correctly', function () {
    beforeEach(initController);

    it('should have called PartnerService.modifyManagedOrgs', function () {
      expect(testOrg.customerOrgId).toBe('1234-34534-afdagfg-425345-afaf');
      controller.modifyManagedOrgs(testOrg.customerOrgId);
      expect(PartnerService.modifyManagedOrgs).toHaveBeenCalled();
    });
  });
});
