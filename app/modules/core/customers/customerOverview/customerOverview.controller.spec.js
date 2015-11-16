'use strict';

describe('Controller: CustomerOverviewCtrl', function () {
  var controller, $scope, $stateParams, $state, $window, $q, currentCustomer, identityCustomer, Userservice, Authinfo, BrandService;

  function LicenseFeature(name, state) {
    this['id'] = name.toString();
    this['properties'] = null;
    //this['state'] = state ? 'ADD' : 'REMOVE';
  }

  var licenseString = 'MC_cfb817d0-ddfe-403d-a976-ada57d32a3d7_100_t30citest.webex.com';

  beforeEach(module('Core'));

  beforeEach(inject(function ($rootScope, $controller, _$stateParams_, _$state_, _$window_, _$q_) {
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
    Userservice = {
      updateUsers: function () {}
    };
    Authinfo = {
      getPrimaryEmail: function () {
        return "xyz123@gmail.com";
      },
      getOrgId: function () {
        return '1A2B3C4D';
      }
    };
    BrandService = {
      getSettings: function () {}
    };

    $stateParams = _$stateParams_;
    $stateParams.currentCustomer = currentCustomer;
    $state = _$state_;
    $window = _$window_;
    $q = _$q_;

    $state.modal = {
      result: $q.when()
    };
    spyOn($state, 'go').and.returnValue($q.when());
    spyOn($state, 'href').and.callThrough();
    spyOn($window, 'open');
    spyOn(Userservice, 'updateUsers');
    spyOn(BrandService, 'getSettings').and.returnValue($q.when({}));

    controller = $controller('CustomerOverviewCtrl', {
      $scope: $scope,
      identityCustomer: identityCustomer,
      Userservice: Userservice,
      Authinfo: Authinfo,
      BrandService: BrandService
    });

    $scope.$apply();
  }));

  it('should transition to trialEdit.info state', function () {
    controller.openEditTrialModal();
    expect($state.go).toHaveBeenCalled();
    expect($state.go.calls.mostRecent().args[0]).toEqual('trialEdit.info');

    $state.go.calls.reset();

    $scope.$apply(); // modal is closed and promise is resolved
    expect($state.go).toHaveBeenCalled();
    expect($state.go.calls.mostRecent().args[0]).toEqual('partnercustomers.list');
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
      controller.launchCustomerPortal();
    });
    it('should create proper url', function () {
      expect($state.href).toHaveBeenCalledWith('login_swap', {
        customerOrgId: controller.currentCustomer.customerOrgId,
        customerOrgName: controller.currentCustomer.customerName
      });
    });

    it('should call Userservice.updateUsers with correct license', function () {
      expect(Userservice.updateUsers).toHaveBeenCalledWith([{
          address: "xyz123@gmail.com"
        }], jasmine.any(Array),
        //[new LicenseFeature(licenseString, true)],
        null, 'updateUserLicense', jasmine.any(Function));
    });

    it('should call $window.open', function () {
      expect($window.open).toHaveBeenCalled();
    });
  });

});