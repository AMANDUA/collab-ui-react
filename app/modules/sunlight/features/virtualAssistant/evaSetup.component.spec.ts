import evaSetupModule from './evaSetup.component';

describe('Care Expert Virtual Assistant Setup Component', () => {
  const escapeKey = 27;
  const OrgName = 'Test-Org-Name';
  const OrgId = 'Test-Org-Id';
  const pages = [
    {
      name: 'evaOverview',
      previousButtonState: 'hidden',
      nextButtonState: true,
    },
    {
      name: 'vaName',
      previousButtonState: true,
      nextButtonState: false,
    },
    {
      name: 'evaEmail',
      previousButtonState: true,
      nextButtonState: false,
    },
    {
      name: 'vaAvatar',
      previousButtonState: true,
      nextButtonState: true,
    },
    {
      name: 'evaDefaultSpace',
      previousButtonState: true,
      nextButtonState: false,
    },
    {
      name: 'evaConfigurationSteps',
      previousButtonState: true,
      nextButtonState: true,
    },
    {
      name: 'vaSummary',
      previousButtonState: true,
      nextButtonState: 'hidden',
    },
  ];
  const expectedPageTemplate = {
    templateId: jasmine.any(String),
    name: jasmine.any(String),
    configuration: {
      mediaType: 'virtualAssistant',
      pages: {
      },
    },
  };
  //fill in expected PageTemplate pages from Pages array above.
  pages.forEach(function (page) { expectedPageTemplate.configuration.pages[page.name] = jasmine.any(Object); });

  const getForm = function(inputName): any {
    return {
      [inputName]: {
        $setValidity: jasmine.createSpy('$setValidity'),
      },
    };
  };

  const expectedStates = Object.keys(expectedPageTemplate.configuration.pages);

  const getDummyLogo = function (data) {
    return {
      data: data,
    };
  };

  const failedData = {
    success: false,
    status: 403,
    Errors: [{
      errorCode: '100106',
    }],
  };

  const dummyLogoUrl = 'https://www.example.com/logo.png';
  const personId = { id: 'personId' };
  const listRoomsResponse = {
    items: [
      {
        id: 'roomId1',
        title: 'title 1',
        creatorId: 'personId',
      },
      {
        id: 'roomId2',
        title: 'room title 2',
        creatorId: 'random id 2',
      },
      {
        id: 'roomId3',
        title: 'room title 3',
        creatorId: 'personId',
      },
      {
        id: 'roomId4',
        title: 'a title 4',
        creatorId: 'random id 4',
      },
      {
        id: 'roomId5',
        title: 'room title 5',
        creatorId: 'random id 5',
      },
    ],
  };
  const listMembershipsResponse = {
    items: [
      {
        isModerator: true,
        roomId: 'roomId4',
      },
      {
        isModerator: false,
        roomId: 'roomId5',
      },
      {
        isModerator: true,
        roomId: 'roomIdnotmatched',
      },
    ],
  };
  const expectedDefaultSpaces = {
    items: [
      {
        id: 'roomId4',
        title: 'a title 4',
        creatorId: 'random id 4',
      },
      {
        id: 'roomId3',
        title: 'room title 3',
        creatorId: 'personId',
      },
      {
        id: 'roomId1',
        title: 'title 1',
        creatorId: 'personId',
      },
    ],
  };

  let getLogoDeferred, getLogoUrlDeferred, controller, listRoomsDeferred, getPersonDeferred, listMembershipsDeferred;

  beforeEach(function () {
    this.initModules('Sunlight', evaSetupModule);
    this.injectDependencies(
      '$q',
      '$scope',
      '$state',
      '$stateParams',
      '$modal',
      '$timeout',
      '$translate',
      'CTService',
      'Analytics',
      'Authinfo',
      'Notification',
      'EvaService',
      'SparkService',
    );

    afterEach(function () {
      getLogoDeferred = getLogoUrlDeferred = controller = listRoomsDeferred = getPersonDeferred = listMembershipsDeferred = undefined;
    });

    //create mock deferred object which will be used to return promises
    getLogoDeferred = this.$q.defer();
    getLogoUrlDeferred = this.$q.defer();
    listRoomsDeferred = this.$q.defer();
    getPersonDeferred = this.$q.defer();
    listMembershipsDeferred = this.$q.defer();

    spyOn(this.$modal, 'open');
    spyOn(this.CTService, 'getLogo').and.returnValue(getLogoDeferred.promise);
    spyOn(this.CTService, 'getLogoUrl').and.returnValue(getLogoUrlDeferred.promise);
    spyOn(this.Notification, 'success');
    spyOn(this.Notification, 'error');
    spyOn(this.Notification, 'errorWithTrackingId');
    spyOn(this.Analytics, 'trackEvent');
    spyOn(this.Authinfo, 'getOrgId').and.returnValue(OrgId);
    spyOn(this.Authinfo, 'getOrgName').and.returnValue(OrgName);
    spyOn(Date, 'now').and.returnValues(10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190);
    spyOn(this.SparkService, 'listRooms').and.returnValue(listRoomsDeferred.promise);
    spyOn(this.SparkService, 'getPerson').and.returnValue(getPersonDeferred.promise);
    spyOn(this.SparkService, 'listMemberships').and.returnValue(listMembershipsDeferred.promise);
    spyOn(this.$translate, 'instant').and.callThrough();

    this.compileComponent('eva-setup', {
      dismiss: 'dismiss()',
    });

    controller = this.controller;
  });

  function checkStateOfNavigationButtons(pageIndex: number, previousButtonState: any, nextButtonState: any): void {
    controller.currentState = controller.states[pageIndex];
    expect(controller.previousButton()).toEqual(previousButtonState);
    expect(controller.nextButton()).toEqual(nextButtonState);
  }

  describe('should test the', function () {
    let deferred;
    beforeEach(function () {
      deferred = this.$q.defer();
      spyOn(controller, 'getText').and.returnValue(deferred.promise);
    });

    it('getTitle', function () {
      controller.getTitle();
      expect(controller.getText).toHaveBeenCalledWith('createTitle');
    });

    it('getTitle with isEditFeature true', function () {
      controller.isEditFeature = true;
      controller.getTitle();
      expect(controller.getText).toHaveBeenCalledWith('editTitle');
    });

    it('getSummaryDescription', function () {
      controller.template.configuration.pages.vaName.nameValue = 'testName';
      controller.getSummaryDescription();
      expect(controller.getText).toHaveBeenCalledWith('summary.evaDesc', { name: controller.template.configuration.pages.vaName.nameValue });
    });

    it('getSummaryDescription with isEditFeature true', function () {
      controller.isEditFeature = true;
      controller.template.configuration.pages.vaName.nameValue = 'testName';
      controller.getSummaryDescription();
      expect(controller.getText).toHaveBeenCalledWith('summary.evaDescEdit', { name: controller.template.configuration.pages.vaName.nameValue });
    });

    it('cancelModal', function () {
      controller.cancelModal();
      expect(this.$translate.instant).toHaveBeenCalledWith('careChatTpl.cancelCreateDialog',
        { featureName: 'careChatTpl.virtualAssistant.eva.featureText.name' });
    });

    it('cancelModal with isEditFeature true', function () {
      controller.isEditFeature = true;
      controller.cancelModal();
      expect(this.$translate.instant).toHaveBeenCalledWith('careChatTpl.cancelEditDialog',
        { featureName: 'careChatTpl.virtualAssistant.eva.featureText.name' });
    });
  });

  describe('Page Structures', function () {
    beforeEach(function () {
      getLogoDeferred.resolve(getDummyLogo('abcd'));
      getLogoUrlDeferred.resolve(dummyLogoUrl);
      listRoomsDeferred.resolve(listRoomsResponse);
      getPersonDeferred.resolve(personId);
      listMembershipsDeferred.resolve(listMembershipsResponse);
      this.$scope.$apply();
    });

    it('should validate the states correlate to pages', function () {
      expect(controller.states).toEqual(expectedStates);
      expect(controller.template.configuration.pages.evaDefaultSpace.defaultSpaceOptions).toEqual(expectedDefaultSpaces.items);
    });

    it('should validate the first state is initial state', function () {
      expect(controller.currentState).toEqual(controller.states[0]);
    });

    it('should validate the keyboard functionality', function () {
      controller.evalKeyPress(escapeKey);
      expect(this.$modal.open).toHaveBeenCalled();
    });

    it('should walk pages forward in order ', function () {
      for (let i = 0; i < controller.states.length; i++) {
        expect(controller.currentState).toEqual(controller.states[i]);
        controller.nextPage();
        expect(this.Analytics.trackEvent).toHaveBeenCalledWith(controller.template.configuration.pages[controller.currentState].eventName, { durationInMillis: 10 });
        this.Analytics.trackEvent.calls.reset();
        this.$timeout.flush();
      }
    });

    it('should walk pages Backward in order ', function () {
      controller.currentState = controller.states[controller.states.length - 1];
      for (let i = (controller.states.length - 1); 0 <= i; i--) {
        expect(controller.currentState).toEqual(controller.states[i]);
        controller.previousPage();
        this.$timeout.flush();
      }
    });

    pages.forEach(function (expectedPage, index) {
      it(expectedPage.name + ': previous button should be ' + (expectedPage.previousButtonState ? 'Enabled' : 'Disabled') +
        ' and next button should be ' + (expectedPage.nextButtonState ? 'Enabled' : 'Disabled'), function () {
        checkStateOfNavigationButtons(index, expectedPage.previousButtonState, expectedPage.nextButtonState);
      });

      it(expectedPage.name + ': make sure template file exists for page ' + expectedPage.name + '.tpl.html\'', function () {
        const expectedPageFilename = 'modules/sunlight/features/virtualAssistant/wizardPages/' + expectedPage.name + '.tpl.html';
        controller.currentState = controller.states[index];
        expect(controller.getCurrentPage()).toEqual(expectedPageFilename);
      });
    });

  });

  describe('Field Checks on All Pages with fields', function () {
    const AVATAR_PAGE_INDEX = 3;

    it('should disable Next and Back button on Avatar Page when avatar file is loading', function () {
      controller.avatarUploadState = controller.avatarState.LOADING;
      checkStateOfNavigationButtons(AVATAR_PAGE_INDEX, false, false);
    });

    it('should enable Next button on Default Space Page after select something', function () {
      controller.template.configuration.pages.evaDefaultSpace.selectedDefaultSpace.id = 'something';
      checkStateOfNavigationButtons(AVATAR_PAGE_INDEX, true, true);
    });
  });

  describe('Avatar Page', function () {
    let deferredFileDataUrl;
    beforeEach(function() {
      deferredFileDataUrl = this.$q.defer();
      spyOn(this.EvaService, 'getFileDataUrl').and.returnValue(deferredFileDataUrl.promise);
    });

    it('should validate avatar file type', function () {
      deferredFileDataUrl.resolve('');
      const size = 1000;
      controller.template.configuration.pages.vaAvatar.avatarError = controller.avatarErrorType.NO_ERROR;
      controller.uploadAvatar({ name: 'abc.jpeg', size });
      expect(controller.template.configuration.pages.vaAvatar.avatarError).toEqual(controller.avatarErrorType.FILE_TYPE_ERROR);

      controller.template.configuration.pages.vaAvatar.avatarError = controller.avatarErrorType.NO_ERROR;
      controller.uploadAvatar({ name: 'abc.png', size });
      expect(controller.template.configuration.pages.vaAvatar.avatarError).toEqual(controller.avatarErrorType.NO_ERROR);
    });

    it('should validate avatar file size', function () {
      deferredFileDataUrl.resolve('');
      controller.template.configuration.pages.vaAvatar.avatarError = controller.avatarErrorType.NO_ERROR;
      controller.uploadAvatar({ name: 'abc.png' , size: controller.MAX_AVATAR_FILE_SIZE + 1 });
      expect(controller.template.configuration.pages.vaAvatar.avatarError).toEqual(controller.avatarErrorType.FILE_SIZE_ERROR);

      controller.template.configuration.pages.vaAvatar.avatarError = controller.avatarErrorType.NO_ERROR;
      controller.uploadAvatar({ name: 'abc.png' , size: 0 });
      expect(controller.template.configuration.pages.vaAvatar.avatarError).toEqual(controller.avatarErrorType.FILE_SIZE_ERROR);

      controller.template.configuration.pages.vaAvatar.avatarError = controller.avatarErrorType.NO_ERROR;
      controller.uploadAvatar({ name: 'abc.png' , size: controller.MAX_AVATAR_FILE_SIZE });
      expect(controller.template.configuration.pages.vaAvatar.avatarError).toEqual(controller.avatarErrorType.NO_ERROR);
    });
  });

  describe('vaName Page', function () {
    beforeEach(function () {
      controller.nameForm = getForm('nameInput');
    });

    it ('isNameValid to return true when name input field is populated and less than maxNameLength', function () {
      controller.template.configuration.pages.vaName.nameValue = 'testUser';

      const isNameValid = controller.isNameValid();
      expect(controller.nameForm.nameInput.$setValidity).toHaveBeenCalledWith(controller.NameErrorMessages.ERROR_CHAR_50, true);
      expect(isNameValid).toBe(true);
    });

    it ('isNameValid to return false when name input field is empty', function () {
      controller.template.configuration.pages.vaName.nameValue = '';

      const isNameValid = controller.isNameValid();
      expect(isNameValid).toBe(true);
    });

    it ('isNameValid to return false when name is longer than maxNameLength', function () {
      controller.template.configuration.pages.vaName.nameValue = '123456789012345678901234567890123456789012345678901';

      const isNameValid = controller.isNameValid();
      expect(controller.nameForm.nameInput.$setValidity).toHaveBeenCalledWith(controller.NameErrorMessages.ERROR_CHAR_50, false);
      expect(isNameValid).toBe(false);
    });

    it ('isNamePageValid to return false when name input field is empty', function () {
      controller.template.configuration.pages.vaName.nameValue = '';

      spyOn(this.controller, 'isNameValid').and.returnValue(true);
      const isNameValid = controller.isNamePageValid();
      expect(isNameValid).toBe(false);
    });
  });

  describe('evaEmail Page', function () {
    beforeEach(function () {
      controller.emailForm = getForm('emailInput');
    });

    it('isEmailpageValid should return true when emailForm is $valid and email input is populated', function () {
      controller.template.configuration.pages.evaEmail.value = 'zyx89';
      controller.emailForm.$valid = true;

      const isEmailPageValid = controller.isEmailPageValid();
      expect(isEmailPageValid).toBe(true);
    });

    it('isEmailPageValid should return false when email input field is empty', function () {
      controller.template.configuration.pages.evaEmail.value = '';
      controller.emailForm.$valid = true;

      const isEmailPageValid = controller.isEmailPageValid();
      expect(isEmailPageValid).toBe(false);
    });

    it('isEmailPageValid should return false when emailForm is NOT $valid', function () {
      controller.template.configuration.pages.evaEmail.value = 'a@b';
      controller.emailForm.$valid = false;

      const isEmailPageValid = controller.isEmailPageValid();
      expect(isEmailPageValid).toBe(false);
    });
  });

  describe('Summary Page', function () {
    let deferred;
    beforeEach(function () {
      deferred = this.$q.defer();
      spyOn(this.EvaService, 'addExpertAssistant').and.returnValue(deferred.promise);
      spyOn(this.EvaService, 'updateExpertAssistant').and.returnValue(deferred.promise);
    });

    it("When save template failed, the 'saveTemplateErrorOccurred' is set", function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      deferred.reject(failedData);

      controller.submitFeature();
      this.$scope.$apply();

      const featureNameObj = { featureName: 'careChatTpl.virtualAssistant.eva.featureText.name' };
      expect(controller.saveTemplateErrorOccurred).toBeTruthy();
      expect(this.Notification.errorWithTrackingId).toHaveBeenCalledWith(failedData, jasmine.any(String), featureNameObj);
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.VIRTUAL_ASSISTANT.eventNames.EVA_CREATE_FAILURE);
    });

    it('should submit template successfully', function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();

      spyOn(this.$state, 'go');
      deferred.resolve({
        success: true,
        expertAssistantId: 'AnExpertAssistantId',
        status: 201,
      });
      controller.submitFeature();
      this.$scope.$apply();

      expect(this.Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
        featureName: jasmine.any(String),
      });
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      expect(this.$state.go).toHaveBeenCalled();
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.VIRTUAL_ASSISTANT.eventNames.EVA_SUMMARY_PAGE, { durationInMillis: 30 });
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.VIRTUAL_ASSISTANT.eventNames.EVA_START_FINISH, { durationInMillis: 10 });
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.VIRTUAL_ASSISTANT.eventNames.EVA_CREATE_SUCCESS);
    });

    it('should save successfully for Edit', function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      controller.isEditFeature = true;
      const testName = 'My Test EVA';
      controller.template.configuration.pages.vaName.nameValue = testName;
      spyOn(this.$state, 'go');
      deferred.resolve({
        success: true,
        status: 200,
      });
      controller.submitFeature();
      this.$scope.$apply();

      expect(this.Notification.success).toHaveBeenCalledWith('careChatTpl.editSuccessText', {
        featureName: testName,
      });
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      expect(this.$state.go).toHaveBeenCalled();
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.VIRTUAL_ASSISTANT.eventNames.EVA_SUMMARY_PAGE, { durationInMillis: 30 });
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.VIRTUAL_ASSISTANT.eventNames.EVA_START_FINISH, { durationInMillis: 10 });
    });

    it('should show correct notification if save fails on Edit', function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      controller.isEditFeature = true;
      const failedData = {
        success: false,
        status: 403,
        Errors: [{
          errorCode: '100106',
        }],
      };
      deferred.reject(failedData);
      controller.submitFeature();
      this.$scope.$apply();

      expect(controller.saveTemplateErrorOccurred).toBeTruthy();
      expect(this.Notification.errorWithTrackingId).toHaveBeenCalledWith(failedData, jasmine.any(String));
    });
  });
});
