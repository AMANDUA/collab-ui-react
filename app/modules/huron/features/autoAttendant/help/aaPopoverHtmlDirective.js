(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .directive('aaPopoverHtmlPopup', aaPopoverHtmlPopup)
    .directive('aaPopoverHtml', aaPopoverHtml);

  /* @ngInject */
  function aaPopoverHtmlPopup() {
    return {
      restrict: 'EA',
      replace: true,
      scope: {
        title: '@',
        content: '@',
        placement: '@',
        animation: '&',
        isOpen: '&',
      },
      template: require('modules/huron/features/autoAttendant/help/aaPopoverHtmlPopup.tpl.html'),
    };
  }

  /* @ngInject */
  function aaPopoverHtml($tooltip) {
    return $tooltip('aaPopoverHtml', 'popover', 'click');
  }
})();
