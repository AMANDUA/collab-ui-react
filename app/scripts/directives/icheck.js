'use strict';

//Setting it to false just for this file because it does not recognize jQuery's '$' symbol.
/* global $ */

angular.module('wx2AdminWebClientApp')
  .directive('icheck', function($timeout) {
    return {
      require: 'ngModel',
      link: function($scope, element, $attrs, ngModel) {
        return $timeout(function() {
          var value;
          value = $attrs.value;

          $scope.$watch($attrs.ngModel, function() {
            $(element).iCheck('update');
          });

          return $(element).iCheck({
            checkboxClass: 'icheckbox_square-blue'
          }).on('ifChanged', function(event) {
            if ($(element).attr('type') === 'checkbox' && $attrs.ngModel) {
              $scope.$apply(function() {
                return ngModel.$setViewValue(event.target.checked);
              });
            }
            $scope.validateEntitlements(element);
          });
        });
      }
    };
  });
