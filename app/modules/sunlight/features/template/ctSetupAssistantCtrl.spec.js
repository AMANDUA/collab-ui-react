'use strict';

describe('Care Setup Assistant Ctrl', function () {

  var controller, $scope, $modal, $q, CTService, getLogoDeferred, getLogoUrlDeferred, SunlightConfigService, $state, $stateParams, LogMetricsService;
  var Notification, $translate;

  var escapeKey = 27;
  var templateName = 'Atlas UT Template';
  var NAME_PAGE_INDEX = 0;
  var OVERVIEW_PAGE_INDEX = 1;
  var AGENT_UNAVAILABLE_PAGE_INDEX = 3;
  var OFF_HOURS_PAGE_INDEX = 4;
  var FEEDBACK_PAGE_INDEX = 5;
  var PROFILE_PAGE_INDEX = 6;
  var CHAT_STATUS_MESSAGES_PAGE_INDEX = 7;
  var EMBED_CODE_PAGE_INDEX = 8;
  var OrgName = 'Test-Org-Name';
  var businessHours = getJSONFixture('sunlight/json/features/chatTemplateCreation/businessHoursSchedule.json');
  var spiedAuthinfo = {
    getOrgId: jasmine.createSpy('getOrgId').and.returnValue('Test-Org-Id'),
    getOrgName: jasmine.createSpy('getOrgName').and.returnValue(OrgName)
  };

  var getDummyLogo = function (data) {
    return {
      data: data
    };
  };

  var dummyLogoUrl = 'https://www.example.com/logo.png';

  var failedData = {
    success: false,
    status: 403,
    Errors: [{
      errorCode: '100106'
    }]
  };

  var deSelectAllDays = function () {
    _.forEach(controller.days, function (day, key) {
      if (day.isSelected) {
        controller.setDay(key);
      }
    });
  };

  var duplicateFieldTypeData = {
    'field1': {
      attributes: [{
        name: 'type',
        value: { id: 'name' }
      }]
    },
    'field2': {
      attributes: [{
        name: 'type',
        value: { id: 'email' }
      }]
    },
    'field3': {
      attributes: [{
        name: 'type',
        value: { id: 'name' }
      }]
    } };
  var customerInfoWithLongAttributeValue = {
    'welcomeHeader': {
      'attributes': [
        { 'name': 'header', 'value': 'Welcome to' },
        { 'name': 'organization', 'value': Array(52).join("c") }
      ]
    },
    'field1': {
      'attributes': [
        { 'name': 'label', 'value': 'Name' },
        { 'name': 'hintText', 'value': 'Something' },
        { 'name': 'type', 'value': { id: 'name' } }
      ] },
    'field2': {
      'attributes': [
        { 'name': 'label', 'value': 'Email' },
        { 'name': 'hintText', 'value': Array(52).join("d") },
        { 'name': 'type', 'value': { id: 'email' } }
      ] },
    'field3': {
      'attributes': [
        { 'name': 'label', 'value': 'SomethingElse' },
        { 'name': 'hintText', 'value': 'SomethingElse' },
        { 'name': 'type', 'value': { id: 'custom' } }
      ] }
  };

  var selectedDaysByDefault = businessHours.selectedDaysByDefault;
  var defaultTimeZone = businessHours.defaultTimeZone;
  var defaultDayPreview = businessHours.defaultDayPreview;
  var startTimeOptions = businessHours.startTimeOptions;
  var defaultTimings = businessHours.defaultTimings;

  afterEach(function () {
    controller = $scope = $modal = $q = CTService = getLogoDeferred = getLogoUrlDeferred = SunlightConfigService = $state = $stateParams = LogMetricsService = undefined;
    Notification = $translate = undefined;
  });

  afterAll(function () {
    selectedDaysByDefault = defaultTimeZone = defaultDayPreview = startTimeOptions = defaultTimings = businessHours = failedData = deSelectAllDays = duplicateFieldTypeData = customerInfoWithLongAttributeValue = undefined;
  });

  beforeEach(angular.mock.module('Sunlight'));
  beforeEach(angular.mock.module('Hercules'));
  beforeEach(angular.mock.module(function ($provide) {
    $provide.value("Authinfo", spiedAuthinfo);
  }));

  var intializeCtrl = function (_$rootScope_, $controller, _$modal_, _$q_, _$translate_,
    _$window_, _Authinfo_, _CTService_, _SunlightConfigService_, _$state_, _Notification_, _$stateParams_, _LogMetricsService_) {
    $scope = _$rootScope_.$new();
    $modal = _$modal_;
    $q = _$q_;
    $translate = _$translate_;
    CTService = _CTService_;
    SunlightConfigService = _SunlightConfigService_;
    $state = _$state_;
    Notification = _Notification_;
    $stateParams = _$stateParams_;
    LogMetricsService = _LogMetricsService_;

    $stateParams.type = 'chat';

    // set language to en_US to show AM and PM for startTime and endTime
    $translate.use(businessHours.userLang);
    //create mock deferred object which will be used to return promises
    getLogoDeferred = $q.defer();
    getLogoUrlDeferred = $q.defer();
    spyOn($modal, 'open');
    spyOn(CTService, 'getLogo').and.returnValue(getLogoDeferred.promise);
    spyOn(CTService, 'getLogoUrl').and.returnValue(getLogoUrlDeferred.promise);
    spyOn(Notification, 'success');
    spyOn(Notification, 'errorWithTrackingId');
    spyOn(LogMetricsService, 'logMetrics').and.callFake(function () {});
    $stateParams = {
      template: undefined,
      isEditFeature: false
    };
    controller = $controller('CareSetupAssistantCtrl', {
      $scope: $scope
    });
  };

  function checkStateOfNavigationButtons(pageIndex, previousButtonState, nextButtonState) {
    controller.currentState = controller.states[pageIndex];
    expect(controller.previousButton(pageIndex)).toEqual(previousButtonState);
    expect(controller.nextButton()).toEqual(nextButtonState);
  }

  function resolveLogoPromise() {
    getLogoDeferred.resolve(getDummyLogo('abcd'));
    $scope.$apply();
  }

  function resolveLogoUrlPromise() {
    getLogoUrlDeferred.resolve(dummyLogoUrl);
    $scope.$apply();
  }

  function rejectLogoPromise() {
    getLogoDeferred.reject({
      status: 500
    });
    $scope.$apply();
  }

  describe('should test the', function () {

    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      resolveLogoPromise();
      resolveLogoUrlPromise();
    });

    it("it starts from the name page", function () {
      controller.currentState = controller.states[NAME_PAGE_INDEX];
      expect(controller.getPageIndex()).toEqual(NAME_PAGE_INDEX);
    });

    it("behavior of navigation buttons", function () {
      checkStateOfNavigationButtons(NAME_PAGE_INDEX, 'hidden', false);
      checkStateOfNavigationButtons(EMBED_CODE_PAGE_INDEX, true, 'hidden');
    });

    it("keyboard functionality", function () {
      controller.evalKeyPress(escapeKey);
      expect($modal.open).toHaveBeenCalled();
    });
  });

  describe('Name Page', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      resolveLogoPromise();
    });
    it("next button should be enabled when name is present", function () {
      controller.template.name = templateName;
      checkStateOfNavigationButtons(NAME_PAGE_INDEX, 'hidden', true);
    });

    it("next button should be disabled when name is not present", function () {
      controller.template.name = '';
      checkStateOfNavigationButtons(NAME_PAGE_INDEX, 'hidden', false);
    });

    it("next button should be disabled when name is more than 250 chars long", function () {
      controller.template.name = Array(252).join("a");
      checkStateOfNavigationButtons(NAME_PAGE_INDEX, 'hidden', false);
    });

    it("next button should be disabled when name has any invalid character", function () {
      controller.template.name = ">";
      checkStateOfNavigationButtons(NAME_PAGE_INDEX, 'hidden', false);
    });

    it("next button should be disabled when name has invalid character and length exceeds 250 chars", function () {
      controller.template.name = Array(251).join("a") + "<";
      checkStateOfNavigationButtons(NAME_PAGE_INDEX, 'hidden', false);
    });
  });

  describe('Feedback Page', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      controller.currentState = controller.states[FEEDBACK_PAGE_INDEX];
    });

    it('next and previous buttons should be enabled by default', function () {
      controller.template.name = templateName;
      controller.currentState = controller.states[FEEDBACK_PAGE_INDEX];
      expect(controller.previousButton()).toEqual(true);
      expect(controller.nextButton()).toEqual(true);
    });

    it('next button should be disabled if feedback comment is longer than 50 characters', function () {
      controller.template.configuration.pages.feedback.fields.comment.displayText = Array(52).join("a");
      checkStateOfNavigationButtons(FEEDBACK_PAGE_INDEX, true, false);
    });

    it('next button should be disabled if feedback query is longer than 250 characters', function () {
      controller.template.configuration.pages.feedback.fields.feedbackQuery.displayText = Array(252).join("a");
      checkStateOfNavigationButtons(FEEDBACK_PAGE_INDEX, true, false);
    });

    it('next button should be enabled if feedback comment and query are valid', function () {
      controller.template.configuration.pages.feedback.fields.comment.displayText = "Feedback comment";
      controller.template.configuration.pages.feedback.fields.feedbackQuery.displayText = "Feedback query";
      checkStateOfNavigationButtons(FEEDBACK_PAGE_INDEX, true, true);
    });
  });

  describe('Profile Page', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      controller.currentState = controller.states[PROFILE_PAGE_INDEX];
    });
    it('set Organization name and prev/next should be enabled', function () {
      resolveLogoPromise();
      expect(controller.orgName).toEqual(OrgName);
      checkStateOfNavigationButtons(PROFILE_PAGE_INDEX, true, true);
    });

    it('next btn should disabled when org name is not present', function () {
      resolveLogoPromise();
      controller.orgName = '';
      checkStateOfNavigationButtons(PROFILE_PAGE_INDEX, true, false);
    });

    it('should set default agent preview name to the agent display name option', function () {
      resolveLogoPromise();
      expect(controller.selectedAgentProfile).toEqual(controller.agentNames.displayName);
    });

    it('should set agent preview names based on selected agent profile', function () {
      resolveLogoPromise();
      controller.selectedAgentProfile = controller.agentNames.alias;
      controller.setAgentProfile();
      expect(controller.agentNamePreview).toEqual('careChatTpl.agentAliasPreview');
      controller.selectedAgentProfile = controller.agentNames.displayName;
      controller.setAgentProfile();
      expect(controller.agentNamePreview).toEqual('careChatTpl.agentNamePreview');
    });

    it('should set template profile to org profile if org profile is selected when nextBtn is clicked', function () {
      resolveLogoPromise();
      resolveLogoUrlPromise();
      controller.selectedTemplateProfile = controller.profiles.org;
      controller.nextButton();
      expect(controller.template.configuration.mediaSpecificConfiguration).toEqual({
        useOrgProfile: true,
        useAgentRealName: true,
        displayText: OrgName,
        orgLogoUrl: dummyLogoUrl
      });
    });

    it('should set template profile to agent profile if agent profile is selected when nextBtn is clicked', function () {
      resolveLogoPromise();
      resolveLogoUrlPromise();
      controller.selectedTemplateProfile = controller.profiles.agent;
      controller.selectedAgentProfile = controller.agentNames.alias;
      controller.nextButton();
      expect(controller.template.configuration.mediaSpecificConfiguration).toEqual({
        useOrgProfile: false,
        useAgentRealName: false,
        orgLogoUrl: dummyLogoUrl,
        displayText: OrgName,
      });
    });

    it('logoUploaded should be falsy when org admin did not upload a logo', function () {
      rejectLogoPromise();
      expect(controller.logoFile).toEqual('');
      expect(controller.logoUploaded).toBeFalsy();
    });
  });

  describe('Overview Page', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      resolveLogoPromise();
    });
    it("should have previous and next button enabled", function () {
      checkStateOfNavigationButtons(OVERVIEW_PAGE_INDEX, true, true);
    });

    it("should initialize all cards as enabled ", function () {
      expect(controller.template.configuration.pages.customerInformation.enabled).toBe(true);
      expect(controller.template.configuration.pages.agentUnavailable.enabled).toBe(true);
      expect(controller.template.configuration.pages.offHours.enabled).toBe(true);
      expect(controller.template.configuration.pages.feedback.enabled).toBe(true);
    });
  });

  describe('Customer Info Page', function () {

    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      resolveLogoPromise();
    });

    it("should set the active item", function () {
      var returnObj = {
        attributes: [{
          name: 'header',
          value: 'careChatTpl.defaultWelcomeText'
        }, {
          name: 'organization',
          value: OrgName
        }]
      };
      controller.setActiveItem("welcomeHeader");
      expect(controller.activeItem).toEqual(returnObj);
    });

    it("should not get the attribute param for incorrect param", function () {
      var attrParam = controller.getAttributeParam("displaytext", "organization", "welcomeHeader");
      expect(attrParam).toBe(undefined);
    });

    it("should not get the attribute param for incorrect attribute", function () {
      var attrParam = controller.getAttributeParam("label", "displaytext", "welcomeHeader");
      expect(attrParam).toBe(undefined);
    });

    it("should not get the attribute param for incorrect field", function () {
      var attrParam = controller.getAttributeParam("label", "organization", "field");
      expect(attrParam).toBe(undefined);
    });

    it("should not get the attribute param for undefined field", function () {
      var attrParam = controller.getAttributeParam("label", "organization", undefined);
      expect(attrParam).toBe(undefined);
    });

    it("should be true for dynamic field", function () {
      var isDynamicRes = controller.isDynamicFieldType("field1");
      expect(isDynamicRes).toBe(true);
    });

    it("should be false for static field", function () {
      var isDynamicRes = controller.isDynamicFieldType("welcome");
      expect(isDynamicRes).toBe(false);
    });

    it("should be true for static field", function () {
      var isStaticRes = controller.isStaticFieldType("welcome");
      expect(isStaticRes).toBe(true);
    });

    it("should be false for dynamic field", function () {
      var isStaticRes = controller.isStaticFieldType("field1");
      expect(isStaticRes).toBe(false);
    });

    it("should be false for undefined field", function () {
      var isDynamicRes = controller.isDynamicFieldType(undefined);
      expect(isDynamicRes).toBe(false);
      var isStaticRes = controller.isStaticFieldType(undefined);
      expect(isStaticRes).toBe(false);
    });

    it("should be true for defined object field", function () {
      var testObj = {
        "trees-14": "x-10000",
        "trees-15": "x-20000",
        "trees-16": "x-30000"
      };
      var isDefinedRes = controller.isDefined(testObj, "trees-15");
      expect(isDefinedRes).toBe(true);
    });

    it("should be false for undefined object or field", function () {
      var testObj = {
        "trees-14": "x-10000",
        "trees-15": "x-20000",
        "trees-16": ""
      };
      var isDefinedRes = controller.isDefined(testObj, "trees-17");
      expect(isDefinedRes).toBe(false);
      isDefinedRes = controller.isDefined(testObj, "trees-16");
      expect(isDefinedRes).toBe(false);
    });

    it("should add a new category token and clear the input field when a new token is added", function () {
      var ENTER_KEYPRESS_EVENT = {
        which: 13
      };
      controller.categoryOptionTag = 'Mock Category Token';
      var mockElementObject = jasmine.createSpyObj('element', ['tokenfield']);
      spyOn(angular, 'element').and.returnValue(mockElementObject);
      spyOn(controller, 'addCategoryOption').and.callThrough();

      controller.onEnterKey(ENTER_KEYPRESS_EVENT);

      expect(controller.addCategoryOption).toHaveBeenCalled();
      expect(mockElementObject.tokenfield).toHaveBeenCalledWith('createToken', 'Mock Category Token');
      expect(controller.categoryOptionTag).toEqual('');
    });

    it("should validate type for a unique field", function () {
      expect(controller.validateType({ id: 'name' })).toEqual(true);
    });

    it("should identify a duplicate type configured", function () {
      controller.template.configuration.pages.customerInformation.fields = duplicateFieldTypeData;
      expect(controller.validateType({ id: 'name' })).toEqual(false);
    });

    it("next button should get disabled when duplicate types are configured in customerInfo page", function () {
      controller.template.configuration.pages.customerInformation.fields = duplicateFieldTypeData;
      expect(controller.nextButton()).toEqual(false);
    });

    it("next button should get disabled when attributes of customerInfo: Static and Dynamic fields have value > 50 chars", function () {
      controller.template.configuration.pages.customerInformation.fields = customerInfoWithLongAttributeValue;
      expect(controller.nextButton()).toEqual(false);
    });
  });

  describe('Off Hours Page', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      controller.currentState = controller.states[OFF_HOURS_PAGE_INDEX]; // set to off hours view
      resolveLogoPromise();
    });

    function setTimings(startTime) {
      expect(controller.timings).toEqual(defaultTimings);
      controller.timings.startTime = startTime;
      controller.setEndTimeOptions();
    }

    function setTimezone(timeZoneValue) {
      controller.scheduleTimeZone = _.find(CTService.getTimezoneOptions(), {
        value: timeZoneValue
      });
    }

    it('should set off hours message and business hours by default', function () {
      expect(controller.template.configuration.pages.offHours.message).toEqual('careChatTpl.offHoursDefaultMessage');
      expect(controller.template.configuration.pages.offHours.schedule.open24Hours).toBe(true);
      expect(controller.isOffHoursMessageValid).toBe(true);
      expect(controller.isBusinessHoursDisabled).toBe(false);
      expect(_.map(_.filter(controller.days, 'isSelected'), 'label')).toEqual(selectedDaysByDefault);
      expect(_.map(controller.timings, 'value')).toEqual(['08:00', '16:00']);
      expect(controller.scheduleTimeZone).toEqual(defaultTimeZone);
      expect(controller.daysPreview).toEqual(defaultDayPreview);
    });

    it('should set days', function () {
      deSelectAllDays();
      expect(controller.isBusinessHoursDisabled).toBe(true);
      expect(_.map(_.filter(controller.days, 'isSelected'), 'label')).toEqual([]);
      controller.setDay(1); // set Monday
      controller.setDay(6); // set Saturday
      expect(_.map(_.filter(controller.days, 'isSelected'), 'label')).toEqual(['Monday', 'Saturday']);
      expect(controller.daysPreview).toEqual('Monday, Saturday');
    });

    it('should disable the right btn if no days are selected', function () {
      deSelectAllDays();
      expect(controller.isBusinessDaySelected).toBe(undefined);
      checkStateOfNavigationButtons(OFF_HOURS_PAGE_INDEX, true, false);
    });

    it('should disable the right btn if off hours message is more than 250 characters', function () {
      controller.template.configuration.pages.offHours.message = Array(252).join("a");
      checkStateOfNavigationButtons(OFF_HOURS_PAGE_INDEX, true, false);
    });

    it('should select start time and end time correctly if startTime is less than endTime', function () {
      expect(_.map(controller.startTimeOptions, 'label')).toEqual(startTimeOptions);
      var startTime = {
        label: '09:00 AM',
        value: '09:00'
      };
      var oldEndTime = controller.timings.endTime;
      setTimings(startTime);
      expect(controller.timings).toEqual({
        startTime: startTime,
        endTime: oldEndTime

      });
    });

    it('should select start time and end time correctly if startTime is greater than endTime', function () {
      expect(_.map(controller.startTimeOptions, 'label')).toEqual(startTimeOptions);
      var startTime = {
        label: '05:00 PM',
        value: '17:00'
      };
      var endTime = {
        label: '05:30 PM',
        value: '17:30'
      };
      setTimings(startTime);
      expect(controller.timings).toEqual({
        startTime: startTime,
        endTime: endTime
      });
    });

    it('should select end time as 11:59 PM if start time is 11:30 PM', function () {
      expect(_.map(controller.startTimeOptions, 'label')).toEqual(startTimeOptions);
      var startTime = {
        label: '11:30 PM',
        value: '23:30'
      };
      var endTime = {
        label: '11:59 PM',
        value: '23:59'
      };
      setTimings(startTime);
      expect(controller.timings).toEqual({
        startTime: startTime,
        endTime: endTime
      });
    });

    it('should update templateJSON with the offHours data', function () {
      controller.template.configuration.pages.offHours.schedule.open24Hours = false;
      deSelectAllDays();
      controller.setDay(1); // set Monday
      controller.setDay(6); // set Saturday
      var startTime = {
        label: '10:30 AM',
        value: '10:30'
      };
      var endTime = {
        label: '05:30 PM',
        value: '17:30'
      };
      setTimings(startTime);
      controller.timings.endTime = endTime;
      setTimezone('America/Nassau');
      controller.nextButton();
      expect(controller.template.configuration.pages.offHours).toEqual({
        enabled: true,
        message: 'careChatTpl.offHoursDefaultMessage',
        schedule: {
          businessDays: ['Monday', 'Saturday'],
          open24Hours: false,
          timings: {
            startTime: '10:30 AM',
            endTime: '05:30 PM'
          },
          timezone: 'America/Nassau'
        }
      });
    });

  });

  describe('Summary Page', function () {
    var deferred;
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      deferred = $q.defer();
      spyOn(SunlightConfigService, 'createChatTemplate').and.returnValue(deferred.promise);
      spyOn(SunlightConfigService, 'editChatTemplate').and.returnValue(deferred.promise);
    });

    it("When save template failed, the 'saveCTErrorOccurred' is set", function () {
      //by default, this flag is false
      expect(controller.saveCTErrorOccurred).toBeFalsy();
      deferred.reject(failedData);
      controller.submitChatTemplate();
      $scope.$apply();

      expect(controller.saveCTErrorOccurred).toBeTruthy();
      expect(LogMetricsService.logMetrics).not.toHaveBeenCalled();
      expect(Notification.errorWithTrackingId).toHaveBeenCalledWith(failedData, jasmine.any(String));
    });

    it("should submit template successfully", function () {
      //by default, this flag is false
      expect(controller.saveCTErrorOccurred).toBeFalsy();

      spyOn($state, 'go');
      spyOn($stateParams, 'isEditFeature').and.returnValue(false);
      deferred.resolve({
        success: true,
        headers: function () {
          return 'something/abc123';
        },
        status: 201
      });

      controller.submitChatTemplate();
      $scope.$apply();

      expect($modal.open).toHaveBeenCalledWith({
        templateUrl: 'modules/sunlight/features/template/ctEmbedCodeModal.tpl.html',
        type: 'small',
        controller: 'EmbedCodeCtrl',
        controllerAs: 'embedCodeCtrl',
        resolve: {
          templateId: jasmine.any(Function),
          templateHeader: jasmine.any(Function)
        }
      });
      expect(Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
        featureName: jasmine.any(String)
      });
      expect(controller.saveCTErrorOccurred).toBeFalsy();
      expect($state.go).toHaveBeenCalled();
      expect(LogMetricsService.logMetrics.calls.argsFor(0)[1]).toEqual('CARETEMPLATEFINISH');
    });

    it("should submit template successfully for Edit", function () {
      //by default, this flag is false
      expect(controller.saveCTErrorOccurred).toBeFalsy();

      spyOn($state, 'go');
      spyOn($stateParams, 'isEditFeature').and.returnValue(true);
      deferred.resolve({
        success: true,
        headers: function () {
          return 'something/abc123';
        },
        status: 200
      });

      controller.submitChatTemplate();
      $scope.$apply();

      expect($modal.open).toHaveBeenCalledWith({
        templateUrl: 'modules/sunlight/features/template/ctEmbedCodeModal.tpl.html',
        type: 'small',
        controller: 'EmbedCodeCtrl',
        controllerAs: 'embedCodeCtrl',
        resolve: {
          templateId: jasmine.any(Function),
          templateHeader: jasmine.any(Function)
        }
      });
      expect(Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
        featureName: jasmine.any(String)
      });
      expect(controller.saveCTErrorOccurred).toBeFalsy();
      expect($state.go).toHaveBeenCalled();
      expect(LogMetricsService.logMetrics.calls.argsFor(0)[1]).toEqual('CARETEMPLATEFINISH');
    });

  });

  describe('Chat Status Messages Page', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      resolveLogoPromise();
    });
    beforeEach(function () {
      controller.currentState = controller.states[CHAT_STATUS_MESSAGES_PAGE_INDEX];
    });
    it("if bubble title field is missing it should continue", function () {
      controller.template.configuration.chatStatusMessages.messages.connectingMessage.displayText = "Connecting Message";
      controller.template.configuration.chatStatusMessages.messages.bubbleTitleMessage = undefined;
      controller.template.configuration.chatStatusMessages.messages.waitingMessage.displayText = "Waiting Message";
      controller.template.configuration.chatStatusMessages.messages.enterRoomMessage.displayText = "Enter Room Message";
      controller.template.configuration.chatStatusMessages.messages.leaveRoomMessage.displayText = "Left Room Message";
      controller.template.configuration.chatStatusMessages.messages.chattingMessage.displayText = "Chatting Message";
      checkStateOfNavigationButtons(CHAT_STATUS_MESSAGES_PAGE_INDEX, true, true);
    });
    it("should have previous and next button enabled", function () {
      controller.template.configuration.chatStatusMessages.messages.connectingMessage.displayText = "Connecting Message";
      controller.template.configuration.chatStatusMessages.messages.bubbleTitleMessage.displayText = "Click here to chat with Customer Care";
      controller.template.configuration.chatStatusMessages.messages.waitingMessage.displayText = "Waiting Message";
      controller.template.configuration.chatStatusMessages.messages.enterRoomMessage.displayText = "Enter Room Message";
      controller.template.configuration.chatStatusMessages.messages.leaveRoomMessage.displayText = "Left Room Message";
      controller.template.configuration.chatStatusMessages.messages.chattingMessage.displayText = "Chatting Message";
      checkStateOfNavigationButtons(CHAT_STATUS_MESSAGES_PAGE_INDEX, true, true);
    });
    it("should have next button disabled if all the status messages are more than 50 characters", function () {
      controller.template.configuration.chatStatusMessages.messages.connectingMessage.displayText = Array(60).join("n");
      controller.template.configuration.chatStatusMessages.messages.bubbleTitleMessage.displayText = Array(51).join("n");
      controller.template.configuration.chatStatusMessages.messages.waitingMessage.displayText = Array(60).join("n");
      controller.template.configuration.chatStatusMessages.messages.enterRoomMessage.displayText = Array(60).join("n");
      controller.template.configuration.chatStatusMessages.messages.leaveRoomMessage.displayText = Array(60).join("n");
      controller.template.configuration.chatStatusMessages.messages.chattingMessage.displayText = Array(60).join("n");
      checkStateOfNavigationButtons(CHAT_STATUS_MESSAGES_PAGE_INDEX, true, false);
    });
    it("should have next button disabled if any of the status messages are more than 50 characters", function () {
      controller.template.configuration.chatStatusMessages.messages.connectingMessage.displayText = "Connecting Message";
      controller.template.configuration.chatStatusMessages.messages.bubbleTitleMessage.displayText = "Click here to chat with Customer Care";
      controller.template.configuration.chatStatusMessages.messages.waitingMessage.displayText = "Waiting Message";
      controller.template.configuration.chatStatusMessages.messages.enterRoomMessage.displayText = "Enter Room Message";
      controller.template.configuration.chatStatusMessages.messages.leaveRoomMessage.displayText = "Left Room Message";
      controller.template.configuration.chatStatusMessages.messages.chattingMessage.displayText = Array(60).join("n");
      checkStateOfNavigationButtons(CHAT_STATUS_MESSAGES_PAGE_INDEX, true, false);
    });
  });

  describe('Agent Unavailable Page', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      controller.currentState = controller.states[AGENT_UNAVAILABLE_PAGE_INDEX];
    });

    it('next and previous buttons should be enabled by default', function () {
      checkStateOfNavigationButtons(AGENT_UNAVAILABLE_PAGE_INDEX, true, true);
    });

    it("next button should be disabled when unavailable msg is more than 250 characters", function () {
      controller.template.configuration.pages.agentUnavailable.fields.agentUnavailableMessage.displayText = Array(252).join("a");
      checkStateOfNavigationButtons(AGENT_UNAVAILABLE_PAGE_INDEX, true, false);
    });

    it("next button should be enabled when unavailable msg is present", function () {
      controller.template.configuration.pages.agentUnavailable.fields.agentUnavailableMessage.displayText = templateName;
      checkStateOfNavigationButtons(AGENT_UNAVAILABLE_PAGE_INDEX, true, true);
    });
  });

  describe('For callback media', function () {
    beforeEach(inject(intializeCtrl));
    beforeEach(function () {
      controller.type = 'callback';
      controller.setStates();
      controller.getDefaultTemplate();
    });
    it('the page order should be as expected', function () {
      expect(controller.states).toEqual(['name', 'summary']);
    });
    it('default template should be of type callback', function () {
      expect(controller.template.configuration.mediaType).toEqual('callback');
    });
  });

});
