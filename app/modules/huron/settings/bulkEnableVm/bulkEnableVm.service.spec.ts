import bulkEnableVmModule from './index';
describe('Service: BulkEnableVmService', () => {
  beforeEach(function () {
      this.initModules(bulkEnableVmModule);
      this.injectDependencies(
        'UrlConfig',
        'HuronConfig',
        'Authinfo',
        'UserListService',
        'BulkEnableVmService',
        '$q',
        '$httpBackend',
      );

      spyOn(this.Authinfo, 'getOrgId').and.returnValue('78901');
  });

  const voiceMailPayload = { services: ['VOICE', 'VOICEMAIL'], voicemail: { dtmfAccessId: '71005001' } };

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  it('can get SparkCallUserCount', function() {
    let userlistServiceUrl = this.UrlConfig.getScimUrl(this.Authinfo.getOrgId()) +
    '?filter=active%20eq%20true%20and%20entitlements%20eq%20%22ciscouc%22&attributes=name,userName,userStatus,entitlements,displayName,photos,roles,active,trainSiteNames,licenseID,userSettings&count=1000';

    this.$httpBackend.expectGET(userlistServiceUrl).respond(200, { totalResults: '20' });
    spyOn(this.BulkEnableVmService, 'getSparkCallUserCountRetry').and.callThrough();

    this.BulkEnableVmService.getSparkCallUserCountRetry().then((data: number) => {
      expect(data).toBe(20);
    });
    expect(this.BulkEnableVmService.getSparkCallUserCountRetry).toHaveBeenCalledTimes(1);
    this.$httpBackend.flush();
  });

  it('can get user services', function() {
    let voiceService = ['VOICE'];
    let voiceServiceResponse = { services: voiceService };

    this.$httpBackend.expectGET(this.HuronConfig.getCmiUrl() + '/common/customers/' + this.Authinfo.getOrgId() + '/users/12345').
    respond(200, voiceServiceResponse);
    spyOn(this.BulkEnableVmService, 'getUserServicesRetry').and.callThrough();

    this.BulkEnableVmService.getUserServicesRetry('12345').then(function(response) {
      expect(response).toEqual(voiceService);
    });
    expect(this.BulkEnableVmService.getUserServicesRetry).toHaveBeenCalledTimes(1);
    this.$httpBackend.flush();
  });

  it('can get user siteToSite number', function() {
    let siteToSiteNumber = '9724567893';
    let userNumbers = [{ siteToSite: siteToSiteNumber }];
    let v2UserGetResp = { numbers: userNumbers };

    this.$httpBackend.whenGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/users/12345')
    .respond(200, v2UserGetResp);
    spyOn(this.BulkEnableVmService, 'getUserSitetoSiteNumberRetry').and.callThrough();

    this.BulkEnableVmService.getUserSitetoSiteNumberRetry('12345').then(function(response) {
      expect(response).toEqual(siteToSiteNumber);
    });
    expect(this.BulkEnableVmService.getUserSitetoSiteNumberRetry).toHaveBeenCalledTimes(1);
    this.$httpBackend.flush();
  });

  it('can enableUserVm', function() {
    this.$httpBackend.expectPUT(this.HuronConfig.getCmiUrl() + '/common/customers/' + this.Authinfo.getOrgId() + '/users/12345', voiceMailPayload)
    .respond(200);
    spyOn(this.BulkEnableVmService, 'enableUserVmRetry').and.callThrough();

    this.BulkEnableVmService.enableUserVmRetry('12345', voiceMailPayload);
    expect(this.BulkEnableVmService.enableUserVmRetry).toHaveBeenCalledTimes(1);
    this.$httpBackend.flush();
  } );

  it('enableUserVm fail without retry if response is not 429 or 503', function() {
    this.$httpBackend.expectPUT(this.HuronConfig.getCmiUrl() + '/common/customers/' + this.Authinfo.getOrgId() + '/users/12345', voiceMailPayload)
    .respond(500);

    spyOn(this.BulkEnableVmService, 'enableUserVmRetry').and.callThrough();
    this.BulkEnableVmService.enableUserVmRetry('12345', voiceMailPayload).catch(function (error) {
          expect(error.status).toBe(500);
        });
    expect(this.BulkEnableVmService.enableUserVmRetry).toHaveBeenCalledTimes(1);
    this.$httpBackend.flush();
  } );

  it('getUserServices should retry 3 times by default when 503 response is received', function() {
    this.$httpBackend.whenGET(this.HuronConfig.getCmiUrl() + '/common/customers/' + this.Authinfo.getOrgId() + '/users/12345')
    .respond(503);

    spyOn(this.BulkEnableVmService, 'getUserServicesRetry').and.callThrough();
    this.BulkEnableVmService.getUserServicesRetry('12345').catch(function (error) {
          expect(error.status).toBe(503);
        });
    this.$httpBackend.flush();
    expect(this.BulkEnableVmService.getUserServicesRetry).toHaveBeenCalledTimes(4);

  });

  it('getUserServices should retry 3 times by default when 502 response is received', function() {
    this.$httpBackend.whenGET(this.HuronConfig.getCmiUrl() + '/common/customers/' + this.Authinfo.getOrgId() + '/users/12345')
    .respond(502);

    spyOn(this.BulkEnableVmService, 'getUserServicesRetry').and.callThrough();
    this.BulkEnableVmService.getUserServicesRetry('12345').catch(function (error) {
          expect(error.status).toBe(502);
        });
    this.$httpBackend.flush();
    expect(this.BulkEnableVmService.getUserServicesRetry).toHaveBeenCalledTimes(4);

  });

  it('getUserServices should retry 3 times by default when 504 response is received', function() {
    this.$httpBackend.whenGET(this.HuronConfig.getCmiUrl() + '/common/customers/' + this.Authinfo.getOrgId() + '/users/12345')
    .respond(504);

    spyOn(this.BulkEnableVmService, 'getUserServicesRetry').and.callThrough();
    this.BulkEnableVmService.getUserServicesRetry('12345').catch(function (error) {
          expect(error.status).toBe(504);
        });
    this.$httpBackend.flush();
    expect(this.BulkEnableVmService.getUserServicesRetry).toHaveBeenCalledTimes(4);

  });

  it('getUserSitetoSiteNumberRetry should retry specified number of times when 429 response is received', function() {
    this.$httpBackend.whenGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/users/12345').respond(429);
    spyOn(this.BulkEnableVmService, 'getUserSitetoSiteNumberRetry').and.callThrough();

    this.BulkEnableVmService.getUserSitetoSiteNumberRetry('12345', 5).catch(function (error) {
          expect(error.status).toBe(429);
    });
    this.$httpBackend.flush();
    expect(this.BulkEnableVmService.getUserSitetoSiteNumberRetry).toHaveBeenCalledTimes(6);
  });

});
