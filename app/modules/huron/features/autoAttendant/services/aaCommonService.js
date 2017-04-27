(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .factory('AACommonService', AACommonService);

  function AACommonService(AutoAttendantCeMenuModelService) {

    var aaSayMessageForm = false;
    var aaPhoneMenuOptions = false;
    var aaCallerInputStatus = false;
    var aaDecisionStatus = false;
    var aaActionStatus = false;
    var aaDialByExtensionStatus = false;
    var aaCENumberStatus = false;
    var aaMediaUploadStatus = false;
    var aaQueueSettingsStatus = false;
    var mediaUploadToggle = false;
    var callerInputToggle = false;
    var routeSIPAddressToggle = false;
    var dynAnnounceToggle = false;
    var returnedCallerToggle = false;
    var uniqueId = 0;
    var restApiToggle = false;

    var invalidList = {};
    var service = {
      isFormDirty: isFormDirty,
      setSayMessageStatus: setSayMessageStatus,
      setPhoneMenuStatus: setPhoneMenuStatus,
      setCallerInputStatus: setCallerInputStatus,
      setDecisionStatus: setDecisionStatus,
      setActionStatus: setActionStatus,
      setDialByExtensionStatus: setDialByExtensionStatus,
      setCENumberStatus: setCENumberStatus,
      setMediaUploadStatus: setMediaUploadStatus,
      setQueueSettingsStatus: setQueueSettingsStatus,
      setMediaUploadToggle: setMediaUploadToggle,
      setCallerInputToggle: setCallerInputToggle,
      setRouteSIPAddressToggle: setRouteSIPAddressToggle,
      setRestApiToggle: setRestApiToggle,
      isRestApiToggle: isRestApiToggle,
      setDynAnnounceToggle: setDynAnnounceToggle,
      setReturnedCallerToggle: setReturnedCallerToggle,
      isDynAnnounceToggle: isDynAnnounceToggle,
      isCallerInputToggle: isCallerInputToggle,
      isMediaUploadToggle: isMediaUploadToggle,
      isRouteSIPAddressToggle: isRouteSIPAddressToggle,
      isReturnedCallerToggle: isReturnedCallerToggle,
      isValid: isValid,
      setIsValid: setIsValid,
      getInvalid: getInvalid,
      getUniqueId: getUniqueId,
      makeKey: makeKey,
      resetFormStatus: resetFormStatus,
      saveUiModel: saveUiModel,
      sortByProperty: sortByProperty,
      keyActionAvailable: keyActionAvailable,
      DIGITS_DIAL_BY: 2,
      DIGITS_RAW: 3,
      DIGITS_CHOICE: 4,
    };

    return service;

    /////////////////////

    function isFormDirty() {
      return aaQueueSettingsStatus || aaMediaUploadStatus || aaSayMessageForm || aaPhoneMenuOptions || aaCallerInputStatus || aaActionStatus || aaDialByExtensionStatus || aaCENumberStatus || aaDecisionStatus;
    }

    function isValid() {
      return (_.size(invalidList) === 0);
    }

    function getInvalid(which) {
      return invalidList[which];
    }

    function makeKey(schedule, tag) {
      /* Used by aaVerificationSuccess and aaRouteToExtNum */
      /* this is an attempt to (weakly) codify the keys used by getInvalid */

      return schedule + '-' + tag;
    }

    function getUniqueId() {
      return ++uniqueId;
    }

    function setIsValid(element, validity) {
      if (!validity) {
        invalidList[element] = validity;
      } else {
        delete invalidList[element];
      }
    }
    function setMediaUploadStatus(status) {
      aaMediaUploadStatus = status;
    }

    function resetFormStatus() {
      aaSayMessageForm = false;
      aaPhoneMenuOptions = false;
      aaCallerInputStatus = false;
      aaDecisionStatus = false;
      aaActionStatus = false;
      aaDialByExtensionStatus = false;
      aaMediaUploadStatus = false;
      aaQueueSettingsStatus = false;
      aaCENumberStatus = false;
      invalidList = {};
    }

    function setSayMessageStatus(status) {
      aaSayMessageForm = status;
    }

    function setPhoneMenuStatus(status) {
      aaPhoneMenuOptions = status;
    }
    function setCallerInputStatus(status) {
      aaCallerInputStatus = status;
    }
    function setDecisionStatus(status) {
      aaDecisionStatus = status;
    }
    function setActionStatus(status) {
      aaActionStatus = status;
    }

    function setDialByExtensionStatus(status) {
      aaDialByExtensionStatus = status;
    }

    function setCENumberStatus(status) {
      aaCENumberStatus = status;
    }

    function setDynAnnounceToggle(status) {
      dynAnnounceToggle = status;
    }
    function setQueueSettingsStatus(status) {
      aaQueueSettingsStatus = status;
    }

    function setMediaUploadToggle(status) {
      mediaUploadToggle = status;
    }

    function setCallerInputToggle(status) {
      callerInputToggle = status;
    }

    function setRouteSIPAddressToggle(status) {
      routeSIPAddressToggle = status;
    }

    function setReturnedCallerToggle(status) {
      returnedCallerToggle = status;
    }

    function isReturnedCallerToggle() {
      return returnedCallerToggle;
    }

    function setRestApiToggle(status) {
      restApiToggle = status;
    }

    function isDynAnnounceToggle() {
      return dynAnnounceToggle;
    }

    function isRestApiToggle() {
      return restApiToggle;
    }

    function isMediaUploadToggle() {
      return mediaUploadToggle;
    }

    function isCallerInputToggle() {
      return callerInputToggle;
    }

    function isRouteSIPAddressToggle() {
      return routeSIPAddressToggle;
    }

    function saveUiModel(ui, aaRecord) {
      var openHours = AutoAttendantCeMenuModelService.getCombinedMenu(aaRecord, 'openHours');
      var closedHours = AutoAttendantCeMenuModelService.getCombinedMenu(aaRecord, 'closedHours');
      var holidays = AutoAttendantCeMenuModelService.getCombinedMenu(aaRecord, 'holidays');
      if (ui.isOpenHours) {
        if (_.isUndefined(openHours)) {
          openHours = AutoAttendantCeMenuModelService.newCeMenu();
          openHours.setType('MENU_WELCOME');
        }
        AutoAttendantCeMenuModelService.updateCombinedMenu(aaRecord, 'openHours', openHours);
      }

      if (ui.isClosedHours || (ui.holidaysValue === 'closedHours' && ui.isHolidays)) {
        if (_.isUndefined(closedHours)) { //New
          closedHours = AutoAttendantCeMenuModelService.newCeMenu();
          closedHours.setType('MENU_WELCOME');
        }
        AutoAttendantCeMenuModelService.updateCombinedMenu(aaRecord, 'closedHours', closedHours);
      } else {
        AutoAttendantCeMenuModelService.deleteScheduleActionSetMap(aaRecord, 'closedHours');
      }

      if (ui.isHolidays && ui.holidaysValue !== 'closedHours') {
        if (_.isUndefined(holidays)) { //New
          holidays = AutoAttendantCeMenuModelService.newCeMenu();
          holidays.setType('MENU_WELCOME');
        }
        AutoAttendantCeMenuModelService.updateCombinedMenu(aaRecord, 'holidays', holidays, ui.holidaysValue);
      } else if (ui.isHolidays) {
        AutoAttendantCeMenuModelService.updateScheduleActionSetMap(aaRecord, 'holidays', ui.holidaysValue);
      } else {
        AutoAttendantCeMenuModelService.deleteScheduleActionSetMap(aaRecord, 'holidays', ui.holidaysValue);
      }

      AutoAttendantCeMenuModelService.updateDefaultActionSet(aaRecord, ui.hasClosedHours);
    }

  }

  /**
   * This will sort the string array based on the property passed.
   */
  var sortByProperty = function (property) {
    return function (a, b) {
      return a[property].toLocaleUpperCase().localeCompare(b[property].toLocaleUpperCase());
    };
  };

  /*
   * will cycle through key actions and extract already used keys.
   * return: a set of available keys
   */
  function keyActionAvailable(selectedKey, inputActions) {
    var keys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '#', '*'];

    _.forEach(inputActions, function (inputAction) {
      if (inputAction.key !== selectedKey) {
        _.pull(keys, inputAction.key);
      }

    });

    return keys;

  }
})();
