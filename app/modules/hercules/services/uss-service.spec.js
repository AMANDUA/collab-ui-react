'use strict';

describe('Service: USSService', function () {
  beforeEach(angular.mock.module('Squared')); // because we use CsdmPoller
  beforeEach(angular.mock.module('Hercules'));

  var $httpBackend, Authinfo, CsdmHubFactory, USSService, hubOn;
  var rootPath = 'https://uss-integration.wbx2.com/uss/api/v1/';

  beforeEach(angular.mock.module(function ($provide) {
    hubOn = sinon.spy();
    CsdmHubFactory = {
      create: sinon.stub()
    };
    CsdmHubFactory.create.returns({
      on: hubOn,
      onListener: sinon.stub()
    });
    $provide.value('CsdmHubFactory', CsdmHubFactory);
  }));
  beforeEach(inject(function (_$httpBackend_, _USSService_, _Authinfo_) {
    Authinfo = _Authinfo_;
    Authinfo.getOrgId = sinon.stub().returns('456');

    $httpBackend = _$httpBackend_;
    USSService = _USSService_;
  }));

  it('should fetch and return data from the correct backend', function () {
    $httpBackend
      .when('GET', rootPath + 'orgs/456/userStatuses?userId=123')
      .respond({
        userStatuses: [{
          userId: '123',
          orgId: 'cisco',
          serviceId: 'squared-fusion-cal',
          entitled: false,
          state: 'deactivated'
        }, {
          userId: '123',
          orgId: 'cisco',
          serviceId: 'squared-fusion-uc',
          entitled: false,
          state: 'pendingDeactivation'
        }, {
          userId: '123',
          orgId: 'cisco',
          serviceId: 'squared-fusion-yolo',
          entitled: true,
          state: 'deactivated'
        }, {
          userId: '123',
          orgId: 'cisco',
          serviceId: 'squared-fusion-voicemail',
          entitled: true,
          state: 'activated'
        }]
      });

    USSService.getStatusesForUser('123')
      .then(function (response) {
        expect(response.length).toBe(3);
        expect(response[0].serviceId).toBe('squared-fusion-uc');
        expect(response[1].serviceId).toBe('squared-fusion-yolo');
        expect(response[2].serviceId).toBe('squared-fusion-voicemail');
      });

    $httpBackend.flush();
  });

  describe('getStatusesForUser', function () {
    it('should return statuses for a given user', function () {
      $httpBackend
        .when('GET', rootPath + 'orgs/456/userStatuses?userId=123')
        .respond({
          userStatuses: [{
            userId: '123',
            orgId: 'cisco',
            serviceId: 'squared-fusion-cal',
            entitled: false,
            state: 'deactivated'
          }]
        });

      USSService.getStatusesForUser('123')
        .then(function (response) {
          // in the mocked HTTP response, the user is not entitled and
          // state === 'deactivated' so USSService will filter it
          expect(response.length).toBe(0);
        });
      $httpBackend.flush();
    });

    it('should return error status if unable to fetch data from backend', function () {
      $httpBackend
        .when('GET', rootPath + 'orgs/456/userStatuses?userId=123')
        .respond(500);

      USSService.getStatusesForUser('123')
        .catch(function (error) {
          expect(error.status).toBe(500);
        });
      $httpBackend.flush();
    });
  });

  describe('decorateWithStatus', function () {
    describe('when not entitled', function () {
      it('error state is not entitled', function () {
        var status = USSService.decorateWithStatus({
          entitled: false,
          state: 'error'
        });
        expect(status).toBe('not_entitled');
      });

      it('deactivated state is not entitled', function () {
        var status = USSService.decorateWithStatus({
          entitled: false,
          state: 'deactivated'
        });
        expect(status).toBe('not_entitled');
      });

      it('notActivated state is not entitled', function () {
        var status = USSService.decorateWithStatus({
          entitled: false,
          state: 'notActivated'
        });
        expect(status).toBe('not_entitled');
      });

      it('activated state is pending deactivation', function () {
        var status = USSService.decorateWithStatus({
          entitled: false,
          state: 'activated'
        });
        expect(status).toBe('not_entitled');
      });

      it('other state is unknown', function () {
        var status = USSService.decorateWithStatus({
          entitled: true,
          state: 'other'
        });
        expect(status).toBe('unknown');
      });
    });

    describe('when entitled', function () {
      it('deactivated state is pending activation', function () {
        var status = USSService.decorateWithStatus({
          entitled: true,
          state: 'deactivated'
        });
        expect(status).toBe('pending_activation');
      });

      it('notActivated state is pending activation', function () {
        var status = USSService.decorateWithStatus({
          entitled: true,
          state: 'notActivated'
        });
        expect(status).toBe('pending_activation');
      });

      it('activated state is activated', function () {
        var status = USSService.decorateWithStatus({
          entitled: true,
          state: 'activated'
        });
        expect(status).toBe('activated');
      });

      it('error state is error', function () {
        var status = USSService.decorateWithStatus({
          entitled: true,
          state: 'error'
        });
        expect(status).toBe('error');
      });

      it('other state is unknown', function () {
        var status = USSService.decorateWithStatus({
          entitled: true,
          state: 'other'
        });
        expect(status).toBe('unknown');
      });
    });
  });

  describe('getOrg', function () {
    it('should work', function () {
      $httpBackend
        .when('GET', rootPath + 'orgs/456')
        .respond({
          id: '456',
          sipDomain: ''
        });

      USSService.getOrg('456')
        .then(function (response) {
          expect(response.id).toEqual('456');
        });
      $httpBackend.flush();
    });
  });

  describe('updateOrg', function () {
    it('should work', function () {
      $httpBackend
        .when('PATCH', rootPath + 'orgs/456', {
          id: '456',
          sipDomain: 'whatever'
        })
        .respond({
          id: '456',
          sipDomain: 'whatever'
        });

      USSService.updateOrg({
        id: '456',
        sipDomain: 'whatever'
      })
        .then(function (response) {
          expect(response.sipDomain).toEqual('whatever');
        });
      $httpBackend.flush();
    });
  });

  describe('getStatusesSummary', function () {
    it('should be empty by default', function () {
      var statuses = USSService.getStatusesSummary();
      expect(statuses).toEqual([]);
    });

    // TODO: find how to check changes after polling
    // TODO: find how to check that the HTTP request trigerred will have ?entitled=true
  });

  describe('getStatuses', function () {
    it('should work', function () {
      $httpBackend
        .when('GET', rootPath + 'orgs/456/userStatuses?serviceId=squared-fusion-cal&limit=10000&entitled=true')
        .respond({
          userStatuses: [{
            userId: '123',
            orgId: '456',
            serviceId: 'squared-fusion-cal',
            entitled: true,
            state: 'notActivated'
          }, {
            userId: 'ABC',
            orgId: '456',
            serviceId: 'squared-fusion-cal',
            entitled: true,
            state: 'error',
            connectorId: 'c_cal@0A5E3DE8',
            description: {
              key: 'c_cal.DiscoveryScoreException',
              defaultMessage: 'Failed to get score for the user:  MailServer Error:  User folder bind error'
            },
            clusterId: 'f61e9340-928e-11e5-9965-005056b12db1'
          }]
        });

      USSService.getAllStatuses('squared-fusion-cal', null)
        .then(function (userStatuses) {
          expect(userStatuses.length).toEqual(2);
        });
      $httpBackend.flush();
    });
  });

  describe('subscribeStatusesSummary', function () {
    it('should have some specific functions', function () {
      expect(hubOn.called).toBe(false);
      USSService.subscribeStatusesSummary('blah', function () {});
      expect(hubOn.called).toBe(true);
    });
  });

  describe('getStatusesForUserInOrg', function () {
    it('should return statuses for a given user in org', function () {
      $httpBackend
        .when('GET', rootPath + 'orgs/456/userStatuses?userId=123')
        .respond({
          userStatuses: [{
            userId: '123',
            orgId: '456',
            serviceId: 'squared-fusion-cal',
            entitled: true,
            state: 'active'
          }]
        });

      USSService.getStatusesForUserInOrg('123', '456')
        .then(function (response) {
          expect(response.length).toBe(1);
        });
      $httpBackend.flush();
    });
  });

  describe('getUserProps', function () {
    it('should return props for a given user in org', function () {
      $httpBackend
        .when('GET', rootPath + 'orgs/456/userProps/123')
        .respond({ userId: '123', resourceGroups: {} });

      USSService.getUserProps('123', '456')
        .then(function (response) {
          expect(response.userId).toBe('123');
        });
      $httpBackend.flush();
    });
  });
});
