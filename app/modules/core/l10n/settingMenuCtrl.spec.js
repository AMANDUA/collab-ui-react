'use strict';

describe('settingsMenuCtrl', function () {
  beforeEach(angular.mock.module('Core'));

  var controller, $translate;

  afterEach(function () {
    $translate.use('en_US');
    moment.locale('en_US');
    controller = $translate = undefined;
  });

  describe('with real languages', function () {
    beforeEach(inject(function ($rootScope, $controller, _$translate_) {
      $translate = _$translate_;

      $translate.use = jasmine.createSpy('use').and.returnValue('nb_NO');

      controller = $controller('SettingsMenuCtrl', {
        $scope: $rootScope.$new,
      });
    }));

    it('should have injected the list of languages', function () {
      expect(controller.options.length).toEqual(21);
    });

    it('should set the current language', function () {
      expect(controller.selected.value).toBe('nb_NO');
    });
  });

  describe('with single mocked language', function () {
    beforeEach(inject(function ($rootScope, $controller, _$translate_) {
      $translate = _$translate_;
      $translate.instant = jasmine.createSpy('instant').and.returnValue('foo');
      $translate.use = jasmine.createSpy('use').and.returnValue({
        then: jasmine.createSpy('then'),
      });

      controller = $controller('SettingsMenuCtrl', {
        $scope: $rootScope.$new,
        languages: [{
          value: 'foo_BAR',
          label: 'languages.simplifiedDothraki',
        }],
      });
    }));

    it('should have injected the list of languages', function () {
      expect(controller.options.length).toEqual(1);
    });

    it('should have translated the language', function () {
      expect($translate.instant.callCount).toBe(1);
      expect($translate.instant.getCall(0).args[0]).toBe('languages.simplifiedDothraki');
    });

    it('should do something clever things when updateLanguage is called', function () {
      controller.selected.value = '123';
      controller.updateLanguage();
      expect($translate.use.getCall(1).args[0]).toBe('123');
    });
  });
});
