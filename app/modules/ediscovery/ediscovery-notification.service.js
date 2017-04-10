(function () {
  'use strict';

  /* @ngInject */
  function EdiscoveryNotificationService($window, $translate, $timeout) {

    var ReportNotification = $window.Notification;

    function show(report) {
      var options = {
        icon: '/images/cisco_logo.png',
        body: report.displayName + ': ' + $translate.instant('ediscovery.reportStates.' + report.state),
      };
      var reportNotification = new ReportNotification($translate.instant('ediscovery.browserTabHeaderTitle'), options);
      $timeout(reportNotification.close.bind(reportNotification), 10000);
    }

    function notify(report) {
      if (ReportNotification && ReportNotification.permission === 'granted') {
        show(report);
      } else if (ReportNotification && ReportNotification.permission !== 'denied') {
        ReportNotification.requestPermission().then(function (permission) {
          if (permission === 'granted') {
            show(report);
          }
        });
      }
    }

    function notificationsEnabled() {
      return ReportNotification.permission === 'granted';
    }

    return {
      notify: notify,
      notificationsEnabled: notificationsEnabled,
    };
  }

  angular.module('Ediscovery')
    .service('EdiscoveryNotificationService', EdiscoveryNotificationService);
}());
