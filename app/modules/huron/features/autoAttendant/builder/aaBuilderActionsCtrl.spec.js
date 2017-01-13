'use strict';

describe('Controller: AABuilderActionsCtrl', function () {
  var controller, $controller, optionController;
  var AAUiModelService, AutoAttendantCeMenuModelService, AACommonService;
  var $rootScope, $scope;

  var aaUiModel = {
    openHours: {}
  };

  var testOptions = [{
    title: 'testOption1',
    controller: 'AABuilderActionsCtrl as aaTest',
    url: 'testUrl',
    hint: 'testHint',
    help: 'testHelp',
    actions: ['testAction']
  }];

  var sortedOptions = [{
    "title": 'autoAttendant.actionPhoneMenu',
  }, {
    "title": 'autoAttendant.actionRouteCall',
  }, {
    "title": 'autoAttendant.actionSayMessage',
  }, {
    "title": 'autoAttendant.phoneMenuDialExt',
  }];

  var testOptionsWithPhoneMenu = [{
    title: 'Phone Menu',
    controller: 'AAPhoneMenuCtrl as aaPhoneMenu',
    url: 'modules/huron/features/autoAttendant/phoneMenu/aaPhoneMenu.tpl.html',
    hint: 'testHint',
    help: 'testHelp',
    actions: ['runActionsOnInput']
  }];

  var testOptionsWithDialByExt = [{
    title: 'Dial By phoneMenuDialExt',
    controller: 'AADialByExtCtrl as aaDialByExtCtrl',
    url: 'modules/huron/features/autoAttendant/dialByExt/aaDialByExt.tpl.html',
    hint: 'testHint',
    help: 'testHelp',
    type: 2,
    actions: ['runActionsOnInput']
  }];

  function type(obj) {
    var text = obj.constructor.toString();
    return text.match(/function (.*)\(/)[1];
  }

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function (_$rootScope_, _$controller_, _AAUiModelService_, _AutoAttendantCeMenuModelService_, _AACommonService_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope;
    $controller = _$controller_;

    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;
    AAUiModelService = _AAUiModelService_;
    AACommonService = _AACommonService_;

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(aaUiModel);
    spyOn(AutoAttendantCeMenuModelService, 'deleteCeMenuMap');


    $scope.schedule = 'openHours';
    controller = $controller('AABuilderActionsCtrl', {
      $scope: $scope
    });
    $scope.$apply();
  }));

  describe('setOption for Dial By Extension', function () {
    it('option for Dial By Extension is selected', function () {

      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();

      aaUiModel['openHours'].addEntryAt(0, AutoAttendantCeMenuModelService.newCeMenuEntry());

      var action = AutoAttendantCeMenuModelService.newCeActionEntry('runActionsOnInput', '');
      action.inputType = 2;

      aaUiModel['openHours'].entries[0].addAction(action);

      $scope.index = 0;

      var controller = $controller('AABuilderActionsCtrl', {
        $scope: $scope
      });

      expect(controller.option.title).toEqual('autoAttendant.phoneMenuDialExt');

    });
  });

  describe('selectOption', function () {
    it('enables save and replaces CeMenuEntry with CeMenu when phone-menu option is selected', function () {
      controller.option = testOptionsWithPhoneMenu[0];
      controller.schedule = 'openHours';
      controller.index = 0;
      controller.ui['openHours'] = AutoAttendantCeMenuModelService.newCeMenu();
      controller.ui['openHours'].addEntryAt(controller.index, AutoAttendantCeMenuModelService.newCeMenuEntry());

      expect(AACommonService.isFormDirty()).toBeFalsy();
      controller.selectOption();
      var _menuEntry = controller.ui['openHours'].getEntryAt(controller.index);
      expect(type(_menuEntry)).toBe('CeMenu');
      expect(AACommonService.isFormDirty()).toBeTruthy();
    });

    it('enables save and retains CeMenuEntry when dial-by-ext option is selected', function () {
      controller.option = testOptionsWithDialByExt[0];
      controller.schedule = 'openHours';
      controller.index = 0;
      controller.ui['openHours'] = AutoAttendantCeMenuModelService.newCeMenu();
      controller.ui['openHours'].addEntryAt(controller.index, AutoAttendantCeMenuModelService.newCeMenuEntry());

      expect(AACommonService.isFormDirty()).toBeFalsy();
      controller.selectOption();
      var _menuEntry = controller.ui['openHours'].getEntryAt(controller.index);
      expect(type(_menuEntry)).toBe('CeMenuEntry');
      expect(AACommonService.isFormDirty()).toBeTruthy();
    });
  });

  describe('getOptionController', function () {
    it('does not instantiate a controller if option is not defined', function () {
      optionController = controller.getOptionController();
      expect(optionController).not.toBeDefined();
    });

    it('instantiates a controller if option is defined', function () {
      controller.option = testOptions[0];
      optionController = controller.getOptionController();
      expect(optionController).toBeDefined();
    });
  });

  describe('getSelectHint', function () {
    it('returns hint for select list based on options', function () {
      expect(controller.getSelectHint()).toContain('<br>');
    });
  });

  describe('removeAction', function () {
    it('remove a menu entry from the menu model', function () {
      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel['openHours'].addEntryAt(0, AutoAttendantCeMenuModelService.newCeMenuEntry());
      expect(aaUiModel['openHours']['entries'].length).toEqual(1);
      controller.removeAction(0);
      expect(aaUiModel['openHours']['entries'].length).toEqual(0);
    });

    it('should invoke deleteCeMenuMap for a Menu action to free up the associated menu mapping', function () {
      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel['openHours'].addEntryAt(0, AutoAttendantCeMenuModelService.newCeMenu());
      expect(aaUiModel['openHours']['entries'].length).toEqual(1);
      controller.removeAction(0);
      expect(aaUiModel['openHours']['entries'].length).toEqual(0);
      expect(AutoAttendantCeMenuModelService.deleteCeMenuMap).toHaveBeenCalled();
    });
  });

  describe('removeAction', function () {
    it('remove a particular menu entry from the menu model', function () {
      aaUiModel.openHours = AutoAttendantCeMenuModelService.newCeMenu();
      aaUiModel['openHours'].addEntryAt(0, AutoAttendantCeMenuModelService.newCeMenuEntry());
      expect(aaUiModel['openHours']['entries'].length).toEqual(1);
      aaUiModel['openHours']['entries'][0].setKey('0');

      aaUiModel['openHours'].addEntryAt(1, AutoAttendantCeMenuModelService.newCeMenuEntry());
      expect(aaUiModel['openHours']['entries'].length).toEqual(2);
      aaUiModel['openHours']['entries'][1].setKey('1');

      aaUiModel['openHours'].addEntryAt(1, AutoAttendantCeMenuModelService.newCeMenuEntry());
      expect(aaUiModel['openHours']['entries'].length).toEqual(3);
      expect(aaUiModel['openHours']['entries'][0].getKey()).toEqual('0');
      expect(aaUiModel['openHours']['entries'][1].getKey()).toEqual('');
      expect(aaUiModel['openHours']['entries'][2].getKey()).toEqual('1');

      controller.removeAction(1);
      expect(aaUiModel['openHours']['entries'].length).toEqual(2);
      expect(aaUiModel['openHours']['entries'][0].getKey()).toEqual('0');
      expect(aaUiModel['openHours']['entries'][1].getKey()).toEqual('1');
    });
  });

  /**
   * title value is not read from properties file in unit test cases. So it will treat the key provided into vm.options for title
   * as text only. Sorting is based on the key itself and not on values of title.
   */
  describe('Activate ', function () {
    it('test for sorted options', function () {
      for (var i = 0; i < sortedOptions.length; i++) {
        expect(controller.options[i].title).toEqual(sortedOptions[i].title);
      }
    });
  });

  describe('test caller Input', function () {
    it('should add the Caller Input label', function () {
      spyOn(AACommonService, 'isCallerInputToggle').and.returnValue(true);
      // setup the options menu
      controller = $controller('AABuilderActionsCtrl', {
        $scope: $scope
      });

      expect(controller.options.length).toEqual(5);
      // note: only works until an action that starts with an A or a B happens
      expect(controller.options[0].title).toEqual('autoAttendant.actionCallerInput');

    });

  });

});
