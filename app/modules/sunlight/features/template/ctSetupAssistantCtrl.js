(function () {
  'use strict';

  /* global Uint8Array:false */

  angular
    .module('Sunlight')
    .directive('validateCharacters', validateCharactersDirective)
    .controller('CareSetupAssistantCtrl', CareSetupAssistantCtrl);

  /* @ngInject */

  function CareSetupAssistantCtrl($modal, $scope, $state, $stateParams, $timeout, $translate, $window, Authinfo, CTService, FeatureToggleService, DomainManagementService, LogMetricsService, Notification, SunlightConfigService) {
    var vm = this;
    init();

    vm.selectedMediaType = $stateParams.type;

    vm.mediaTypes = {
      chat: 'chat',
      callback: 'callback',
      chatPlusCallback: 'chatPlusCallback',
    };
    vm.cancelModal = cancelModal;
    vm.evalKeyPress = evalKeyPress;

    // Setup assistant controller functions
    vm.nextPage = nextPage;
    vm.previousPage = previousPage;
    vm.nextButton = nextButton;
    vm.previousButton = previousButton;
    vm.getPageIndex = getPageIndex;
    vm.setAgentProfile = setAgentProfile;
    vm.setDay = setDay;
    vm.setEndTimeOptions = setEndTimeOptions;
    vm.animation = 'slide-left';
    vm.submitChatTemplate = submitChatTemplate;
    vm.isEditFeature = $stateParams.isEditFeature;
    vm.getCustomerInformationFormFields = getCustomerInformationFormFields;
    vm.getLocalisedText = getLocalisedText;
    vm.getLocalisedFeedbackText = getLocalisedFeedbackText;
    vm.getFeedbackDesc = getFeedbackDesc;
    vm.getFeedbackModel = getFeedbackModel;
    vm.getCustomerInformationBtnClass = getCustomerInformationBtnClass;
    vm.getTitle = getTitle;
    vm.isCategoryWarningRequired = isCategoryWarningRequired;
    vm.getCardConfig = getCardConfig;

    // Setup Assistant pages with index
    vm.states = {};

    vm.setStates = function (isProactiveFlagEnabled) {
      vm.states = CTService.getStatesBasedOnType(vm.selectedMediaType, isProactiveFlagEnabled);
      vm.currentState = vm.states[0];
    };

    vm.overviewCards = {};
    vm.setOverviewCards = function (isProactiveFlagEnabled) {
      vm.overviewCards = CTService.getOverviewPageCards(vm.selectedMediaType, isProactiveFlagEnabled);
    };

    vm.animationTimeout = 10;
    vm.escapeKey = 27;

    // Template branding page related constants
    vm.orgName = Authinfo.getOrgName();
    vm.profiles = {
      org: $translate.instant('careChatTpl.org'),
      agent: $translate.instant('careChatTpl.agent'),
    };
    vm.selectedTemplateProfile = vm.profiles.org;
    vm.agentNames = {
      displayName: $translate.instant('careChatTpl.agentDisplayName'),
      alias: $translate.instant('careChatTpl.agentAlias'),
    };
    vm.selectedAgentProfile = vm.agentNames.displayName;
    vm.agentNamePreview = $translate.instant('careChatTpl.agentAliasPreview');
    vm.logoFile = '';
    vm.logoUploaded = false;
    vm.logoUrl = undefined;
    vm.categoryField = 'category';
    vm.FieldValue = 'value';
    vm.idField = 'id';
    vm.optionalValue = 'optional';
    vm.requiredValue = 'required';
    vm.categoryOptions = 'categoryOptions';
    vm.categoryTokensId = 'categoryTokensElement';
    vm.categoryOptionTag = '';
    vm.typeIndexInField = 4;
    vm.saveCTErrorOccurred = false;
    vm.creatingChatTemplate = false;
    vm.days = CTService.getDays();
    vm.isOffHoursMessageValid = true;
    vm.isBusinessHoursDisabled = false;
    vm.timings = CTService.getDefaultTimes();
    vm.startTimeOptions = CTService.getTimeOptions();
    vm.endTimeOptions = CTService.getEndTimeOptions(vm.timings.startTime);
    vm.scheduleTimeZone = CTService.getDefaultTimeZone();
    vm.timezoneOptions = CTService.getTimezoneOptions();
    vm.ChatTemplateButtonText = $translate.instant('common.finish');
    vm.lengthConstants = CTService.getLengthValidationConstants();
    vm.isBusinessDaySelected = true;
    vm.promptTime = CTService.getPromptTime();
    vm.promptTimeOptions = CTService.getPromptTimeOptions();

    vm.InvalidCharacters = /[<>]/i; // add your invalid character to this regex

    /**
     * Type enumerations
     */

    vm.STATIC_FIELD_TYPES = {
      welcome: {
        text: 'welcome',
        htmlType: 'label',
      },
    };

    vm.typeOptions = [{
      id: 'email',
      text: $translate.instant('careChatTpl.typeEmail'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_Work_Email',
      },
    }, {
      id: 'name',
      text: $translate.instant('careChatTpl.typeName'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_First_Name',
      },
    }, {
      id: 'category',
      text: $translate.instant('careChatTpl.typeCategory'),
      dictionaryType: {
        fieldSet: 'cisco.base.ccc.pod',
        fieldName: 'category',
      },
    }, {
      id: 'phone',
      text: $translate.instant('careChatTpl.typePhone'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_Mobile_Phone',
      },
    }, {
      id: 'id',
      text: $translate.instant('careChatTpl.typeId'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_Customer_External_ID',
      },
    }, {
      id: 'custom',
      text: $translate.instant('careChatTpl.typeCustom'),
      dictionaryType: {
        fieldSet: 'cisco.base.ccc.pod',
        fieldName: 'cccCustom',
      },
    }, {
      id: 'reason',
      text: $translate.instant('careChatTpl.typeReason'),
      dictionaryType: {
        fieldSet: 'cisco.base.ccc.pod',
        fieldName: 'cccChatReason',
      },
    }];

    vm.categoryTypeOptions = [{
      text: $translate.instant('careChatTpl.categoryTextCustomer'),
      id: 'customerInfo',

    }, {
      text: $translate.instant('careChatTpl.categoryTextRequest'),
      id: 'requestInfo',
    }];

    vm.requiredOptions = [{
      text: $translate.instant('careChatTpl.requiredField'),
      id: 'required',
    }, {
      text: $translate.instant('careChatTpl.optionalField'),
      id: 'optional',
    }];

    vm.getCategoryTypeObject = function (typeId) {
      return _.find(vm.categoryTypeOptions, {
        id: typeId,
      });
    };

    vm.getTypeObject = function (typeId) {
      return _.find(vm.typeOptions, {
        id: typeId,
      });
    };

    //Template related constants  variables used after editing template
    if ($stateParams.isEditFeature) {
      var config = $stateParams.template.configuration;
      vm.selectedMediaType = config.mediaType;
      if (config.mediaType) {
        if (config.mediaType === vm.mediaTypes.chat) {
          vm.selectedTemplateProfile = config.mediaSpecificConfiguration.useOrgProfile ?
            vm.profiles.org : vm.profiles.agent;
          vm.selectedAgentProfile = config.mediaSpecificConfiguration.useAgentRealName ?
            vm.agentNames.displayName : vm.agentNames.alias;
          vm.orgName = config.mediaSpecificConfiguration.displayText;
          vm.logoUrl = config.mediaSpecificConfiguration.orgLogoUrl;
        }
        vm.timings.startTime.label = config.pages.offHours.schedule.timings.startTime;
        vm.timings.endTime.label = config.pages.offHours.schedule.timings.endTime;
        vm.scheduleTimeZone = CTService.getTimeZone(config.pages.offHours.schedule.timezone);
        var businessDays = config.pages.offHours.schedule.businessDays;
        vm.days = _.map(CTService.getDays(), function (day) {
          var selectedDay = day;
          selectedDay.isSelected = _.includes(businessDays, day.label);
          return selectedDay;
        });
      }
    }
    setDayPreview();

    /* Templates */
    var defaultChatTemplate = {
      name: '',
      configuration: {
        mediaType: vm.mediaTypes.chat,
        mediaSpecificConfiguration: {
          useOrgProfile: true,
          displayText: vm.orgName,
          orgLogoUrl: vm.logoUrl,
          useAgentRealName: false,
        },
        proactivePrompt: {
          enabled: true,
          fields: {
            promptTime: vm.promptTime.value,
            promptTitle: {
              displayText: vm.orgName,
            },
            promptMessage: {
              message: $translate.instant('careChatTpl.defaultPromptMessage'),
            },
          },
        },
        pages: {
          customerInformation: {
            enabled: true,
            fields: {
              'welcomeHeader': {
                attributes: [{
                  name: 'header',
                  value: $translate.instant('careChatTpl.defaultWelcomeText'),
                }, {
                  name: 'organization',
                  value: vm.orgName,
                }],
              },
              'field1': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultNameText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultNameHint'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('name'),
                  categoryOptions: '',
                }],
              },

              'field2': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultEmailText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultEmail'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('email'),
                  categoryOptions: '',
                }],
              },

              'field3': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultQuestionText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.field3HintText'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('category'),
                  categoryOptions: '',
                }],
              },

              'field4': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.additionalDetails'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.additionalDetailsAbtIssue'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('reason'),
                  categoryOptions: '',
                }],
              },
            },
          },
          agentUnavailable: {
            enabled: true,
            fields: {
              agentUnavailableMessage: {
                displayText: $translate.instant('careChatTpl.agentUnavailableMessage'),
              },
            },
          },
          offHours: {
            enabled: true,
            message: $translate.instant('careChatTpl.offHoursDefaultMessage'),
            schedule: {
              businessDays: _.map(_.filter(vm.days, 'isSelected'), 'label'),
              open24Hours: true,
              timings: {
                startTime: vm.timings.startTime.label,
                endTime: vm.timings.endTime.label,
              },
              timezone: vm.scheduleTimeZone.value,
            },
          },
          feedback: {
            enabled: true,
            fields: {
              feedbackQuery: {
                displayText: $translate.instant('careChatTpl.feedbackQuery'),
              },
              comment: {
                displayText: $translate.instant('careChatTpl.ratingComment'),
                dictionaryType: {
                  fieldSet: 'cisco.base.ccc.pod',
                  fieldName: 'cccRatingComments',
                },
              },
            },
          },
        },
        chatStatusMessages: {
          messages: {
            connectingMessage: {
              displayText: $translate.instant('careChatTpl.connectingMessage'),
            },
            waitingMessage: {
              displayText: $translate.instant('careChatTpl.waitingMessage'),
            },
            enterRoomMessage: {
              displayText: $translate.instant('careChatTpl.enterRoomMessage'),
            },
            leaveRoomMessage: {
              displayText: $translate.instant('careChatTpl.leaveRoomMessage'),
            },
            chattingMessage: {
              displayText: $translate.instant('careChatTpl.chattingMessage'),
            },
          },

        },
      },
    };

    var defaultCallBackTemplate = {
      name: '',
      configuration: {
        mediaType: vm.mediaTypes.callback,
        mediaSpecificConfiguration: {
          useOrgProfile: true,
          displayText: vm.orgName,
          orgLogoUrl: vm.logoUrl,
          useAgentRealName: false,
        },
        pages: {
          customerInformation: {
            enabled: true,
            fields: {
              'welcomeHeader': {
                attributes: [{
                  name: 'header',
                  value: $translate.instant('careChatTpl.defaultWelcomeText'),
                }, {
                  name: 'organization',
                  value: vm.orgName,
                }],
              },
              'field1': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultNameText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultNameHint'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('name'),
                  categoryOptions: '',
                }],
              },

              'field2': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultPhoneText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultPhoneHintText'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('phone'),
                  categoryOptions: '',
                }],
              },
              'field3': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultQuestionText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.field3HintText'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('category'),
                  categoryOptions: '',
                }],
              },
              'field4': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.additionalDetails'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.additionalDetailsAbtIssue'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('reason'),
                  categoryOptions: '',
                }],
              },
            },
          },
          agentUnavailable: {
            enabled: false,
            fields: {
              agentUnavailableMessage: {
                displayText: $translate.instant('careChatTpl.agentUnavailableMessage'),
              },
            },
          },
          offHours: {
            enabled: true,
            message: $translate.instant('careChatTpl.offHoursDefaultMessage'),
            schedule: {
              businessDays: _.map(_.filter(vm.days, 'isSelected'), 'label'),
              open24Hours: true,
              timings: {
                startTime: vm.timings.startTime.label,
                endTime: vm.timings.endTime.label,
              },
              timezone: vm.scheduleTimeZone.value,
            },
          },
          feedbackCallback: {
            enabled: true,
            fields: {
              feedbackQuery: {
                displayText: $translate.instant('careChatTpl.feedbackQueryCall'),
              },
              comment: {
                displayText: $translate.instant('careChatTpl.ratingComment'),
                dictionaryType: {
                  fieldSet: 'cisco.base.ccc.pod',
                  fieldName: 'cccRatingComments',
                },
              },
            },
          },
          // NOTE: Do NOT disable callbackConfirmation page as it is required in Bubble app.
          callbackConfirmation: {
            enabled: true,
            fields: {
              callbackConfirmationMessage: {
                displayText: "Your callback request has been received.",
              },
            },
          },
        },
      },
    };

    var defaultChatPlusCallBackTemplate = {
      name: '',
      configuration: {
        mediaType: vm.mediaTypes.chatPlusCallback,
        mediaSpecificConfiguration: {
          useOrgProfile: true,
          displayText: vm.orgName,
          orgLogoUrl: vm.logoUrl,
          useAgentRealName: false,
        },
        proactivePrompt: {
          enabled: true,
          fields: {
            promptTime: vm.promptTime.value,
            promptTitle: {
              displayText: vm.orgName,
            },
            promptMessage: {
              message: $translate.instant('careChatTpl.defaultPromptMessage'),
            },
          },
        },
        pages: {
          customerInformationChat: {
            enabled: true,
            fields: {
              'welcomeHeader': {
                attributes: [{
                  name: 'header',
                  value: $translate.instant('careChatTpl.defaultWelcomeText'),
                }, {
                  name: 'organization',
                  value: vm.orgName,
                }],
              },
              'field1': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultNameText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultNameHint'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('name'),
                  categoryOptions: '',
                }],
              },

              'field2': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultEmailText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultEmail'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('email'),
                  categoryOptions: '',
                }],
              },

              'field3': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultQuestionText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.field3HintText'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('category'),
                  categoryOptions: '',
                }],
              },
              'field4': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.additionalDetails'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.additionalDetailsAbtIssue'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('reason'),
                  categoryOptions: '',
                }],
              },
            },
          },
          customerInformationCallback: {
            enabled: true,
            fields: {
              'welcomeHeader': {
                attributes: [{
                  name: 'header',
                  value: $translate.instant('careChatTpl.defaultWelcomeText'),
                }, {
                  name: 'organization',
                  value: vm.orgName,
                }],
              },
              'field1': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultNameText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultNameHint'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('name'),
                  categoryOptions: '',
                }],
              },
              'field2': {
                attributes: [{
                  name: 'required',
                  value: 'required',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultPhoneText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultPhoneHintText'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('phone'),
                  categoryOptions: '',
                }],
              },
              'field3': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultQuestionText'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.field3HintText'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('category'),
                  categoryOptions: '',
                }],
              },
              'field4': {
                attributes: [{
                  name: 'required',
                  value: 'optional',
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.additionalDetails'),
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.additionalDetailsAbtIssue'),
                }, {
                  name: 'type',
                  value: vm.getTypeObject('reason'),
                  categoryOptions: '',
                }],
              },
            },
          },
          agentUnavailable: {
            enabled: true,
            fields: {
              agentUnavailableMessage: {
                displayText: $translate.instant('careChatTpl.agentUnavailableMessage'),
              },
            },
          },
          offHours: {
            enabled: true,
            message: $translate.instant('careChatTpl.offHoursDefaultMessage'),
            schedule: {
              businessDays: _.map(_.filter(vm.days, 'isSelected'), 'label'),
              open24Hours: true,
              timings: {
                startTime: vm.timings.startTime.label,
                endTime: vm.timings.endTime.label,
              },
              timezone: vm.scheduleTimeZone.value,
            },
          },
          feedbackCallback: {
            enabled: true,
            fields: {
              feedbackQuery: {
                displayText: $translate.instant('careChatTpl.feedbackQueryCall'),
              },
              comment: {
                displayText: $translate.instant('careChatTpl.ratingComment'),
                dictionaryType: {
                  fieldSet: 'cisco.base.ccc.pod',
                  fieldName: 'cccRatingComments',
                },
              },
            },
          },
          callbackConfirmation: {
            enabled: true,
            fields: {
              callbackConfirmationMessage: {
                displayText: "Your callback request has been received.",
              },
            },
          },
          feedback: {
            enabled: true,
            fields: {
              feedbackQuery: {
                displayText: $translate.instant('careChatTpl.feedbackQuery'),
              },
              comment: {
                displayText: $translate.instant('careChatTpl.ratingComment'),
                dictionaryType: {
                  fieldSet: 'cisco.base.ccc.pod',
                  fieldName: 'cccRatingComments',
                },
              },
            },
          },
        },
        chatStatusMessages: {
          messages: {
            bubbleTitleMessage: {
              displayText: $translate.instant('careChatTpl.bubbleTitleMessage'),
            },
            connectingMessage: {
              displayText: $translate.instant('careChatTpl.connectingMessage'),
            },
            waitingMessage: {
              displayText: $translate.instant('careChatTpl.waitingMessage'),
            },
            enterRoomMessage: {
              displayText: $translate.instant('careChatTpl.enterRoomMessage'),
            },
            leaveRoomMessage: {
              displayText: $translate.instant('careChatTpl.leaveRoomMessage'),
            },
            chattingMessage: {
              displayText: $translate.instant('careChatTpl.chattingMessage'),
            },
          },
        },
      },
    };

    vm.template = {};

    vm.getDefaultTemplate = function () {
      switch (vm.selectedMediaType) {
        case vm.mediaTypes.chat: vm.template = defaultChatTemplate; break;
        case vm.mediaTypes.callback: vm.template = defaultCallBackTemplate; break;
        case vm.mediaTypes.chatPlusCallback: vm.template = defaultChatPlusCallBackTemplate; break;
      }
    };

    vm.getDefaultTemplate();

    vm.singleLineValidationMessage25 = CTService.getValidationMessages(0, vm.lengthConstants.singleLineMaxCharLimit25);
    vm.singleLineValidationMessage50 = CTService.getValidationMessages(0, vm.lengthConstants.singleLineMaxCharLimit50);
    vm.multiLineValidationMessage = CTService.getValidationMessages(0, vm.lengthConstants.multiLineMaxCharLimit);
    vm.multiLineValidationMessage100 = CTService.getValidationMessages(0, vm.lengthConstants.multiLineMaxCharLimit100);


    vm.overview = {
      customerInformation: 'circle-user',
      agentUnavailable: 'circle-comp-negative',
      offHours: 'circle-clock-hands',
      feedback: 'circle-star',
    };

    //Use the existing template fields when editing the template
    if ($stateParams.isEditFeature) {
      vm.template = $stateParams.template;
      // This will become dead once all the existing templates are saved with field4.
      populateCustomerInformationField4();
      populateFeedbackInformation();
      populateProactivePromptInformation();
    }

    function populateCustomerInformationField4() {
      var field4Default = {
        attributes: [{
          name: 'required',
          value: 'optional',
        }, {
          name: 'category',
          value: vm.getCategoryTypeObject('requestInfo'),
        }, {
          name: 'label',
          value: $translate.instant('careChatTpl.additionalDetails'),
        }, {
          name: 'hintText',
          value: $translate.instant('careChatTpl.additionalDetailsAbtIssue'),
        }, {
          name: 'type',
          value: vm.getTypeObject('reason'),
          categoryOptions: '',
        }],
      };
      if (vm.selectedMediaType === vm.mediaTypes.chat &&
        vm.template.configuration.pages.customerInformation.fields.field4 === undefined) {
        vm.template.configuration.pages.customerInformation.fields.field4 = field4Default;
      } else if (vm.selectedMediaType === vm.mediaTypes.chatPlusCallback) {
        if (vm.template.configuration.pages.customerInformationChat.fields.field4 === undefined) {
          vm.template.configuration.pages.customerInformationChat.fields.field4 = _.cloneDeep(field4Default);
        }
        if (vm.template.configuration.pages.customerInformationCallback.fields.field4 === undefined) {
          vm.template.configuration.pages.customerInformationCallback.fields.field4 = _.cloneDeep(field4Default);
        }
      }
    }
    function populateFeedbackInformation() {
      var defaultFeedback =
        {
          enabled: false,
          fields: {
            feedbackQuery: {
              displayText: $translate.instant('careChatTpl.feedbackQueryCall'),
            },
            comment: {
              displayText: $translate.instant('careChatTpl.ratingComment'),
              dictionaryType: {
                fieldSet: 'cisco.base.ccc.pod',
                fieldName: 'cccRatingComments',
              },
            },
          },
        };
      if ((vm.selectedMediaType === vm.mediaTypes.chatPlusCallback || vm.selectedMediaType === vm.mediaTypes.callback) && vm.template.configuration.pages.feedbackCallback === undefined) {
        vm.template.configuration.pages.feedbackCallback = _.cloneDeep(defaultFeedback);

      }
    }

    function populateProactivePromptInformation() {
      var defaultProactivePrompt = {
        enabled: false,
        fields: {
          promptTime: vm.promptTime.value,
          promptTitle: {
            displayText: vm.orgName,
          },
          promptMessage: {
            message: $translate.instant('careChatTpl.defaultPromptMessage'),
          },
        },
      };

      if (vm.selectedMediaType === vm.mediaTypes.chat || vm.selectedMediaType === vm.mediaTypes.chatPlusCallback) {
        if (vm.template.configuration.proactivePrompt === undefined) {
          vm.template.configuration.proactivePrompt = defaultProactivePrompt;
        }
        vm.promptTime = CTService.getPromptTime(vm.template.configuration.proactivePrompt.fields.promptTime);
      }
    }

    function cancelModal() {
      var modelText = $stateParams.isEditFeature ? {
        bodyMessage: $translate.instant('careChatTpl.ctEditBody'),
        trailingMessage: $translate.instant('careChatTpl.ctEditMessage'),
        process: $translate.instant('careChatTpl.ctEditing'),
      } : {
        bodyMessage: $translate.instant('careChatTpl.ctCreationBody'),
        trailingMessage: $translate.instant('careChatTpl.ctCreationMessage'),
        process: $translate.instant('careChatTpl.ctCreation'),
      };

      vm.cancelModalText = {
        cancelHeader: $translate.instant('careChatTpl.cancelHeader'),
        cancelDialog: $translate.instant('careChatTpl.cancelDialog', {
          bodyMessage: modelText.bodyMessage,
          trailingMessage: modelText.trailingMessage,
        }),
        continueButton: $translate.instant('careChatTpl.continueButton', {
          confirmProcess: modelText.process,
        }),
        confirmButton: $translate.instant('careChatTpl.confirmButton', {
          cancelProcess: modelText.process,
        }),
      };
      $modal.open({
        templateUrl: 'modules/sunlight/features/template/ctCancelModal.tpl.html',
        type: 'dialog',
        scope: $scope,
      });
    }

    function evalKeyPress(keyCode) {
      switch (keyCode) {
        case vm.escapeKey:
          cancelModal();
          break;
        default:
          break;
      }
    }

    function getPageIndex() {
      return vm.states.indexOf(vm.currentState);
    }

    vm.validateNameLength = function () {
      return vm.template.name.length == vm.lengthConstants.empty || isValidField(vm.template.name, vm.lengthConstants.multiLineMaxCharLimit);
    };

    vm.isNamePageValid = function () {
      return (vm.template.name !== '' && vm.validateNameLength() && vm.isInputValid(vm.template.name));
    };

    function isProfilePageValid() {
      if ((vm.selectedTemplateProfile === vm.profiles.org && vm.orgName !== '') || (vm.selectedTemplateProfile === vm.profiles.agent)) {
        setTemplateProfile();
        return true;
      }
      return false;
    }

    function getCardConfig(name) {
      return name === 'proactivePrompt' ? vm.template.configuration[name] : vm.template.configuration.pages[name];
    }

    function isValidField(fieldDisplayText, maxCharLimit) {
      return (fieldDisplayText.length <= maxCharLimit);
    }

    function statusPageNotifier() {
      var notifyMessage = $translate.instant('careChatTpl.statusMessage_failureText', {
        lengthLimit: vm.lengthConstants.singleLineMaxCharLimit25 });
      if (!isStatusMessagesPageValid() && $stateParams.isEditFeature) {
        Notification.error(notifyMessage);
      }
    }

    function isAgentUnavailablePageValid() {
      return isValidField(vm.template.configuration.pages.agentUnavailable.fields.agentUnavailableMessage.displayText, vm.lengthConstants.multiLineMaxCharLimit) &&
        vm.isInputValid(vm.template.configuration.pages.agentUnavailable.fields.agentUnavailableMessage.displayText);
    }

    function isOffHoursPageValid() {
      setOffHoursWarning();
      if (isValidField(vm.template.configuration.pages.offHours.message, vm.lengthConstants.multiLineMaxCharLimit) && vm.isBusinessDaySelected &&
        vm.isInputValid(vm.template.configuration.pages.offHours.message)) {
        setOffHoursData();
        return true;
      }
      return false;
    }

    function isFeedbackPageValid() {
      return ((isValidField(getFeedbackModel().fields.feedbackQuery.displayText, vm.lengthConstants.multiLineMaxCharLimit)
      && isValidField(getFeedbackModel().fields.comment.displayText, vm.lengthConstants.singleLineMaxCharLimit50)
      && vm.isInputValid(getFeedbackModel().fields.feedbackQuery.displayText)
      && vm.isInputValid(getFeedbackModel().fields.comment.displayText)));

    }

    function isProactivePromptPageValid() {
      if (isValidField(vm.template.configuration.proactivePrompt.fields.promptTitle.displayText, vm.lengthConstants.singleLineMaxCharLimit25) &&
          isValidField(vm.template.configuration.proactivePrompt.fields.promptMessage.message, vm.lengthConstants.multiLineMaxCharLimit100) &&
          vm.isInputValid(vm.template.configuration.proactivePrompt.fields.promptTitle.displayText) &&
          vm.isInputValid(vm.template.configuration.proactivePrompt.fields.promptMessage.message)) {
        vm.template.configuration.proactivePrompt.fields.promptTime = vm.promptTime.value;
        return true;
      }
      return false;
    }

    function isStatusMessagesPageValid() {
      var chatStatusMessagesObj = vm.template.configuration.chatStatusMessages.messages;
      return isValidField(chatStatusMessagesObj.waitingMessage.displayText, vm.lengthConstants.singleLineMaxCharLimit25)
      && isValidField(chatStatusMessagesObj.leaveRoomMessage.displayText, vm.lengthConstants.singleLineMaxCharLimit25)
      && isValidField(chatStatusMessagesObj.chattingMessage.displayText, vm.lengthConstants.singleLineMaxCharLimit25)
      && vm.isInputValid(chatStatusMessagesObj.waitingMessage.displayText)
      && vm.isInputValid(chatStatusMessagesObj.leaveRoomMessage.displayText)
      && vm.isInputValid(chatStatusMessagesObj.chattingMessage.displayText);
    }

    vm.isTypeDuplicate = false;

    var nonHeaderFieldNames = _.filter(_.keys(getCustomerInformationFormFields()),
        function (name) { return (name !== "welcomeHeader"); });

    function getConfiguredTypes() {
      var typesConfigured = _.map(nonHeaderFieldNames, function (fieldName) {
        return (vm.getAttributeParam("value", "type", fieldName)).id;
      });
      return typesConfigured;
    }

    function isSelectedTypeDuplicate(selectedType) {
      vm.isTypeDuplicate = false;

      var typesConfigured = getConfiguredTypes();
      if (_.filter(typesConfigured, function (type) { return type === selectedType.id; }).length > 1) {
        vm.isTypeDuplicate = true;
        return vm.isTypeDuplicate;
      } else {
        return false;
      }
    }

    function areAllTypesUnique() {
      var configuredTypes = getConfiguredTypes();
      var uniqueConfiguredTypes = _.uniq(configuredTypes);

      return (configuredTypes.length === uniqueConfiguredTypes.length);
    }

    function areAllFixedFieldsValid() {
      return isValidField(vm.getAttributeParam('value', 'header', 'welcomeHeader'), vm.lengthConstants.singleLineMaxCharLimit50)
          && isValidField(vm.getAttributeParam('value', 'organization', 'welcomeHeader'), vm.lengthConstants.singleLineMaxCharLimit50)
          && vm.isFixedFieldInputValid();
    }

    vm.isFixedFieldInputValid = function () {
      return vm.isInputValid(vm.getAttributeParam('value', 'header', 'welcomeHeader'))
        && vm.isInputValid(vm.getAttributeParam('value', 'organization', 'welcomeHeader'));
    };

    function areAllDynamicFieldsValid() {
      return _.reduce(_.map(nonHeaderFieldNames, function (fieldName) {
        return isValidField(vm.getAttributeParam('value', 'label', fieldName), vm.lengthConstants.singleLineMaxCharLimit50)
                && isValidField(vm.getAttributeParam('value', 'hintText', fieldName), vm.lengthConstants.singleLineMaxCharLimit50);
      }), function (x, y) { return x && y; }, true);
    }

    vm.isDynamicFieldInputValid = function () {
      return _.reduce(_.map(nonHeaderFieldNames, function (fieldName) {
        return vm.isInputValid(vm.getAttributeParam('value', 'label', fieldName))
          && vm.isInputValid(vm.getAttributeParam('value', 'hintText', fieldName));
      }), function (x, y) { return x && y; }, true);
    };

    vm.validateType = function (selectedType) {
      return !(selectedType && isSelectedTypeDuplicate(selectedType));
    };

    function getCustomerInformationText() {
      if (vm.selectedMediaType !== vm.mediaTypes.chatPlusCallback) {
        return 'customerInformation';
      }
      var type = vm.cardMode || vm.selectedMediaType;
      switch (type) {
        case 'callback': return 'customerInformationCallback';
        default: return 'customerInformationChat';
      }
    }

    function getFieldWithType(type) {
      var models = vm.template.configuration.pages;
      var model = _.get(models, getCustomerInformationText());
      var fields = model.fields;
      if (fields != null) {
        // Iterating from field1-4 to figure out the field with type ( eg category  type)
        for (var fieldName in fields) {
          if (fieldName !== undefined && (fieldName.indexOf('field') === 0)) {
            var field = _.get(fields, fieldName);
            if (field !== undefined && field.attributes !== undefined && field.attributes instanceof Array) {
              if (field.attributes[vm.typeIndexInField] !== undefined && (field.attributes[vm.typeIndexInField].value)[vm.idField] === type) {
                return fieldName;
              }
            }
          }
        }
      }

    }

    function getCategoryOptions() {
      var fieldName = getFieldWithType(vm.categoryField);
      //Categories fetched from field with 'type' as category
      return vm.getAttributeValue(vm.categoryOptions, fieldName, getCustomerInformationText(), 4);
    }

    function isCategoryWarningRequired() {
      var fieldName = getFieldWithType(vm.categoryField);
      //Checking whether category is required or optional
      if (fieldName !== undefined) {
        var requiredField = vm.getAttributeValue(vm.FieldValue, fieldName, getCustomerInformationText(), 0);

        if (requiredField === vm.requiredValue && getCategoryOptions() === '') {
          return true;
        }
      }
      return false;
    }

    function isCategoryValid() {
      var fieldName = getFieldWithType(vm.categoryField);
      //No category in list of fields when category is not added in the template
      if (fieldName === undefined) {
        return true;
      }
      var customerInfoPage = getCustomerInformationText();
      if ((vm.getAttributeValue(vm.FieldValue, fieldName, customerInfoPage, 4))[vm.idField] !== vm.categoryField) {
        return true;
      }

      //Checking  whether category is required or optional
      var requiredField = vm.getAttributeValue(vm.FieldValue, fieldName, customerInfoPage, 0);

      if (requiredField === vm.optionalValue) {
        var categoryTxtContent = vm.categoryOptionTag;
        if (categoryTxtContent === undefined ||
          (categoryTxtContent.length <= vm.lengthConstants.singleLineMaxCharLimit50)) {
          return true;
        } else {
          return false;
        }
      }
      if (getCategoryOptions()) {
        return true;
      }
      return false;
    }

    function isCustomerInformationPageValid() {
      return areAllTypesUnique() && areAllFixedFieldsValid() && areAllDynamicFieldsValid() && isCategoryValid()
        && vm.isDynamicFieldInputValid() && vm.isInputValid(vm.categoryOptionTag);
    }

    vm.isInputValid = function (input) {
      return !(vm.InvalidCharacters.test(input));
    };

    function nextButton() {
      switch (vm.currentState) {
        case 'summary':
          return 'hidden';
        case 'offHours':
          return isOffHoursPageValid();
        case 'name':
          return vm.isNamePageValid();
        case 'proactivePrompt':
          return isProactivePromptPageValid();
        case 'customerInformation':
        case 'customerInformationChat':
        case 'customerInformationCallback':
          return isCustomerInformationPageValid();
        case 'profile':
          return isProfilePageValid();
        case 'agentUnavailable':
          return isAgentUnavailablePageValid();

        case 'feedback':
        case 'feedbackCallback':
          return isFeedbackPageValid();
        case 'chatStatusMessages':
          return isStatusMessagesPageValid();
        case 'overview':
          return true;
        default:
          return 'hidden';
      }
    }

    function previousButton() {
      if (vm.currentState === vm.states[0]) {
        return 'hidden';
      }
      return true;
    }

    function getAdjacentEnabledState(current, jump) {
      var next = current + jump;
      var last = vm.states.length - 1;
      if (next > last) {
        return vm.states[last];
      }
      var nextPage = vm.template.configuration.pages[vm.states[next]];
      if (vm.states[next] === 'proactivePrompt') {
        nextPage = vm.template.configuration[vm.states[next]];
      }

      if (nextPage && !nextPage.enabled) {
        return getAdjacentEnabledState(next, jump);
      } else {
        return vm.states[next];
      }
    }

    function navigationHandler() {
      switch (vm.currentState) {
        case 'customerInformation':
        case 'customerInformationCallback':
        case 'customerInformationChat': vm.activeItem = undefined; break;
        case 'chatStatusMessages': statusPageNotifier(); break;
      }
    }

    function nextPage() {
      vm.animation = 'slide-left';
      $timeout(function () {
        vm.currentState = getAdjacentEnabledState(getPageIndex(), 1);
        navigationHandler();
      }, vm.animationTimeout);
    }

    function previousPage() {
      vm.animation = 'slide-right';
      $timeout(function () {
        vm.currentState = getAdjacentEnabledState(getPageIndex(), -1);
        navigationHandler();
      }, vm.animationTimeout);
    }

    vm.activeItem = undefined;
    vm.activeItemName = undefined;

    /**
     * Utility Methods Section
     */

    vm.getFieldByName = function (fieldName) {
      return getCustomerInformationFormFields()[fieldName];
    };

    vm.getAttributeByName = function (attributeName, fieldName) {
      var fields = getCustomerInformationFormFields();
      var field = _.get(fields, fieldName);
      if (field) {
        return _.find(field.attributes, {
          name: attributeName,
        });
      }
      return undefined;
    };

    vm.getAttributeParam = function (paramName, attributeName, fieldName) {
      var attribute = vm.getAttributeByName(attributeName, fieldName);
      if (typeof attribute !== 'undefined' && attribute.hasOwnProperty(paramName.toString())) {
        return attribute[paramName.toString()];
      }
    };

    vm.getAttributeValue = function (attributeName, fieldName, modelName, i) {
      var models = vm.template.configuration.pages;
      var model = _.get(models, modelName);

      return vm.getAttributeByModelName(attributeName, fieldName, model, i);
    };

    vm.getAttributeByModelName = function (attributeName, fieldName, model, i) {
      var fields = model.fields;
      var field = _.get(fields, fieldName);

      if (field.attributes instanceof Array) {
        field = field.attributes[i];
      }

      if (field) {
        return _.get(field, attributeName);
      }
      return undefined;
    };

    vm.setActiveItem = function (val) {
      vm.activeItem = vm.getFieldByName(val.toString());
    };

    vm.isSecondFieldForCallBack = function () {
      return (vm.selectedMediaType === vm.mediaTypes.callback ||
        vm.cardMode === vm.mediaTypes.callback) && vm.activeItemName === 'field2';
    };

    vm.isDynamicFieldType = function (val) {
      return typeof val !== 'undefined' && getCustomerInformationFormFields().hasOwnProperty(val.toString());
    };

    vm.isStaticFieldType = function (val) {
      return typeof val !== 'undefined' && vm.STATIC_FIELD_TYPES.hasOwnProperty(val.toString());
    };

    vm.isDefined = function (object, field) {
      var value = object[field];
      return typeof value !== 'undefined' && value.trim() !== '';
    };

    vm.onEnterKey = function (keyEvent) {
      if (keyEvent.which === 13) {
        vm.addCategoryOption();
      }
    };

    function isCategoryOptionTagValid() {
      var categoyValue = vm.categoryOptionTag;
      if (vm.categoryOptionTag && (vm.categoryOptionTag.length > vm.lengthConstants.singleLineMaxCharLimit50 ||
        !vm.isInputValid(categoyValue))) {
        return false;
      } else {
        return true;
      }
    }
    vm.addCategoryOption = function () {
      if (vm.categoryOptionTag) {
        if (!isCategoryOptionTagValid()) return;
        angular.element('#categoryTokensElement').tokenfield('createToken', vm.categoryOptionTag);
        vm.categoryOptionTag = '';
      }
    };

    vm.isUserProfileSelected = function () {
      return vm.template.configuration.mediaSpecificConfiguration.useOrgProfile;
    };

    function setTemplateProfile() {
      vm.template.configuration.mediaSpecificConfiguration = {
        useOrgProfile: vm.selectedTemplateProfile === vm.profiles.org,
        useAgentRealName: vm.selectedAgentProfile === vm.agentNames.displayName,
        orgLogoUrl: vm.logoUrl,
        displayText: vm.getAttributeParam('value', 'organization', 'welcomeHeader'),
      };
    }

    function setOffHoursData() {
      vm.template.configuration.pages.offHours.enabled = true;
      vm.template.configuration.pages.offHours.schedule.businessDays = _.map(_.filter(vm.days, 'isSelected'), 'label');
      vm.template.configuration.pages.offHours.schedule.timings.startTime = vm.timings.startTime.label;
      vm.template.configuration.pages.offHours.schedule.timings.endTime = vm.timings.endTime.label;
      vm.template.configuration.pages.offHours.schedule.timezone = vm.scheduleTimeZone.value;
    }

    function setAgentProfile() {
      if (vm.selectedAgentProfile === vm.agentNames.alias) {
        vm.agentNamePreview = $translate.instant('careChatTpl.agentAliasPreview');
      } else if (vm.selectedAgentProfile === vm.agentNames.displayName) {
        vm.agentNamePreview = $translate.instant('careChatTpl.agentNamePreview');
      }
    }

    function submitChatTemplate() {
      DomainManagementService.syncDomainsWithCare();
      vm.creatingChatTemplate = true;
      if ($stateParams.isEditFeature) editChatTemplate();
      else createChatTemplate();
    }

    function createChatTemplate() {
      SunlightConfigService.createChatTemplate(vm.template)
        .then(function (response) {
          handleChatTemplateCreation(response);
          LogMetricsService.logMetrics('Created template for Care', LogMetricsService.getEventType('careTemplateFinish'), LogMetricsService.getEventAction('buttonClick'), 200, moment(), 1, null);
        })
        .catch(function (response) {
          handleChatTemplateError();
          Notification.errorWithTrackingId(response, vm.getLocalisedText('careChatTpl.createTemplateFailureText'));
        });
    }

    function editChatTemplate() {
      SunlightConfigService.editChatTemplate(vm.template, vm.template.templateId)
        .then(function (response) {
          handleChatTemplateEdit(response, vm.template.templateId);
          LogMetricsService.logMetrics('Edited template for Care', LogMetricsService.getEventType('careTemplateFinish'), LogMetricsService.getEventAction('buttonClick'), 200, moment(), 1, null);
        })
        .catch(function (response) {
          handleChatTemplateError();
          Notification.errorWithTrackingId(response, vm.getLocalisedText('careChatTpl.editTemplateFailureText'));
        });
    }

    function handleChatTemplateCreation(response) {
      vm.creatingChatTemplate = false;
      var responseTemplateId = response.headers('Location').split('/').pop();
      $state.go('care.Features');
      var successMsg = 'careChatTpl.createSuccessText';
      Notification.success(successMsg, {
        featureName: vm.template.name,
      });
      CTService.openEmbedCodeModal(responseTemplateId, vm.template.name);
    }

    function handleChatTemplateEdit(response, templateId) {
      vm.creatingChatTemplate = false;
      $state.go('care.Features');
      var successMsg = 'careChatTpl.editSuccessText';
      Notification.success(successMsg, {
        featureName: vm.template.name,
      });
      CTService.openEmbedCodeModal(templateId, vm.template.name);
    }

    function setDay(index) {
      vm.days[index].isSelected = !vm.days[index].isSelected;
      vm.isBusinessDaySelected = _.find(vm.days, 'isSelected');
      setDayPreview();
    }

    function setEndTimeOptions() {
      vm.endTimeOptions = CTService.getEndTimeOptions(vm.timings.startTime);
      if (vm.timings.endTime.value < vm.endTimeOptions[0].value) {
        vm.timings.endTime = vm.endTimeOptions[0];
      }
    }

    function setDayPreview() {
      var firstSelectedDayIndex = _.findIndex(vm.days, 'isSelected');
      var lastSelectedDayIndex = _.findLastIndex(vm.days, 'isSelected');

      vm.isBusinessHoursDisabled = firstSelectedDayIndex == -1;

      if (!vm.isBusinessHoursDisabled) {
        var isDiscontinuous = _.some(
          _.slice(vm.days, firstSelectedDayIndex, lastSelectedDayIndex + 1), {
            isSelected: false,
          });
        vm.daysPreview = CTService.getPreviewDays(vm.days, !isDiscontinuous, firstSelectedDayIndex, lastSelectedDayIndex);
      }
    }

    function setOffHoursWarning() {
      vm.isOffHoursMessageValid = vm.template.configuration.pages.offHours.message !== '';
    }

    function handleChatTemplateError() {
      vm.saveCTErrorOccurred = true;
      vm.creatingChatTemplate = false;
      vm.ChatTemplateButtonText = $translate.instant('common.retry');
    }

    function init() {
      FeatureToggleService.atlasCareProactiveChatTrialsGetStatus().then(function (result) {
        vm.setStates(result);
        vm.setOverviewCards(result);
      });

      CTService.getLogoUrl().then(function (url) {
        vm.logoUrl = url;
      });
      CTService.getLogo().then(function (data) {
        vm.logoFile = 'data:image/png;base64,' + $window.btoa(String.fromCharCode.apply(null, new Uint8Array(data.data)));
        vm.logoUploaded = true;
      });
    }

    function getCustomerInformationBtnClass() {
      var type = (vm.cardMode) ? vm.cardMode : vm.selectedMediaType;
      switch (type) {
        case 'chat': return 'start-chat';
        case 'callback': return 'actionBtn';
      }
    }

    function getCustomerInformationFormFields() {
      if (vm.selectedMediaType !== vm.mediaTypes.chatPlusCallback) {
        return vm.template.configuration.pages.customerInformation.fields;
      }
      var type = (vm.cardMode) ? vm.cardMode : vm.selectedMediaType;
      switch (type) {
        case 'callback': return vm.template.configuration.pages.customerInformationCallback.fields;
        default: return vm.template.configuration.pages.customerInformationChat.fields;
      }
    }

    function getLocalisedText(name) {
      var type = (vm.cardMode) ? vm.cardMode : vm.selectedMediaType;
      return $translate.instant(name + '_' + type);
    }


    function getFeedbackModel() {
      if (vm.currentState === 'feedback') {
        return vm.template.configuration.pages.feedback;
      } else {
        return vm.template.configuration.pages.feedbackCallback;
      }
    }

    function getLocalisedFeedbackText() {
      return getLocalisedText('careChatTpl.' + vm.currentState);
    }

    function getFeedbackDesc() {
      if (vm.currentState === "feedbackCallback") {
        return $translate.instant('careChatTpl.callFeedbackDesc');
      } else {
        return $translate.instant('careChatTpl.feedbackDesc');
      }
    }

    function getTitle() {
      if (vm.isEditFeature) {
        return $translate.instant('careChatTpl.editTitle_' + vm.selectedMediaType);
      } else {
        return $translate.instant('careChatTpl.createTitle_' + vm.selectedMediaType);
      }
    }

  }

  /**
   * Validate characters directive:
   */
  function validateCharactersDirective($parse) {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, elem, attrs, ngModelCtrl) {
        var InvalidCharacters = $parse(attrs.validateCharacters)(scope);
        ngModelCtrl.$validators.invalidInput = function (value) {
          if (value) {
            var input = value.trim().toLowerCase();
            return !(InvalidCharacters.test(input));
          }
          return true;
        };
      },
    };
  }
})();
