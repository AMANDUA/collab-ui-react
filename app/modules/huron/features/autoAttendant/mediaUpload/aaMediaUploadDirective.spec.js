'use strict';

describe('Directive: aaMediaUpload', function () {
  var $compile, $rootScope, $scope, $q;
  var AAUiModelService, AutoAttendantCeMenuModelService, FeatureToggleService;

  var ui = {
    openHours: {},
  };
  var uiMenu = {};
  var menuEntry = {};
  var playAction = {};
  var schedule = 'openHours';
  var index = '0';
  var elementHtml = "<aa-media-upload aa-schedule='openHours' aa-index='0' name='mediaUploadInput'></aa-media-upload>";
  var attributeHtml = "<div aa-media-upload aa-schedule='openHours' aa-index='0' name='mediaUploadInput'></div>";
  var play = 'play';
  var element;

  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function (_$compile_, _$rootScope_, _$q_, _AAUiModelService_, _AutoAttendantCeMenuModelService_, _FeatureToggleService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = $rootScope;
    $q = _$q_;
    AAUiModelService = _AAUiModelService_;
    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;
    FeatureToggleService = _FeatureToggleService_;

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(ui);
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(true));

    $scope.schedule = schedule;
    $scope.index = index;
    uiMenu = AutoAttendantCeMenuModelService.newCeMenu();
    ui[schedule] = uiMenu;
    menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
    uiMenu.addEntryAt(index, menuEntry);
    playAction = AutoAttendantCeMenuModelService.newCeActionEntry(play, '');
    menuEntry.addAction(playAction);
  }));

  afterEach(function () {
    $compile = null;
    $rootScope = null;
    $scope = null;
    $q = null;
    AAUiModelService = null;
    AutoAttendantCeMenuModelService = null;
    FeatureToggleService = null;
    if (element) {
      element.remove();
    }
    element = null;
  });

  describe('when the directive is an element', function () {
    beforeEach(function () {
      element = $compile(elementHtml)($rootScope);
      $rootScope.$digest();
    });

    it('creates the appropriate content as element', function () {
      expect(element.html()).toContain('mediaUpload');
    });
  });

  describe('when the directive is an attribute', function () {
    beforeEach(function () {
      element = $compile(attributeHtml)($rootScope);
      $rootScope.$digest();
    });

    it('creates the appropriate content as attribute', function () {
      expect(element.html()).toContain('mediaUpload');
    });
  });
});
