(function () {
  'use strict';

  angular
  .module('uc.autoattendant')
  .controller('AADecisionCtrl', AADecisionCtrl);

  /* @ngInject */
  function AADecisionCtrl($scope, $translate /*, QueueHelperService*/, AACommonService, AAUiModelService, AutoAttendantCeMenuModelService, AAModelService, AASessionVariableService) {

    var vm = this;

    var actionName = 'conditional';
    vm.queues = [];

    vm.menuEntry = {};
    vm.actionEntry = {};

    vm.selectConditionPlaceholder = $translate.instant('autoAttendant.selectConditionPlaceholder');
    vm.selectActionPlaceholder = $translate.instant('autoAttendant.selectActionPlaceholder');
    vm.selectVariablePlaceholder = $translate.instant('autoAttendant.selectVariablePlaceholder');
    vm.varMissingWarning = $translate.instant('autoAttendant.decisionMissingCustomVariable');

    vm.ifOption = {
      label: '',
      value: '',
    };
    vm.isWarn = false;

    vm.sessionVarOption = '';

    vm.sessionVarOptions = [];

    vm.ifOptions = [{
      /* caller returned not implemented yet */
      label: $translate.instant('autoAttendant.decisionCallerReturned'),
      value: 'callerReturned',
      buffer: '',
    }, {
      label: $translate.instant('autoAttendant.decisionNumberDialed'),
      value: 'Original-Called-Number',
      buffer: '',
    }, {
      label: $translate.instant('autoAttendant.decisionCallerNumber'),
      value: 'Original-Caller-Number',
      buffer: '',
    }, {
      label: $translate.instant('autoAttendant.decisionCallerName'),
      value: 'Original-Remote-Party-ID',
      buffer: '',
    }, {
      label: $translate.instant('autoAttendant.decisionCallerCountryCode'),
      value: 'Original-Caller-Country-Code',
      buffer: '',
    }, {
      label: $translate.instant('autoAttendant.decisionCallerAreaCode'),
      value: 'Original-Caller-Area-Code',
      buffer: '',
    }];

    vm.thenOption = {
      label: '',
      value: '',
    };

    vm.thenOptions = [{
      label: $translate.instant('autoAttendant.phoneMenuRouteHunt'),
      value: 'routeToHuntGroup',
    }, {
      label: $translate.instant('autoAttendant.phoneMenuRouteAA'),
      value: 'goto',
    }, {
      label: $translate.instant('autoAttendant.phoneMenuRouteUser'),
      value: 'routeToUser',
    }, {
      label: $translate.instant('autoAttendant.phoneMenuRouteVM'),
      value: 'routeToVoiceMail',
    }, {
      label: $translate.instant('autoAttendant.phoneMenuRouteToExtNum'),
      value: 'route',
    }];

    /* caller returned options will be implemented later */
    vm.callerReturnedOption = {
      label: $translate.instant('autoAttendant.callerReturnedOneWeek'),
      value: 'One Week',
    };

    vm.callerReturnedOptions = [{
      label: $translate.instant('autoAttendant.callerReturned5Mins'),
      value: '5 mins',
    }, {
      label: $translate.instant('autoAttendant.callerReturnedOneDay'),
      value: 'One Day',
    }, {
      label: $translate.instant('autoAttendant.callerReturnedOneWeek'),
      value: 'One Week',
    }, {
      label: $translate.instant('autoAttendant.callerReturnedTwoWeeks'),
      value: 'Two Week',
    }, {
      label: $translate.instant('autoAttendant.callerReturnedOneMonth'),
      value: 'One Month',
    }, {
      label: 'How about Never?',
      value: 'Never',
    }];

    vm.setIfDecision = setIfDecision;
    vm.update = update;

    /////////////////////
    function update(which) {

      AACommonService.setDecisionStatus(true);

      var option = _.find(vm.ifOptions, { 'value': which });
      vm.actionEntry.if.rightCondition = option.buffer;

    }

    function createDecisionAction() {
      var action = AutoAttendantCeMenuModelService.newCeActionEntry(actionName, '');
      action.if = {};
      action.if.leftCondition = '';
      action.if.rightCondition = '';
      /* the various controller, routeTo's, will create a 'then' action for their type */

      return action;

    }
    function setIfDecision() {
      if (vm.ifOption.value == 'sessionVariable') {
        vm.actionEntry.if.leftCondition = vm.sessionVarOption;

        // no warning if blank leftCondition - first time through
        vm.isWarn = vm.actionEntry.if.leftCondition ? !_.includes(vm.sessionVarOptions, vm.actionEntry.if.leftCondition) : false;

      } else {
        vm.isWarn = false;
        vm.actionEntry.if.leftCondition = vm.ifOption.value;
      }
      var option = _.find(vm.ifOptions, { 'value': vm.ifOption.value });
      vm.actionEntry.if.rightCondition = option.buffer;

      AACommonService.setDecisionStatus(true);

    }

    function getAction(menuEntry) {
      var action;

      action = _.get(menuEntry, 'actions[0]');

      if (_.get(action, 'name', '') === actionName) {
        return action;
      }

      return undefined;

    }
    function addSessionObject() {
      vm.ifOptions.push({
        label: $translate.instant('autoAttendant.decisionSessionVariable'),
        value: 'sessionVariable',
        buffer: '',
      });
    }

    function setActionEntry() {
      var ui = AAUiModelService.getUiModel();
      var uiMenu = ui[$scope.schedule];
      vm.menuEntry = uiMenu.entries[$scope.index];
      var action = getAction(vm.menuEntry);
      if (!action) {
        action = createDecisionAction();
        vm.menuEntry.addAction(action);
      }

      vm.actionEntry = action;
    }

    function populateMenu() {
      if (vm.actionEntry.if.leftCondition) {

        vm.ifOption = _.find(vm.ifOptions, { 'value': vm.actionEntry.if.leftCondition });
        if (!vm.ifOption) {
          vm.ifOption = _.find(vm.ifOptions, { 'value': 'sessionVariable' });
          if (!vm.ifOption) {
            addSessionObject();
            vm.ifOption = vm.ifOptions[vm.ifOptions.length - 1];
          }
          vm.isWarn = !_.includes(vm.sessionVarOptions, vm.actionEntry.if.leftCondition);
          vm.sessionVarOption = vm.actionEntry.if.leftCondition;
        }
        vm.ifOption.buffer = vm.actionEntry.if.rightCondition;
      }
      if (_.has(vm.actionEntry, 'then.name')) {
        vm.thenOption = _.find(vm.thenOptions, { 'value': vm.actionEntry.then.name });
      }

    }
    /* No support for Queues as of this story US260317
     *

    function getQueues() {
      return QueueHelperService.listQueues().then(function (aaQueueList) {
        if (aaQueueList.length > 0) {
          vm.thenOptions.push({
            "label": $translate.instant('autoAttendant.phoneMenuRouteQueue'),
            "value": 'routeToQueue'
          });
          _.each(aaQueueList, function (aaQueue) {
            var idPos = aaQueue.queueUrl.lastIndexOf("/");
            vm.queues.push({
              description: aaQueue.queueName,
              id: aaQueue.queueUrl.substr(idPos + 1)
            });
          });
        }
      });
    }
    */


    function sortAndSetActionType() {
      vm.thenOptions.sort(AACommonService.sortByProperty('label'));
    }

    function activate() {
      /* remove callerReturned until US264303 */
      vm.ifOptions.splice(0, 1);

      setActionEntry();
      sortAndSetActionType();

      populateMenu();
    }

    function init() {
      AASessionVariableService.getSessionVariables(AAModelService.getAAModel().aaRecordUUID).then(function (data) {
        if (!_.isUndefined(data) && data.length > 0) {
          vm.sessionVarOptions = data;
          vm.sessionVarOptions.sort();
          addSessionObject();
        }
      }).finally(function () {
        /* no support for Queues as of this story.
         * if (AACommonService.isRouteQueueToggle()) {
         *
         * getQueues().finally(activate);
         * } else {
         */
        activate();
        /* } */
      });
    }

    init();

  }

})();
