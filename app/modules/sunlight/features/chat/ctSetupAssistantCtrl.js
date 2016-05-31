(function () {
  'use strict';

  /* global Uint8Array:false */

  angular
    .module('Sunlight')
    .controller('CareChatSetupAssistantCtrl', CareChatSetupAssistantCtrl);

  /* @ngInject */
  function CareChatSetupAssistantCtrl($modal, $timeout, $translate, $window, Authinfo, CTService) {
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
    vm.animation = 'slide-left';

    // Setup Assistant pages with index
    vm.states = ['name',
      'profile',
      'overview',
      'customer',
      'feedback',
      'agentUnavailable',
      'offHours',
      'chatStrings',
      'embedCode'
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
      alias: $translate.instant('careChatTpl.agentAlias'),
      realName: $translate.instant('careChatTpl.agentRealName')
    };
    vm.selectedAgentProfile = vm.agentNames.alias;
    vm.agentNamePreview = $translate.instant('careChatTpl.agentAliasPreview');
    vm.logoFile = '';
    vm.logoUploaded = false;

    /**
     * Type enumerations
     */

    vm.STATIC_FIELD_TYPES = {
      "welcome": {
        text: "welcome",
        htmlType: "label"
      }
    };

    vm.typeOptions = [{
      text: "email",
      dictionaryType: {
        fieldSet: "ccc_core",
        fieldName: "ccc_email"
      }
    }, {
      text: "name",
      dictionaryType: {
        fieldSet: "ccc_core",
        fieldName: "ccc_name"
      }
    }, {
      text: "category",
      dictionaryType: {
        fieldSet: "ccc_core",
        fieldName: "ccc_category"
      }
    }, {
      text: "phone",
      dictionaryType: {
        fieldSet: "ccc_core",
        fieldName: "ccc_phone"
      }
    }, {
      text: "id",
      dictionaryType: {
        fieldSet: "ccc_core",
        fieldName: "ccc_email"
      }
    }];

    vm.categoryTypeOptions = [{
      text: $translate.instant('careChatTpl.categoryTextCustomer'),
      id: 'customerInfo'

    }, {
      text: $translate.instant('careChatTpl.categoryTextRequest'),
      id: 'requestInfo',
    }];

    vm.customerHelpText = $translate.instant('careChatTpl.ciHelpText');
    vm.reHelpText = $translate.instant('careChatTpl.ciHelpText');

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

    vm.getTypeObject = function (typeText) {
      return _.find(vm.typeOptions, {
        text: typeText
      });
    };

    /* Template */

    vm.template = {
      name: '',
      mediaType: 'chat',
      configuration: {
        mediaSpecificConfiguration: {
          useOrgProfile: true,
          displayText: vm.orgName,
          image: '',
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
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultNameText')
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultNameHint')
                }, {
                  name: 'type',
                  value: vm.getTypeObject('name')
                }]
              },

              'field2': {
                attributes: [{
                  name: 'required',
                  value: 'required'
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('customerInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultEmailText')
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.defaultEmail')
                }, {
                  name: 'type',
                  value: vm.getTypeObject('email')
                }]
              },

              'field3': {
                attributes: [{
                  name: 'required',
                  value: 'optional'
                }, {
                  name: 'category',
                  value: vm.getCategoryTypeObject('requestInfo'),
                }, {
                  name: 'label',
                  value: $translate.instant('careChatTpl.defaultQuestionText')
                }, {
                  name: 'hintText',
                  value: $translate.instant('careChatTpl.field3HintText')
                }, {
                  name: 'type',
                  value: vm.getTypeObject('category')
                }]
              }
            }
          },
          agentUnavailable: {
            enabled: true
          },
          offHours: {
            enabled: true
          },
          feedback: {
            enabled: true
          }
        }
      }
    };

    vm.overview = {
      customerInformation: 'circle-user',
      agentUnavailable: 'circle-comp-negative',
      offHours: 'circle-clock-hands',
      feedback: 'circle-star'
    };

    function cancelModal() {
      $modal.open({
        templateUrl: 'modules/sunlight/features/chat/ctCancelModal.tpl.html'
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

    function isNamePageValid() {
      if (vm.template.name === '') {
        return false;
      }
      return true;
    }

    function isProfilePageValid() {
      if ((vm.selectedTemplateProfile === vm.profiles.org && vm.orgName !== '') || (vm.selectedTemplateProfile === vm.profiles.agent)) {
        setTemplateProfile();
        return true;
      }
      return false;
    }

    function nextButton() {
      switch (vm.currentState) {
      case 'name':
        return isNamePageValid();
      case 'profile':
        return isProfilePageValid();
      case 'embedCode':
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

    function nextPage() {
      vm.animation = 'slide-left';
      $timeout(function () {
        vm.currentState = vm.states[getPageIndex() + 1];
      }, vm.animationTimeout);
    }

    function previousPage() {
      vm.animation = 'slide-right';
      $timeout(function () {
        vm.currentState = vm.states[getPageIndex() - 1];
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

    function setTemplateProfile() {
      if (vm.selectedTemplateProfile === vm.profiles.org) {
        vm.template.configuration.mediaSpecificConfiguration = {
          useOrgProfile: true,
          displayText: vm.orgName,
          image: ''
        };
      } else if (vm.selectedTemplateProfile === vm.profiles.agent) {
        vm.template.configuration.mediaSpecificConfiguration = {
          useOrgProfile: false,
          useAgentRealName: false
        };
      }
    }

    function setAgentProfile() {
      if (vm.selectedAgentProfile === vm.agentNames.alias) {
        vm.agentNamePreview = $translate.instant('careChatTpl.agentAliasPreview');
      } else if (vm.selectedAgentProfile === vm.agentNames.realName) {
        vm.agentNamePreview = $translate.instant('careChatTpl.agentNamePreview');
      }
    }

    vm.isUserProfileSelected = function () {
      return vm.template.configuration.mediaSpecificConfiguration.useOrgProfile;
    };

    function init() {
      CTService.getLogo().then(function (data) {
        vm.logoFile = 'data:image/png;base64,' + $window.btoa(String.fromCharCode.apply(null, new Uint8Array(data.data)));
        vm.logoUploaded = true;
      });
    }
  }
})();
