(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .controller('AAScheduleInfoCtrl', AAScheduleInfoCtrl);

  /* @ngInject */
  function AAScheduleInfoCtrl($scope, AAICalService, AACalendarService, AAModelService, AAUiModelService, $translate) {

    var vm = this;
    /* schedule model  */
    vm.dayGroup = [{
      label: '',
      hours: []
    }];
    vm.schedule = "";
    vm.openHours = [];
    vm.holidays = [];
    vm.activate = activate;
    vm.laneTitle = '';
    vm.isOpenClosed = isOpenClosed;
    vm.isClosed = isClosed;
    vm.isHolidays = isHolidays;
    vm.formatDate = formatDate;
    vm.formatTime = formatTime;
    vm.isStartTimeSet = false;

    $scope.$on('ScheduleChanged', function () {
      if (vm.aaModel.aaRecord.scheduleId) {
        populateScheduleHours();
      }
    });

    vm.scheduleClass = 'aa-panel-body';

    function populateScheduleHours() {
      vm.dayGroup = [];
      vm.aaModel = AAModelService.getAAModel();
      vm.ui = AAUiModelService.getUiModel();
      populateHours();
    }

    function getHoursInfo() {
      //Prepares a list of days and the corresponding Open/Closed hours
      vm.days = angular.copy(AAICalService.getDefaultDayHours());
      var hh = moment().set('hour', '00').set('minute', '00').format('hh:mm a');
      var endhh = moment().set('hour', '23').set('minute', '59').format('hh:mm a');
      _.forEach(vm.openhours, function (hour) {
        var dayhour = {
          starttime: 0,
          endtime: 0
        };
        getScheduleHours(hour, dayhour);
        var start = dayhour.starttime;
        var end = dayhour.endtime;
        _.forEach(hour.days, function (wday, windex) {
          if (wday.active) {
            _.each(vm.days, function (day, index) {
              if (day.label === wday.label) {
                if (vm.schedule === 'closedHours') {
                  //Determine closed hours by getting hours not included in Openhours
                  dayhour.starttime = hh;
                  dayhour.endtime = start;
                  vm.days[index].hours.push(angular.copy(dayhour));
                  dayhour.starttime = end;
                  dayhour.endtime = endhh;
                }
                vm.days[index].hours.push(angular.copy(dayhour));
              }
            });
          }
          if (!wday.active && vm.schedule === 'closedHours') {
            //Inactive days will have all day closed 12:00am  - 11:59pm
            _.each(vm.days, function (day, index) {
              if (!vm.days[index].hours.length && day.label === wday.label) {
                dayhour.starttime = hh;
                dayhour.endtime = endhh;
                vm.days[index].hours.push(angular.copy(dayhour));
              }
            });
          }
        });
      });
    }

    function getScheduleHours(hour, dayhour) {
      if (vm.schedule === 'openHours') {
        dayhour.starttime = moment(hour.starttime).format('hh:mm a');
        dayhour.endtime = moment(hour.endtime).format('hh:mm a');
      } else if (vm.schedule === 'closedHours') {
        dayhour.starttime = moment(hour.starttime).subtract(1, 'm').format('hh:mm a');
        dayhour.endtime = moment(hour.endtime).add(1, 'm').format('hh:mm a');
      }
    }

    function prepareDayHourReport() {

      //Groups the days together in a range if the hours are same.
      vm.dayGroup = [];
      var indices = [];
      var indexListed = [];
      _.forEach(vm.days, function (wday, index) {
        var hour1 = wday.hours;
        var isIndexPresent = _.contains(indexListed, index);
        if (hour1.length && !isIndexPresent) {
          var range = {
            hours: [],
            label: ''
          };
          indices = [];
          indices.push(index);
          indexListed.push(index);
          range.hours = angular.copy(hour1);
          for (var i = index + 1; i < vm.days.length; i++) {
            var hour2 = vm.days[i].hours;
            if (hour1.length && hour2.length && hour1.length === hour2.length) {
              if (angular.equals(hour1, hour2)) {
                indices.push(i);
                indexListed.push(i);
              }
            }
          }
          if (indices.length >= 1) {
            var len = indices.length;
            var dayLabel = '';
            if (len > 1 && (indices[len - 1] - indices[0]) === len - 1) {
              dayLabel = (vm.days[indices[0]].label) + ' - ' + (vm.days[indices[len - 1]].label);
            } else {
              _.each(indices, function (index) {
                if (dayLabel !== '') {
                  dayLabel = dayLabel + ',';
                }
                dayLabel = dayLabel + (vm.days[index].label);
              });
            }
            range.label = dayLabel;
            vm.dayGroup.push(range);
          }
        }

      });
    }

    function populateHours() {
      if (vm.aaModel.aaRecord.scheduleId) {
        AACalendarService.readCalendar(vm.aaModel.aaRecord.scheduleId).then(function (data) {
          var calhours = AAICalService.getHoursRanges(data);
          vm.openhours = angular.copy(calhours.hours);
          vm.holidays = calhours.holidays;
          if (angular.isDefined(vm.openhours) && vm.openhours.length || angular.isDefined(vm.holidays) && vm.holidays.length) {
            vm.isStartTimeSet = isStartTimePresent();
            getScheduleTitle();
            getHoursInfo();
            prepareDayHourReport();
            vm.scheduleClass = (vm.isStartTimeSet) ? 'aa-schedule-body' : 'aa-panel-body';
          }
        });
      }
    }

    function getScheduleTitle() {
      if (vm.schedule === 'openHours') {
        vm.laneTitle = $translate.instant('autoAttendant.scheduleOpen');
      } else if (vm.schedule === 'closedHours') {
        vm.laneTitle = $translate.instant('autoAttendant.scheduleClosed');
      } else if (vm.schedule === 'holidays') {
        vm.laneTitle = $translate.instant('autoAttendant.scheduleHolidays');
      }
    }

    function isOpenClosed() {
      return (vm.schedule === 'openHours' || vm.schedule === 'closedHours');
    }

    function isClosed() {
      return (vm.schedule === 'closedHours' && (vm.holidays));
    }

    function isHolidays() {
      return (vm.schedule === 'holidays' && angular.isDefined(vm.holidays) && vm.holidays.length);
    }

    function formatTime(tt) {
      return (tt) ? moment(tt).format('h:mm a') : 0;
    }

    function formatDate(dt) {
      return (moment(dt).format('MMM') === 'May') ? moment(dt).format('MMM DD, YYYY') : moment(dt).format('MMM. DD, YYYY');
    }

    function isStartTimePresent() {
      var flag = false;
      _.each(vm.holidays, function (day) {
        if (day.starttime) {
          flag = true;
        }
      });
      return flag;
    }

    function activate() {
      vm.schedule = $scope.schedule;
      vm.aaModel = AAModelService.getAAModel();
      populateHours();
    }

    activate();
  }
})();
