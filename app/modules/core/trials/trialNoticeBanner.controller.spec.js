'use strict';

describe('Controller: TrialNoticeBannerCtrl:', function () {
  var $scope,
    controller,
    $httpBackend,
    $q,
    Authinfo,
    deferred,
    EmailService,
    FeatureToggleService,
    Notification,
    TrialService,
    UserListService;

  var fakePartnerInfoData = {
    'data': {
      'partners': [{
        'userName': 'fake-partner-email@example.com',
        'displayName': 'fakeuser admin1',
        'id': '2'
      }, {
        'userName': 'fake-partner-email2@example.com',
        'displayName': 'fakeuser admin2',
        'id': '1'
      }]
    }
  };

  var fakeTrialPeriodData = {
    startDate: '2015-12-06T00:00:00.000Z',
    trialPeriod: 90
  };

  var fakeConferenceDataWithWebex = [{
    'license': {
      'licenseType': 'CONFERENCING',
      'siteUrl': 'test.webex.com',
    }
  }, {
    'license': {
      'licenseType': 'CONFERENCING',
    }
  }];

  var fakeConferenceDataWithoutWebex = [{
    'license': {}
  }];

  afterEach(function () {
    $scope = controller = $httpBackend = $q = Authinfo = deferred = EmailService = Notification = TrialService = UserListService = undefined;
  });

  afterAll(function () {
    fakePartnerInfoData = fakeTrialPeriodData = fakeConferenceDataWithWebex = fakeConferenceDataWithoutWebex = undefined;
  });

  beforeEach(angular.mock.module('core.trial'));
  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  /* @ngInject */
  beforeEach(inject(function ($rootScope, $controller, _$httpBackend_, _$q_, _Authinfo_, _EmailService_,
                              _FeatureToggleService_, _Notification_, _TrialService_, _UserListService_) {

    $scope = $rootScope.$new();
    controller = $controller;
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    Authinfo = _Authinfo_;
    EmailService = _EmailService_;
    FeatureToggleService = _FeatureToggleService_;
    Notification = _Notification_;
    TrialService = _TrialService_;
    UserListService = _UserListService_;

    spyOn(FeatureToggleService, 'atlasNotifyPartnerTrialExtBackendEmailGetStatus').and.returnValue($q.when(false));
    spyOn(Notification, 'success');
    spyOn(Notification, 'error');
    spyOn(UserListService, 'listPartnersAsPromise').and.returnValue($q.when(fakePartnerInfoData));
    $httpBackend.whenGET(/organization\/trials$/).respond(fakeTrialPeriodData);

    deferred = _$q_.defer();

    controller = controller('TrialNoticeBannerCtrl', {
      Authinfo: Authinfo,
      EmailService: EmailService,
      FeatureToggleService: FeatureToggleService,
      Notification: Notification,
      TrialService: TrialService,
      UserListService: UserListService
    });

    $httpBackend.flush();
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('primary behaviors:', function () {

    describe('canShow():', function () {
      it('should return true if "Authinfo.isUserAdmin()" is true and "TrialInfo.getTrialIds()" is not empty and the logged in user is not the partner', function () {
        spyOn(TrialService, 'getTrialIds').and.returnValue(['fake-uuid-value-1']);
        spyOn(Authinfo, 'isUserAdmin').and.returnValue(true);
        spyOn(Authinfo, 'getUserId').and.returnValue('1');
        expect(controller.canShow()).toBe(true);
      });

      it('should return true if "Authinfo.isUserAdmin()" is false', function () {
        spyOn(Authinfo, 'isUserAdmin').and.returnValue(false);
        spyOn(Authinfo, 'getUserId').and.returnValue('1');
        expect(controller.canShow()).toBe(false);
      });

      it('should return true if the logged in user is the partner', function () {
        spyOn(TrialService, 'getTrialIds').and.returnValue(['fake-uuid-value-1']);
        spyOn(Authinfo, 'isUserAdmin').and.returnValue(true);
        spyOn(Authinfo, 'getUserId').and.returnValue('2');
        expect(controller.canShow()).toBe(false);
      });
    });

    describe('sendRequest():', function () {
      it('should have called "sendEmail()" when notification via backend request toggle is disabled', function () {
        spyOn(controller._helpers, 'sendEmail').and.returnValue($q.when());

        controller.sendRequest().then(function () {
          expect(controller._helpers.sendEmail).toHaveBeenCalled();
        });
      });
    });

    describe('sendRequest():', function () {
      beforeEach(function () {
        controller.isAtlasNotifyPartnerTrialExtBackendEmailEnabled = true;
      });

      it('should have called "TrialService.notifyPartnerTrialExt()" when notification via backend request toggle is enabled', function () {
        var fakePartnerNotifyResponse = {
          'data': {
            'notifyPartnerEmailStatusList': []
          }
        };
        spyOn(TrialService, 'notifyPartnerTrialExt').and.returnValue($q.when(fakePartnerNotifyResponse));

        controller.sendRequest().then(function () {
          expect(TrialService.notifyPartnerTrialExt).toHaveBeenCalled();

        });
      });
    });
  });

  describe('helper functions:', function () {

    describe('getPartnerInfo():', function () {

      describe('will resolve with partner data that...', function () {
        it('should have a "data.partners[0].displayName" property', function () {
          controller._helpers.getPartnerInfo().then(function () {
            expect(controller.partnerAdmin[0].userName).toBe('fake-partner-email@example.com');
            expect(controller.partnerAdmin[1].userName).toBe('fake-partner-email2@example.com');

          });
        });
      });
    });

    describe('sendEmail():', function () {
      beforeEach(function () {
        controller.partnerAdmin = fakePartnerInfoData.data.partners;
      });
      it('should have called "EmailService.emailNotifyPartnerTrialConversionRequest()" once for each partner admin with correct userName', function () {

        spyOn(Authinfo, 'getConferenceServices').and.callFake(function () {
          return null;
        });
        spyOn(EmailService, 'emailNotifyPartnerTrialConversionRequest').and.returnValue(deferred.promise);
        deferred.resolve({});
        $scope.$apply();

        controller._helpers.sendEmail('fake-cust-name', 'fake-cust-admin-email');
        expect(EmailService.emailNotifyPartnerTrialConversionRequest)
          .toHaveBeenCalledWith(
            'fake-cust-name', 'fake-cust-admin-email', 'fake-partner-email2@example.com', null);
        expect(EmailService.emailNotifyPartnerTrialConversionRequest)
          .toHaveBeenCalledWith(
            'fake-cust-name', 'fake-cust-admin-email', 'fake-partner-email@example.com', null);
      });

      it('should return the results array of length equal to the number of admins and value corresponding to the resolve object', function () {

        spyOn(Authinfo, 'getConferenceServices').and.callFake(function () {
          return null;
        });
        spyOn(EmailService, 'emailNotifyPartnerTrialConversionRequest').and.returnValue(deferred.promise);
        deferred.resolve({
          status: 400
        });
        $scope.$apply();

        controller._helpers.sendEmail('fake-cust-name', 'fake-cust-admin-email').then(function (results) {
          expect(results[0].status).toBe(400);
          expect(results.length).toBe(2);
        });

      });
    });

    describe('sendRequest():', function () {

      it('should set requestResult to true when all emails were sent succesfully with status 200', function () {

        var emailResult = [{
          status: 200
        }, {
          status: 200
        }];

        spyOn(controller._helpers, 'sendEmail').and.returnValue($q.when(emailResult));
        controller.sendRequest().then(function () {
          expect(controller.requestResult).toBe(controller.requestResultEnum.SUCCESS);
          expect(Notification.success).toHaveBeenCalled();

        });
      });

      it('should set requestResult to false when some emails were not sent with status 400', function () {

        var emailResult = [{
          status: 400
        }, {
          status: 200
        }];

        spyOn(controller._helpers, 'sendEmail').and.returnValue($q.when(emailResult));

        controller.sendRequest().then(function () {
          expect(controller.requestResult).toBe(controller.requestResultEnum.PARTIAL_FAILURE);
          expect(Notification.error).toHaveBeenCalled();
        });
      });

      it('should set requestResult to false when all emails were rejected with status 400', function () {

        var emailResult = [{
          status: 400
        }, {
          status: 400
        }];
        spyOn(controller._helpers, 'sendEmail').and.returnValue($q.when(emailResult));

        controller.sendRequest().then(function () {
          expect(controller.requestResult).toBe(controller.requestResultEnum.TOTAL_FAILURE);
          expect(Notification.error).toHaveBeenCalled();
        });
      });
    });

    describe('getWebexSiteUrl():', function () {

      it('should return null without Conference Services', function () {
        spyOn(Authinfo, 'getConferenceServices').and.callFake(function () {
          return null;
        });
        var url = controller._helpers.getWebexSiteUrl();
        expect(url).toBe(null);
      });

      it('should return null when Conference Services without webex', function () {
        spyOn(Authinfo, 'getConferenceServices').and.callFake(function () {
          return fakeConferenceDataWithoutWebex;
        });
        var url = controller._helpers.getWebexSiteUrl();
        expect(url).toBe(null);
      });

      it('should return webex siteUrl when Conference Services with webex', function () {
        spyOn(Authinfo, 'getConferenceServices').and.callFake(function () {
          return fakeConferenceDataWithWebex;
        });
        var url = controller._helpers.getWebexSiteUrl();
        expect(url).toBe('test.webex.com');
      });
    });

    describe('sendNotifyPartnerRequest():', function () {
      it('should set requestResult to TOTAL_FAILURE when the request to notify partners fails', function () {
        spyOn(TrialService, 'notifyPartnerTrialExt').and.returnValue($q.reject('error'));

        controller._helpers.sendNotifyPartnerRequest().then(function () {
          expect(Notification.errorResponse).toHaveBeenCalled();
          expect(Notification.errorResponse.calls.count()).toEqual(1);
          expect(controller.requestResult).toBe(controller.requestResultEnum.TOTAL_FAILURE);
        });

      });

      it('should set requestResult to TOTAL_FAILURE when the request to notify partners has no notifications', function () {
        var fakePartnerNotifyResponse = {
          data: {
            notifyPartnerEmailStatusList: []
          }
        };
        spyOn(TrialService, 'notifyPartnerTrialExt').and.returnValue($q.when(fakePartnerNotifyResponse));

        controller._helpers.sendNotifyPartnerRequest().then(function () {
          expect(Notification.error).toHaveBeenCalled();
          expect(Notification.error.calls.count()).toEqual(1);
          expect(controller.requestResult).toBe(controller.requestResultEnum.TOTAL_FAILURE);
        });

      });

      it('should set requestResult to TOTAL_FAILURE when the request to notify partners has all failed notifications', function () {
        var fakePartnerNotifyResponse = {
          data: {
            notifyPartnerEmailStatusList: [{
              adminEmail: 'fakeuserunodostres+admin1@gmail.com',
              status: 400
            }, {
              adminEmail: 'fakeuserunodostres+admin2@gmail.com',
              status: 400
            }]
          }
        };
        spyOn(TrialService, 'notifyPartnerTrialExt').and.returnValue($q.when(fakePartnerNotifyResponse));

        controller._helpers.sendNotifyPartnerRequest().then(function () {
          expect(Notification.error).toHaveBeenCalled();
          expect(Notification.error.calls.count()).toEqual(1);
          expect(controller.requestResult).toBe(controller.requestResultEnum.TOTAL_FAILURE);
        });

      });

      it('should set requestResult to PARTIAL_FAILURE when the request to notify partners has some failed notifications', function () {
        var fakePartnerNotifyResponse = {
          data: {
            notifyPartnerEmailStatusList: [{
              adminEmail: 'fakeuserunodostres+admin1@gmail.com',
              status: 200
            }, {
              adminEmail: 'fakeuserunodostres+admin2@gmail.com',
              status: 400
            }]
          }
        };
        spyOn(TrialService, 'notifyPartnerTrialExt').and.returnValue($q.when(fakePartnerNotifyResponse));

        controller._helpers.sendNotifyPartnerRequest().then(function () {
          expect(Notification.error).toHaveBeenCalled();
          expect(Notification.error.calls.count()).toEqual(1);
          expect(controller.requestResult).toBe(controller.requestResultEnum.PARTIAL_FAILURE);
        });

      });

      it('should set requestResult to SUCCESS when the request to notify partners has all successful notifications', function () {
        var fakePartnerNotifyResponse = {
          data: {
            notifyPartnerEmailStatusList: [{
              adminEmail: 'fakeuserunodostres+admin1@gmail.com',
              status: 200
            }, {
              adminEmail: 'fakeuserunodostres+admin2@gmail.com',
              status: 200
            }]
          }
        };
        spyOn(TrialService, 'notifyPartnerTrialExt').and.returnValue($q.when(fakePartnerNotifyResponse));

        controller._helpers.sendNotifyPartnerRequest().then(function () {
          expect(Notification.success).toHaveBeenCalled();
          expect(Notification.success.calls.count()).toEqual(1);
          expect(controller.requestResult).toBe(controller.requestResultEnum.SUCCESS);
        });

      });
    });
  });
});
