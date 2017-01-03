'use strict';

describe('Directive: icheck', function () {

  // load the directive's module
  beforeEach(angular.mock.module('Squared'));

  var element,
    scope;

  afterEach(function () {
    if (element) {
      element.remove();
    }
    element = undefined;
  });

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  xit('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<icheck>this is the icheck directive</icheck>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the icheck directive');
  }));
});
