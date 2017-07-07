'use strict';

xdescribe('SetupWizardCtrl', function () {
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
    spyOn(this.Authinfo, 'isCare').and.returnValue(false);
    spyOn(this.SetupWizardService, 'isOrderSimplificationToggled').and.returnValue(true);
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
    beforeEach(initController);

    it('the wizard should have 5 macro-level steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'finish']);
    });

    it('planReview should have a single substep', function () {
      this.expectSubStepOrder('planReview', ['init']);
    });

    it('messagingSetup should have a single substep', function () {
      this.expectSubStepOrder('messagingSetup', ['setup']);
    });

    it('enterpriseSettings should have five steps', function () {
      this.expectSubStepOrder('enterpriseSettings', ['enterpriseSipUrl', 'init', 'exportMetadata', 'importIdp', 'testSSO']);
    });

    it('finish should have a single substep', function () {
      this.expectSubStepOrder('finish', ['init']);
    });
  });

  describe('When Authinfo.isSetupDone is true', function () {
    beforeEach(function () {
      this.Authinfo.isSetupDone.and.returnValue(true);
      this.initController();
    });

    it('the wizard should not have the finish step', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings']);
    });
  });

  describe('When has COMMUNICATION license', function () {
    beforeEach(function () {
      this.Authinfo.getLicenses.and.returnValue([{
        licenseType: 'COMMUNICATION',
      }]);
      this.initController();
    });

    it('the wizard should have 5 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'finish']);
    });

    it('serviceSetup should have a single substep', function () {
      this.expectSubStepOrder('serviceSetup', ['init']);
    });
  });

  describe('When dirsync is enabled', function () {
    beforeEach(function () {
      spyOn(this.DirSyncService, 'isDirSyncEnabled').and.returnValue(true);
      this.initController();
    });

    it('the wizard should have 5 tabs', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'finish']);
    });
  });

  describe('When Authinfo.isCSB is disabled', function () {
    beforeEach(function () {
      this.Authinfo.isCSB.and.returnValue(false);
      this.initController();
    });

    it('the wizard should have 5 tabs', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'finish']);
    });
  });

  describe('When Authinfo.isCare is enabled and addUsers too', function () {
    beforeEach(function () {
      this.Authinfo.isCare.and.returnValue(true);
      this.Authinfo.isCSB.and.returnValue(false);
      this.initController();
    });

    it('the wizard should have the 6 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'careSettings', 'finish']);
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

    it('the wizard should have the 6 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'careSettings', 'finish']);
    });
  });

  describe('When Authinfo.isCare is enabled and not first time setup', function () {
    beforeEach(function () {
      this.Authinfo.isCare.and.returnValue(true);
      this.Authinfo.isSetupDone.and.returnValue(true);
      this.initController();
    });

    it('the wizard should have the 5 steps', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'careSettings']);
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

      this.initController();
    });

    it('the wizard should have a lot of settings', function () {
      this.expectStepOrder(['planReview', 'serviceSetup', 'messagingSetup', 'enterpriseSettings', 'careSettings']);
      this.expectSubStepOrder('planReview', ['init']);
      this.expectSubStepOrder('serviceSetup', ['setup', 'init']);
      this.expectSubStepOrder('messagingSetup', ['setup']);
      this.expectSubStepOrder('enterpriseSettings', ['enterpriseSipUrl', 'enterprisePmrSetup', 'init', 'exportMetadata', 'importIdp', 'testSSO']);
      this.expectSubStepOrder('careSettings', ['csonboard']);
    });
  });

  it('will filter tabs if onlyShowSingleTab is true', function () {
    this.$controller('SetupWizardCtrl', {
      $scope: this.$scope,
      $stateParams: {
        onlyShowSingleTab: true,
        currentTab: 'messagingSetup',
      },
    });
    this.$scope.$apply();

    this.expectStepOrder(['messagingSetup']);
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
