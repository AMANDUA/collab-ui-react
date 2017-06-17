'use strict';

describe('Controller: AARouteToHGCtrl', function () {
  var $controller;
  var AAUiModelService, AutoAttendantCeInfoModelService, AutoAttendantCeMenuModelService, AAModelService, HuntGroupService;
  var $rootScope, $scope;

  var $q;

  var aaModel = {

  };

  var aaUiModel = {
    openHours: {},
    ceInfo: {
      name: 'AA2',
    },
  };

  var huntGroups = [{
    name: 'Olegs Hunt Group',
    numbers: [{
      uuid: '15098786-2413-42af-87f4-2ab9b1382885',
      number: '987654321',
      type: 'NUMBER_FORMAT_ENTERPRISE_LINE',
    }],
    number: '987654321',
    uuid: 'c16a6027-caef-4429-b3af-9d61ddc7964b',
  }, {
    name: 'Test Hunt Group',
    numbers: [{
      uuid: '15098786-2413-42af-87f4-2ab9b1382885',
      number: '987654321',
      type: 'NUMBER_FORMAT_ENTERPRISE_LINE',
    }],
    number: '987654321',
    uuid: 'c16a6027-caef-4429-b3af-9d61ddc7964b',
  }, {
    name: 'AA Hunt Group',
    numbers: [{
      uuid: '15098786-2413-42af-87f4-2ab9b1382885',
      number: '987654321',
      type: 'NUMBER_FORMAT_ENTERPRISE_LINE',
    }],
    number: '987654321',
    uuid: 'c16a6027-caef-4429-b3af-9d61ddc7964b',
  }, {
    name: 'Super Hunt Group',
    numbers: [{
      uuid: '15098786-2413-42af-87f4-2ab9b1382885',
      number: '987654321',
      type: 'NUMBER_FORMAT_ENTERPRISE_LINE',
    }],
    number: '987654321',
    uuid: 'c16a6027-caef-4429-b3af-9d61ddc7964b',
  }];

  var sortedOptions = [{
    description: huntGroups[2].name.concat(' (').concat(huntGroups[2].number).concat(')'),
  }, {
    description: huntGroups[0].name.concat(' (').concat(huntGroups[0].number).concat(')'),
  }, {
    description: huntGroups[3].name.concat(' (').concat(huntGroups[3].number).concat(')'),
  }, {
    description: huntGroups[1].name.concat(' (').concat(huntGroups[1].number).concat(')'),
  }];

  var schedule = 'openHours';
  var index = 0;
  var keyIndex = 0;
  var menuId = 'menu1';

  var rawCeInfos = getJSONFixture('huron/json/autoAttendant/callExperiencesWithNumber.json');

  function raw2CeInfos(rawCeInfos) {
    var _ceInfos = [];
    for (var i = 0; i < rawCeInfos.length; i++) {
      var _ceInfo = AutoAttendantCeInfoModelService.newCeInfo();
      for (var j = 0; j < rawCeInfos[i].assignedResources.length; j++) {
        var _resource = AutoAttendantCeInfoModelService.newResource();
        _resource.setId(rawCeInfos[i].assignedResources[j].id);
        _resource.setTrigger(rawCeInfos[i].assignedResources[j].trigger);
        _resource.setType(rawCeInfos[i].assignedResources[j].type);
        _resource.setNumber(rawCeInfos[i].assignedResources[j].number);
        _ceInfo.addResource(_resource);
      }
      _ceInfo.setName(rawCeInfos[i].callExperienceName);
      _ceInfo.setCeUrl(rawCeInfos[i].callExperienceURL);
      _ceInfos[i] = _ceInfo;
    }
    return _ceInfos;
  }

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$controller_, _$q_, _$rootScope_, _AAUiModelService_, _AutoAttendantCeInfoModelService_, _AutoAttendantCeMenuModelService_, _AAModelService_, _HuntGroupService_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope;
    $q = _$q_;

    $controller = _$controller_;
    AAModelService = _AAModelService_;
    AAUiModelService = _AAUiModelService_;
    AutoAttendantCeInfoModelService = _AutoAttendantCeInfoModelService_;
    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;
    HuntGroupService = _HuntGroupService_;

    $scope.schedule = schedule;
    $scope.index = index;
    $scope.keyIndex = keyIndex;
    $scope.menuId = menuId;

    spyOn(AAModelService, 'getAAModel').and.returnValue(aaModel);
    aaModel.ceInfos = raw2CeInfos(rawCeInfos);

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(aaUiModel);
    AutoAttendantCeMenuModelService.clearCeMenuMap();
    aaUiModel[schedule] = AutoAttendantCeMenuModelService.newCeMenu();
    aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenu());
    spyOn(HuntGroupService, 'getHuntGroupList').and.returnValue($q.resolve(huntGroups));
  }));

  describe('fromDecision', function () {
    beforeEach(function () {
      $scope.fromDecision = true;

      aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenuEntry());

      aaUiModel[schedule].entries[0].actions = [];

      var action = AutoAttendantCeMenuModelService.newCeActionEntry('conditional', '');
      aaUiModel[schedule].entries[0].actions[0] = action;
    });

    it('should create a HG conditional action with then clause', function () {
      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      expect(controller.menuEntry.actions[0].then).toBeDefined();
      expect(controller.menuEntry.actions[0].then.name).toEqual('routeToHuntGroup');
    });

    it('should create a HG condition action with then clause', function () {
      aaUiModel[schedule].entries[0].actions[0] = undefined;

      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      expect(controller.menuEntry.actions[0].name).toEqual('conditional');
      expect(controller.menuEntry.actions[0].then).toBeDefined();
      expect(controller.menuEntry.actions[0].then.name).toEqual('routeToHuntGroup');
    });

    it('should change an action from routetoQueue to route to HG', function () {
      aaUiModel[schedule].entries[index].actions[0].then = AutoAttendantCeMenuModelService.newCeActionEntry('routeToQueue', '');

      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      expect(controller.menuEntry.actions[0].name).toEqual('conditional');
      expect(controller.menuEntry.actions[0].then).toBeDefined();
      expect(controller.menuEntry.actions[0].then.name).toEqual('routeToHuntGroup');
    });
  });

  describe('fromRouteCall overwrite', function () {
    beforeEach(function () {
      aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenuEntry());
      var action = AutoAttendantCeMenuModelService.newCeActionEntry('dummy', '');

      aaUiModel[schedule].entries[0].addAction(action);
    });

    it('should be able to create new HG entry from Route Call', function () {
      $scope.fromRouteCall = true;

      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      expect(controller).toBeDefined();

      expect(controller.menuEntry.actions[0].name).toEqual('routeToHuntGroup');
      expect(controller.menuEntry.actions[0].value).toEqual('');
    });
  });

  describe('fromRouteCall', function () {
    beforeEach(function () {
      $scope.fromRouteCall = true;

      aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenuEntry());

      aaUiModel[schedule].entries[0].actions = [];
    });
    it('should populate the ui from the menuEntry', function () {
      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      controller.hgSelected = {
        name: "Oleg's Call Experience 1",
        id: 'c16a6027-caef-4429-b3af-9d61ddc7964b',
      };

      var action = AutoAttendantCeMenuModelService.newCeActionEntry('routeToHuntgroup', 'myId');
      controller.menuEntry.actions = [];
      controller.menuEntry.actions[0] = action;

      controller.populateUiModel();

      $scope.$apply();

      expect(controller.hgSelected.id).toEqual('myId');
    });

    it('should be able to create new HG entry from Route Call', function () {
      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      expect(controller).toBeDefined();

      expect(controller.menuEntry.actions[0].name).toEqual('routeToHuntGroup');
      expect(controller.menuEntry.actions[0].value).toEqual('');
    });

    it('should be able to change update via saveUIModel', function () {
      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });
      controller.hgSelected = {
        name: "Oleg's Call Experience 1",
        id: 'c16a6027-caef-4429-b3af-9d61ddc7964b',
      };

      var action = AutoAttendantCeMenuModelService.newCeActionEntry('routeToHuntgroup', 'fobar');
      controller.menuEntry.actions = [];
      controller.menuEntry.actions[0] = action;

      controller.saveUiModel();

      $scope.$apply();

      expect(controller.menuEntry.actions[0].value).toEqual('c16a6027-caef-4429-b3af-9d61ddc7964b');
    });
  });

  describe('AARouteToHG', function () {
    it('should be able to create new HG entry', function () {
      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      expect(controller).toBeDefined();
      expect(controller.menuKeyEntry.actions[0].name).toEqual('routeToHuntGroup');
      expect(controller.menuKeyEntry.actions[0].value).toEqual('');
    });

    it('should initialize the options list and check for sorted list', function () {
      var controller = $controller('AARouteToHGCtrl', {
        $scope: $scope,
      });

      $scope.$apply();

      expect(controller.huntGroups.length).toEqual(4);
      for (var i = 0; i < sortedOptions.length; i++) {
        expect(controller.huntGroups[i].description).toEqual(sortedOptions[i].description);
      }
    });

    describe('activate', function () {
      it('should read and display an existing entry', function () {
        var actionEntry = AutoAttendantCeMenuModelService.newCeActionEntry('Olegs Hunt Group', 'c16a6027-caef-4429-b3af-9d61ddc7964b');

        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(actionEntry);
        aaUiModel[schedule].entries[0].addEntry(menuEntry);
        var controller = $controller('AARouteToHGCtrl', {
          $scope: $scope,
        });

        $scope.$apply();

        expect(controller.hgSelected.id).toEqual(huntGroups[0].uuid);
      });
    });

    describe('fromNewStep_Queue_Fallback', function () {
      it('should be able to create new route entry from Queue Fallback in New Step', function () {
        var disconnect = AutoAttendantCeMenuModelService.newCeActionEntry('disconnect', '');
        var fallback = AutoAttendantCeMenuModelService.newCeMenuEntry();
        fallback.addAction(disconnect);
        var queueSettings = {};
        queueSettings.fallback = fallback;
        var routeToQueue = AutoAttendantCeMenuModelService.newCeActionEntry('routeToQueue', 'some-queue-id');
        routeToQueue.queueSettings = queueSettings;
        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(routeToQueue);
        aaUiModel[schedule].addEntryAt(index, menuEntry);
        $scope.fromRouteCall = true;
        $scope.fromFallback = true;

        var controller = $controller('AARouteToHGCtrl', {
          $scope: $scope,
        });

        var fallbackAction = _.get(controller.menuEntry, 'actions[0].queueSettings.fallback.actions[0]');
        $scope.$apply();
        expect(fallbackAction.name).toEqual('routeToHuntGroup');
        expect(fallbackAction.value).toEqual('');
      });
    });

    describe('fromPhoneMenu_Queue_Fallback', function () {
      it('should be able to create new route entry from Queue Fallback of Phone Menu', function () {
        var disconnect = AutoAttendantCeMenuModelService.newCeActionEntry('disconnect', '');
        var fallback = AutoAttendantCeMenuModelService.newCeMenuEntry();
        fallback.addAction(disconnect);
        var queueSettings = {};
        queueSettings.fallback = fallback;
        var routeToQueue = AutoAttendantCeMenuModelService.newCeActionEntry('routeToQueue', 'some-queue-id');
        routeToQueue.queueSettings = queueSettings;
        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(routeToQueue);
        aaUiModel[schedule].entries[index].addEntryAt(index, menuEntry);

        $scope.fromRouteCall = false;
        $scope.fromFallback = true;

        var controller = $controller('AARouteToHGCtrl', {
          $scope: $scope,
        });

        var fallbackAction = _.get(controller.menuKeyEntry, 'actions[0].queueSettings.fallback.actions[0]');
        $scope.$apply();
        expect(fallbackAction.name).toEqual('routeToHuntGroup');
        expect(fallbackAction.value).toEqual('');
      });
    });
  });
});
