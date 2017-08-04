'use strict';

describe('SetupWizardCtrl', function () {
  beforeEach(function () {
    this.initModules('Core');

    this.injectDependencies(
      '$controller',
      '$q',
      '$scope',
      '$state',
      '$stateParams',
      'Authinfo',
      'FeatureToggleService',
      'Orgservice',
      'DirSyncService',
      'SetupWizardService'
    );

    this.usageFixture = getJSONFixture('core/json/organizations/usage.json');
    this.usageOnlySharedDevicesFixture = getJSONFixture('core/json/organizations/usageOnlySharedDevices.json');
    this.enabledFeatureToggles = [];

    spyOn(this.Authinfo, 'isCustomerAdmin').and.returnValue(true);
    spyOn(this.Authinfo, 'isSetupDone').and.returnValue(false);
    spyOn(this.Authinfo, 'isCSB').and.returnValue(true);
    spyOn(this.Authinfo, 'isCare').and.returnValue(false);
    spyOn(this.SetupWizardService, 'getPendingLicenses').and.returnValue(this.$q.resolve());
    spyOn(this.SetupWizardService, 'hasPendingLicenses').and.returnValue(true);
    spyOn(this.SetupWizardService, 'hasPendingWebExMeetingLicenses').and.returnValue(false);
    spyOn(this.SetupWizardService, 'hasPendingCallLicenses').and.returnValue(false);
    spyOn(this.SetupWizardService, 'hasPendingServiceOrder').and.returnValue(false);
    spyOn(this.SetupWizardService, 'isCustomerPresent').and.returnValue(this.$q.resolve(true));
    spyOn(this.Authinfo, 'getLicenses').and.returnValue([{
      licenseType: 'SHARED_DEVICES',
    }]);

    spyOn(this.DirSyncService, 'requiresRefresh').and.returnValue(false);
    spyOn(this.DirSyncService, 'refreshStatus').and.returnValue(this.$q.resolve());

    spyOn(this.FeatureToggleService, 'supports').and.callFake(function (feature) {
      return this.$q.resolve(_.includes(this.enabledFeatureToggles, feature));
    }.bind(this));
    spyOn(this.Orgservice, 'getAdminOrgUsage').and.returnValue(this.$q.resolve(this.usageFixture));

    this._expectStepIndex = _expectStepIndex;
    this._expectSubStepIndex = _expectSubStepIndex;
    this.expectStepOrder = expectStepOrder;
    this.expectSubStepOrder = expectSubStepOrder;
    this.initController = initController;
  });

  function _expectStepIndex(step, index) {
    expect(_.findIndex(this.$scope.tabs, {
      name: step,
    })).toBe(index);
  }

  function _expectSubStepIndex(step, subStep, index) {
    expect(_.chain(this.$scope.tabs)
      .find({
        name: step,
      })
      .get('steps')
      .findIndex({
        name: subStep,
      })
      .value()).toBe(index);
  }

  function expectStepOrder(steps) {
    expect(this.$scope.tabs.length).toBe(steps.length);
    _.forEach(steps, function (step, index) {
      this._expectStepIndex(step, index);
    }.bind(this));
  }

  function expectSubStepOrder(macroStep, subSteps) {
    // get the step
    var stepVal = _.find(this.$scope.tabs, {
      name: macroStep,
    });

    // verify substeps length
    expect(stepVal.steps.length).toBe(subSteps.length);

    // for each substep verify order
    _.forEach(subSteps, function (subStep, index) {
      this._expectSubStepIndex(macroStep, subStep, index);
    }.bind(this));
  }

  function initController() {
    this.$controller('SetupWizardCtrl', {
      $scope: this.$scope,
    });
    this.$scope.$apply();
  }

  describe('When all toggles are false (and Authinfo.isSetupDone is false as well)', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingLicenses.and.returnValue(false);
      this.initController();
    });

    it('the wizard should have 4 macro-level steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
    });

    it('planReview should have a single substep', function () {
      this.expectSubStepOrder('planReview', ['init']);
    });

    it('enterpriseSettings should have five steps', function () {
      this.expectSubStepOrder('enterpriseSettings', ['enterpriseSipUrl', 'init', 'exportMetadata', 'importIdp', 'testSSO']);
    });

    it('finish should have a substep', function () {
      this.expectSubStepOrder('finish', ['done']);
    });
  });

  describe('When subscription does not have a pending service order', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(false);
      this.initController();
    });

    it('the setup wizard should not call getPendingLicenses API', function () {
      expect(this.SetupWizardService.getPendingLicenses).not.toHaveBeenCalled();
    });
  });

  describe('When subscription has a pending service order', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(true);
      this.initController();
    });

    it('the setup wizard should call getPendingLicenses API', function () {
      expect(this.SetupWizardService.getPendingLicenses).toHaveBeenCalled();
    });

    it('the setup wizard should call getPendingLicenses API', function () {
      var tab = _.find(this.$scope.tabs, { name: 'planReview' });
      expect(tab.label).toBe('firstTimeWizard.subscriptionReview');
      expect(tab.title).toBe('firstTimeWizard.subscriptionReview');
    });
  });

  describe('When subscription does not have a pending service order', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(false);
      this.initController();
    });

    it('the setup wizard should call getPendingLicenses API', function () {
      expect(this.SetupWizardService.getPendingLicenses).not.toHaveBeenCalled();
    });

    it('the setup wizard should call getPendingLicenses API', function () {
      var tab = _.find(this.$scope.tabs, { name: 'planReview' });
      expect(tab.label).toBe('firstTimeWizard.planReview');
      expect(tab.title).toBe('firstTimeWizard.planReview');
    });
  });

  describe('When Authinfo.isSetupDone is true', function () {
    beforeEach(function () {
      this.Authinfo.isSetupDone.and.returnValue(true);
      this.initController();
    });

    it('the wizard should not have the finish step', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings']);
    });
  });

  describe('When has COMMUNICATION license', function () {
    beforeEach(function () {
      this.Authinfo.getLicenses.and.returnValue([{
        licenseType: 'COMMUNICATION',
      }]);
      this.initController();
    });

    it('the wizard should have 4 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
    });

    it('serviceSetup should have a single substep', function () {
      this.expectSubStepOrder('serviceSetup', ['setupCallSite']);
    });
  });

  describe('When has pending COMMUNICATION licenses', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(true);
      this.SetupWizardService.hasPendingCallLicenses.and.returnValue(true);
      this.SetupWizardService.hasPendingWebExMeetingLicenses.and.returnValue(false);
      this.initController();
    });

    it('the wizard should have 4 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
    });

    it('serviceSetup should have a single substep', function () {
      this.expectSubStepOrder('serviceSetup', ['setupCallSite']);
    });
  });

  describe('When has active licenses and has pending COMMUNICATION licenses', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(true);
      this.SetupWizardService.hasPendingCallLicenses.and.returnValue(true);
      this.SetupWizardService.hasPendingWebExMeetingLicenses.and.returnValue(false);
      this.Authinfo.getLicenses.and.returnValue([{
        licenseType: 'STORAGE',
      }]);
      this.initController();
    });

    it('the wizard should have 4 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
    });

    it('serviceSetup should have a single substep', function () {
      this.expectSubStepOrder('serviceSetup', ['setupCallSite']);
    });
  });

  describe('When does not have active COMMUNICATION licenses nor pending COMMUNICATION licenses', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(false);
      this.SetupWizardService.hasPendingCallLicenses.and.returnValue(false);
      this.SetupWizardService.hasPendingWebExMeetingLicenses.and.returnValue(false);
      this.Authinfo.getLicenses.and.returnValue([{
        licenseType: 'STORAGE',
      }]);
      this.initController();
    });

    it('the wizard should have 3 steps', function () {
      this.expectStepOrder(['planReview', 'enterpriseSettings', 'finish']);
    });
  });

  describe('When has pending WEBEX (EE, MC, EC, TC, SC) licenses', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(true);
      this.SetupWizardService.hasPendingWebExMeetingLicenses.and.returnValue(true);
      this.SetupWizardService.hasPendingCallLicenses.and.returnValue(false);
      this.Authinfo.getLicenses.and.returnValue([{}]);
      this.initController();
    });

    it('the wizard should have 4 steps', function () {
      this.expectStepOrder(['planReview', 'meetingSettings', 'enterpriseSettings', 'finish']);
    });
  });

  describe('When dirsync is enabled', function () {
    beforeEach(function () {
      spyOn(this.DirSyncService, 'isDirSyncEnabled').and.returnValue(true);
      this.initController();
    });

    it('the wizard should have 4 tabs', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
    });
  });

  describe('When Authinfo.isCSB is disabled', function () {
    beforeEach(function () {
      this.Authinfo.isCSB.and.returnValue(false);
      this.initController();
    });

    it('the wizard should have 4 tabs', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
    });
  });

  describe('When Authinfo.isCare is enabled and addUsers too', function () {
    beforeEach(function () {
      this.Authinfo.isCare.and.returnValue(true);
      this.Authinfo.isCSB.and.returnValue(false);
      this.initController();
    });

    it('the wizard should have the 5 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'careSettings', 'finish']);
    });

    it('careSettings should have a single substep', function () {
      this.expectSubStepOrder('careSettings', ['csonboard']);
    });
  });

  describe('When Authinfo.isCare is enabled ', function () {
    beforeEach(function () {
      this.Authinfo.isCare.and.returnValue(true);
      this.initController();
    });

    it('the wizard should have the 5 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'careSettings', 'finish']);
    });
  });

  describe('When Authinfo.isCare is enabled and not first time setup', function () {
    beforeEach(function () {
      this.Authinfo.isCare.and.returnValue(true);
      this.Authinfo.isSetupDone.and.returnValue(true);
      this.initController();
    });

    it('the wizard should have the 4 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'careSettings']);
    });
  });

  describe('When there are only shared device licenses', function () {
    beforeEach(function () {
      this.Orgservice.getAdminOrgUsage = jasmine.createSpy().and.returnValue(this.$q.resolve(this.usageOnlySharedDevicesFixture));
    });

    it('the wizard should have 4 tabs and no SSO setup if FTW', function () {
      _.set(this.$state, 'current.data.firstTimeSetup', true);

      this.initController();
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
      this.expectSubStepOrder('enterpriseSettings', ['enterpriseSipUrl']);
    });
    it('the wizard should have 4 tabs and SSO setup if accessed through settings', function () {
      this.initController();
      this.expectStepOrder(['planReview', 'serviceSetup', 'enterpriseSettings', 'finish']);
      this.expectSubStepOrder('enterpriseSettings', ['enterpriseSipUrl', 'init', 'exportMetadata', 'importIdp', 'testSSO']);
    });
  });

  describe('When everything is true', function () {
    beforeEach(function () {
      this.Authinfo.isSetupDone.and.returnValue(true);
      this.Authinfo.getLicenses.and.returnValue([{
        licenseType: 'COMMUNICATION',
      }]);
      this.Authinfo.isCare.and.returnValue(true);

      this.FeatureToggleService.supports.and.returnValue(this.$q.resolve(true));
      spyOn(this.DirSyncService, 'isDirSyncEnabled').and.returnValue(true);

      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(true);
      this.SetupWizardService.hasPendingWebExMeetingLicenses.and.returnValue(true);
      this.SetupWizardService.hasPendingCallLicenses.and.returnValue(true);

      this.initController();
    });

    it('the wizard should have a lot of settings', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'meetingSettings', 'enterpriseSettings', 'careSettings']);
      this.expectSubStepOrder('planReview', ['init']);
      this.expectSubStepOrder('serviceSetup', ['pickCallLocationType', 'setupCallLocation']);
      this.expectSubStepOrder('meetingSettings', ['siteSetup', 'licenseDistribution', 'summary']);
      this.expectSubStepOrder('enterpriseSettings', ['enterpriseSipUrl', 'enterprisePmrSetup', 'init', 'exportMetadata', 'importIdp', 'testSSO']);
      this.expectSubStepOrder('careSettings', ['csonboard']);
    });
  });

  describe('When there is a TSP audio license present', function () {
    beforeEach(function () {
      this.SetupWizardService.hasPendingServiceOrder.and.returnValue(true);
      this.SetupWizardService.hasPendingWebExMeetingLicenses.and.returnValue(true);
      spyOn(this.SetupWizardService, 'hasTSPAudioPackage').and.returnValue(true);
      this.initController();
    });

    it('displays the set TSP partner view during meeting setup', function () {
      this.expectSubStepOrder('meetingSettings', ['siteSetup', 'licenseDistribution', 'setPartnerAudio', 'summary']);
    });
  });

  it('will filter tabs if onlyShowSingleTab is true', function () {
    this.$controller('SetupWizardCtrl', {
      $scope: this.$scope,
      $stateParams: {
        onlyShowSingleTab: true,
        currentTab: 'enterpriseSettings',
      },
    });
    this.$scope.$apply();

    this.expectStepOrder(['enterpriseSettings']);
  });

  it('will filter steps if onlyShowSingleTab is true and currentStep is set.', function () {
    this.$controller('SetupWizardCtrl', {
      $scope: this.$scope,
      $stateParams: {
        currentTab: 'enterpriseSettings',
        currentStep: 'init',
        onlyShowSingleTab: true,
      },
    });
    this.$scope.$apply();
    this.expectStepOrder(['enterpriseSettings']);
    this.expectSubStepOrder('enterpriseSettings', ['init', 'exportMetadata', 'importIdp', 'testSSO']);
  });

  describe('stateParams with onlyShowSingleTab and numberOfSteps', function () {
    it('should only contain a single tab and specific steps if numberOfSteps is set', function () {
      _.set(this.$stateParams, 'onlyShowSingleTab', true);
      _.set(this.$stateParams, 'currentTab', 'enterpriseSettings');
      _.set(this.$stateParams, 'currentStep', 'init');
      _.set(this.$stateParams, 'numberOfSteps', 1);
      this.initController();

      this.expectStepOrder(['enterpriseSettings']);
      this.expectSubStepOrder('enterpriseSettings', ['init']);
    });

    it('should only contain a single tab and remaining steps if numberOfSteps is not set', function () {
      _.set(this.$stateParams, 'onlyShowSingleTab', true);
      _.set(this.$stateParams, 'currentTab', 'enterpriseSettings');
      _.set(this.$stateParams, 'currentStep', 'init');
      this.initController();

      this.expectStepOrder(['enterpriseSettings']);
      this.expectSubStepOrder('enterpriseSettings', ['init', 'exportMetadata', 'importIdp', 'testSSO']);
    });
  });
});
