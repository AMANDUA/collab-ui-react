'use strict';

describe('Controller: CustomerOverviewCtrl', function () {
  var $controller, $scope, $stateParams, $state, $window, $q, modal, Authinfo, BrandService, controller, currentCustomer, FeatureToggleService, identityCustomer, newCustomerViewToggle, Orgservice, PartnerService, trialForPaid, TrialService, Userservice, Notification;

  var licenseString = 'MC_cfb817d0-ddfe-403d-a976-ada57d32a3d7_100_t30citest.webex.com';

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));
  beforeEach(inject(function ($rootScope, _$controller_, _$stateParams_, _$state_, _$window_, _$q_, _$modal_, _FeatureToggleService_, _Orgservice_, _PartnerService_, _TrialService_, _Notification_) {

    $scope = $rootScope.$new();
    currentCustomer = {
      customerEmail: 'testuser@gmail.com',
      customerOrgId: '123-456',
      licenseList: [{
        licenseId: licenseString,
        offerName: "MC",
        licenseType: "CONFERENCING",
        siteUrl: "t30citest.webex.com"
      }, {
        licenseId: "ST_04b1c66d-9cb7-4280-bd0e-cfdb763fbdc6",
        offerName: "ST",
        licenseType: "STORAGE"
      }]
    };
    identityCustomer = {
      services: ['webex-squared', 'ciscouc']
    };
    $scope.newCustomerViewToggle = newCustomerViewToggle;
    $scope.trialForPaid = trialForPaid;
    Userservice = {
      updateUsers: function () {}
    };
    Authinfo = {
      getPrimaryEmail: function () {
        return "xyz123@gmail.com";
      },
      getOrgId: function () {
        return '1A2B3C4D';
      },
      getOrgName: function () {
        return "xyz123";
      },
      isPartnerAdmin: function () {
        return true;
      },
      getUserId: function () {
        return 'D4C3B2A1';
      },
      isCare: function () {
        return true;
      }
    };
    BrandService = {
      getSettings: function () {}
    };

    FeatureToggleService = _FeatureToggleService_;
    Orgservice = _Orgservice_;
    PartnerService = _PartnerService_;

    $stateParams = _$stateParams_;
    $stateParams.currentCustomer = currentCustomer;
    $state = _$state_;
    $window = _$window_;
    $q = _$q_;
    modal = _$modal_;
    $controller = _$controller_;

    $state.modal = {
      result: $q.when()
    };

    TrialService = _TrialService_;
    Notification = _Notification_;
    spyOn(Notification, 'errorWithTrackingId');
    spyOn($state, 'go').and.returnValue($q.when());
    spyOn($state, 'href').and.callThrough();
    spyOn($window, 'open');
    spyOn(Userservice, 'updateUsers').and.callFake(function (usersDataArray, licenses, entitlements, method, callback) {
      callback();
    });
    spyOn(BrandService, 'getSettings').and.returnValue($q.when({}));
    spyOn(TrialService, 'getTrial').and.returnValue($q.when({}));
    spyOn(Orgservice, 'getOrg').and.callFake(function (callback) {
      callback(getJSONFixture('core/json/organizations/Orgservice.json').getOrg, 200);
    });
    spyOn(Orgservice, 'isSetupDone').and.returnValue($q.when(false));
    spyOn(PartnerService, 'modifyManagedOrgs').and.returnValue($q.when({}));
    spyOn($window, 'confirm').and.returnValue(true);
    spyOn(FeatureToggleService, 'atlasCareTrialsGetStatus').and.returnValue(
      $q.when(true)
    );
    spyOn(FeatureToggleService, 'atlasCustomerListUpdateGetStatus').and.returnValue($q.resolve(true));
    spyOn(modal, 'open').and.callThrough();

    initController();
  }));

  function initController(options) {
    var trialForPaid = _.get(options, 'hasTrialForPaidFT', false);
    controller = $controller('CustomerOverviewCtrl', {
      $scope: $scope,
      identityCustomer: identityCustomer,
      Userservice: Userservice,
      Authinfo: Authinfo,
      BrandService: BrandService,
      FeatureToggleService: FeatureToggleService,
      newCustomerViewToggle: newCustomerViewToggle,
      $modal: modal,
      trialForPaid: trialForPaid
    });

    $scope.$apply();
  }

  xit('should transition to trialEdit.info state', function () {
    controller.openEditTrialModal();
    expect($state.go).toHaveBeenCalled();
    expect($state.go.calls.mostRecent().args[0]).toEqual('trialEdit.info');

    $state.go.calls.reset();

    $scope.$apply(); // modal is closed and promise is resolved
    expect($state.go).toHaveBeenCalled();
    expect($state.go.calls.mostRecent().args[0]).toEqual('partnercustomers.list');
  });

  describe('Trial for Paid  Customer feature toggle Trial Actions', function () {
    it('should be empty for paid customer without feature toggle', function () {
      initController({ hasTrialForPaidFT: false });
      expect(controller.trialActions.length).toBe(0);
    });

    it('should have \'add\' action for paid customer with feature toggle', function () {
      initController({ hasTrialForPaidFT: true });
      expect(controller.trialActions.length).toBe(1);
      expect(controller.trialActions[0].actionKey).toBe('customerPage.addTrial');
    });
  });

  it('should display correct customer portal launch button via var isOrgSetup', function () {
    // isOrgSetup is false from spyOn in beforeEach
    expect(controller.isOrgSetup).toBe(false);

    Orgservice.isSetupDone.and.returnValue($q.when(true));
    initController();
    expect(controller.isOrgSetup).toBe(true);
  });

  it('should display number of days left', function () {
    expect(controller.getDaysLeft(1)).toEqual(1);
    expect(controller.getDaysLeft(0)).toEqual('customerPage.expiresToday');
    expect(controller.getDaysLeft(-1)).toEqual('customerPage.expired');
  });

  it('should set the isSquaredUC flag based on services', function () {
    expect(controller.isSquaredUC).toEqual(true);
  });


  describe('launchCustomerPortal', function () {
    beforeEach(function () {
      Userservice.updateUsers.and.returnValue($q.when());
    });

    describe('as a full-admin', function () {
      beforeEach(function () {
        spyOn(controller._helpers, 'canUpdateLicensesForSelf').and.returnValue(true);
        controller.launchCustomerPortal();
        $scope.$apply();
      });

      it('should call modifyManagedOrgs', function () {
        expect(controller.customerOrgId).toBe(currentCustomer.customerOrgId);
        expect(Authinfo.isPartnerAdmin()).toBe(true);
        expect(PartnerService.modifyManagedOrgs).toHaveBeenCalled();
      });

      it('should create proper url', function () {
        expect($state.href).toHaveBeenCalledWith('login_swap', {
          customerOrgId: controller.currentCustomer.customerOrgId,
          customerOrgName: controller.currentCustomer.customerName
        });
      });

      it('should call $window.open', function () {
        expect($window.open).toHaveBeenCalled();
      });
    });

    describe('as a non-full-admin', function () {
      beforeEach(function () {
        controller.isPartnerAdmin = false;
        spyOn(controller._helpers, 'canUpdateLicensesForSelf').and.returnValue(false);
        spyOn(controller._helpers, 'openCustomerPortal');
        controller.launchCustomerPortal();
        $scope.$apply();
      });

      it('should not call "modifyManagedOrgs()"', function () {
        expect(PartnerService.modifyManagedOrgs).not.toHaveBeenCalled();
      });

      it('should call "openCustomerPortal()"', function () {
        expect(controller._helpers.openCustomerPortal).toHaveBeenCalled();
      });
    });
  });

  describe('launchCustomerPortal error', function () {
    beforeEach(function () {
      PartnerService.modifyManagedOrgs.and.returnValue($q.reject(400));
      Userservice.updateUsers.and.returnValue($q.when());
      controller.launchCustomerPortal();
      $scope.$apply();
    });

    it('should cause a Notification if modifyManagedOrgs returns 400', function () {
      expect(Notification.errorWithTrackingId).toHaveBeenCalled();
    });
  });

  describe('should call isTestOrg successfully', function () {
    it('should identify as a test org', function () {
      expect(controller.isTest).toBe(true);
    });
  });

  describe('should call deleteOrg successfully', function () {
    it('should call deleteTestOrg', function () {
      controller.deleteTestOrg();
      expect(modal.open).toHaveBeenCalled();
    });
  });

  describe('atlasCareTrialsGetStatus should be called', function () {
    it('should have called FeatureToggleService.atlasCareTrialsGetStatus', function () {
      expect(FeatureToggleService.atlasCareTrialsGetStatus).toHaveBeenCalled();
    });
  });

});
