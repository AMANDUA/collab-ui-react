import { IDirectoryNumber, Availability, ExternalNumberType, Pattern } from './index';

describe('Service: DirectoryNumberOptionsService', () => {
  beforeEach(function () {
    this.initModules('huron.directory-number');
    this.injectDependencies(
      '$httpBackend',
      'Authinfo',
      'HuronConfig',
      'DirectoryNumberOptionsService',
    );
    spyOn(this.Authinfo, 'getOrgId').and.returnValue('12345');

    const internalNumbersResponse: IDirectoryNumber[] = [
      { pattern: '12345' },
      { pattern: '67890' },
      { pattern: '75023' },
    ];

    const internalNumbers: string[] = [
      '12345',
      '67890',
      '75023',
    ];

    const externalNumbersResponse: IDirectoryNumber[] = [
      { pattern: '+12345' },
      { pattern: '+67890' },
    ];

    const externalNumbers: string[] = [
      '+12345',
      '+67890',
    ];

    this.internalNumbers = internalNumbers;
    this.externalNumbers = externalNumbers;
    this.internalNumbersResponse = internalNumbersResponse;
    this.externalNumbersResponse = externalNumbersResponse;
  });
  beforeEach(installPromiseMatchers);

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('getInternalNumbers function', function () {
    it('should get internal numbers list', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/internalnumberpools?directorynumber=&order=pattern')
        .respond(200, this.internalNumbersResponse);
      this.DirectoryNumberOptionsService.getInternalNumberOptions().then(response => {
        expect(response).toEqual(this.internalNumbers);
      });
      this.$httpBackend.flush();
    });

    it('should reject the promise on a failed response', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/internalnumberpools?directorynumber=&order=pattern')
        .respond(500);
      const promise = this.DirectoryNumberOptionsService.getInternalNumberOptions();
      this.$httpBackend.flush();
      expect(promise).toBeRejected();
    });
  });

  describe('getExternalNumbers function', function () {
    it('should get external numbers list and default to query for unassigned DID numbers sorted by pattern', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Fixed+Line+or+Mobile&order=pattern')
        .respond(200, this.externalNumbersResponse);
      this.DirectoryNumberOptionsService.getExternalNumberOptions().then(response => {
        expect(response).toEqual(this.externalNumbers);
      });
      this.$httpBackend.flush();
    });

    it('should reject the promise on a failed response', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Fixed+Line+or+Mobile&order=pattern')
        .respond(500);
      const promise = this.DirectoryNumberOptionsService.getExternalNumberOptions();
      this.$httpBackend.flush();
      expect(promise).toBeRejected();
    });

    it('should get external numbers list and query for a specific unassigned DID pattern sorted by pattern', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Fixed+Line+or+Mobile&order=pattern&pattern=%25%2B123%25')
        .respond(200, this.externalNumbersResponse);
      this.DirectoryNumberOptionsService.getExternalNumberOptions('+123').then(response => {
        expect(response).toEqual(this.externalNumbers);
      });
      this.$httpBackend.flush();
    });

    it('should get external numbers list and default to query for unassigned numbers sorted by pattern', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Fixed+Line+or+Mobile&order=pattern')
        .respond(200, this.externalNumbersResponse);
      this.DirectoryNumberOptionsService.getExternalNumberOptions(Pattern.SKIP_MATCHING, Availability.UNASSIGNED).then(response => {
        expect(response).toEqual(this.externalNumbers);
      });
      this.$httpBackend.flush();
    });

    it('should get external numbers list and default to query for unassigned DID numbers sorted by pattern', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Fixed+Line+or+Mobile&order=pattern')
        .respond(200, this.externalNumbersResponse);
      this.DirectoryNumberOptionsService.getExternalNumberOptions(Pattern.SKIP_MATCHING, Availability.UNASSIGNED, ExternalNumberType.DID).then(response => {
        expect(response).toEqual(this.externalNumbers);
      });
      this.$httpBackend.flush();
    });

    it('should get external numbers list and default to query for unassigned toll free numbers sorted by pattern', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Toll+Free&order=pattern')
        .respond(200, this.externalNumbersResponse);
      this.DirectoryNumberOptionsService.getExternalNumberOptions(Pattern.SKIP_MATCHING, Availability.UNASSIGNED, ExternalNumberType.TOLLFREE).then(response => {
        expect(response).toEqual(this.externalNumbers);
      });
      this.$httpBackend.flush();
    });

    it('should get external numbers list and default to query for assigned and unassigned toll free numbers sorted by pattern', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Toll+Free&order=pattern')
        .respond(200, this.externalNumbersResponse);
      this.DirectoryNumberOptionsService.getExternalNumberOptions(Pattern.SKIP_MATCHING, Availability.ASSIGNED_AND_UNASSIGNED, ExternalNumberType.TOLLFREE).then(response => {
        expect(response).toEqual(this.externalNumbers);
      });
      this.$httpBackend.flush();
    });

    it('should get external numbers list and default to query for assigned and unassigned DID numbers sorted by pattern', function () {
      this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/voice/customers/' + this.Authinfo.getOrgId() + '/externalnumberpools?directorynumber=&externalnumbertype=Fixed+Line+or+Mobile&order=pattern')
        .respond(200, this.externalNumbersResponse);
      this.DirectoryNumberOptionsService.getExternalNumberOptions(Pattern.SKIP_MATCHING, Availability.ASSIGNED_AND_UNASSIGNED, ExternalNumberType.DID).then(response => {
        expect(response).toEqual(this.externalNumbers);
      });
      this.$httpBackend.flush();
    });
  });
});
