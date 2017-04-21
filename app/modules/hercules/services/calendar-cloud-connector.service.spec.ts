describe('CloudConnectorService', () => {

  let $httpBackend, CloudConnectorService;

  beforeEach(angular.mock.module('Hercules'));
  beforeEach(angular.mock.module(mockDependencies));

  beforeEach(inject((_CloudConnectorService_, _$httpBackend_) => {
    CloudConnectorService = _CloudConnectorService_;
    $httpBackend = _$httpBackend_;
  }));

  function mockDependencies($provide) {
    let Authinfo = {
      getOrgId: sinon.stub().returns('myOrgId'),
      isFusionGoogleCal: sinon.stub().returns(true),
    };
    $provide.value('Authinfo', Authinfo);
  }

  describe('.getStatusCss()', () => {

    it('should just work', () => {
      expect(CloudConnectorService.getStatusCss(null)).toBe('default');
      expect(CloudConnectorService.getStatusCss({})).toBe('default');
      expect(CloudConnectorService.getStatusCss({ provisioned: false, status: 'OK' })).toBe('default');
      expect(CloudConnectorService.getStatusCss({ provisioned: true, status: 'OK' })).toBe('success');
      expect(CloudConnectorService.getStatusCss({ provisioned: true, status: 'ERROR' })).toBe('danger');
      expect(CloudConnectorService.getStatusCss({ provisioned: true, status: 'WARN' })).toBe('warning');
    });
  });

  describe('.updateConfig()', function () {

    afterEach(() => {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    afterAll(() => {
      CloudConnectorService = $httpBackend = undefined;
    });

    let serviceId = 'squared';

    it('should post the service account, ACL account, and private key to the correct API', () => {
      let inputData = {
        newServiceAccountId: 'test@example.org',
        newAclAccount: 'acl@example.org',
        privateKey: 'header,actualKeyData',
        serviceId: serviceId,
      };
      let dataToBeSentToServer = {
        serviceAccountId: 'test@example.org',
        aclAdminAccount: 'acl@example.org',
        privateKeyData: 'actualKeyData',
      };
      $httpBackend.expectPOST('https://calendar-cloud-connector-intb.ciscospark.com/api/v1/orgs/myOrgId/services/squared', dataToBeSentToServer).respond({});
      $httpBackend.expectPATCH('https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/myOrgId/services/squared').respond({});
      CloudConnectorService.updateConfig(inputData.newServiceAccountId, inputData.newAclAccount, inputData.privateKey, inputData.serviceId);
      $httpBackend.flush();
    });

    it('should post an empty ACL account if an empty string is provided, because doing so is supposed to clear it server-side', () => {
      let inputData = {
        newServiceAccountId: 'test@example.org',
        newAclAccount: '',
        privateKey: 'header,actualKeyData',
        serviceId: serviceId,
      };
      let dataToBeSentToServer = {
        serviceAccountId: 'test@example.org',
        aclAdminAccount: '',
        privateKeyData: 'actualKeyData',
      };
      $httpBackend.expectPOST('https://calendar-cloud-connector-intb.ciscospark.com/api/v1/orgs/myOrgId/services/squared', dataToBeSentToServer).respond({});
      $httpBackend.expectPATCH('https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/myOrgId/services/squared').respond({});
      CloudConnectorService.updateConfig(inputData.newServiceAccountId, inputData.newAclAccount, inputData.privateKey, inputData.serviceId);
      $httpBackend.flush();
    });

  });

  describe(' error handling ', () => {

    it('should map a valid error code to a translation key', () => {
      let errorCode = 1;
      let returnedTranslationKey = CloudConnectorService.getProvisioningResultTranslationKey(errorCode);
      expect(returnedTranslationKey).toBe('hercules.settings.googleCalendar.provisioningResults.BAD_API_ACCESS_SETTINGS');
    });

    it('should default to the general error if the error code is not in the enum', () => {
      let errorCode = 1913;
      let returnedTranslationKey = CloudConnectorService.getProvisioningResultTranslationKey(errorCode);
      expect(returnedTranslationKey).toBe('hercules.settings.googleCalendar.provisioningResults.GENERAL_ERROR');
    });

  });

});
