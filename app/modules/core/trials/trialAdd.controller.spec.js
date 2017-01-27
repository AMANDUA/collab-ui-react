'use strict';

describe('Controller: TrialAddCtrl', function () {
  var controller, $httpBackend, $q, $scope, $state, $translate, Analytics, FeatureToggleService, HuronCustomer, Notification, Orgservice, TrialContextService, TrialPstnService, TrialService;
  var addContextSpy;

  afterEach(function () {
    controller = $httpBackend = $q = $scope = $state = $translate = Analytics = FeatureToggleService = HuronCustomer = Notification = Orgservice = TrialContextService = TrialPstnService = TrialService = undefined;
    addContextSpy = undefined;
  });

  beforeEach(angular.mock.module('core.trial'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));
  beforeEach(angular.mock.module('Core'));

  beforeEach(inject(function ($rootScope, $controller, _$httpBackend_, _$q_, _$state_, _$translate_, _Analytics_, _FeatureToggleService_, _HuronCustomer_, _Notification_, _Orgservice_, _TrialContextService_, _TrialPstnService_, _TrialService_) {
    $scope = $rootScope.$new();
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    $state = _$state_;
    $translate = _$translate_;
    FeatureToggleService = _FeatureToggleService_;
    HuronCustomer = _HuronCustomer_;
    Notification = _Notification_;
    Orgservice = _Orgservice_;
    TrialService = _TrialService_;
    TrialContextService = _TrialContextService_;
    TrialPstnService = _TrialPstnService_;
    Analytics = _Analytics_;

    $state.modal = jasmine.createSpyObj('modal', ['close']);
    addContextSpy = spyOn(TrialContextService, 'addService').and.returnValue($q.resolve());

    spyOn(FeatureToggleService, 'atlasCareTrialsGetStatus').and.returnValue($q.resolve(true));
    spyOn(FeatureToggleService, 'atlasCareCallbackTrialsGetStatus').and.returnValue($q.resolve(true));
    spyOn(FeatureToggleService, 'atlasContextServiceTrialsGetStatus').and.returnValue($q.resolve(true));
    spyOn(FeatureToggleService, 'atlasTrialsShipDevicesGetStatus').and.returnValue($q.resolve(false));
    spyOn(FeatureToggleService, 'supports').and.callFake(function (param) {
      fail('the following toggle wasn\'t expected ' + param);
    });

    spyOn(Notification, 'success');
    spyOn(Notification, 'errorResponse');
    spyOn(Orgservice, 'getOrg').and.callFake(function (callback) {
      callback(getJSONFixture('core/json/organizations/Orgservice.json').getOrg, 200);
    });
    spyOn($state, 'go');
    spyOn(TrialService, 'getDeviceTrialsLimit');
    spyOn(Analytics, 'trackTrialSteps');

    $httpBackend
      .when('GET', 'https://atlas-integration.wbx2.com/admin/api/v1/organizations/null?disableCache=false')
      .respond({});

    controller = $controller('TrialAddCtrl', {
      $scope: $scope,
      $translate: $translate,
      $state: $state,
      FeatureToggleService: FeatureToggleService,
      HuronCustomer: HuronCustomer,
      Notification: Notification,
      Orgservice: Orgservice,
      TrialService: TrialService,
      TrialContextService: TrialContextService,
    });
    $scope.$apply();
  }));

  it('should be created successfully', function () {
    expect(controller).toBeDefined();
  });

  it('should have default offers', function () {
    expect(controller.messageTrial.enabled).toBeTruthy();
    expect(controller.meetingTrial.enabled).toBeTruthy();
    expect(controller.webexTrial.enabled).toBeTruthy();
    expect(controller.roomSystemTrial.enabled).toBeTruthy();
    expect(controller.sparkBoardTrial.enabled).toBeTruthy();
    expect(controller.callTrial.enabled).toBeTruthy();
    expect(controller.pstnTrial.enabled).toBeTruthy();
    expect(controller.contextTrial.enabled).toBeFalsy();
  });

  it('should start in trialAdd.info state', function () {
    expect(controller.navStates).toEqual(['trialAdd.info']);
  });

  it('should have correct navigation state order', function () {
    expect(controller.navOrder).toEqual(['trialAdd.info', 'trialAdd.webex', 'trialAdd.pstn', 'trialAdd.emergAddress', 'trialAdd.call']);
  });

  it('should transition state', function () {
    expect(controller.hasNextStep()).toBeTruthy();
    controller.nextStep();
    expect($state.go).toHaveBeenCalledWith('trialAdd.info');
  });

  it('should close the modal', function () {
    controller.closeDialogBox();
    expect($state.modal.close).toHaveBeenCalled();
  });

  it('should test that if the current and next state are removed, then it can still find the next value', function () {
    controller.navOrder = [1, 2, 3, 4, 5, 6];
    controller.navStates = [1, 4];
    $state.current.name = 2;
    expect(controller.getNextState()).toEqual(4);
  });

  it('should set call trial to false and disable pstn trial', function () {
    controller.pstnTrial.enabled = true;
    controller.callTrial.enabled = false;
    controller.roomSystemTrial.enabled = false;
    $scope.$apply();
    expect(controller.pstnTrial.enabled).toBeFalsy();
  });

  it('should have call trial and not skip pstn after watch', function () {
    controller.hasCallEntitlement = true;
    controller.pstnTrial.enabled = false;
    controller.callTrial.enabled = true;
    controller.pstnTrial.skipped = false;
    $scope.$apply();
    expect(controller.pstnTrial.enabled).toBeTruthy();
  });

  it('should have call trial and skip pstn after watch', function () {
    controller.hasCallEntitlement = true;
    controller.pstnTrial.enabled = false;
    controller.callTrial.enabled = true;
    controller.pstnTrial.skipped = true;
    $scope.$apply();
    expect(controller.pstnTrial.enabled).toBeFalsy();
  });

  describe('Start a new trial', function () {
    var callback;
    beforeEach(function () {
      callback = jasmine.createSpy('addNumbersCallback').and.returnValue($q.resolve());
      spyOn(TrialService, 'startTrial').and.returnValue($q.resolve(getJSONFixture('core/json/trials/trialAddResponse.json')));
    });

    describe('basic behavior', function () {
      beforeEach(function () {
        controller.callTrial.enabled = false;
        controller.roomSystemTrial.enabled = false;
        controller.pstnTrial.enabled = false;
        controller.startTrial();
        $scope.$apply();
      });

      it('should notify success', function () {
        expect(Notification.success).toHaveBeenCalledWith('trialModal.addSuccess', jasmine.any(Object));
      });

      it('should have a customer org id set', function () {
        expect(controller.customerOrgId).toBeDefined();
      });
    });

    describe('with addNumbers callback', function () {
      beforeEach(function () {
        controller.callTrial.enabled = false;
        controller.roomSystemTrial.enabled = false;
        controller.pstnTrial.enabled = false;
        controller.startTrial(callback);
        $scope.$apply();
      });

      it('should call with customerOrgId', function () {
        expect(callback).toHaveBeenCalledWith('123');
      });

      it('should go to finish page', function () {
        expect($state.go).toHaveBeenCalledWith('trialAdd.finishSetup');
      });
    });

    describe('without addNumbers callback', function () {
      beforeEach(function () {
        controller.callTrial.enabled = false;
        controller.roomSystemTrial.enabled = false;
        controller.pstnTrial.enabled = false;
        controller.startTrial();
        $scope.$apply();
      });

      it('should not call callback', function () {
        expect(callback).not.toHaveBeenCalled();
      });

      it('should go to finish page', function () {
        expect($state.go).toHaveBeenCalledWith('trialAdd.finishSetup');
      });
    });

    describe('With Squared UC', function () {
      beforeEach(function () {
        controller.pstnTrial.enabled = false;
      });

      it('should have Squared UC offer', function () {
        expect(controller.callTrial.enabled).toBeTruthy();
        expect(controller.pstnTrial.enabled).toBeFalsy();
      });

      it('should notify success', function () {
        spyOn(HuronCustomer, 'create').and.returnValue($q.resolve());
        controller.startTrial();
        $scope.$apply();
        expect(HuronCustomer.create).toHaveBeenCalled();
        expect(Notification.success).toHaveBeenCalledWith('trialModal.addSuccess', jasmine.any(Object));
        expect(Notification.success.calls.count()).toEqual(1);
      });

      it('error should notify error', function () {
        spyOn(HuronCustomer, 'create').and.returnValue($q.reject());
        controller.startTrial();
        $scope.$apply();
        expect(Notification.errorResponse).toHaveBeenCalled();
        expect(Notification.errorResponse.calls.count()).toEqual(1);
      });
    });

    describe('With Squared UC and PSTN', function () {
      it('should have Squared UC offer', function () {
        expect(controller.callTrial.enabled).toBeTruthy();
        expect(controller.pstnTrial.enabled).toBeTruthy();
      });

      it('should notify success', function () {
        spyOn(HuronCustomer, 'create').and.returnValue($q.resolve());
        spyOn(TrialPstnService, 'createPstnEntityV2').and.returnValue($q.resolve());
        controller.startTrial();
        $scope.$apply();
        expect(HuronCustomer.create).toHaveBeenCalled();
        expect(TrialPstnService.createPstnEntityV2).toHaveBeenCalled();
        expect(Notification.success).toHaveBeenCalledWith('trialModal.addSuccess', jasmine.any(Object));
        expect(Notification.success.calls.count()).toEqual(1);
      });

      it('error should notify error', function () {
        spyOn(HuronCustomer, 'create').and.returnValue($q.reject());
        controller.startTrial();
        $scope.$apply();
        expect(Notification.errorResponse).toHaveBeenCalled();
        expect(Notification.errorResponse.calls.count()).toEqual(1);
      });
    });

    describe('hasUserServices() ', function () {
      beforeEach(function () {
        controller.callTrial.enabled = false;
        controller.meetingTrial.enabled = false;
        controller.webexTrial.enabled = false;
        controller.messageTrial.enabled = false;
        controller.messageTrial.enabled = false;
        controller.roomSystemTrial.enabled = true;
        $scope.$apply();
      });

      it('should return false when only roomSystemTrial is enabled', function () {
        expect(controller.hasUserServices()).toBeFalsy();
      });

      it('should return false when only roomSystemTrial and sparkBoardTrial is enabled', function () {
        controller.sparkBoardTrial.enabled = true;
        expect(controller.hasUserServices()).toBeFalsy();
      });

      it('should return false when only sparkboardTrial is enabled', function () {
        controller.sparkBoardTrial.enabled = true;
        controller.roomSystemTrial.enabled = false;
        expect(controller.hasUserServices()).toBeFalsy();
      });

      it('should return false when no services are enabled', function () {
        controller.roomSystemTrial.enabled = false;
        $scope.$apply();
        expect(controller.hasUserServices()).toBeFalsy();
      });

      it('should return true when any user service is enabled', function () {
        controller.messageTrial.enabled = true;
        $scope.$apply();
        expect(controller.hasUserServices()).toBeTruthy();
      });
    });

    describe('with context service checked', function () {

      it('should enable context service', function () {
        controller.contextTrial.enabled = true;
        controller.callTrial.enabled = false;
        controller.roomSystemTrial.enabled = false;
        controller.startTrial();
        $scope.$apply();
        expect(TrialContextService.addService).toHaveBeenCalled();
        expect(Notification.errorResponse).not.toHaveBeenCalled();
      });

      it('should display error notification if call to enable context service fails', function () {
        addContextSpy.and.returnValue($q.reject('rejected'));
        controller.contextTrial.enabled = true;
        controller.callTrial.enabled = false;
        controller.roomSystemTrial.enabled = false;
        controller.startTrial();
        $scope.$apply();
        expect(TrialContextService.addService).toHaveBeenCalled();
        expect(Notification.errorResponse).toHaveBeenCalledWith('rejected', 'trialModal.startTrialContextServiceError');
      });

      it('should not be able to proceed if no other trial services are checked', function () {
        // uncheck all services except for Context Service
        Object.keys(controller.trialData.trials).forEach(function (service) {
          controller.trialData.trials[service].enabled = service === 'contextTrial';
        });
        expect(controller.hasTrial()).toBeFalsy();
      });
    });

    describe('without context service checked', function () {
      beforeEach(function () {
        controller.contextTrial.enabled = false;
        controller.callTrial.enabled = false;
        controller.roomSystemTrial.enabled = false;
        controller.startTrial();
        $scope.$apply();
      });

      it('should not enable context service', function () {
        expect(TrialContextService.addService).not.toHaveBeenCalled();
      });

      it('should be able to proceed with trial services enabled', function () {
        // uncheck Context Service and all other services except for Message
        Object.keys(controller.trialData.trials).forEach(function (service) {
          controller.trialData.trials[service].enabled = service === 'messageTrial';
        });
        expect(controller.hasTrial()).toBeTruthy();
      });
    });
  });

  describe('Start a new trial with error', function () {
    beforeEach(function () {
      spyOn(TrialService, 'startTrial').and.returnValue($q.reject({
        data: {
          message: 'An error occurred'
        }
      }));
      controller.startTrial();
      $scope.$apply();
    });

    it('should notify error', function () {
      expect(Notification.errorResponse).toHaveBeenCalled();
    });

    it('should not have closed the modal', function () {
      expect($state.modal.close).not.toHaveBeenCalled();
    });
  });

  describe('Set ship devices modal display with Orgservice call', function () {
    it('should disable ship devices modal for test org', function () {
      spyOn(Orgservice, 'getAdminOrg').and.returnValue($q.resolve({
        data: {
          success: true,
          isTestOrg: true
        }
      }));
      controller.setDeviceModal();
      $scope.$apply();
      expect(controller.devicesModal.enabled).toBeFalsy();
    });
  });

  describe('Care offer trial', function () {

    describe('primary behaviors:', function () {
      it('Message, Call and Care are enabled by default', function () {
        expect(controller.callTrial.enabled).toBeTruthy();
        expect(controller.messageTrial.enabled).toBeTruthy();
        expect(controller.careTrial.enabled).toBeTruthy();
      });
    });

    describe('helper functions:', function () {
      var CARE_LICENSE_COUNT_DEFAULT = 15;
      var CARE_LICENSE_COUNT = CARE_LICENSE_COUNT_DEFAULT * 2;

      describe('messageOfferDisabledExpression:', function () {
        it('should be disabled if message is disabled.', function () {
          controller.messageTrial.enabled = false;
          expect(controller.messageOfferDisabledExpression()).toBeTruthy();
          expect(controller.careTrial.enabled).toBeFalsy();

          controller.messageTrial.enabled = true;
          expect(controller.messageOfferDisabledExpression()).toBeFalsy();
          //Care is a choice to enable/disable when Message is enabled.
          expect(controller.careTrial.enabled).toBeFalsy();
        });
      });

      describe('callOfferDisabledExpression:', function () {
        it('should be disabled if call is disabled.', function () {
          controller.callTrial.enabled = false;
          expect(controller.callOfferDisabledExpression()).toBeTruthy();
          expect(controller.careTrial.enabled).toBeFalsy();

          controller.callTrial.enabled = true;
          expect(controller.callOfferDisabledExpression()).toBeFalsy();
          //Care is a choice to enable/disable when Call is enabled.
          expect(controller.careTrial.enabled).toBeFalsy();
        });
      });

      describe('careLicenseInputDisabledExpression:', function () {
        it('care license count disabled expression works correctly.', function () {
          controller.careTrial.enabled = true;
          controller.careTrial.details.quantity = CARE_LICENSE_COUNT;
          expect(controller.careLicenseInputDisabledExpression()).toBeFalsy();
          expect(controller.careTrial.details.quantity).toEqual(CARE_LICENSE_COUNT);
        });

        it('care license count resets to 0 when disabled.', function () {
          controller.careTrial.details.quantity = CARE_LICENSE_COUNT;
          controller.careTrial.enabled = false;
          expect(controller.careLicenseInputDisabledExpression()).toBeTruthy();
          expect(controller.careTrial.details.quantity).toEqual(0);
        });

        it('care license count shows default value when enabled.', function () {
          controller.careTrial.details.quantity = 0;
          controller.careTrial.enabled = true;
          expect(controller.careLicenseInputDisabledExpression()).toBeFalsy();
          expect(controller.careTrial.details.quantity).toEqual(CARE_LICENSE_COUNT_DEFAULT);
        });
      });

      describe('validateCareLicense:', function () {
        it('care license validation is not used when care is not selected.', function () {
          controller.careTrial.enabled = false;
          expect(controller.validateCareLicense()).toBeTruthy();
        });

        it('care license validation allows value between 1 and 50.', function () {
          controller.details.licenseCount = 100;
          controller.careTrial.enabled = true;
          expect(controller.validateCareLicense(CARE_LICENSE_COUNT, CARE_LICENSE_COUNT)).toBeTruthy();
        });

        it('care license validation disallows value greater than total users.', function () {
          controller.details.licenseCount = 10;
          controller.careTrial.enabled = true;
          expect(controller.validateCareLicense(CARE_LICENSE_COUNT + 1, CARE_LICENSE_COUNT + 1)).toBeFalsy();
        });
      });

      describe('careLicenseCountLessThanTotalCount:', function () {
        it('Total license count cannot be lesser than Care license count.', function () {
          controller.details.licenseCount = 10;
          controller.careTrial.enabled = true;
          controller.careTrial.details.quantity = 20;
          expect(controller.careLicenseCountLessThanTotalCount()).toBeFalsy();
        });

        it('Total license validation with Care is applicable only when careTrial is enabled.', function () {
          controller.details.licenseCount = 10;
          controller.careTrial.enabled = false;
          controller.careTrial.details.quantity = 20;
          expect(controller.careLicenseCountLessThanTotalCount()).toBeTruthy();
        });
      });
    });
  });

  describe('Input validators', function () {
    var orgInput;
    var emailInput;
    var testCase = [{
      retVal: {
        unique: true
      },
      targetVal: true
    }, {
      retVal: {
        error: 'trialModal.errorInUse'
      },
      targetVal: false
    }, {
      retVal: {
        error: 'trialModal.errorInvalidName'
      },
      targetVal: false
    }, {
      retVal: {
        error: 'trialModal.errorInvalid'
      },
      targetVal: false
    }, {
      retVal: {
        error: 'trialModal.errorServerDown'
      },
      targetVal: false
    }, {
      retVal: {
        bad: 'bad'
      },
      targetVal: false
    }];

    beforeEach(function () {
      orgInput = controller.custInfoFields[0];
      emailInput = controller.custInfoFields[1];
      orgInput.options = {
        validation: {
          show: null
        }
      };
      emailInput.options = {
        validation: {
          show: null
        }
      };
    });

    function doTestCase(index) {
      spyOn(TrialService, 'shallowValidation').and.returnValue($q.resolve(testCase[index].retVal));

      orgInput.asyncValidators.uniqueName.expression('test', 'test', orgInput);
      emailInput.asyncValidators.uniqueEmail.expression('test', 'test', emailInput);
      $scope.$apply();

      expect(controller.uniqueName).toBe(testCase[index].targetVal);
      expect(controller.uniqueEmail).toBe(testCase[index].targetVal);
    }

    _.times(testCase.length, function (index) {
      var testMsg = 'should confirm ' + JSON.stringify(testCase[index].retVal) + ' validates as ' + testCase[index].targetVal;
      it(testMsg, function () {
        doTestCase(index);
      });
    });
  });
});
