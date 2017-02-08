(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .controller('AABuilderActionsCtrl', AABuilderActionsCtrl);

  /* @ngInject */
  function AABuilderActionsCtrl($scope, $translate, $controller, AAUiModelService, AACommonService, AutoAttendantCeMenuModelService) {

    var vm = this;
    var appendSpecialCharHelp = "<br><br>" + $translate.instant('autoAttendant.sayMessageSpecialChar');

    vm.options = [{
      title: $translate.instant('autoAttendant.actionSayMessage'),
      controller: 'AASayMessageCtrl as aaSay',
      url: 'modules/huron/features/autoAttendant/sayMessage/aaSayMessage.tpl.html',
      hint: $translate.instant('autoAttendant.actionSayMessageHint'),
      help: $translate.instant('autoAttendant.sayMessageHelp') + appendSpecialCharHelp,
      metric: 'Say-Message-Title',
      showHelpLink: true,
      actions: ['play', 'say']
    }, {
      title: $translate.instant('autoAttendant.actionPhoneMenu'),
      controller: 'AAPhoneMenuCtrl as aaPhoneMenu',
      url: 'modules/huron/features/autoAttendant/phoneMenu/aaPhoneMenu.tpl.html',
      hint: $translate.instant('autoAttendant.actionPhoneMenuHint'),
      help: $translate.instant('autoAttendant.phoneMenuHelp') + appendSpecialCharHelp,
      metric: 'Phone-Menu-Title',
      showHelpLink: true,
      actions: ['runActionsOnInput']
    }, {
      title: $translate.instant('autoAttendant.phoneMenuDialExt'),
      controller: 'AADialByExtCtrl as aaDialByExtCtrl',
      url: 'modules/huron/features/autoAttendant/dialByExt/aaDialByExt.tpl.html',
      hint: $translate.instant('autoAttendant.actionDialByExtensionHint'),
      help: $translate.instant('autoAttendant.actionDialByExtensionHelp'),
      metric: 'Dial-By-Extension-Title',
      showHelpLink: false,
      type: [2], // to flag that this is not phonemenu, see setOption
      actions: ['runActionsOnInput']
    }, {
      title: $translate.instant('autoAttendant.actionRouteCall'),
      controller: 'AARouteCallMenuCtrl as aaRouteCallMenu',
      url: 'modules/huron/features/autoAttendant/routeCall/aaRouteCallMenu.tpl.html',
      hint: $translate.instant('autoAttendant.actionRouteCallHint'),
      help: $translate.instant('autoAttendant.routeCallMenuHelp'),
      metric: 'Route-Call-Title',
      showHelpLink: false,
      actions: ['route', 'goto', 'routeToUser', 'routeToVoiceMail', 'routeToHuntGroup', 'routeToQueue', 'routeToSipEndpoint']
    }];

    vm.actionPlaceholder = $translate.instant("autoAttendant.actionPlaceholder");
    vm.option = ""; // no default option
    vm.schedule = "";
    vm.selectHint = "";

    vm.getOptionController = getOptionController;
    vm.selectOption = selectOption;
    vm.getSelectHint = getSelectHint;
    vm.removeAction = removeAction;


    var PHONE_MENU_INDEX = 1;

    /////////////////////
    function selectOption() {
      // if we are selecting a phone menu, re-initialize uiMenu.entries[vm.index] with a CeMenu.
      if (vm.option.actions[0] === 'runActionsOnInput' && !_.has(vm.option, 'type')) {
        var menu = AutoAttendantCeMenuModelService.newCeMenu();
        menu.type = 'MENU_OPTION';
        var uiMenu = vm.ui[vm.schedule];
        uiMenu.entries[vm.index] = menu;
      }
      AACommonService.setActionStatus(true);
    }

    function getSelectHint() {
      if (!vm.selectHint) {
        _.each(vm.options, function (option, index) {
          if (option.title && option.hint) {
            vm.selectHint = vm.selectHint
              .concat("<i>")
              .concat(option.title)
              .concat("</i>")
              .concat(" - ")
              .concat(option.hint)
              .concat("<br>");
            if (index < vm.options.length - 1) {
              vm.selectHint = vm.selectHint.concat("<br>");
            }
          }
        });
      }

      return vm.selectHint;
    }

    function getOptionController() {
      if (vm.option && vm.option.controller) {
        return $controller(vm.option.controller, {
          $scope: $scope
        });
      }
    }

    function removeAction(index) {
      var uiMenu = vm.ui[vm.schedule];
      var entryI = uiMenu.entries[index];
      if (AutoAttendantCeMenuModelService.isCeMenu(entryI)) {
        AutoAttendantCeMenuModelService.deleteCeMenuMap(entryI.getId());
      }
      uiMenu.deleteEntryAt(index);

      AACommonService.setActionStatus(true);
    }

    function setOption() {
      if ($scope.index >= 0) {
        var menuEntry = vm.ui[vm.schedule].getEntryAt($scope.index);
        if (menuEntry.type == "MENU_OPTION") {
          vm.option = vm.options[PHONE_MENU_INDEX];
        } else if (menuEntry.actions.length > 0 && menuEntry.actions[0].getName()) {
          var matchType = function (action) {
            return menuEntry.actions[0].getName() === action &&
              (_.has(vm.options[i], 'type') ? _.includes(vm.options[i].type, menuEntry.actions[0].inputType) : true);
          };
          for (var i = 0; i < vm.options.length; i++) {
            var isMatch = vm.options[i].actions.some(matchType);
            if (isMatch) {
              vm.option = vm.options[i];
            }
          }
        }
      }
    }

    function setFeatureToggledActions() {
      if (AACommonService.isCallerInputToggle()) {
        vm.options.push({
          title: $translate.instant('autoAttendant.actionCallerInput'),
          controller: 'AACallerInputCtrl as aaCallerInput',
          url: 'modules/huron/features/autoAttendant/callerInput/aaCallerInput.tpl.html',
          hint: $translate.instant('autoAttendant.actionCallerInputHint'),
          help: $translate.instant('autoAttendant.actionCallerInputHelp') + appendSpecialCharHelp,
          metric: 'Caller-Input-Title',
          type: [3, 4],
          showHelpLink: true,
          actions: ['runActionsOnInput']
        });
      }
      if (AACommonService.isDecisionToggle()) {
        vm.options.push({
          title: $translate.instant('autoAttendant.actionDecision'),
          ifTitle: $translate.instant('autoAttendant.actionIfDecision'),
          controller: 'AADecisionCtrl as aaDecisionCtrl',
          url: 'modules/huron/features/autoAttendant/decision/aaDecision.tpl.html',
          hint: $translate.instant('autoAttendant.actionDecisionHint'),
          help: $translate.instant('autoAttendant.actionDecisionHelp'),
          metric: 'Decision-Title',
          showHelpLink: true,
          actions: ['conditional']
        });
      }
    }

    function activate() {
      setFeatureToggledActions();
      vm.index = $scope.index;
      vm.schedule = $scope.schedule;
      vm.ui = AAUiModelService.getUiModel();
      setOption();
      vm.options.sort(AACommonService.sortByProperty('title'));
    }

    activate();
  }
})();
