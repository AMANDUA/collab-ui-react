(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .directive('aaTimeoutInvalid', aaTimeoutInvalid);

  function aaTimeoutInvalid() {
    return {
      restrict: 'E',
      scope: {
        schedule: '@aaSchedule',
        menuId: '@aaMenuId',
        index: '=aaIndex',
        keyIndex: '@aaKeyIndex',
      },
      controller: 'AATimeoutInvalidCtrl',
      controllerAs: 'aaTimeoutInvalidCtrl',
      templateUrl: 'modules/huron/features/autoAttendant/timeoutInvalid/aaTimeoutInvalid.tpl.html',
    };
  }
})();
