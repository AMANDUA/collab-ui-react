(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .factory('AAValidationService', AAValidationService);

  /* @ngInject */
  function AAValidationService(AAModelService, AutoAttendantCeInfoModelService, AutoAttendantCeMenuModelService, AANotificationService, AACommonService, $translate) {

    var routeToCalls = [{
      'name': 'goto',
      errRCMsg: 'autoAttendant.routeCallErrorRouteToAATargetMissing',
      errPhoneMsg: 'autoAttendant.phoneMenuErrorRouteToAATargetMissing',
      errSubMenuPhoneMsg: 'autoAttendant.phoneMenuSubmenuErrorRouteToAATargetMissing'
    }, {
      name: 'routeToHuntGroup',
      errRCMsg: 'autoAttendant.routeCallErrorRouteToHGTargetMissing',
      errPhoneMsg: 'autoAttendant.phoneMenuErrorRouteToHGTargetMissing',
      errSubMenuPhoneMsg: 'autoAttendant.phoneMenuSubmenuErrorRouteToHGTargetMissing'
    }, {
      name: 'routeToUser',
      errRCMsg: 'autoAttendant.routeCallErrorRouteToUserTargetMissing',
      errPhoneMsg: 'autoAttendant.phoneMenuErrorRouteToUserTargetMissing',
      errSubMenuPhoneMsg: 'autoAttendant.phoneMenuSubmenuErrorRouteToUserTargetMissing'
    }, {
      name: 'routeToVoiceMail',
      errRCMsg: 'autoAttendant.routeCallErrorRouteToVoicemailTargetMissing',
      errPhoneMsg: 'autoAttendant.phoneMenuErrorRouteToVoicemailTargetMissing',
      errSubMenuPhoneMsg: 'autoAttendant.phoneMenuSubmenuErrorRouteToVoicemailTargetMissing'
    }, {
      name: 'route',
      errRCMsg: 'autoAttendant.routeCallErrorRouteToPhoneNumberTargetMissing',
      errPhoneMsg: 'autoAttendant.phoneMenuErrorRouteToPhoneNumberTargetMissing',
      errSubMenuPhoneMsg: 'autoAttendant.phoneMenuSubmenuErrorRouteToPhoneNumberTargetMissing'
    }, {
      name: 'routeToQueue',
      /* not implemented */
      errRCMsg: '',
      errPhoneMsg: 'autoAttendant.phoneMenuErrorRouteToQueueTargetMissing',
      errSubMenuPhoneMsg: 'autoAttendant.phoneMenuSubmenuErrorRouteToQueueTargetMissing'
    }];


    var runActionInputName = 'runActionsOnInput';
    var errMissingVariableNameMsg = 'autoAttendant.callerInputMenuErrorVariableNameMissing';
    var errNoInputValuesEnteredMsg = 'autoAttendant.callerInputMenuErrorNoInputValuesEntered';

    var service = {
      isNameValidationSuccess: isNameValidationSuccess,
      isRouteToValidationSuccess: isRouteToValidationSuccess
    };

    return service;

    /////////////////////

    function isNameValidationSuccess(name, uuid) {
      var aaModel = AAModelService.getAAModel();

      if (_.trim(name).length === 0) {
        AANotificationService.error('autoAttendant.invalidBuilderNameMissing');
        return false;
      }

      if (_.isUndefined(uuid)) {
        return false;
      }

      for (var i = 0; i < aaModel.ceInfos.length; i++) {
        if ((uuid !== AutoAttendantCeInfoModelService.extractUUID(aaModel.ceInfos[i].ceUrl)) && (name === aaModel.ceInfos[i].getName())) {
          AANotificationService.error('autoAttendant.invalidBuilderNameNotUnique');
          return false;
        }
      }

      return true;
    }

    function actionValid(entry, whichLane) {
      var action;

      if (entry.type === 'MENU_OPTION' && _.isEmpty(entry.key)) {
        /* entry was a phone menu with no selected entry for the key, ignore */
        return true;
      }
      if (_.isEmpty(entry.actions[0])) {
        /* no actions to validate */
        return true;
      }

      action = entry.actions[0];

      if (_.isEmpty(action.name)) {
        /* no actions to validate */
        return true;
      }

      // special case - when action is route we need to check for valid phone number
      if (action.name === 'route') {
        /* AACommonService maintains a list which looks like:
           holiday-0menu3 for phoneMenu
           holiday-1 for route call (route call menu 2)
        */

        var ret = AACommonService.getInvalid(AACommonService.makeKey(whichLane, entry.routeToId));
        /* getInvalid returns false if an error, undefined if no error */
        return _.isUndefined(ret);

      }
      /* checking entry for blank value. Not empty? auto passes */
      if (!_.isEmpty(action.value)) {
        return true;
      }

      return false;

    }

    /* whichMenu - index into the original array..position in the lane of this screen
       whichLane - openHours, closeHours, holiday
     */
    function checkAllActions(optionMenu, whichLane) {
      var msg;

      if (actionValid(optionMenu, whichLane)) {
        return;
      }

      /* got here? error */

      msg = _.find(routeToCalls, {
        name: optionMenu.actions[0].name
      });

      /* might be Say Message, not in the routeCalls list */
      if (msg) {
        return msg.errRCMsg;
      }

      return;
    }

    /* whichLane - openHours, closeHours, holiday */

    function checkAllKeys(optionMenu, whichLane, outErrors) {

      _.forEach(optionMenu.entries, function (entry) {

        /* will be defined only if a submenu. We can make use of this later to
         * differentiate btw menu and sub menus for the error condition
         */

        var saveKey = optionMenu.key;
        if (AutoAttendantCeMenuModelService.isCeMenu(entry)) {
          checkAllKeys(entry, whichLane, outErrors);
          return;
        } else {
          if (actionValid(entry, whichLane)) {
            return;
          }
        }

        /* got here? error */

        _.find(routeToCalls, function (routeTo) {
          if (routeTo.name === entry.actions[0].name) {
            if (_.isUndefined(saveKey)) {
              outErrors.push({
                msg: routeTo.errPhoneMsg,
                key: entry.key
              });
            } else {
              outErrors.push({
                msg: routeTo.errSubMenuPhoneMsg,
                key: saveKey,
                subkey: entry.key
              });

            }

            return;

          }

        });

      });

      return outErrors;

    }

    function checkForValidCallerInputs(callerInputMenu, callerInputMenus, fromLane, translatedLabel) {

      var action = callerInputMenu.actions[0];
      var validAction = true;
      var atLeastOneNonBlank = false;

      // special case number two - runActionsOnInput inputType === 3,4
      if (_.get(action, 'name', '') === runActionInputName && _.includes([AACommonService.DIGITS_RAW, AACommonService.DIGITS_CHOICE], action.inputType)) {
        if (_.isEmpty(action.variableName)) {
          validAction = false;
          AANotificationService.error(errMissingVariableNameMsg, {
            schedule: translatedLabel,
            at: _.indexOf(callerInputMenus, callerInputMenu) + 1
          });

        }

        if (action.inputType === 4) {
          if (!action.inputActions || action.inputActions.length === 0) {
            validAction = false;
            AANotificationService.error(errNoInputValuesEnteredMsg, {
              schedule: translatedLabel,
              at: _.indexOf(callerInputMenus, callerInputMenu) + 1
            });
          }

          _.forEach(action.inputActions, function (inputItem) {
            if (!_.isEmpty(_.get(inputItem, 'value', ''))) {
              atLeastOneNonBlank = true;
            }
          });

          if (!atLeastOneNonBlank) {
            validAction = false;
            AANotificationService.error(errNoInputValuesEnteredMsg, {
              schedule: translatedLabel,
              at: _.indexOf(callerInputMenus, callerInputMenu) + 1
            });
          }
        }
      }
      return validAction;
    }

    function checkForValidPhoneMenu(optionMenu, menuOptions, fromLane, translatedLabel) {
      var errors = [];
      var isValid = true;

      if (_.has(optionMenu, 'entries')) {
        checkAllKeys(optionMenu, fromLane, errors, 0);
      }

      _.forEach(errors, function (err) {
        isValid = false;

        if (_.has(err, 'subkey')) {
          AANotificationService.error(err.msg, {
            key: err.key,
            schedule: translatedLabel,
            at: _.indexOf(menuOptions, optionMenu) + 1,
            subkey: err.subkey
          });

        } else {

          AANotificationService.error(err.msg, {
            key: err.key,
            schedule: translatedLabel,
            at: _.indexOf(menuOptions, optionMenu) + 1
          });
        }

      });

      return isValid;

    }

    function checkForValidRouteCall(optionMenu, routeTosOnly, fromLane, translatedLabel) {

      var isValid = true;

      var error = checkAllActions(optionMenu, fromLane);

      if (error) {
        isValid = false;

        AANotificationService.error(error, {
          schedule: translatedLabel,
          at: _.indexOf(routeTosOnly, optionMenu) + 1
        });
      }

      return isValid;
    }

    function isRouteToValidationSuccess(ui) {
      var openHoursValid = true;
      var closedHoursValid = true;
      var holidaysValid = true;

      var closedHoursLabel = $translate.instant('autoAttendant.scheduleClosed');
      var holidayHoursLabel = $translate.instant('autoAttendant.scheduleHolidays');
      var openHoursLabel = $translate.instant('autoAttendant.scheduleOpen');
      var closedHolidayHoursLabel = $translate.instant('autoAttendant.scheduleClosedHolidays');

      /* check holiday value to determine if holiday uses open closed or holiday lane */

      var closedHoliday = _.get(ui, 'holidaysValue') === 'closedHours';
      if (ui.isOpenHours && _.has(ui, 'openHours.entries')) {
        openHoursValid = checkForValid(ui.openHours, 'openHours', openHoursLabel);
      }
      if (ui.isClosedHours && _.has(ui, 'closedHours.entries')) {
        closedHoursValid = checkForValid(ui.closedHours, 'closedHours',
          closedHoliday ? closedHolidayHoursLabel : closedHoursLabel);
      }

      /* if holiday follows closed behavior, then don't validate */
      if (ui.isHolidays && (!closedHoliday) && _.has(ui, 'holidays.entries')) {
        holidaysValid = checkForValid(ui.holidays, 'holidays', holidayHoursLabel);
      }

      return openHoursValid && closedHoursValid && holidaysValid;

    }

    function checkForValid(uiCombinedMenu, fromLane, scheduleLabel) {
      var isValid = true;

      /* save menuOptions array so we can compute which Phone menu  had
         the offending field */

      var menuOptions = _.filter(uiCombinedMenu.entries, {
        'type': 'MENU_OPTION'
      });

      /* segregate the RouteCall menus so we can determine which
         RouteCall menu has the error
       */

      var routeTosOnly = _.filter(uiCombinedMenu.entries, function (menu) {
        var actionName = _.get(menu, 'actions[0].name');
        return _.find(routeToCalls, {
          'name': actionName
        });
      });

      var callerInputsOnly = _.filter(uiCombinedMenu.entries, function (menu) {
        return _.includes([AACommonService.DIGITS_RAW, AACommonService.DIGITS_CHOICE], _.get(menu, 'actions[0].inputType', ""));
      });

      _.forEach(uiCombinedMenu.entries, function (optionMenu) {

        if (optionMenu.type === 'MENU_OPTION') {
          if (!checkForValidPhoneMenu(optionMenu, menuOptions, fromLane, scheduleLabel)) {
            isValid = false;
          }
        } else {
          if (!checkForValidCallerInputs(optionMenu, callerInputsOnly, fromLane, scheduleLabel)) {
            isValid = false;
          }

          /* else must be welcome menu - process routeCalls */
          if (!checkForValidRouteCall(optionMenu, routeTosOnly, fromLane, scheduleLabel)) {
            isValid = false;
          }
        }
      });

      return isValid;

    }
  }
})();
