(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .controller('AABuilderActionsCtrl', AABuilderActionsCtrl);

  /* @ngInject */
  function AABuilderActionsCtrl($scope, $translate, $controller, AAUiModelService, AutoAttendantCeMenuModelService) {

    var vm = this;

    vm.templates = [{
      title: $translate.instant('autoAttendant.actionSayMessage'),
      controller: 'AASayMessageCtrl as aaSay',
      url: 'modules/huron/features/autoAttendant/sayMessage/aaSayMessage.tpl.html',
      help: $translate.instant('autoAttendant.sayMessageHelp'),
      actions: ['say']
    }, {
      title: $translate.instant('autoAttendant.actionPhoneMenu'),
      controller: 'AutoAttendantMainCtrl as aaMain',
      url: 'modules/huron/callRouting/autoAttendant/autoAttendantMenu.tpl.html',
      help: '',
      actions: ['runActionsOnInput']
    }, {
      title: $translate.instant('autoAttendant.actionRouteCall'),
      controller: '',
      url: '',
      help: '',
      actions: ['route', 'goto', 'routeToExtension']
    }];

    vm.template = ""; // no default template
    vm.schedule = "";

    vm.getTemplateController = getTemplateController;
    vm.getTemplateUrl = getTemplateUrl;
    vm.removeAction = removeAction;

    /////////////////////

    function getTemplateUrl() {
      return vm.template.url;
    }

    function getTemplateController() {
      if (vm.template && vm.template.controller) {
        return $controller(vm.template.controller, {
          $scope: $scope
        });
      }
    }

    function removeAction(index) {
      var uiMenu = vm.ui[vm.schedule];

      uiMenu.deleteEntryAt(index);
    }

    function setTemplate() {
      if ($scope.index >= 0) {
        var menuEntry = vm.ui[vm.schedule].getEntryAt($scope.index);
        if (menuEntry.actions.length > 0 && menuEntry.actions[0].getName()) {
          for (var i = 0; i < vm.templates.length; i++) {
            var isMatch = vm.templates[i].actions.some(function (action) {
              return menuEntry.actions[0].getName() === action;
            });
            if (isMatch) {
              vm.template = vm.templates[i];
              getTemplateController();
            }
          }
        }
      }
    }

    function activate() {
      vm.schedule = $scope.schedule;
      vm.ui = AAUiModelService.getUiModel();
      setTemplate();
    }

    activate();
  }
})();
