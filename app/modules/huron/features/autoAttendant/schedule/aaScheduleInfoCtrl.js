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
      hours: [],
    }];
    vm.schedule = "";
    vm.openHours = [];
    vm.holidays = [];
    vm.laneTitle = '';
    vm.activate = activate;
    vm.isOpenClosed = isOpenClosed;
    vm.isClosed = isClosed;
    vm.isHolidays = isHolidays;
    vm.formatDate = formatDate;

    $scope.$on('ScheduleChanged', function () {
      if (vm.aaModel.aaRecord.scheduleId) {
        populateScheduleHours();
      }
    });

    function populateScheduleHours() {
      vm.dayGroup = [];
      vm.aaModel = AAModelService.getAAModel();
      vm.ui = AAUiModelService.getUiModel();
      populateHours();
    }

    function getHoursInfo() {
      var consolidateDate = {
        year: 2016,
        month: 3,
        date: 11,
      };
      //Prepares a list of days and the corresponding Open/Closed hours
      vm.days = angular.copy(AAICalService.getDefaultDayHours());
      _.forEach(vm.openhours, function (hour) {
        var dayhour = {
          starttime: 0,
          endtime: 0,
        };
        dayhour.starttime = moment(hour.starttime, "hh:mm A").set(consolidateDate);
        dayhour.endtime = moment(hour.endtime, "hh:mm A").set(consolidateDate);
        if (hour.endtime === '12:00 AM') {
          dayhour.endtime.add(1, 'day');
        }
        _.forEach(hour.days, function (wday, index) {
          if (wday.active) {
            addUniqueHours(vm.days[index], dayhour);
          }
        });
      });

      _.each(vm.days, function (day) {
        //order the hours of each day by starttime
        day.hours.sort(function (a, b) {
          return (a.starttime - b.starttime);
        });
      });

      //consolidate mulitple Hours if necessary
      _.each(vm.days, function (day) {
        consolidateHours(day.hours);
      });

      if (vm.schedule === 'closedHours') {
        getClosedHours(vm.days);
      }

      getFormattedOpenhours();
    }

    function addUniqueHours(day, dayhour) {
      if (!_.filter(day.hours, dayhour).length) {
        day.hours.push(angular.copy(dayhour));
      }
    }

    function is24HoursOpen(hour) {
      var hh = moment().set('hour', '00').set('minute', '00').format('hh:mm A');
      var endhh = moment().set('hour', '23').set('minute', '59').format('hh:mm A');
      return (moment(hour.starttime).format('hh:mm A') === hh &&
        moment(hour.endtime).format('hh:mm A') === endhh);
    }

    function consolidateHours(hours) {
      var range1, range2;
      for (var i = 0; i < hours.length; i++) {
        if (hours.length === 1) {
          return;
        }

        for (var j = i + 1; j < hours.length;) {
          var s1 = hours[i].starttime;
          var e1 = hours[i].endtime;
          range1 = moment().range(s1, e1);
          var s2 = hours[j].starttime;
          var e2 = hours[j].endtime;
          range2 = moment().range(s2, e2);
          if (range1.overlaps(range2) || range1.intersect(range2)) {
            var range3 = range1.add(range2);
            hours[i].starttime = range3.start;
            hours[i].endtime = range3.end;
            hours.splice(j, 1);
          } else if (range2.contains(s1) && range2.contains(e1)) {
            hours[i].starttime = s2;
            hours[i].endtime = e2;
            hours.splice(j, 1);
          } else if (range1.contains(s2) && range1.contains(e2)) {
            hours.splice(j, 1);
          } else if (range2.contains(e1)) {
            hours[i].starttime = s1;
            hours[i].endtime = e2;
            hours.splice(j, 1);
          } else {
            break;
          }
        }
      }
    }

    function getFormattedOpenhours() {
      if (vm.schedule === 'openHours') {
        _.each(vm.days, function (day) {
          _.each(day.hours, function (hour) {
            hour.starttime = moment(hour.starttime).format('hh:mm A');
            hour.endtime = moment(hour.endtime).format('hh:mm A');
          });
        });
      }
    }

    function getClosedHours() {
      var hh = moment().set('hour', '00').set('minute', '00').format('hh:mm A');
      var dayhour = {
        starttime: 0,
        endtime: 0,
      };
      var closedHours = angular.copy(AAICalService.getDefaultDayHours());
      _.each(vm.days, function (day, index) {
        if (_.isUndefined(day.hours) || day.hours.length === 0) {
          //Inactive days will have all day closed 12:00am  - 12:00am
          dayhour.starttime = hh;
          dayhour.endtime = hh;
          addUniqueHours(closedHours[index], dayhour);
        }
        _.each(day.hours, function (hour, i) {
          var numberOfHours = day.hours.length;
          if (!is24HoursOpen(hour)) {
            var starttime = moment(hour.starttime).format('hh:mm A');
            var endtime = moment(hour.endtime).format('hh:mm A');
            if (!i && moment(hour.starttime).format('hh:mm A') !== hh) {
              //First interval starts at 12:00AM if it is not part of open hours
              dayhour.starttime = hh;
              dayhour.endtime = starttime;
              addUniqueHours(closedHours[index], dayhour);
            }
            if (i + 1 < numberOfHours) {
              dayhour.starttime = endtime;
              dayhour.endtime = moment(day.hours[i + 1].starttime).format('hh:mm A');
              addUniqueHours(closedHours[index], dayhour);
            }
            if (i + 1 === numberOfHours && moment(hour.endtime).format('hh:mm A') !== hh) {
              //last interval ends with 12:00AM if it is not part of open hours
              dayhour.starttime = endtime;
              dayhour.endtime = hh;
              addUniqueHours(closedHours[index], dayhour);
            }
          }
        });
      });
      vm.days = angular.copy(closedHours);
    }

    function prepareDayHourReport() {

      //Groups the days together in a range if the hours are same.
      vm.dayGroup = [];
      var indices = [];
      var indexListed = [];
      _.forEach(vm.days, function (wday, index) {
        var hour1 = wday.hours;
        var isIndexPresent = _.includes(indexListed, index);
        if (hour1.length && hour1[0].starttime && hour1[0].endtime && !isIndexPresent) {
          var range = {
            hours: [],
            label: '',
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
                  dayLabel = dayLabel + ', ';
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

          getScheduleTitle();

          if (!_.isUndefined(vm.holidays) && vm.holidays.length && vm.openhours.length === 0) {
            var open24hours = AAICalService.getDefaultRange();
            _.forEach(open24hours.days, function (day) {
              day.active = true;
            });
            open24hours.starttime = '12:00 AM';
            open24hours.endtime = '12:00 AM';
            vm.openhours = [open24hours];
          }

          if (vm.isOpenClosed() && !_.isUndefined(vm.openhours) && vm.openhours.length) {
            getHoursInfo();
            prepareDayHourReport();
          }
        });
      }
    }

    function getScheduleTitle() {
      if (vm.schedule === 'openHours') {
        vm.laneTitle = $translate.instant('autoAttendant.scheduleOpen');
      } else if (vm.schedule === 'closedHours' && vm.ui.holidaysValue === 'closedHours') {
        vm.laneTitle = $translate.instant('autoAttendant.scheduleClosedHolidays');
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
      return (vm.schedule === 'holidays' && !_.isUndefined(vm.holidays) && vm.holidays.length) || (vm.schedule === 'closedHours' && vm.ui.holidaysValue === 'closedHours');
    }

    function formatDate(dt) {
      return (moment(dt).format('MMM') === 'May') ? moment(dt).format('MMM DD, YYYY') : moment(dt).format('MMM. DD, YYYY');
    }

    function activate() {
      vm.schedule = $scope.schedule;
      vm.aaModel = AAModelService.getAAModel();
      vm.ui = AAUiModelService.getUiModel();
      populateHours();
    }

    activate();
  }
})();
