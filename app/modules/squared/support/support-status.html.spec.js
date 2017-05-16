'use strict';

describe('Controller: SupportCtrl', function () {
  beforeEach(angular.mock.module('Squared'));

  var Userservice, httpBackend, $compile, controller, Authinfo, $scope;

  function stubAllHttpGetRequests() {
    httpBackend.whenGET(/.*/).respond({});
  }

  beforeEach(inject(function (_Userservice_, $httpBackend, _$compile_, $rootScope, $controller, _Authinfo_) {
    Userservice = _Userservice_;

    Authinfo = _Authinfo_;
    $compile = _$compile_;
    httpBackend = $httpBackend;
    $scope = $rootScope.$new();
    controller = $controller;
    stubAllHttpGetRequests();

    controller('SupportCtrl', {
      $scope: $scope,
      Authinfo: Authinfo,
      Userservice: Userservice,
    });
  }));

  describe('Tools card view', function () {
    var view;
    afterEach(function () {
      if (view) {
        view.remove();
      }
      view = undefined;
    });
    beforeEach(inject(function (_$templateCache_) {
      var html = _$templateCache_.get("modules/squared/support/support-status.html");
      view = $compile(angular.element(html))($scope);
    }));

    it('shows tools card if user has helpdesk role', function () {
      Authinfo.isHelpDeskUser = jasmine.createSpy('isHelpDeskUser').and.returnValue(true);
      $scope.$digest();
      var hasToolsCard = _.includes(view.html(), "supportPageToolsCard");
      expect(hasToolsCard).toBeTruthy();
    });

    it('shows tools card if user has cisco dev role', function () {
      Authinfo.isCisco = jasmine.createSpy('isCisco').and.returnValue(true);
      Authinfo.isHelpDeskUser = jasmine.createSpy('isHelpDeskUser').and.returnValue(false);
      Userservice.getUser = jasmine.createSpy('getUser').yields({
        success: true,
        roles: ['ciscouc.devops', 'ciscouc.devsupport'],
      });

      controller('SupportCtrl', {
        $scope: $scope,
        Authinfo: Authinfo,
        Userservice: Userservice,
      });

      $scope.$digest();
      var hasToolsCard = _.includes(view.html(), "supportPageToolsCard");
      expect(hasToolsCard).toBeTruthy();
    });

    it('does NOT show tools card if user doesnt have dev roles nor helpdesk role', function () {
      Authinfo.isHelpDeskUser = jasmine.createSpy('isHelpDeskUser').and.returnValue(false);
      Userservice.getUser = jasmine.createSpy('getUser').yields({
        success: true,
        roles: ['noDevRole'],
      });
      $scope.$digest();
      var hasToolsCard = _.includes(view.html(), "supportPageToolsCard");
      expect(hasToolsCard).toBeFalsy();
    });

    it('has clickable helpdesk button if user has helpdesk role', function () {
      Authinfo.isHelpDeskUser = jasmine.createSpy('isHelpDeskUser').and.returnValue(true);
      $scope.gotoHelpdesk = sinon.spy($scope, 'gotoHelpdesk');
      $scope.$digest();
      view.find("#toolsCardHelpdeskButton").click();
      expect($scope.gotoHelpdesk.calls.count()).toBe(1);
    });

    it('has NO helpdesk button to click if user hasnt helpdesk role', function () {
      Authinfo.isHelpDeskUser = jasmine.createSpy('isHelpDeskUser').and.returnValue(false);
      $scope.gotoHelpdesk = sinon.spy($scope, 'gotoHelpdesk');
      $scope.$digest();
      view.find("toolsCardHelpdeskButton").click();
      expect($scope.gotoHelpdesk.calls.count()).toBe(0);
    });

    it('has clickable call flow button if user has cisco dev role', function () {
      Authinfo.isCisco = jasmine.createSpy('isCisco').and.returnValue(true);
      Authinfo.isHelpDeskUser = jasmine.createSpy('isHelpDeskUser').and.returnValue(false);
      Userservice.getUser = jasmine.createSpy('getUser').yields({
        success: true,
        roles: ['ciscouc.devops', 'ciscouc.devsupport'],
      });

      controller('SupportCtrl', {
        $scope: $scope,
        Authinfo: Authinfo,
        Userservice: Userservice,
      });

      $scope.gotoCdrSupport = sinon.spy($scope, 'gotoCdrSupport');
      $scope.$digest();
      view.find("#toolsCardCdrCallFlowButton").click();
      expect($scope.gotoCdrSupport.calls.count()).toBe(1);
    });

    it('has no call flow button to click if user hasnt cisco dev role', function () {
      Authinfo.isCisco = jasmine.createSpy('isCisco').and.returnValue(true);
      Authinfo.isHelpDeskUser = jasmine.createSpy('isHelpDeskUser').and.returnValue(false);
      Userservice.getUser = jasmine.createSpy('getUser').yields({
        success: true,
        roles: ['noDevopRole'],
      });

      controller('SupportCtrl', {
        $scope: $scope,
        Authinfo: Authinfo,
        Userservice: Userservice,
      });

      $scope.gotoCdrSupport = sinon.spy($scope, 'gotoCdrSupport');
      $scope.$digest();
      view.find("toolsCardCdrCallFlowButton").click();
      expect($scope.gotoCdrSupport.calls.count()).toBe(0);
    });
  });

});
