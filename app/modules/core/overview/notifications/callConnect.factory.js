(function () {
  'use strict';

  angular
    .module('Core')
    .factory('OverviewCallConnectNotification', OverviewCallConnectNotification);

  /* @ngInject */
  function OverviewCallConnectNotification($state, ServiceDescriptor) {
    return {
      createNotification: function createNotification() {
        var notification = {
          badgeText: 'common.new',
          badgeType: 'success',
          canDismiss: true,
          dismiss: function () {
            ServiceDescriptor.acknowledgeService('call-connect-service');
          },
          link: function () {
            $state.go('call-service.list');
          },
          linkText: 'homePage.getStarted',
          name: 'callConnect',
          text: 'homePage.setUpCallConnectService',
        };

        return notification;
      },
    };
  }
})();
