'use strict';

describe('Controller: UserOverviewCtrl', function () {
  var controller, $controller, $scope, $httpBackend, $rootScope, $q, Config, Authinfo, Auth, Userservice, FeatureToggleService, Notification, WebExUtilsFact;

  var $stateParams, currentUser, updatedUser, getUserFeatures, UrlConfig;
  var userEmail, userName, uuid, userStatus, dirsyncEnabled, entitlements, invitations;

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));
  beforeEach(angular.mock.module('WebExApp'));

  beforeEach(inject(function (_$controller_, _$httpBackend_, _$q_, _$rootScope_, _Config_, _Authinfo_, _Auth_, _Userservice_, _FeatureToggleService_, _UrlConfig_, _Notification_, _WebExUtilsFact_) {
    $controller = _$controller_;
    $scope = _$rootScope_.$new();
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    Config = _Config_;
    Authinfo = _Authinfo_;
    Auth = _Auth_;
    UrlConfig = _UrlConfig_;
    Userservice = _Userservice_;
    FeatureToggleService = _FeatureToggleService_;
    Notification = _Notification_;
    WebExUtilsFact = _WebExUtilsFact_;

    var deferred = $q.defer();
    deferred.resolve('true');
    currentUser = angular.copy(getJSONFixture('core/json/currentUser.json'));
    invitations = getJSONFixture('core/json/users/invitations.json');
    updatedUser = angular.copy(currentUser);
    getUserFeatures = getJSONFixture('core/json/users/me/featureToggles.json');
    var deferred2 = $q.defer();
    deferred2.resolve(getUserFeatures);

    $stateParams = {
      currentUser: currentUser
    };

    spyOn(Authinfo, 'getOrgId').and.returnValue(currentUser.meta.organizationID);
    spyOn(Userservice, 'getUser').and.callFake(function (uid, callback) {
      callback(currentUser, 200);
    });
    spyOn(Userservice, 'resendInvitation').and.returnValue($q.when({}));
    spyOn(FeatureToggleService, 'getFeatureForUser').and.returnValue(deferred.promise);
    spyOn(FeatureToggleService, 'getFeaturesForUser').and.returnValue(deferred2.promise);
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.when(true));
    spyOn(FeatureToggleService, 'atlasSMPGetStatus').and.returnValue($q.when(false));
    spyOn(Authinfo, 'isCSB').and.returnValue(false);
    spyOn(Auth, 'isOnlineOrg').and.returnValue($q.when(false));
    spyOn(Notification, 'success');
    spyOn(WebExUtilsFact, 'isCIEnabledSite').and.returnValue(true);
    spyOn(Authinfo, 'isSquaredTeamMember').and.returnValue(false);

    // eww
    var userUrl = UrlConfig.getScimUrl(Authinfo.getOrgId()) + '/' + currentUser.id;
    $httpBackend.whenGET(userUrl).respond(updatedUser);
    var inviteUrl = UrlConfig.getAdminServiceUrl() + 'organization/' + currentUser.meta.organizationID + '/invitations/' + currentUser.id;
    $httpBackend.whenGET(inviteUrl).respond(invitations);

    initController();
  }));

  function initController() {
    controller = $controller('UserOverviewCtrl', {
      $scope: $scope,
      $stateParams: $stateParams,
      Config: Config,
      Authinfo: Authinfo,
      Userservice: Userservice,
      FeatureToggleService: FeatureToggleService
    });
    $scope.$apply();
  }

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('init', function () {
    it('should handle an empty response from feature toggles', function () {
      Authinfo.isSquaredTeamMember.and.returnValue(true);
      FeatureToggleService.getFeaturesForUser.and.returnValue($q.resolve({}));
      expect(initController).not.toThrow();
    });

    it('should reload the user data from identity response when user list is updated', function () {
      expect(currentUser.entitlements.length).toEqual(2);
      updatedUser.entitlements.push('ciscouc');
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(currentUser.entitlements.length).toEqual(3);
    });

    it('should reload the user data from identity response when entitlements are updated', function () {
      expect(currentUser.entitlements.length).toEqual(2);
      updatedUser.entitlements.push('ciscouc');
      $scope.$broadcast('entitlementsUpdated');
      $httpBackend.flush();
      expect(currentUser.entitlements.length).toEqual(3);
    });

    it('should set the title to displayName when user data is updated with displayName', function () {
      updatedUser.displayName = "Display Name";
      $scope.$broadcast('entitlementsUpdated');
      $httpBackend.flush();
      expect(controller.titleCard).toEqual("Display Name");
    });

    it('should not set features list by default', function () {
      expect(controller.features).toBeUndefined();
    });

    it('should reload the user data from identity response and set subTitleCard to title', function () {
      updatedUser.title = "Test";
      updatedUser.displayName = "Display Name";
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(controller.subTitleCard).toBe("Test");
    });

    it('should reload the user data from identity response and set title with givenName and FamilyName', function () {
      updatedUser.name = {
        givenName: "Given Name",
        familyName: "Family Name"
      };
      $scope.$broadcast('entitlementsUpdated');
      $httpBackend.flush();
      expect(controller.titleCard).toEqual("Given Name Family Name");
    });

    it('should reload the user data from identity response and set subTitleCard to addresses', function () {
      updatedUser.addresses.push({
        "locality": "AddressLine1"
      });
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(controller.subTitleCard).toBe(" AddressLine1 AddressLine1");

    });

    it('should reload the user data from identity when user list is updated with cloud-contact-center entitlement', function () {
      expect(currentUser.entitlements.length).toEqual(2);
      updatedUser.entitlements.push('cloud-contact-center');
      $scope.$broadcast('entitlementsUpdated');
      $httpBackend.flush();
      expect(currentUser.entitlements.length).toEqual(3);
    });

    it('should reload the user data from identity when user list is updated with squared-syncup entitlement', function () {
      expect(currentUser.entitlements.length).toEqual(2);
      updatedUser.entitlements.push('squared-syncup');
      $scope.$broadcast('entitlementsUpdated');
      $httpBackend.flush();
      expect(currentUser.entitlements.length).toEqual(3);
    });

    it('should reload user data from identity response when squared-syncup licenseID is updated', function () {
      updatedUser.entitlements.push('squared-syncup');
      updatedUser.licenseID.push('CF_xyz');
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(currentUser.licenseID.length).toEqual(1);
    });

    it('should reload user data from identity response when contact center licenseID is updated', function () {
      updatedUser.entitlements.push('cloud-contact-center');
      updatedUser.licenseID.push('CC_xyz');
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(currentUser.licenseID.length).toEqual(1);
    });

    it('should reload user data from identity response when communication licenseID is updated', function () {
      updatedUser.licenseID.push('CO_xyz');
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(currentUser.licenseID.length).toEqual(1);
    });

    it('should reload user data from identity response when messaging licenseID is updated', function () {
      updatedUser.licenseID.push('MS_xyz');
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(currentUser.licenseID.length).toEqual(1);
    });
  });

  describe('AuthCodeLink', function () {
    it('should set showGenerateOtpLink to true when addGenerateAuthCodeLink method is called on controller', function () {
      controller.enableAuthCodeLink();
      expect(controller.showGenerateOtpLink).toBeTruthy();
    });

    it('should set showGenerateOtpLink to false when disableAuthCodeLink method is called on controller', function () {
      controller.disableAuthCodeLink();
      expect(controller.showGenerateOtpLink).toBeFalsy();
    });

  });

  describe('getAccountStatus should be called properly', function () {
    it('and should check if status is pending', function () {
      expect(controller.pendingStatus).toBe(true);
      expect(controller.currentUser.pendingStatus).toBe(true);
    });
    it('and should check if status is not pending', function () {
      updatedUser.licenseID.push('MS_d9fb2e50-2a92-4b0f-b1a4-e7003ecc93ec');
      updatedUser.userSettings = [];
      updatedUser.userSettings.push('{spark.signUpDate:1470262687261}');
      $scope.$broadcast('USER_LIST_UPDATED');
      $httpBackend.flush();
      expect(controller.pendingStatus).toBe(false);
      expect(controller.currentUser.pendingStatus).toBe(false);
    });
  });

  describe('resendInvitation', function () {
    beforeEach(function () {
      userEmail = 'testOrg12345@gmail';
      userName = 'testOrgEmail';
      uuid = '111112';
      userStatus = 'pending';
      dirsyncEnabled = true;
      entitlements = ["squared-call-initiation", "spark", "webex-squared"];
    });

    it('should call resendInvitation successfully', function () {
      controller.resendInvitation(userEmail, userName, uuid, userStatus, dirsyncEnabled, entitlements);
      $rootScope.$apply();
      expect(Notification.success).toHaveBeenCalled();
    });
  });

  describe('When Authinfo.isCSB returns false', function () {
    it('should set the controller.isCSB to false', function () {
      expect(controller.isCSB).toBe(false);
    });
  });

});
