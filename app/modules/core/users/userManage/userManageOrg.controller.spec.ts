import moduleName from './index';

describe('UserManageOrgController', () => {
  ///////////////////

  function init() {
    this.initModules(moduleName);
    this.injectDependencies(
      '$q',
      '$scope',
      '$state',
      '$window',
      'Analytics',
      'AutoAssignTemplateModel',
      'AutoAssignTemplateService',
      'DirSyncService',
      'FeatureToggleService',
      'OnboardService',
      'Orgservice',
      'UserCsvService',
    );

    this.$state = {
      modal: {
        dismiss: jasmine.createSpy('dismiss').and.returnValue(true),
        closed: this.$q.resolve(),
      },
      go: jasmine.createSpy('go'),
    };

    spyOn(this.Analytics, 'trackAddUsers');
    spyOn(this.$window, 'open');
  }

  function initController() {
    this.initController('UserManageOrgController', {
      controllerLocals: {
        $scope: this.$scope,
        $state: this.$state,
        $stateParams: this.$stateParams,
        Analytics: this.Analytics,
        DirSyncService: this.DirSyncService,
        FeatureToggleService: this.FeatureToggleService,
        OnboardService: this.OnboardService,
        Orgservice: this.Orgservice,
        UserCsvService: this.UserCsvService,
      },
    });
  }

  function initControllerAndDefaults() {
    spyOn(this.Orgservice, 'getUnlicensedUsers').and.callFake(function (callback) {
      callback({
        success: false,
      });
    });
    spyOn(this.DirSyncService, 'isDirSyncEnabled').and.returnValue(false);
    spyOn(this.FeatureToggleService, 'atlasEmailSuppressGetStatus').and.returnValue(this.$q.resolve(false));
    spyOn(this.FeatureToggleService, 'atlasF3745AutoAssignLicensesGetStatus').and.returnValue(this.$q.resolve(false));

    initController.apply(this);
  }

  function initControllerAndAutoAssignFeatureToggleOn(spies: {
    isEnabledForOrg?,
    getTemplates?,
  } = {}) {
    const {
      isEnabledForOrg = this.$q.resolve(true),
      getTemplates = this.$q.resolve([{
        name: 'Default',
        foo: 'bar',
      }]),
    } = spies;
    spyOn(this.FeatureToggleService, 'atlasEmailSuppressGetStatus').and.returnValue(this.$q.resolve(false));
    spyOn(this.FeatureToggleService, 'atlasF3745AutoAssignLicensesGetStatus').and.returnValue(this.$q.resolve(true));
    spyOn(this.AutoAssignTemplateService, 'isEnabledForOrg').and.returnValue(isEnabledForOrg);
    spyOn(this.AutoAssignTemplateService, 'getTemplates').and.returnValue(getTemplates);

    initController.apply(this);
  }

  function initControllerAndDirSyncEnabled() {
    spyOn(this.DirSyncService, 'isDirSyncEnabled').and.returnValue(true);

    initController.apply(this);
  }

  function initControllerAndUnlicensedUsers() {
    spyOn(this.Orgservice, 'getUnlicensedUsers').and.callFake(function (callback) {
      callback({
        success: true,
        totalResults: 1,
      });
    });
    spyOn(this.FeatureToggleService, 'atlasEmailSuppressGetStatus').and.returnValue(this.$q.resolve(false));

    initController.apply(this);
  }

  function initControllerAndUnlicensedUsersAndFeatureToggleOn() {
    spyOn(this.Orgservice, 'getUnlicensedUsers').and.callFake(function (callback) {
      callback({
        success: true,
        totalResults: 1,
      });
    });
    spyOn(this.FeatureToggleService, 'atlasEmailSuppressGetStatus').and.returnValue(this.$q.resolve(true));
    spyOn(this.FeatureToggleService, 'atlasF3745AutoAssignLicensesGetStatus').and.returnValue(this.$q.resolve(false));

    initController.apply(this);
  }

  beforeEach(init);

  it('should init with expected responses when getUnlicensedUsers fails', function () {
    initControllerAndDefaults.apply(this);

    expect(this.controller.manageType).toEqual('manual');
    expect(this.controller.maxUsersInCSV).toEqual(this.UserCsvService.maxUsersInCSV);
    expect(this.controller.maxUsersInManual).toEqual(this.OnboardService.maxUsersInManual);
    expect(this.controller.isOverExportThreshold).toBeFalsy();
    expect(this.controller.convertableUsers).toBeFalsy();
  });

  it('should init with expected responses when getUnlicensedUsers returns 0 unlicensed users', function () {
    spyOn(this.Orgservice, 'getUnlicensedUsers').and.callFake(function (callback) {
      callback({
        success: true,
        totalResults: 0,
      });
    });

    initController.apply(this);

    expect(this.controller.manageType).toEqual('manual');
    expect(this.controller.maxUsersInCSV).toEqual(this.UserCsvService.maxUsersInCSV);
    expect(this.controller.maxUsersInManual).toEqual(this.OnboardService.maxUsersInManual);
    expect(this.controller.isOverExportThreshold).toBeFalsy();
    expect(this.controller.convertableUsers).toBeFalsy();
  });

  it('should init with expected responses when getUnlicensedUsers returns 1 or more unlicensed users', function () {
    initControllerAndUnlicensedUsers.apply(this);

    expect(this.controller.manageType).toEqual('manual');
    expect(this.controller.maxUsersInCSV).toEqual(this.UserCsvService.maxUsersInCSV);
    expect(this.controller.maxUsersInManual).toEqual(this.OnboardService.maxUsersInManual);
    expect(this.controller.isOverExportThreshold).toBeFalsy();
    expect(this.controller.convertableUsers).toBeTruthy();
  });

  it('should cancel modal', function () {
    initControllerAndDefaults.apply(this);

    expect(this.$state.modal.dismiss).toHaveBeenCalledTimes(0);
    this.controller.cancelModal();
    expect(this.$state.modal.dismiss).toHaveBeenCalledTimes(1);
    expect(this.Analytics.trackAddUsers).toHaveBeenCalledWith(this.Analytics.eventNames.CANCEL_MODAL);
  });

  it('should go to users.add', function () {
    initControllerAndDefaults.apply(this);

    this.controller.onNext();
    expect(this.$state.go).toHaveBeenCalledWith('users.add.manual');
    expect(this.Analytics.trackAddUsers).toHaveBeenCalledWith(this.Analytics.eventNames.NEXT, this.Analytics.sections.ADD_USERS.uploadMethods.MANUAL);
  });

  it('should go to users.csv', function () {
    initControllerAndDefaults.apply(this);
    this.controller.manageType = 'bulk';

    this.controller.onNext();
    expect(this.$state.go).toHaveBeenCalledWith('users.csv');
    expect(this.Analytics.trackAddUsers).toHaveBeenCalledWith(this.Analytics.sections.ADD_USERS.eventNames.CSV_UPLOAD, this.Analytics.sections.ADD_USERS.uploadMethods.CSV);
  });

  it('should go to users.manage.advanced.add.ob.installConnector', function () {
    initControllerAndDefaults.apply(this);
    this.controller.manageType = 'advancedNoDS';

    this.controller.onNext();
    expect(this.$state.go).toHaveBeenCalledWith('users.manage.advanced.add.ob.installConnector');
    expect(this.Analytics.trackAddUsers).toHaveBeenCalledWith(this.Analytics.sections.ADD_USERS.eventNames.INSTALL_CONNECTOR, this.Analytics.sections.ADD_USERS.uploadMethods.SYNC);
  });

  it('should go to users.convert', function () {
    initControllerAndUnlicensedUsers.apply(this);
    this.controller.manageType = 'convert';

    this.controller.onNext();
    expect(this.$state.go).toHaveBeenCalledWith('users.convert', {
      manageUsers: true,
    });
    expect(this.Analytics.trackAddUsers).not.toHaveBeenCalled();
  });

  it('should go to users.manage.emailSuppress when emailSuppress toggle is on', function () {
    initControllerAndUnlicensedUsersAndFeatureToggleOn.apply(this);
    this.controller.manageType = 'manual';

    this.controller.onNext();
    expect(this.$state.go).toHaveBeenCalledWith('users.manage.emailSuppress', {
      manageType: 'manual',
      prevState: 'users.manage.org',
    });
  });

  it('should go to auto assign template when isAtlasF3745AutoAssignToggle is on', function () {
    initControllerAndAutoAssignFeatureToggleOn.apply(this);
    this.controller.manageType = 'autoAssignTemplate';

    this.controller.onNext();
    expect(this.$state.go).toHaveBeenCalledWith('users.manage.edit-auto-assign-template-modal', {
      prevState: 'users.manage.picker',
    });
  });

  it('should go to settings page if isDirSyncEnabled is true', function () {
    initControllerAndDirSyncEnabled.apply(this);
    this.controller.handleDirSyncService();
    this.$scope.$apply();

    expect(this.$state.go).toHaveBeenCalledWith('settings', {
      showSettings: 'dirsync',
    });
    expect(this.$state.modal.dismiss).toHaveBeenCalled();
  });

  it('should go to an external link if isDirSyncEnabled is false', function () {
    initControllerAndDefaults.apply(this);
    this.controller.handleDirSyncService();

    expect(this.$window.open).toHaveBeenCalled();
  });

  describe('initFeatureToggles():', function () {
    it('should fetch feature toggles"', function () {
      spyOn(this.FeatureToggleService, 'atlasEmailSuppressGetStatus');
      spyOn(this.FeatureToggleService, 'atlasF3745AutoAssignLicensesGetStatus');
      initController.call(this);
      this.controller.initFeatureToggles();
      expect(this.FeatureToggleService.atlasEmailSuppressGetStatus).toHaveBeenCalled();
      expect(this.FeatureToggleService.atlasF3745AutoAssignLicensesGetStatus).toHaveBeenCalled();
    });
  });

  describe('initConvertableUsers():', function () {
    it('should call "Orgservice.getUnlicensedUsers()"', function () {
      spyOn(this.Orgservice, 'getUnlicensedUsers');
      initController.call(this);
      this.controller.initConvertableUsers();
      expect(this.Orgservice.getUnlicensedUsers).toHaveBeenCalled();
    });
  });

  describe('initDefaultAutoAssignTemplate():', function () {
    it('should call early out if "isAtlasF3745AutoAssignToggle" is not true', function () {
      initControllerAndDefaults.call(this);

      expect(this.controller.initDefaultAutoAssignTemplate()).toBe(undefined);
    });

    it('should set "autoAssignTemplates" property if "AutoAssignTemplateService.getTemplates()" responds with appropriate data', function () {
      initControllerAndAutoAssignFeatureToggleOn.call(this);

      expect(this.controller.autoAssignTemplates).toEqual({
        Default: {
          name: 'Default',
          foo: 'bar',
        },
      });
    });
  });

  describe('isDefaultAutoAssignTemplateActivated():', function () {
    it('should set AutoAssignTemplateModel and be true if has a default template and is activated', function () {
      initControllerAndAutoAssignFeatureToggleOn.call(this);

      expect(this.controller.isDefaultAutoAssignTemplateActivated()).toBe(true);
      expect(this.AutoAssignTemplateModel.isDefaultAutoAssignTemplateActivated).toBe(true);
    });

    it('should set AutoAssignTemplateModel and be false if does not have a default template', function () {
      this.AutoAssignTemplateModel.isDefaultAutoAssignTemplateActivated = true; // initial state to check against
      initControllerAndAutoAssignFeatureToggleOn.call(this, {
        getTemplates: this.$q.resolve([]),
      });

      expect(this.controller.isDefaultAutoAssignTemplateActivated()).toBe(false);
      expect(this.AutoAssignTemplateModel.isDefaultAutoAssignTemplateActivated).toBe(false);
    });

    it('should set AutoAssignTemplateModel and be false if is not an activated template', function () {
      this.AutoAssignTemplateModel.isDefaultAutoAssignTemplateActivated = true; // initial state to check against
      initControllerAndAutoAssignFeatureToggleOn.call(this, {
        isEnabledForOrg: this.$q.resolve(false),
      });

      expect(this.controller.isDefaultAutoAssignTemplateActivated()).toBe(false);
      expect(this.AutoAssignTemplateModel.isDefaultAutoAssignTemplateActivated).toBe(false);
    });
  });
});
