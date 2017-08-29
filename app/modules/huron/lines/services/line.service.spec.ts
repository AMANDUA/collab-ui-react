import { Line, LineConsumerType } from './index';

describe('Service: LineService', () => {
  beforeEach(function () {
    this.initModules('huron.line-services');
    this.injectDependencies(
      '$httpBackend',
      'Authinfo',
      'HuronConfig',
      'LineService',
    );
    spyOn(this.Authinfo, 'getOrgId').and.returnValue('12345');

    const getLineResponse: Line = {
      uuid: '0000000',
      primary: true,
      shared: false,
      internal: '12345',
      external: '',
      siteToSite: '710012345',
      incomingCallMaximum: 2,
      label: {
        value: 'someuser@some.com',
        appliesToAllSharedLines: false,
      },
    };

    const createLinePayload: any = {
      internal: '12345',
      external: '+99999',
      incomingCallMaximum: 2,
    };

    const updateLinePayload: any = {
      internal: '54321',
      external: '+98765',
      incomingCallMaximum: 8,
      label: {
        value: 'someuser@some.com',
        appliesToAllSharedLines: false,
      },
    };

    this.getLineResponse = getLineResponse;
    this.createLinePayload = createLinePayload;
    this.updateLinePayload = updateLinePayload;
  });

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  it('should get a single line for a place', function () {
    this.$httpBackend.expectGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/places/12345/numbers/0000000')
      .respond(200, this.getLineResponse);
    this.LineService.getLine(LineConsumerType.PLACES, '12345', '0000000').then(response => {
      expect(response).toEqual(jasmine.objectContaining(this.getLineResponse));
    });
    this.$httpBackend.flush();
  });

  it('should reject the promise on a failed response', function () {
    this.$httpBackend.expectGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/places/12345/numbers/0000000').respond(500);
    this.LineService.getLine(LineConsumerType.PLACES, '12345', '0000000').then(response => {
      expect(response.data).toBeUndefined();
      expect(response.status).toEqual(500);
    });
    this.$httpBackend.flush();
  });

  it('should get a single line for a user', function () {
    this.$httpBackend.expectGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/users/12345/numbers/0000000')
      .respond(200, this.getLineResponse);
    this.LineService.getLine(LineConsumerType.USERS, '12345', '0000000').then(response => {
      expect(response).toEqual(jasmine.objectContaining(this.getLineResponse));
    });
    this.$httpBackend.flush();
  });

  it('should create a line for a place', function () {
    this.$httpBackend.expectPOST(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/places/12345/numbers?wide=false', this.createLinePayload).respond(201, {},
      {
        Location: 'http://some/url/123456',
      });
    this.LineService.createLine(LineConsumerType.PLACES, '12345', this.createLinePayload).then(location => {
      expect(location).toEqual('http://some/url/123456');
    });
    this.$httpBackend.flush();
  });

  it('should create a line for a user', function () {
    this.$httpBackend.expectPOST(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/users/12345/numbers?wide=false', this.createLinePayload).respond(201, {},
      {
        Location: 'http://some/url/123456',
      });
    this.LineService.createLine(LineConsumerType.USERS, '12345', this.createLinePayload).then(location => {
      expect(location).toEqual('http://some/url/123456');
    });
    this.$httpBackend.flush();
  });

  it('should update a line for a place', function () {
    this.$httpBackend.expectPUT(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/places/12345/numbers/0000000?wide=false', this.updateLinePayload).respond(200);
    this.LineService.updateLine(LineConsumerType.PLACES, '12345', '0000000', this.updateLinePayload);
    this.$httpBackend.flush();
  });

  it('should update a line for a user', function () {
    this.$httpBackend.expectPUT(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/users/12345/numbers/0000000?wide=false', this.updateLinePayload).respond(200);
    this.LineService.updateLine(LineConsumerType.USERS, '12345', '0000000', this.updateLinePayload);
    this.$httpBackend.flush();
  });

  it('should delete a line for a place', function () {
    this.$httpBackend.expectDELETE(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/places/12345/numbers/0000000?wide=false').respond(204);
    this.LineService.deleteLine(LineConsumerType.PLACES, '12345', '0000000');
    this.$httpBackend.flush();
  });

  it('should delete a line for a user', function () {
    this.$httpBackend.expectDELETE(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/users/12345/numbers/0000000?wide=false').respond(204);
    this.LineService.deleteLine(LineConsumerType.USERS, '12345', '0000000');
    this.$httpBackend.flush();
  });

});
