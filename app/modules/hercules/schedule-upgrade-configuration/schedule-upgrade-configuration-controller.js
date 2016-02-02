(function () {
  'use strict';

  angular
    .module('Hercules')
    .controller('ScheduleUpgradeConfigurationCtrl', ScheduleUpgradeConfigurationCtrl);

  /* @ngInject */
  function ScheduleUpgradeConfigurationCtrl($scope, $translate, Authinfo, ScheduleUpgradeService, NotificationService, TimezoneService) {
    var vm = this;
    vm.data = {}; // UI data
    vm.isAdminAcknowledged = true;
    vm.state = 'syncing'; // 'error' | 'idle'
    vm.errorMessage = '';
    vm.timeOptions = getTimeOptions();
    vm.dayOptions = getDayOptions();
    vm.timezoneOptions = getTimezoneOptions();
    vm.acknowledge = function (data) {
      return patch(data);
    };
    ScheduleUpgradeService.get(Authinfo.getOrgId(), vm.serviceType)
      .then(function (data) {
        vm.data = {
          scheduleTime: {
            label: labelForTime(data.scheduleTime),
            value: data.scheduleTime
          },
          scheduleDay: {
            label: labelForDay(data.scheduleDay),
            value: data.scheduleDay
          },
          scheduleTimeZone: {
            label: labelForTimezone(data.scheduleTimeZone),
            value: data.scheduleTimeZone
          }
        };
        vm.errorMessage = '';
        vm.isAdminAcknowledged = data.isAdminAcknowledged;
        vm.state = 'idle';
      }, function (error) {
        vm.errorMessage = error.message;
        vm.state = 'error';
      });

    $scope.$watch(function () {
      return vm.data;
    }, function saveNewData(newValue, oldValue) {
      if (newValue === oldValue || _.isEmpty(oldValue)) {
        return;
      }
      patch(newValue);
    }, true);

    function labelForTime(time) {
      var currentLanguage = $translate.use();
      if (currentLanguage === 'en_US') {
        return moment(time, ['HH:mm']).format('hh:mm A');
      } else {
        return time;
      }
    }

    function getTimeOptions() {
      var values = _.range(0, 24).map(function (time) {
        return _.padLeft(time, 2, '0') + ':00';
      });
      var labels = angular.copy(values);
      return _.map(values, function (value) {
        return {
          label: labelForTime(value),
          value: value
        };
      });
    }

    function labelForDay(day) {
      var keys = ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return $translate.instant('weekDays.everyDay', {
        day: $translate.instant('weekDays.' + keys[day])
      });
    }

    function getDayOptions() {
      var currentLanguage = $translate.use();
      var days = _.range(1, 8).map(function (day) {
        return {
          label: labelForDay(day),
          value: day
        };
      });
      // if USA, put Sunday first
      if (currentLanguage === 'en_US') {
        var sunday = days.pop();
        return [sunday].concat(days);
      } else {
        return days;
      }
    }

    function labelForTimezone(zone) {
      var map = TimezoneService.getCountryMapping();
      return map[zone] + ': ' + zone;
    }

    function getTimezoneOptions() {
      var timezones = moment.tz.names()
        .filter(function (zone) {
          var map = TimezoneService.getCountryMapping();
          return map[zone];
        })
        .map(function (zone) {
          return {
            'label': labelForTimezone(zone),
            'value': zone
          };
        })
        .sort(function (a, b) {
          return a['label'].localeCompare(b['label']);
        });
      return timezones;
    }

    function patch(data) {
      vm.state = 'syncing';
      return ScheduleUpgradeService.patch(Authinfo.getOrgId(), vm.serviceType, {
          scheduleTime: data.scheduleTime.value,
          scheduleTimeZone: data.scheduleTimeZone.value,
          scheduleDay: data.scheduleDay.value
        })
        .then(function () {
          NotificationService.removeNotification('acknowledgeScheduleUpgrade');
          vm.isAdminAcknowledged = true;
          vm.errorMessage = '';
          vm.state = 'idle';
        }, function (error) {
          vm.errorMessage = error.message;
          vm.state = 'error';
        });
    }
  }
}());
