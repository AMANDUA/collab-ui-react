import moduleName from './index';

describe('Service: AutoAssignTemplateService:', () => {
  beforeEach(function() {
    this.initModules(moduleName);
    this.injectDependencies(
      '$http',
      '$q',
      '$scope',
      'Authinfo',
      'AutoAssignTemplateService',
      'MessengerInteropService',
      'Orgservice',
      'UrlConfig',
    );
    this.endpointUrl = 'fake-admin-service-url/organizations/fake-org-id/templates';
    this.settingsUrl = 'fake-admin-service-url/organizations/fake-org-id/settings/autoLicenseAssignment';
    this.fixtures = {};
    this.fixtures.fakeLicenseUsage = [{
      subscriptionId: 'fake-subscriptionId-2',
      licenses: [{ offerName: 'foo' }],
    }, {
      subscriptionId: 'fake-subscriptionId-3',
      licenses: [{ offerName: 'foo' }],
    }, {
      subscriptionId: 'fake-subscriptionId-1',
      licenses: [{ offerName: 'foo' }],
    }];
    this.autoAssignTemplateData = {};
    _.set(this.autoAssignTemplateData, 'subscriptions', undefined);
    _.set(this.autoAssignTemplateData, 'LICENSE', { subscriptionId: 'fake-subscriptionId-1' });
    _.set(this.autoAssignTemplateData, 'USER_ENTITLEMENTS_PAYLOAD', undefined);
  });

  beforeEach(function () {
    spyOn(this.UrlConfig, 'getAdminServiceUrl').and.returnValue('fake-admin-service-url/');
    spyOn(this.Authinfo, 'getOrgId').and.returnValue('fake-org-id');
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.resolve(this.fixtures.fakeLicenseUsage));
  });

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('primary behaviors:', () => {
    it('should initialize its "autoAssignTemplateUrl" property', function () {
      expect(this.AutoAssignTemplateService.autoAssignTemplateUrl).toBe(this.endpointUrl);
    });
  });

  describe('getTemplates():', () => {
    it('should call GET on the internal endpoint url', function () {
      this.$httpBackend.expectGET(this.endpointUrl);
      this.AutoAssignTemplateService.getTemplates();
    });
  });

  describe('getDefaultTemplate():', () => {
    it('should call "getTemplates()" and return the default template', function (done) {
      const fakeValidResponse = [{
        name: 'Default',
      }];
      spyOn(this.AutoAssignTemplateService, 'getTemplates').and.returnValue(this.$q.resolve(fakeValidResponse));
      this.AutoAssignTemplateService.getDefaultTemplate().then(template => {
        expect(template).toEqual({
          name: 'Default',
        });
      });
      this.$scope.$apply();

      this.AutoAssignTemplateService.getTemplates.and.returnValue(this.$q.reject({ status: 404 }));
      this.AutoAssignTemplateService.getDefaultTemplate().then(template => {
        expect(template).toBe(undefined);
        _.defer(done);
      });
      this.$scope.$apply();
    });
  });

  describe('isEnabledForOrg():', () => {
    it('should reflect the status of orgSettings.autoLicenseAssignment', function (done) {
      this.$httpBackend.expectGET(this.settingsUrl).respond({
        autoLicenseAssignment: true,
      });
      this.AutoAssignTemplateService.isEnabledForOrg().then(isEnabled => {
        expect(isEnabled).toBe(true);
        _.defer(done);
      });
      this.$httpBackend.flush();
    });
  });

  describe('createTemplate():', () => {
    it('should call POST on the internal endpoint url with the given payload', function () {
      this.$httpBackend.expectPOST(this.endpointUrl, { foo: 'bar' });
      this.AutoAssignTemplateService.createTemplate({ foo: 'bar' });
    });
  });

  describe('updateTemplate():', () => {
    it('should call PATCH on the internal endpoint url with the given payload', function () {
      this.$httpBackend.expectPATCH(`${this.endpointUrl}/fake-template-id-1`, { foo: 'bar' });
      this.AutoAssignTemplateService.updateTemplate('fake-template-id-1', { foo: 'bar' });
    });
  });

  describe('activateTemplate():', () => {
    it('should call POST on the internal settings url with an empty payload and enabled=true', function () {
      this.$httpBackend.expectPOST(`${this.settingsUrl}?enabled=true`);
      this.AutoAssignTemplateService.activateTemplate();
    });
  });

  describe('deactivateTemplate():', () => {
    it('should call POST on the internal settings url with an empty payload and enabled=false', function () {
      this.$httpBackend.expectPOST(`${this.settingsUrl}?enabled=false`);
      this.AutoAssignTemplateService.deactivateTemplate();
    });
  });

  describe('deleteTemplate():', () => {
    it('should call DELETE on the internal endpoint url with the given payload', function () {
      this.$httpBackend.expectDELETE(`${this.endpointUrl}/fake-template-id-1`);
      this.AutoAssignTemplateService.deleteTemplate('fake-template-id-1');
    });
  });

  describe('getAllLicenses():', () => {
    it('should compose a map of licenses keyed by their license ids', function () {
      const fakeSubscriptions = [{
        subscriptionId: 'fake-subscription-id-1',
        licenses: [
          { licenseId: 'fake-license-id-1' },
        ],
      }, {
        subscriptionId: 'fake-subscription-id-2',
        licenses: [
          { licenseId: 'fake-license-id-2a' },
          { licenseId: 'fake-license-id-2b' },
        ],
      }, {
        subscriptionId: 'fake-subscription-id-3',
        licenses: [
          { licenseId: 'fake-license-id-3a' },
          { licenseId: 'fake-license-id-3b' },
          { licenseId: 'fake-license-id-3c' },
        ],
      }];

      expect(this.AutoAssignTemplateService.getAllLicenses(fakeSubscriptions)).toEqual({
        'fake-license-id-1': { licenseId: 'fake-license-id-1' },
        'fake-license-id-2a': { licenseId: 'fake-license-id-2a' },
        'fake-license-id-2b': { licenseId: 'fake-license-id-2b' },
        'fake-license-id-3a': { licenseId: 'fake-license-id-3a' },
        'fake-license-id-3b': { licenseId: 'fake-license-id-3b' },
        'fake-license-id-3c': { licenseId: 'fake-license-id-3c' },
      });
    });
  });

  describe('mkLicenseEntries():', () => {
    it('should compose state data representing currently selected licenses', function () {
      const fakeAllLicenses = {
        'fake-license-id-1': { foo: 1 },
        'fake-license-id-2': { foo: 2 },
        'fake-license-id-3': { foo: 3 },
      };
      expect(this.AutoAssignTemplateService.mkLicenseEntries([{ id: 'fake-license-id-1' }], fakeAllLicenses)).toEqual({
        'fake-license-id-1': {
          isSelected: true,
          license: { foo: 1 },
        },
      });

      expect(this.AutoAssignTemplateService.mkLicenseEntries([
        { id: 'fake-license-id-1' },
        { id: 'fake-license-id-3' }],
        fakeAllLicenses)).toEqual({
          'fake-license-id-1': {
            isSelected: true,
            license: { foo: 1 },
          },
          'fake-license-id-3': {
            isSelected: true,
            license: { foo: 3 },
          },
        });
    });
  });

  describe('toAutoAssignTemplateData():', () => {
    it('should compose state data object with "LICENSE", "USER_ENTITLEMENTS_PAYLOAD", and "subscriptions" properties', function () {
      spyOn(this.AutoAssignTemplateService, 'getAllLicenses').and.returnValue('fake-allLicenses-result');
      spyOn(this.AutoAssignTemplateService, 'mkLicenseEntries').and.returnValue('fake-mkLicenseEntries-result');
      const result = this.AutoAssignTemplateService.toAutoAssignTemplateData({
        licenses: 'fake-template-licenses-arg',
        userEntitlements: 'fake-template-userEntitlements-arg',
      }, 'fake-subscriptions-arg');

      expect(this.AutoAssignTemplateService.mkLicenseEntries).toHaveBeenCalledWith('fake-template-licenses-arg', 'fake-allLicenses-result');
      expect(result).toEqual({
        LICENSE: 'fake-mkLicenseEntries-result',
        USER_ENTITLEMENTS_PAYLOAD: 'fake-template-userEntitlements-arg',
        subscriptions: 'fake-subscriptions-arg',
      });
    });
  });

  describe('getSortedSubscriptions():', () => {
    it('should resolve with a collection of subscriptions sorted by subscription id', function (done) {
      this.AutoAssignTemplateService.getSortedSubscriptions().then(sortedSubscriptions => {
        expect(sortedSubscriptions.length).toBe(3);
        expect(_.get(sortedSubscriptions[0], 'subscriptionId')).toBe('fake-subscriptionId-1');
        expect(_.get(sortedSubscriptions[1], 'subscriptionId')).toBe('fake-subscriptionId-2');
        expect(_.get(sortedSubscriptions[2], 'subscriptionId')).toBe('fake-subscriptionId-3');
        _.defer(done);
      });
      this.$scope.$apply();
    });

    it('should not containing subscriptions with only licenses of "MSGR" offer name', function (done) {
      expect(this.fixtures.fakeLicenseUsage.length).toBe(3);
      this.fixtures.fakeLicenseUsage.push({
        subscriptionId: 'fake-subscriptionId-4',
        licenses: [{ offerName: 'MSGR' }],
      });
      expect(this.fixtures.fakeLicenseUsage.length).toBe(4);
      this.AutoAssignTemplateService.getSortedSubscriptions().then(sortedSubscriptions => {
        expect(sortedSubscriptions.length).toBe(3);
        expect(_.get(sortedSubscriptions[0], 'subscriptionId')).toBe('fake-subscriptionId-1');
        expect(_.get(sortedSubscriptions[1], 'subscriptionId')).toBe('fake-subscriptionId-2');
        expect(_.get(sortedSubscriptions[2], 'subscriptionId')).toBe('fake-subscriptionId-3');
        _.defer(done);
      });
      this.$scope.$apply();
    });
  });

  describe('mkPayload():', function () {
    it('should return a payload composed of a license payload, and a user-entitlements payload', function () {
      spyOn(this.AutoAssignTemplateService, 'mkLicensesPayload').and.returnValue(['fake-licenses-payload']);
      spyOn(this.AutoAssignTemplateService, 'mkUserEntitlementsPayload').and.returnValue(['fake-user-entitlements-payload']);
      const payload = this.AutoAssignTemplateService.mkPayload({});
      expect(this.AutoAssignTemplateService.mkLicensesPayload).toHaveBeenCalled();
      expect(this.AutoAssignTemplateService.mkUserEntitlementsPayload).toHaveBeenCalled();
      expect(payload).toEqual({
        name: 'Default',
        licenses: ['fake-licenses-payload'],
        userEntitlements: ['fake-user-entitlements-payload'],
      });
    });
  });

  describe('mkLicensesPayload():', function () {
    it('should filter only selected licenses from "autoAssignTemplateData" property', function () {
      const autoAssignTemplateData = {
        LICENSE: {
          'fake-license-id-1': {
            isSelected: true,
            license: {
              licenseId: 'fake-license-id-1',
            },
          },
          'fake-license-id-2': {
            isSelected: true,
            license: {
              licenseId: 'fake-license-id-2',
            },
          },
          'fake-license-id-3': {
            isSelected: false,
            license: {
              licenseId: 'fake-license-id-3',
            },
          },
        },
      };
      expect(this.AutoAssignTemplateService.mkLicensesPayload(autoAssignTemplateData)).toEqual([{
        id: 'fake-license-id-1',
        idOperation: 'ADD',
        properties: {},
      }, {
        id: 'fake-license-id-2',
        idOperation: 'ADD',
        properties: {},
      }]);
    });
  });
});
