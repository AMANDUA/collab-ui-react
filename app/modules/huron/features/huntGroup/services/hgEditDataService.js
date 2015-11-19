(function () {
  'use strict';

  /**
   * A factory to take care of editing hunt groups. It keeps a pristine
   * copy as the base to revert back when a cancel is fired from UI. The
   * pristine will be updated on every successful PUT operation.
   */

  angular
    .module('uc.hurondetails')
    .factory('HuntGroupEditDataService', HuntGroupEditDataService);

  /* @ngInject */

  function HuntGroupEditDataService(HuntGroupService, HuntGroupMemberDataService,
    HuntGroupFallbackDataService, TelephoneNumberService, Notification, $q) {

    var pristineHGData = {};

    var maxRingSecsValue = [{
      value: 10,
      label: "10 secs"
    }, {
      value: 15,
      label: "15 secs"
    }, {
      value: 20,
      label: "20 secs"
    }];

    var maxWaitMinsValue = [{
      value: 1,
      label: "1 mins"
    }, {
      value: 2,
      label: "2 mins"
    }, {
      value: 3,
      label: "3 mins"
    }];

    return {
      fetchHuntGroup: fetchHuntGroup,
      getPristine: getPristine,
      isFallbackDirty: isFallbackDirty,
      isMemberDirty: isMemberDirty,
      reset: reset,
      setPristine: setPristine,
      getMaxRingSecsOptions: getMaxRingSecsOptions,
      getMaxWaitMinsOptions: getMaxWaitMinsOptions
    };

    ////////////////

    function getMaxRingSecsOptions() {
      return maxRingSecsValue;
    }

    function getMaxWaitMinsOptions() {
      return maxWaitMinsValue;
    }

    function setPristine(updatedHG) {
      updateAllTimeoutFields(updatedHG);
      pristineHGData = angular.copy(updatedHG);
    }

    function updateAllTimeoutFields(updatedHG) {
      updatedHG.maxRingSecs = {
        value: updatedHG.maxRingSecs,
        label: updatedHG.maxRingSecs + " secs"
      };
      updatedHG.maxWaitMins = {
        value: updatedHG.maxWaitMins,
        label: updatedHG.maxWaitMins + " mins"
      };
    }

    function updatePilotNumberType(updatedHG) {
      updatedHG.numbers.forEach(function (n) {
        if (TelephoneNumberService.validateDID(n.number)) {
          n.type = HuntGroupService.NUMBER_FORMAT_DIRECT_LINE;
        } else {
          n.type = HuntGroupService.NUMBER_FORMAT_EXTENSION;
        }
      });
    }

    function reset() {
      pristineHGData = {};
    }

    function fetchHuntGroup(customerId, hgId) {
      return HuntGroupService.getDetails(customerId, hgId).then(function (backendData) {
        updatePilotNumberType(backendData);
        updateAllTimeoutFields(backendData);
        pristineHGData = backendData;
        return getPristine();
      });
    }

    function getPristine() {
      return angular.copy(pristineHGData);
    }

    function isFallbackDirty() {
      return HuntGroupFallbackDataService.isFallbackDirty(
        pristineHGData.fallbackDestination);
    }

    function isMemberDirty(userUuid) {
      var dirty = false;
      pristineHGData.members.some(function (m) {
        if (m.userUuid === userUuid) {
          dirty = HuntGroupMemberDataService.isMemberDirty(m);
        }
        return dirty;
      });
      return dirty;
    }
  }
})();
