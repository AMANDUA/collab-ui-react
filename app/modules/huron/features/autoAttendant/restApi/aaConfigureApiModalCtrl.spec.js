'use strict';

describe('Controller: AAConfigureApiModalCtrl', function () {
  var controller;
  var AAUiModelService, AutoAttendantCeMenuModelService;
  var AASessionVariableService;
  var AACommonService;
  var customVarJson = getJSONFixture('huron/json/autoAttendant/aaCustomVariables.json');

  var $rootScope, $scope;

  var aaUiModel = {
    openHours: {},
  };

  var schedule = 'openHours';
  var index = '0';
  var menu;
  var menuEntry;
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

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function ($controller, $q, _$rootScope_, _$translate_, _$window_, _AutoAttendantCeMenuModelService_, _AACommonService_, _AASessionVariableService_, _AAUiModelService_) {
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
    AACommonService = _AACommonService_;
    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;
    $translate = _$translate_;

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(aaUiModel);

    AutoAttendantCeMenuModelService.clearCeMenuMap();
    aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();

    menu = AutoAttendantCeMenuModelService.newCeMenuEntry();

    aaUiModel['openHours'].addEntryAt(index, menu);
    action = AutoAttendantCeMenuModelService.newCeActionEntry('doREST', '');
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
    action.url = 'test URL';
    action.variableSet = [{
      value: '1',
      variableName: 'Test1',
    }];
    action.method = 'GET';
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

  describe('canShowWarn', function () {
    it('should set isWarn false whenever nameInput is valid', function () {
      $scope.$apply();
      var test = {
        value: '',
        variableName: 'New Variable',
        newVariableValue: 'test1',
        isWarn: true,
      };
      controller.canShowWarn(test);
      expect(test.isWarn).toBe(false);
    });

    it('should set warn to true because of duplicate variable name in session object', function () {
      $scope.$apply();
      var test = {
        value: '',
        variableName: 'New Variable',
        newVariableValue: 'Test1',
        isWarn: false,
      };
      controller.variableSet = [{
        value: '',
        newVariableValue: 'Test1',
        variableName: 'New Variable',
        isWarn: false,
      }, {
        value: '',
        variableName: 'Test1',
        isWarn: false,
      }];
      controller.canShowWarn(test);
      expect(test.isWarn).toBe(true);
    });

    it('isWarn should be false', function () {
      $scope.$apply();
      var test = {
        value: '',
        newVariableValue: '',
        isWarn: false,
      };
      controller.canShowWarn(test);
      expect(test.isWarn).toBe(false);
    });
  });

  describe('addVariableSet', function () {
    it('should push variableSet in existing set', function () {
      $scope.$apply();
      expect(controller.variableSet.length).toBe(1);
      controller.addVariableSet();
      expect(controller.variableSet.length).toBe(2);
    });
  });

  describe('isSaveDisabled', function () {
    it('should disable save whenever any field is empty', function () {
      $scope.$apply();
      expect(controller.isSaveDisabled()).toBe(false);
    });
  });

  describe('deleteVariableSet', function () {
    it('should delete variableSet for given index', function () {
      $scope.$apply();
      expect(controller.variableSet.length).toBe(1);
      controller.deleteVariableSet(0);
      expect(controller.variableSet.length).toBe(0);
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

    it('should be able to create dynamicList', function () {
      spyOn(AACommonService, 'isDynAnnounceToggle').and.returnValue(false);
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

    describe('variable warning', function () {
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
    });
  });
});
