(function () {
  'use strict';

  /* global Uint8Array:false */

  angular
    .module('Sunlight')
    .controller('CareChatSetupAssistantCtrl', CareChatSetupAssistantCtrl);

  /* @ngInject */

  function CareChatSetupAssistantCtrl($modal, $scope, $state, $timeout, $translate, $window, Authinfo, CTService, Notification, SunlightConfigService, $stateParams, LogMetricsService) {
    var vm = this;
    init();

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

    // Setup Assistant pages with index
    vm.states = ['name',
      'overview',
      'customerInformation',
      'agentUnavailable',
      'offHours',
      'feedback',
      'profile',
      'chatStatusMessages',
      'summary'
    ];
    vm.currentState = vm.states[0];
    vm.animationTimeout = 10;
    vm.escapeKey = 27;

    // Template branding page related constants
    vm.orgName = Authinfo.getOrgName();
    vm.profiles = {
      org: $translate.instant('careChatTpl.org'),
      agent: $translate.instant('careChatTpl.agent')
    };
    vm.selectedTemplateProfile = vm.profiles.org;
    vm.agentNames = {
      displayName: $translate.instant('careChatTpl.agentDisplayName'),
      alias: $translate.instant('careChatTpl.agentAlias')
    };
    vm.selectedAgentProfile = vm.agentNames.displayName;
    vm.agentNamePreview = $translate.instant('careChatTpl.agentAliasPreview');
    vm.logoFile = '';
    vm.logoUploaded = false;
    vm.logoUrl = undefined;
    vm.categoryTokensId = 'categoryTokensElement';
    vm.categoryOptionTag = '';
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

    /**
     * Type enumerations
     */

    vm.STATIC_FIELD_TYPES = {
      welcome: {
        text: 'welcome',
        htmlType: 'label'
      }
    };

    vm.typeOptions = [{
      id: 'email',
      text: $translate.instant('careChatTpl.typeEmail'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_Work_Email'
      }
    }, {
      id: 'name',
      text: $translate.instant('careChatTpl.typeName'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_First_Name'
      }
    }, {
      id: 'category',
      text: $translate.instant('careChatTpl.typeCategory'),
      dictionaryType: {
        fieldSet: 'cisco.base.ccc.pod',
        fieldName: 'category'
      }
    }, {
      id: 'phone',
      text: $translate.instant('careChatTpl.typePhone'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_Mobile_Phone'
      }
    }, {
      id: 'id',
      text: $translate.instant('careChatTpl.typeId'),
      dictionaryType: {
        fieldSet: 'cisco.base.customer',
        fieldName: 'Context_Customer_External_ID'
      }
    }, {
      id: 'custom',
      text: $translate.instant('careChatTpl.typeCustom'),
      dictionaryType: {
        fieldSet: 'cisco.base.ccc.pod',
        fieldName: 'cccCustom'
      }
    }];

    vm.categoryTypeOptions = [{
      text: $translate.instant('careChatTpl.categoryTextCustomer'),
      id: 'customerInfo'

    }, {
      text: $translate.instant('careChatTpl.categoryTextRequest'),
      id: 'requestInfo'
    }];

    vm.requiredOptions = [{
      text: $translate.instant('careChatTpl.requiredField'),
      id: 'required'
    }, {
      text: $translate.instant('careChatTpl.optionalField'),
      id: 'optional'
    }];

    vm.getCategoryTypeObject = function (typeId) {
      return _.find(vm.categoryTypeOptions, {
        id: typeId
      });
    };

    vm.getTypeObject = function (typeId) {
      return _.find(vm.typeOptions, {
        id: typeId
      });
    };
    vm.overlayTitle = $translate.instant('careChatTpl.createTitle');

    //Template related constants  variables used after editing template
    if ($stateParams.isEditFeature) {
      var config = $stateParams.template.configuration;
      vm.selectedTemplateProfile = config.mediaSpecificConfiguration.useOrgProfile ?
        vm.profiles.org : vm.profiles.agent;
      vm.selectedAgentProfile = config.mediaSpecificConfiguration.useAgentRealName ?
        vm.agentNames.displayName : vm.agentNames.alias;
      vm.orgName = config.mediaSpecificConfiguration.displayText;
      vm.logoUrl = config.mediaSpecificConfiguration.orgLogoUrl;
      vm.timings.startTime.label = config.pages.offHours.schedule.timings.startTime;
      vm.timings.endTime.label = config.pages.offHours.schedule.timings.endTime;
      vm.scheduleTimeZone = CTService.getTimeZone(config.pages.offHours.schedule.timezone);
      var businessDays = config.pages.offHours.schedule.businessDays;
      vm.days = _.map(CTService.getDays(), function (day) {
        var selectedDay = day;
        selectedDay.isSelected = _.includes(businessDays, day.label);
        return selectedDay;
      });
      vm.overlayTitle = $translate.instant('careChatTpl.editTitle');
    }
    setDayPreview();

    /* Template */
    vm.template = {
      name: '',
      configuration: {
        mediaType: 'chat',
        mediaSpecificConfiguration: {
          useOrgProfile: true,
          displayText: vm.orgName,
          orgLogoUrl: vm.logoUrl,
          useAgentRealName: false
        },
        pages: {
          customerInformation: {
            enabled: true,
            fields: {
              'welcomeHeader': {
                attributes: [{
                  name: 'header',
                  value: $translate.instant('careChatTpl.defaultWelcomeText')
                }, {
                  name: 'organization',
                  value: vm.orgName
                }]
              },
              'field1': {
                attributes: [{
                  name: 'required',
                  value: 'required'
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo')
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultNameText')
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultNameHint')
                }, {
                  name: 'type',
                  value: vm.getTypeObject('name'),
                  categoryOptions: ''
                }]
              },

              'field2': {
                attributes: [{
                  name: 'required',
                  value: 'required'
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo')
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultEmailText')
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultEmail')
                }, {
                  name: 'type',
                  value: vm.getTypeObject('email'),
                  categoryOptions: ''
                }]
              },

              'field3': {
                attributes: [{
                  name: 'required',
                  value: 'optional'
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo')
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultQuestionText')
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.field3HintText')
                }, {
                  name: 'type',
                  value: vm.getTypeObject('category'),
                  categoryOptions: ''
                }]
              }
            }
          },
          agentUnavailable: {
            enabled: true,
            fields: {
              agentUnavailableMessage: {
                displayText: $translate.instant('careChatTpl.agentUnavailableMessage')
              }
            }
          },
          offHours: {
            enabled: true,
            message: $translate.instant('careChatTpl.offHoursDefaultMessage'),
            schedule: {
              businessDays: _.map(_.filter(vm.days, 'isSelected'), 'label'),
              open24Hours: true,
              timings: {
                startTime: vm.timings.startTime.label,
                endTime: vm.timings.endTime.label
              },
              timezone: vm.scheduleTimeZone.value
            }
          },
          feedback: {
            enabled: true,
            fields: {
              feedbackQuery: {
                displayText: $translate.instant('careChatTpl.feedbackQuery')
              },
              comment: {
                displayText: $translate.instant('careChatTpl.ratingComment'),
                dictionaryType: {
                  fieldSet: 'cisco.base.ccc.pod',
                  fieldName: 'cccRatingComments'
                }
              }
            }
          }
        },
        chatStatusMessages: {
          messages: {
            bubbleTitleMessage: {
              displayText: $translate.instant('careChatTpl.bubbleTitleMessage')
            },
            connectingMessage: {
              displayText: $translate.instant('careChatTpl.connectingMessage')
            },
            waitingMessage: {
              displayText: $translate.instant('careChatTpl.waitingMessage')
            },
            enterRoomMessage: {
              displayText: $translate.instant('careChatTpl.enterRoomMessage')
            },
            leaveRoomMessage: {
              displayText: $translate.instant('careChatTpl.leaveRoomMessage')
            },
            chattingMessage: {
              displayText: $translate.instant('careChatTpl.chattingMessage')
            }
          }

        }
      }
    };

    vm.singleLineValidationMessage = CTService.getValidationMessages(0, vm.lengthConstants.singleLineMaxCharLimit);
    vm.multiLineValidationMessage = CTService.getValidationMessages(0, vm.lengthConstants.multiLineMaxCharLimit);

    vm.overview = {
      customerInformation: 'circle-user',
      agentUnavailable: 'circle-comp-negative',
      offHours: 'circle-clock-hands',
      feedback: 'circle-star'
    };

    //Use the existing template fields when editing the template
    if ($stateParams.isEditFeature) {
      vm.template = $stateParams.template;
    }

    function cancelModal() {
      var modelText = $stateParams.isEditFeature ? {
        bodyMessage: $translate.instant('careChatTpl.ctEditBody'),
        trailingMessage: $translate.instant('careChatTpl.ctEditMessage'),
        process: $translate.instant('careChatTpl.ctEditing')
      } : {
        bodyMessage: $translate.instant('careChatTpl.ctCreationBody'),
        trailingMessage: $translate.instant('careChatTpl.ctCreationMessage'),
        process: $translate.instant('careChatTpl.ctCreation')
      };

      vm.cancelModalText = {
        cancelHeader: $translate.instant('careChatTpl.cancelHeader'),
        cancelDialog: $translate.instant('careChatTpl.cancelDialog', {
          bodyMessage: modelText.bodyMessage,
          trailingMessage: modelText.trailingMessage
        }),
        continueButton: $translate.instant('careChatTpl.continueButton', {
          confirmProcess: modelText.process
        }),
        confirmButton: $translate.instant('careChatTpl.confirmButton', {
          cancelProcess: modelText.process
        })
      };
      $modal.open({
        templateUrl: 'modules/sunlight/features/chat/ctCancelModal.tpl.html',
        type: 'dialog',
        scope: $scope
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
      return vm.template.name.length == vm.lengthConstants.empty || isValidMultilineField(vm.template.name);
    };

    vm.isNamePageValid = function () {
      return (vm.template.name !== '' && vm.validateNameLength() && vm.isTemplateNameValid());
    };

    function isProfilePageValid() {
      if ((vm.selectedTemplateProfile === vm.profiles.org && vm.orgName !== '') || (vm.selectedTemplateProfile === vm.profiles.agent)) {
        setTemplateProfile();
        return true;
      }
      return false;
    }

    function isValidSinglelineField(fieldDisplayText) {
      return (fieldDisplayText.length <= vm.lengthConstants.singleLineMaxCharLimit);
    }

    function isValidMultilineField(fieldDisplayText) {
      return (fieldDisplayText.length <= vm.lengthConstants.multiLineMaxCharLimit);
    }

    function isAgentUnavailablePageValid() {
      return isValidMultilineField(vm.template.configuration.pages.agentUnavailable.fields.agentUnavailableMessage.displayText);
    }

    function isOffHoursPageValid() {
      setOffHoursWarning();
      if (isValidMultilineField(vm.template.configuration.pages.offHours.message) && vm.isBusinessDaySelected) {
        setOffHoursData();
        return true;
      }
      return false;
    }

    function isFeedbackPageValid() {
      return (isValidMultilineField(vm.template.configuration.pages.feedback.fields.feedbackQuery.displayText)
      && isValidSinglelineField(vm.template.configuration.pages.feedback.fields.comment.displayText));
    }

    function isBubbleTitleValid(chatStatusMessagesObj) {
      if (chatStatusMessagesObj.bubbleTitleMessage) {
        return isValidSinglelineField(chatStatusMessagesObj.bubbleTitleMessage.displayText);
      }
      return true;
    }

    function isStatusMessagesPageValid() {
      var chatStatusMessagesObj = vm.template.configuration.chatStatusMessages.messages;
      return isValidSinglelineField(chatStatusMessagesObj.connectingMessage.displayText)
      && isBubbleTitleValid(chatStatusMessagesObj)
      && isValidSinglelineField(chatStatusMessagesObj.waitingMessage.displayText)
      && isValidSinglelineField(chatStatusMessagesObj.enterRoomMessage.displayText)
      && isValidSinglelineField(chatStatusMessagesObj.leaveRoomMessage.displayText)
      && isValidSinglelineField(chatStatusMessagesObj.chattingMessage.displayText);
    }

    vm.isTypeDuplicate = false;

    var nonHeaderFieldNames = _.filter(_.keys(vm.template.configuration.pages.customerInformation.fields),
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
      return isValidSinglelineField(vm.getAttributeParam('value', 'header', 'welcomeHeader'))
          && isValidSinglelineField(vm.getAttributeParam('value', 'organization', 'welcomeHeader'));
    }

    function areAllDynamicFieldsValid() {
      return _.reduce(_.map(nonHeaderFieldNames, function (fieldName) {
        return isValidSinglelineField(vm.getAttributeParam('value', 'label', fieldName))
                && isValidSinglelineField(vm.getAttributeParam('value', 'hintText', fieldName));
      }), function (x, y) { return x && y; }, true);
    }

    vm.validateType = function (selectedType) {
      return !(selectedType && isSelectedTypeDuplicate(selectedType));
    };

    function isCustomerInformationPageValid() {
      return areAllTypesUnique() && areAllFixedFieldsValid() && areAllDynamicFieldsValid();
    }

    vm.isTemplateNameValid = function () {
      var templateName = vm.template.name;
      if (templateName.indexOf('>') > -1 || templateName.indexOf('<') > -1) {
        return false;
      }
      return true;
    };

    function nextButton() {
      switch (vm.currentState) {
        case 'name':
          return vm.isNamePageValid();
        case 'customerInformation':
          return isCustomerInformationPageValid();
        case 'profile':
          return isProfilePageValid();
        case 'agentUnavailable':
          return isAgentUnavailablePageValid();
        case 'offHours':
          return isOffHoursPageValid();
        case 'feedback':
          return isFeedbackPageValid();
        case 'chatStatusMessages':
          return isStatusMessagesPageValid();
        case 'summary':
          return 'hidden';
        default:
          return true;
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
      var nextPage = vm.template.configuration.pages[vm.states[next]];
      if (nextPage && !nextPage.enabled) {
        return getAdjacentEnabledState(next, jump);
      } else {
        return vm.states[next];
      }
    }

    function nextPage() {
      vm.animation = 'slide-left';
      $timeout(function () {
        vm.currentState = getAdjacentEnabledState(getPageIndex(), 1);
      }, vm.animationTimeout);
    }

    function previousPage() {
      vm.animation = 'slide-right';
      $timeout(function () {
        vm.currentState = getAdjacentEnabledState(getPageIndex(), -1);
      }, vm.animationTimeout);
    }

    vm.activeItem = undefined;

    /**
     * Utility Methods Section
     */

    vm.getFieldByName = function (fieldName) {
      return vm.template.configuration.pages.customerInformation.fields[fieldName];
    };

    vm.getAttributeByName = function (attributeName, fieldName) {
      var fields = vm.template.configuration.pages.customerInformation.fields;
      var field = _.get(fields, fieldName);
      if (field) {
        return _.find(field.attributes, {
          name: attributeName
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

      if (field instanceof Array) {
        field = field[i];
      }
      if (field) {
        return _.get(field, attributeName);
      }
      return undefined;
    };

    vm.setActiveItem = function (val) {
      vm.activeItem = vm.getFieldByName(val.toString());
    };

    vm.isDynamicFieldType = function (val) {
      return typeof val !== 'undefined' && vm.template.configuration.pages.customerInformation.fields.hasOwnProperty(val.toString());
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

    vm.addCategoryOption = function () {
      if (vm.categoryOptionTag) {
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
        displayText: vm.getAttributeParam('value', 'organization', 'welcomeHeader')
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
          Notification.errorWithTrackingId(response, 'careChatTpl.createChatTemplateFailureText');
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
          Notification.errorWithTrackingId(response, 'careChatTpl.editChatTemplateFailureText');
        });
    }

    function handleChatTemplateCreation(response) {
      vm.creatingChatTemplate = false;
      var responseTemplateId = response.headers('Location').split('/').pop();
      $state.go('care.Features');
      Notification.success('careChatTpl.createSuccessText', {
        featureName: vm.template.name
      });
      CTService.openEmbedCodeModal(responseTemplateId, vm.template.name);

    }

    function handleChatTemplateEdit(response, templateId) {
      vm.creatingChatTemplate = false;
      $state.go('care.Features');
      Notification.success('careChatTpl.editSuccessText', {
        featureName: vm.template.name
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
            isSelected: false
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
      CTService.getLogoUrl().then(function (url) {
        vm.logoUrl = url;
      });
      CTService.getLogo().then(function (data) {
        vm.logoFile = 'data:image/png;base64,' + $window.btoa(String.fromCharCode.apply(null, new Uint8Array(data.data)));
        vm.logoUploaded = true;
      });
    }
  }
})();
