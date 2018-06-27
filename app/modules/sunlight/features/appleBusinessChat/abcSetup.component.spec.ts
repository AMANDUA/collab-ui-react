import abcSetupModule from './abcSetup.component';
import { KeyCodes } from 'modules/core/accessibility';
import * as _ from 'lodash';

describe('Care ABC Setup Component', () => {
  const OrgName = 'Test-Org-Name';
  const OrgId = 'Test-Org-Id';
  const pages = [
    {
      enabled: true,
      name: 'abcBusinessId',
      previousButtonState: 'hidden',
      nextButtonState: false,
    },
    {
      enabled: true,
      name: 'name',
      previousButtonState: true,
      nextButtonState: false,
    },
    {
      enabled: true,
      name: 'abcCvaSelection',
      previousButtonState: true,
      nextButtonState: true,
    },
    {
      enabled: true,
      name: 'abcStatusMessages',
      previousButtonState: true,
      nextButtonState: true,
    },
    {
      enabled: true,
      name: 'abcSummary',
      previousButtonState: true,
      nextButtonState: 'hidden',
    },
  ];

  const BUSINESS_ID_PAGE_INDEX = 0;
  const NAME_PAGE_INDEX = 1;
  const STATUS_MESSAGES_PAGE_INDEX = 3;

  const expectedPageTemplate = {
    templateId: jasmine.any(String),
    name: jasmine.any(String),
    configuration: {
      mediaType: 'appleBusinessChat',
      pages: {
      },
    },
  };
  //fill in expected PageTemplate pages from Pages array above.
  pages.forEach(function (page) { expectedPageTemplate.configuration.pages[page.name] = jasmine.any(Object); });

  const listCvaConfigsResponse = {
    items: [
      {
        config: {
          token: 'abc',
        },
        icon: 'data:image/png',
        id: '123',
        name: 'apple',
        type: 'apiai',
      },
      {
        config: {
          token: 'zyx',
        },
        icon: 'data:image/png',
        id: '987',
        name: 'banana',
        type: 'apiai',
      },
    ],
  };

  const expectedStates = Object.keys(expectedPageTemplate.configuration.pages);
  let controller, listCvaConfigsDeferred;

  beforeEach(function () {
    this.initModules('Sunlight', abcSetupModule);
    this.injectDependencies(
      '$q',
      '$scope',
      '$state',
      '$stateParams',
      '$modal',
      '$timeout',
      '$translate',
      'CvaService',
      'AbcService',
      'Analytics',
      'Authinfo',
      'Notification',
    );

    listCvaConfigsDeferred = this.$q.defer();
    spyOn(this.$modal, 'open');
    spyOn(this.Notification, 'success');
    spyOn(this.Notification, 'error');
    spyOn(this.Notification, 'errorWithTrackingId');
    spyOn(this.Analytics, 'trackEvent');
    spyOn(this.Authinfo, 'getOrgId').and.returnValue(OrgId);
    spyOn(this.Authinfo, 'getOrgName').and.returnValue(OrgName);
    spyOn(Date, 'now').and.returnValues(10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10);
    spyOn(this.CvaService, 'listConfigs').and.returnValue(listCvaConfigsDeferred.promise);

    this.initComponent = (businessId?: string) => {
      this.$scope.myBusinessId = businessId;
      this.compileComponent('abc-setup', {
        dismiss: 'dismiss()',
        businessId: 'myBusinessId',
      });

      controller = this.controller;
      return controller;
    };

    controller = this.initComponent();
  });

  afterEach(function () {
    controller = listCvaConfigsDeferred = undefined;
  });

  function checkStateOfNavigationButtons(pageIndex: number, previousButtonState: any, nextButtonState: any): void {
    controller.currentState = controller.states[pageIndex];
    expect(controller.previousButton()).toEqual(previousButtonState, 'previous button is not in a right state');
    expect(controller.nextButton()).toEqual(nextButtonState, 'next button is not in a right state');
  }

  describe('get and cancel', function () {
    let deferred;
    beforeEach(function () {
      deferred = this.$q.defer();
      spyOn(controller, 'getText').and.returnValue(deferred.promise);
      spyOn(controller, 'getCommonText').and.returnValue(deferred.promise);
    });

    it('should call getCommonText when getTitle is called', function () {
      controller.getTitle();
      expect(controller.getCommonText).toHaveBeenCalledWith('createTitle');
    });

    it('should call getSummaryDescription with summary desc', function () {
      controller.template.configuration.pages.name.nameValue = 'testName';
      controller.getSummaryDescription();
      expect(controller.getText).toHaveBeenCalledWith('summary.abcDesc', { name: controller.template.configuration.pages.name.nameValue });
    });

    it('should call getSummaryDescription with edit summary desc when isEditFeature set to true', function () {
      controller.template.configuration.pages.name.nameValue = 'testName';
      controller.isEditFeature = true;
      controller.getSummaryDescription();
      expect(controller.getText).toHaveBeenCalledWith('summary.abcDescEdit', { name: controller.template.configuration.pages.name.nameValue });
    });

    it('should open a modal with right text when calling cancelModal', function () {
      spyOn(this.$translate, 'instant').and.callThrough();
      controller.cancelModal();
      expect(this.$translate.instant).toHaveBeenCalledWith('careChatTpl.cancelCreateDialog',
        { featureName: 'careChatTpl.appleBusinessChat.featureText.name' });
      expect(this.$modal.open).toHaveBeenCalled();
    });

    it('should open a modal with right text when calling cancelModal with isEditFeature set to true', function () {
      spyOn(this.$translate, 'instant').and.callThrough();
      controller.isEditFeature = true;
      controller.cancelModal();
      expect(this.$translate.instant).toHaveBeenCalledWith('careChatTpl.cancelEditDialog',
        { featureName: 'careChatTpl.appleBusinessChat.featureText.name' });
      expect(this.$modal.open).toHaveBeenCalled();
    });
  });

  describe('Page Structures', function () {
    it('should correlate the states to pages', function () {
      expect(controller.states).toEqual(expectedStates);
    });

    it('should set initial state correctly', function () {
      expect(controller.currentState).toEqual(controller.states[0]);
    });

    it('should open modal when escape key is pressed', function () {
      controller.evalKeyPress(KeyCodes.ESCAPE);
      expect(this.$modal.open).toHaveBeenCalled();
    });

    it('should walk pages forward in order ', function () {
      for (let i = 0; i < controller.states.length; i++) {
        expect(controller.currentState).toEqual(controller.states[i]);
        controller.nextPage();
        expect(this.Analytics.trackEvent).toHaveBeenCalledWith(controller.template.configuration.pages[controller.currentState].eventName, { durationInMillis: 0 });
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
        controller.template.configuration.pages.abcStatusMessages.waitingMessage = '';
        controller.template.configuration.pages.abcStatusMessages.leftChatMessage = '';
        checkStateOfNavigationButtons(index, expectedPage.previousButtonState, expectedPage.nextButtonState);
      });

      it(expectedPage.name + ': make sure template file exists for page ' + expectedPage.name + '.tpl.html\'', function () {
        const expectedPageFilename = 'modules/sunlight/features/appleBusinessChat/wizardPages/' + expectedPage.name + '.tpl.html';
        controller.currentState = controller.states[index];
        expect(controller.getCurrentPage()).toEqual(expectedPageFilename);
      });
    });
  });

  const getForm = function(inputName): any {
    return {
      [inputName]: {
        $setValidity: jasmine.createSpy('$setValidity'),
      },
    };
  };

  describe('Field Checks on the', function () {

    describe('Business Id Page', function () {
      const testBusinessId = '12345';

      beforeEach(function () {
        controller.currentState = controller.states[BUSINESS_ID_PAGE_INDEX];
      });

      it('should have the next button enabled when value is not empty', function () {
        controller.template.configuration.pages.abcBusinessId.value = testBusinessId;
        checkStateOfNavigationButtons(BUSINESS_ID_PAGE_INDEX, 'hidden', true);
      });

      it('should have the next button disabled when value is empty', function () {
        controller.template.configuration.pages.abcBusinessId.value = '';
        checkStateOfNavigationButtons(BUSINESS_ID_PAGE_INDEX, 'hidden', false);
      });

      it('should populate and disable business Id input field with the query param if deep launched', function () {
        controller = this.initComponent(testBusinessId);
        expect(controller.template.configuration.pages.abcBusinessId.value).toEqual(testBusinessId);
        expect(controller.template.configuration.pages.abcBusinessId.enabled).toEqual(false);
        checkStateOfNavigationButtons(BUSINESS_ID_PAGE_INDEX, 'hidden', true);
      });
    });

    describe('Name Page', function () {
      beforeEach(function () {
        controller.nameForm = getForm('nameInput');
        controller.currentState = controller.states[NAME_PAGE_INDEX];
      });

      it('should have the next button enabled when name value is not empty', function () {
        controller.template.configuration.pages.name.nameValue = 'Hello World';
        checkStateOfNavigationButtons(NAME_PAGE_INDEX, true, true);
      });

      it('should have the next button disabled when name value too long', function () {
        controller.template.configuration.pages.name.nameValue = _.repeat('X', controller.maxNameLength);
        checkStateOfNavigationButtons(NAME_PAGE_INDEX, true, true);

        controller.template.configuration.pages.name.nameValue = _.repeat('X', controller.maxNameLength + 1);
        checkStateOfNavigationButtons(NAME_PAGE_INDEX, true, false);
      });

      it('should have the next button disabled when name value is empty', function () {
        controller.template.configuration.pages.name.nameValue = '';
        checkStateOfNavigationButtons(NAME_PAGE_INDEX, true, false);
      });

      it('should have the next button disabled by keyboard shortcut if name value is invalid', function () {
        controller.template.configuration.pages.name.nameValue = '';
        const ENTER_KEYPRESS_EVENT = {
          which: KeyCodes.ENTER,
        };
        spyOn(controller, 'nextPage');
        controller.enterNextPage(ENTER_KEYPRESS_EVENT);
        expect(controller.nextPage).not.toHaveBeenCalled();
      });

      it('should not have the next button triggered by space keyboard shortcut', function () {
        controller.currentState = controller.states[NAME_PAGE_INDEX];
        controller.template.configuration.pages.name.nameValue = 'testName';
        const SPACE_KEYPRESS_EVENT = {
          which: KeyCodes.SPACE,
        };
        spyOn(controller, 'nextPage');
        controller.enterNextPage(SPACE_KEYPRESS_EVENT);
        expect(controller.nextPage).not.toHaveBeenCalled();
      });

      it('should have the next button disabled when name value is only spaces', function () {
        controller.template.configuration.pages.name.nameValue = '  ';
        checkStateOfNavigationButtons(NAME_PAGE_INDEX, true, false);
      });
    });

    describe('Status Messages Page', function () {
      beforeEach(function () {
        controller.currentState = controller.states[STATUS_MESSAGES_PAGE_INDEX];
      });

      it('should have the next button enabled when waiting message and left chat message are empty', function () {
        controller.template.configuration.pages.abcStatusMessages.waitingMessage = '';
        controller.template.configuration.pages.abcStatusMessages.leftChatMessage = '';
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, true);
      });

      it('should have the next button enabled when waiting message is not empty', function () {
        controller.template.configuration.pages.abcStatusMessages.waitingMessage = 'Waiting for an agent';
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, true);
      });

      it('should have the next button disabled when waiting message is too long', function () {
        controller.template.configuration.pages.abcStatusMessages.waitingMessage = _.repeat('X', controller.maxInputLength50);
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, true);

        controller.template.configuration.pages.abcStatusMessages.waitingMessage = _.repeat('X', controller.maxInputLength50 + 1);
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, false);
      });

      it('should have the next button enabled when waiting message has invalid character', function () {
        controller.template.configuration.pages.abcStatusMessages.waitingMessage = 'Waiting <>for an agent';
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, false);
      });

      it('should have the next button enabled when left chat message is not empty', function () {
        controller.template.configuration.pages.abcStatusMessages.waitingMessage = '';
        controller.template.configuration.pages.abcStatusMessages.leftChatMessage = 'Left chat';
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, true);
      });

      it('should have the next button disabled when left chat message is too long', function () {
        controller.template.configuration.pages.abcStatusMessages.waitingMessage = '';
        controller.template.configuration.pages.abcStatusMessages.leftChatMessage = _.repeat('X', controller.maxInputLength250);
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, true);

        controller.template.configuration.pages.abcStatusMessages.leftChatMessage = _.repeat('X', controller.maxInputLength250 + 1);
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, false);
      });

      it('should have the next button enabled when left chat message has invalid character', function () {
        controller.template.configuration.pages.abcStatusMessages.leftChatMessage = 'Left<>chat';
        checkStateOfNavigationButtons(STATUS_MESSAGES_PAGE_INDEX, true, false);
      });
    });
  });

  describe('Cva Selection Page', function () {
    it('should populate configured CVAs', function () {
      const myTranslation = 'test';
      spyOn(this.$translate, 'instant').and.returnValue(myTranslation);
      listCvaConfigsDeferred.resolve(listCvaConfigsResponse);
      this.$scope.$apply();
      let actualCVAs = [{ name: 'test' }];
      actualCVAs = actualCVAs.concat(listCvaConfigsResponse.items);
      expect(controller.template.configuration.pages.abcCvaSelection.configuredCVAs).toEqual(actualCVAs);
    });

    it('should populate state and show error notification in the case of an error', function () {
      const error = { errorMsg: 'broken' };

      listCvaConfigsDeferred.reject(error);
      this.$scope.$apply();

      expect(controller.template.configuration.pages.abcCvaSelection.configuredCVAs).toEqual([]);
      controller.Notification.errorWithTrackingId(error, 'abcService.getCustomerVirtualAssistantListError');
    });
  });

  describe('Summary Page', function () {
    let deferred, updateDeferred, updateIconDeferred, listEvasDeferred;
    const failedData = {
      success: false,
      status: 403,
      Errors: [{
        errorCode: '100106',
      }],
    };

    beforeEach(function () {
      deferred = this.$q.defer();
      spyOn(this.AbcService, 'addAbcConfig').and.returnValue(deferred.promise);
      spyOn(this.AbcService, 'updateAbcConfig').and.returnValue(deferred.promise);
      spyOn(this.$translate, 'instant').and.callThrough();
    });

    afterEach(function () {
      deferred = updateDeferred = updateIconDeferred = listEvasDeferred = undefined;
    });

    it('should fail to submit on create', function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      deferred.reject(failedData);

      controller.submitFeature();
      this.$scope.$apply();

      const featureNameObj = { featureName: 'careChatTpl.appleBusinessChat.featureText.name' };
      expect(controller.creatingTemplate).toBeFalsy();
      expect(controller.saveTemplateErrorOccurred).toBeTruthy();
      expect(this.Notification.errorWithTrackingId).toHaveBeenCalledWith(failedData, jasmine.any(String), featureNameObj);
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_CREATE_FAILURE);
      expect(this.$translate.instant).toHaveBeenCalledWith('common.retry');

    });

    it('should submit successfully on create', function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();

      spyOn(this.$state, 'go');
      deferred.resolve();

      controller.submitFeature();
      this.$scope.$apply();

      expect(this.Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
        featureName: jasmine.any(String),
      });
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      expect(this.$state.go).toHaveBeenCalled();

      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_SUMMARY_PAGE, { durationInMillis: 10 });
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_START_FINISH, { durationInMillis: 0 });
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_CREATE_SUCCESS);
    });

    it('should submit successfully on edit', function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      controller.isEditFeature = true;
      spyOn(this.$state, 'go');
      deferred.resolve({
        success: true,
        status: 200,
      });
      controller.submitFeature();
      this.$scope.$apply();

      expect(this.Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
        featureName: jasmine.any(String),
      });
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      expect(this.$state.go).toHaveBeenCalled();
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_SUMMARY_PAGE, { durationInMillis: 10 });
      expect(this.Analytics.trackEvent).toHaveBeenCalledWith(this.Analytics.sections.APPLE_BUSINESS_CHAT.eventNames.ABC_START_FINISH, { durationInMillis: 0 });
    });

    it('should fail to submit on edit', function () {
      //by default, this flag is false
      expect(controller.saveTemplateErrorOccurred).toBeFalsy();
      deferred.reject(failedData);
      controller.isEditFeature = true;

      controller.submitFeature();
      this.$scope.$apply();

      const featureNameObj = { featureName: 'careChatTpl.appleBusinessChat.featureText.name' };
      expect(controller.saveTemplateErrorOccurred).toBeTruthy();
      expect(this.Notification.errorWithTrackingId).toHaveBeenCalledWith(failedData, jasmine.any(String), featureNameObj);
    });
  });
});