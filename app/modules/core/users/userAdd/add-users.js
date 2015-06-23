'use strict';

angular.module('Core')
  .directive('crAddUsers', function () {
    return {
      restrict: 'EA',
      templateUrl: 'modules/core/users/userAdd/add-users.html',
      controller: 'OnboardCtrl',
      scope: true
    };
  });
