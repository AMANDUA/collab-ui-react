'use strict';

describe('Controller: AAConfigureApiModalCtrl', function () {
  var controller;
  var AAUiModelService, AutoAttendantCeMenuModelService;
  var AASessionVariableService;
  var AACommonService;
  var RestApiService;
  var customVarJson = getJSONFixture('huron/json/autoAttendant/aaCustomVariables.json');

  var $rootScope, $scope;

  var aaUiModel = {
    openHours: {},
  };

  var schedule = 'openHours';
  var index = '0';
  var menu;
  var q;
  var action;
  var $translate;
  var $window;
  var modalFake = {
    close: jasmine.createSpy('modalInstance.close'),
    dismiss: jasmine.createSpy('modalInstance.dismiss'),
    result: {
      then: jasmine.createSpy('modalInstance.result.then'),
    },
  };

  beforeEach(angular.mock.module('uc.autoattendant', function ($provide) {
    $provide.value(RestApiService, {
      testRestApiConfigs: function () {
        var deferred = q.defer();
        deferred.resolve({ request: 'aa', response: 'aaaa', responsecode: '200' });
        return deferred.promise();
      },
    });
  }));
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function ($controller, $q, _$rootScope_, _$translate_, _$window_, _AutoAttendantCeMenuModelService_, _AACommonService_, _AASessionVariableService_, _AAUiModelService_, _RestApiService_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope;
    q = $q;

    schedule = 'openHours';
    index = '0';

    aaUiModel = {
      openHours: {},
    };

    controller = $controller;

    AASessionVariableService = _AASessionVariableService_;
    $window = _$window_;

    AAUiModelService = _AAUiModelService_;
    RestApiService = _RestApiService_;
    AACommonService = _AACommonService_;
    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;
    $translate = _$translate_;

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(aaUiModel);

    AutoAttendantCeMenuModelService.clearCeMenuMap();
    aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();

    menu = AutoAttendantCeMenuModelService.newCeMenuEntry();

    aaUiModel['openHours'].addEntryAt(index, menu);
    action = AutoAttendantCeMenuModelService.newCeActionEntry('doREST', 'testId');
    action.varList = ['testVar'];
    action.url = [{
      action: {
        eval: {
          value: 'Static text',
        },
      },
      isDynamic: false,
      htmlModel: '',
    }, {
      action: {
        eval: {
          value: 'Original-Caller-Number',
        },
      },
      isDynamic: true,
      htmlModel: '',
    }];
    action.dynamicList = [{
      action: {
        eval: {
          value: 'Static text',
        },
      },
      isDynamic: false,
      htmlModel: '',
    }, {
      action: {
        eval: {
          value: 'Original-Caller-Number',
        },
      },
      isDynamic: true,
      htmlModel: '',
    }];
    action.variableSet = [{
      value: '',
      variableName: '',
      isWarn: false,
    }];
    action.dynamics = [{
      assignVar: {
        variableName: 'aa',
        value: 'aa',
      },
    }];
    action.restApiRequest = 'http://www.mocky.io';
    action.restApiResponse = 'message: Hello';
    aaUiModel[schedule].entries[0].addAction(action);
    $scope.schedule = schedule;
    $scope.index = index;

    spyOn(AASessionVariableService, 'getSessionVariables').and.returnValue(q.resolve(customVarJson));
    spyOn($translate, 'instant');
    $translate.instant.and.returnValue('New Variable');

    controller = controller('AAConfigureApiModalCtrl', {
      $scope: $scope,
      $modalInstance: modalFake,
      aa_schedule: schedule,
      aa_index: index,
    });
  }));

  afterEach(function () {
    $rootScope = null;
    $scope = null;
    $translate = null;
    AAUiModelService = null;
    AutoAttendantCeMenuModelService = null;
    AASessionVariableService = null;
    AACommonService = null;
    RestApiService = null;
    controller = null;
    aaUiModel = null;
    menu = null;
    action = null;
  });

  describe('activate', function () {
    it('should be defined', function () {
      $scope.$apply();
      expect(controller).toBeDefined();
    });
  });

  describe('save', function () {
    it('save function call results in closing the Modal.', function () {
      $scope.$apply();
      controller.save();
      expect(modalFake.close).toHaveBeenCalled();
    });
  });

  describe('populateUiModal', function () {
    it('populateUi with the dynamicList', function () {
      $scope.$apply();
      expect(controller.dynamicValues.length).toBe(2);
      expect(controller.dynamicValues[0].model).toBe('Static text');
      expect(controller.dynamicValues[1].model).toBe('Original-Caller-Number');
    });
  });

  describe('cancel', function () {
    it('should cancel the modal', function () {
      $scope.$apply();
      controller.lastSavedDynList = '';
      controller.lastSavedVariableList = '';
      controller.cancel();
      expect(modalFake.close).toHaveBeenCalled();
    });
  });

  describe('dynamic functionality', function () {
    beforeEach(function () {
      var scopeElement = {
        insertElement: function (string) {
          return string;
        },
      };
      var dynamicElement = {
        scope: function () {
          return true;
        },
        focus: function () {},
      };
      var rangeGetter = function () {
        var range = {
          collapsed: true,
          endContainer: {
            ownerDocument: {
              activeElement: {
                childNodes: [{
                  nodeName: '#text',
                  nodeValue: 'this is test say message',
                }, {
                  nodeName: 'SPAN',
                  parentElement: {
                    attributes: [{
                      value: 'Test Attribute',
                    }, {
                      value: 'NUMBER',
                    }, {
                      value: 'dummyId',
                    }],
                  },
                }],
                className: 'dynamic-prompt aa-message-height',
                id: 'messageTypeopenHours0',
              },
            },
          },
        };
        return range;
      };
      spyOn(angular, 'element').and.returnValue(dynamicElement);
      spyOn(dynamicElement, 'focus');
      spyOn(dynamicElement, 'scope').and.returnValue(scopeElement);
      spyOn(AACommonService, 'isMediaUploadToggle').and.returnValue(true);
      spyOn(scopeElement, 'insertElement');
      spyOn($window, 'getSelection').and.returnValue({
        getRangeAt: rangeGetter,
        rangeCount: true,
        removeAllRanges: function () {
          return true;
        },
        addRange: function () {
          return true;
        },
      });
    });

    it('should be able to create dynamicList', function () {
      spyOn(AACommonService, 'isDynAnnounceToggle').and.returnValue(true);
      var action = AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', '');
      action.dynamicList = [{
        action: {
          eval: {
            value: 'Static Text',
          },
        },
        isDynamic: false,
        htmlModel: '',
      }];
      var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
      menuEntry.addAction(action);
      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel.openHours.addEntryAt(0, menuEntry);
      expect(_.get(menuEntry.actions[0], 'dynamicList[0].action.eval.value', '')).toBe('Static Text');
      $scope.$apply();
      controller.saveDynamicUi();
      expect(_.get(menuEntry.actions[0], 'dynamicList[0].isDynamic', '')).toBe(false);
    });

    //will be used and updated in the next story which covers errors part
    /*describe('variable warning', function () {
      it('fullWarningMsg', function () {
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', ''));
        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);
        expect(controller.fullWarningMsgValue).toBe(false);
        controller.toggleFullWarningMsg();
        expect(controller.fullWarningMsgValue).toBe(true);
      });

      it('getWarning returning true', function () {
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', ''));
        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);
        controller.deletedSessionVariablesList = ['test', 'test2'];
        expect(controller.getWarning()).toBe(true);
      });

      it('getWarning returning false', function () {
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', ''));
        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);
        controller.deletedSessionVariablesList = {};
        expect(controller.getWarning()).toBe(false);
      });

      it('calling closeFullWarningMsg', function () {
        controller.closeFullWarningMsg();
        expect(controller.fullWarningMsgValue).toBe(false);
      });

      it('broadcast of CE Updated', function () {
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.dynamicList = [{
          action: {
            eval: {
              value: 'testValue',
            },
          },
          isDynamic: true,
        }];
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', ''));
        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);
        $scope.$apply();
        controller.deletedSessionVariablesList = [];
        $rootScope.$broadcast('CE Updated');
        controller.getWarning();
        expect(controller.fullWarningMsgValue).toBe(false);
      });

      it('broadcast of CIVarNameChanged', function () {
        menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.dynamicList = [{
          action: {
            eval: {
              value: 'testValue',
            },
          },
          isDynamic: true,
        }];
        menuEntry.addAction(AutoAttendantCeMenuModelService.newCeActionEntry('dynamic', ''));
        aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
        aaUiModel.openHours.addEntryAt(0, menuEntry);
        $scope.$apply();
        controller.deletedSessionVariablesList = [];
        $rootScope.$broadcast('CIVarNameChanged');
        controller.getWarning();
        expect(controller.fullWarningMsgValue).toBe(false);
      });
    });*/

    describe('should test stepNext Function', function () {
      var result;
      beforeEach(function () {
        controller.currentStep = 1;
        controller.restApiResponse = '';
      });

      it('url should be equate to URL when dynamicList is empty', function () {
        controller.currentStep = 0;
        controller.menuEntry.actions[0].dynamicList = '';
        controller.menuEntry.actions[0].url = [{ testURL: 'test' }];
        controller.stepNext();
        expect(controller.currentStep).toEqual(1);
        expect(action.url).toEqual(controller.menuEntry.actions[0].url);
      });

      it('url should be equate to dynamicList when dynamicList is not empty', function () {
        controller.menuEntry.actions[0].dynamicList = [
          {
            isDynamic: true,
            action: {
              eval: {
                value: 'this is test value',
              },
            },
          },
        ];

        controller.stepNext();
        expect(controller.currentStep).toEqual(2);
        expect(action.url).toEqual(controller.menuEntry.actions[0].dynamicList);
      });

      it('dynamics should be empty when there is no dynamic text', function () {
        controller.menuEntry.actions[0].dynamicList = [
          {
            isDynamic: false,
            action: {
              eval: {
                value: 'test',
              },
            },
          },
        ];

        controller.stepNext();
        expect(controller.currentStep).toEqual(2);
        expect(controller.dynamics.length).toEqual(0);
      });

      it('dynamics should be updated when there is dynamic text', function () {
        controller.menuEntry.actions[0].dynamicList = [
          {
            isDynamic: true,
            action: {
              eval: {
                value: 'aaa',
              },
            },
          },
        ];
        controller.dynamics = [{ variableName: 'aaa', value: 'aa', $$hashkey: 'aa' }];
        controller.stepNext();
        expect(controller.currentStep).toEqual(2);

        result = [{ value: 'aa', variableName: 'aaa' }];
        expect(controller.dynamics).toEqual(result);

        controller.dynamics = [
          {
            variableName: 'aa',
            value: 'a',
          },
        ];
        controller.currentStep = 1;
        result = [{ value: '', variableName: 'aaa' }];
        controller.stepNext();
        expect(controller.dynamics).toEqual(result);
      });

      it('tableData should be updated when corresponding variableSet is present', function () {
        var restApiResponse = { message: 'Hello' };
        controller.restApiResponse = JSON.stringify(restApiResponse);
        controller.variableSet = [{ value: 'message', variableName: 'greeting' }];
        controller.stepNext();
        expect(controller.currentStep).toEqual(2);
        result = [
          {
            responseKey: 'message',
            responseValue: 'Hello',
            options: [],
            selected: 'greeting',
          },
        ];
        expect(controller.tableData).toEqual(result);
      });

      it('tableData should be without selected when variableSet is empty', function () {
        var restApiResponse = { key: 'Hello' };
        controller.restApiResponse = JSON.stringify(restApiResponse);
        controller.variableSet = [];
        result = [
          {
            options: [],
            responseKey: 'key',
            responseValue: 'Hello',
          },
        ];
        controller.stepNext();
        expect(controller.tableData).toEqual(result);
      });

      it('tableData should be empty when restApiResponse is empty', function () {
        var restApiResponse = { mesage: {} };
        controller.restApiResponse = JSON.stringify(restApiResponse);
        result = [];
        controller.stepNext();
        expect(controller.tableData).toEqual(result);
      });

      it('when password doesnot change', function () {
        controller.password = '**********';
        controller.username = 'testuser';
        controller.basicAuthButton = true;
        controller.menuEntry.actions[0].dynamicList = [{
          isDynamic: false,
          action: {
            eval: {
              value: 'test',
            },
          },
        }];
        controller.stepNext();
        expect(controller.currentStep).toBe(2);
        expect(controller.dynamics.length).toBe(0);
      });

      it('tableData should be empty when restApiResponse is not valid', function () {
        controller.restApiResponse = '<div></div>';
        result = [];
        controller.stepNext();
        expect(controller.tableData).toEqual(result);
      });
    });

    describe('should test the api configure modal wizard', function () {
      it('should test showStep function', function () {
        var step = 1;
        controller.currentStep = 1;
        expect(controller.showStep(step)).toBe(true);
        step = 2;
        expect(controller.showStep(step)).toBe(false);
      });

      it('should test stepBack function', function () {
        spyOn(AACommonService, 'isRestApiTogglePhase2').and.returnValue(true);
        controller.currentStep = 2;
        var action = {};
        action.variableSet = [{ a: 'a' }];
        action.dynamics = [{ variablename: 'variable', value: 'vale' }];
        action.restApiRequest = 'http://www.mocky.io';
        action.restApiResponse = 'message: hellow';
        controller.stepBack();
        expect(controller.currentStep).toEqual(1);
      });

      it('should test isNextDisabled function', function () {
        //empty url
        controller.url = '';
        expect(controller.isNextDisabled()).toBe(true);

        //valid url
        controller.url = { testURL: 'testURL' };
        expect(controller.isNextDisabled()).toEqual(true);

        //not empty but not valid url
        controller.url = '<br class="ng-scope">';
        expect(controller.isNextDisabled()).toEqual(true);
      });

      it('should test isTestDisabled function', function () {
        controller.dynamics = '';
        controller.isTestDisabled();

        controller.dynamics = [
          {
            value: '',
          },
        ];
        controller.isTestDisabled();

        controller.dynamics[0].value = 'aaa';
        controller.isTestDisabled();
        expect(controller.isTestDisabled()).toBe(false);
      });

      it('should test callTestRestApiConfigs function', function () {
        controller.dynamics = [{
          variableName: 'Static text',
          value: '',
        }];
        controller.callTestRestApiConfigs();
        expect(controller.dynamics[0].$$hashkey).not.toBeDefined();
      });

      it('should test isSaveDisabled function', function () {
        controller.tableData = [];
        expect(controller.isSaveDisabled()).toBe(true);

        controller.tableData = [
          {
            selected: 'aaa',
          },
        ];
        expect(controller.isSaveDisabled()).toBe(false);

        controller.tableData = [
          {
            selected: '',
          },
        ];
        expect(controller.isSaveDisabled()).toBe(true);
      });

      it('should test saveUpdatedVariableSet function', function () {
        var result = [];
        controller.variableSet = [];
        controller.tableData = [
          {
            selected: '',
          },
        ];
        controller.save();
        expect(controller.variableSet).toEqual(result);

        result = [
          {
            variableName: 'aaa',
            value: 'weather',
          },
        ];
        controller.tableData = [
          {
            selected: 'aaa',
            responseKey: 'weather',
          },
        ];
        controller.save();
        expect(controller.variableSet).toEqual(result);
      });

      it('should test isDynamicsValueUpdated function', function () {
        controller.isDynamicsValueUpdated();
        expect(controller.isDynamicsValueUpdated).toBeDefined();
      });
    });

    describe('should test functionality when basicAuthButton is true', function () {
      beforeEach(function () {
        controller.basicAuthButton = true;
      });
      afterEach(function () {
        controller.basicAuthButton = null;
      });
      it('should test isNextDisabled when url is empty', function () {
        controller.url = '';
        controller.isNextDisabled();
        expect(controller.isNextDisabled()).toBe(true);
      });
      it('should test isNextDisabled when url is defined', function () {
        controller.url = { testURL: 'testURL' };
        controller.username = '';
        controller.password = '';
        controller.isNextDisabled();
        expect(controller.isNextDisabled()).toBe(true);
      });
      it('should test isNextDisabled when username is defined', function () {
        controller.url = { testURL: 'testURL' };
        controller.username = 'testuser';
        controller.password = '';
        controller.isNextDisabled();
        expect(controller.isNextDisabled()).toBe(true);
      });
      it('should test isNextDisabled when password is defined', function () {
        controller.url = { testURL: 'testURL' };
        controller.username = 'testuser';
        controller.password = 'testPass';
        controller.isNextDisabled();
        expect(controller.isNextDisabled()).toBe(true);
      });
      it('should test stepBack function when phase 2 is on', function () {
        spyOn(AACommonService, 'isRestApiTogglePhase2').and.returnValue(true);
        controller.currentStep = 2;
        var action = {};
        action.variableSet = [{ a: 'a' }];
        action.dynamics = [{ variablename: 'variable', value: 'vale' }];
        action.restApiRequest = 'http://www.mocky.io';
        action.restApiResponse = 'message: hellow';
        controller.menuEntry.actions[0].username = 'testUser';
        controller.stepBack();
        expect(controller.currentStep).toBe(1);
        expect(controller.username).toBe('testUser');
      });
      it('should test stepBack function when phase2 is off', function () {
        spyOn(AACommonService, 'isRestApiTogglePhase2').and.returnValue(false);
        controller.currentStep = 2;
        var action = {};
        action.variableSet = [{ a: 'a' }];
        action.dynamics = [{ variablename: 'variable', value: 'vale' }];
        action.restApiRequest = 'http://www.mocky.io';
        action.restApiResponse = 'message: hellow';
        action.username = '';
        controller.stepBack();
        expect(controller.currentStep).toBe(1);
      });
    });

    describe('should test save function when RestApiTogglePhase2tApi is on', function () {
      beforeEach(function () {
        spyOn(AACommonService, 'isRestApiTogglePhase2').and.returnValue(true);
      });
      it('should test saveUpdatedVariableSet function when basicAuthButton is false', function () {
        var result = [];
        controller.variableSet = [];
        controller.tableData = [{
          selected: '',
        }];
        controller.username = '';
        controller.basicAuthButton = false;
        controller.save();
        expect(controller.variableSet).toEqual(result);
        expect(controller.menuEntry.actions[0].username).not.toBeDefined();
      });
      it('should test saveUpdatedVariableSet function when basicAuthButton is true', function () {
        var result = [];
        controller.variableSet = [];
        controller.tableData = [{
          selected: '',
        }];
        controller.username = 'testUser';
        controller.basicAuthButton = true;
        controller.save();
        expect(controller.variableSet).toEqual(result);
        expect(controller.menuEntry.actions[0].username).toBe('testUser');
      });
      it('should test saveUpdatedVariableSet function when password is not changed', function () {
        var result = [];
        controller.variableSet = [];
        controller.tableData = [{
          selected: '',
        }];
        controller.username = 'testUser';
        controller.basicAuthButton = true;
        controller.password = '**********';
        controller.save();
        expect(controller.variableSet).toEqual(result);
        expect(controller.menuEntry.actions[0].username).toBe('testUser');
        expect(controller.menuEntry.actions[0].credentialId).toBe(controller.menuEntry.actions[0].value);
      });
      it('should test callTestRestApiConfigs function when basicAuthButton is enable', function () {
        controller.dynamics = [{
          variableName: 'Static text',
          value: '',
        }];
        controller.basicAuthButton = true;
        controller.callTestRestApiConfigs();
        expect(controller.dynamics[0].$$hashkey).not.toBeDefined();
      });
      it('should test basicAuthSlider function when basicAuthButton is enable', function () {
        controller.basicAuthButton = true;
        controller.onBasicAuthSlider();
        expect(controller.username).toBe('');
      });
      it('should test basicAuthSlider function when basicAuthButton is disabled', function () {
        controller.basicAuthButton = false;
        controller.onBasicAuthSlider();
        expect(controller.username).toBe('');
        expect(controller.password).toBe('');
      });
      it('should test basicAuthSlider function when basicAuthButton is disabled', function () {
        controller.password = '**********';
        controller.passwordCheck();
        expect(controller.password).toBe('');
      });
    });
  });
});
