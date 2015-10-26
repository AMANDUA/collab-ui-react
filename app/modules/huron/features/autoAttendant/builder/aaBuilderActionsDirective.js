'use strict';

angular
  .module('uc.autoattendant')
  .directive('aaBuilderActions', [
    function () {
      return {
        restrict: 'E',
        scope: {
          schedule: '@aaSchedule',
          index: '=aaIndex',
          addAction: '&aaAddAction'
        },
        controller: 'AABuilderActionsCtrl',
        controllerAs: 'actions',
        templateUrl: 'modules/huron/features/autoAttendant/builder/aaBuilderActions.tpl.html'
      };
    }
  ]);