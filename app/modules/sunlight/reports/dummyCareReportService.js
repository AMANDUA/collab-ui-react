(function () {
  'use strict';

  angular.module('Sunlight')
    .service('DummyCareReportService', DummyCareReportService);

  /* @ngInject */
  function DummyCareReportService() {
    var dayFormat = 'MMM DD';
    var monthFormat = 'MMM';
    var hourFormat = 'HH:mm';

    return {
      dummyOrgStatsData: dummyOrgStatsData,
    };

    function dummyOrgStatsData(timeSelected) {
      var dummyGraph;
      var startTime, endTime;

      switch (timeSelected) {
        //today
        case 0:
          startTime = moment().startOf('day');
          endTime = moment().add(1, 'days').startOf('day');
          dummyGraph = getDataForToday((moment.range(startTime.add(1, 'hours').toDate(), endTime.toDate())), 'h', hourFormat, 10, 1);
          break;

        //yesterday
        case 1:
          startTime = moment().subtract(1, 'days').startOf('day');
          endTime = moment().startOf('day');
          dummyGraph = getDataForGivenRange((moment.range(startTime.add(1, 'hours').toDate(), endTime.toDate())), 'h', hourFormat, 10, 1);
          break;

        //last week
        case 2:
          startTime = moment().subtract(8, 'days').startOf('day');
          endTime = moment().subtract(1, 'days').startOf('day');
          dummyGraph = getDataForGivenRange((moment.range(startTime.add(1, 'days').toDate(), endTime.toDate())), 'd', dayFormat, 100, 15);
          break;

        //last month
        case 3:
          endTime = moment().startOf('week').subtract(7, 'days');
          startTime = moment().startOf('week').subtract(28, 'days').startOf('day');
          dummyGraph = getDataForGivenRange((moment.range(startTime.toDate(), endTime.toDate())), 'w', dayFormat, 90, 9);
          break;

        // last 3 months
        case 4:
          startTime = moment().subtract(2, 'months').startOf('month');
          endTime = moment().startOf('day');
          dummyGraph = getDataForGivenRange((moment.range(startTime.toDate(), endTime.toDate())), 'M', monthFormat, 100, 15);
          break;

        default:
          dummyGraph = [];
      }

      return dummyGraph;
    }

    function getDataForToday(range, interval, format, initValue, changeValue) {
      var rangeStatsList = [];
      var handleCount = initValue;
      var abandonCount = initValue / 3;
      var avgCsatScores = 3.0;
      var numWorkingTasks = 20;
      var numPendingTasks = 15;
      var flip = 2;
      var count = 1;
      range.by(interval, function (moment) {
        var formattedTime = momentFormatter(moment, format);
        var rangeStats = {};
        rangeStats.createdTime = formattedTime;
        if (moment.isAfter()) {
          rangeStats.numTasksHandledState = 0;
          rangeStats.numTasksAbandonedState = 0;
          rangeStats.numTasksAssignedState = 0;
          rangeStats.numTasksQueuedState = 0;
          rangeStats.avgCsatScores = 0;
          rangeStats.numWorkingTasks = 0;
          rangeStats.numPendingTasks = 0;
        } else {
          rangeStats.numTasksHandledState = handleCount;
          rangeStats.numTasksAbandonedState = abandonCount;
          rangeStats.numTasksAssignedState = handleCount;
          rangeStats.numTasksQueuedState = handleCount;
          rangeStats.avgCsatScores = avgCsatScores;
          rangeStats.numWorkingTasks = numWorkingTasks;
          rangeStats.numPendingTasks = numPendingTasks;
        }
        rangeStatsList.push(rangeStats);
        count = count + 1;
        if (count % 3 === 0 || count % 4 === 0) flip = -flip;
        numWorkingTasks = numWorkingTasks + (flip * 2) + (count % 3);
        numPendingTasks = numPendingTasks + (flip * 3) + (count % 3);
        handleCount = handleCount + changeValue + (flip * 2);
        abandonCount = abandonCount - (changeValue / 3);

        if (abandonCount < 0) {
          abandonCount = 0;
        }

        avgCsatScores = Math.min(avgCsatScores + 0.1 + (flip * 0.25), 5.0);
      });
      return rangeStatsList;
    }

    function getDataForGivenRange(range, interval, format, initValue, changeValue) {
      var rangeStatsList = [];
      var formatter = getFormatter(interval);
      var handleCount = initValue;
      var abandonCount = initValue / 3;
      var avgTaskWaitTime = 5;
      var avgTaskCloseTime = 3;
      var avgCsatScores = 3.0;
      range.by(interval, function (moment) {
        var formattedTime = formatter(moment, format);
        var rangeStats = {};
        rangeStats.createdTime = formattedTime;
        if (moment.isAfter()) {
          rangeStats.numTasksHandledState = 0;
          rangeStats.numTasksAbandonedState = 0;
          rangeStats.avgTaskWaitTime = 0;
          rangeStats.avgTaskCloseTime = 0;
          rangeStats.avgCsatScores = 0;
        } else {
          rangeStats.numTasksHandledState = handleCount;
          rangeStats.numTasksAbandonedState = abandonCount;
          rangeStats.avgTaskWaitTime = avgTaskWaitTime;
          rangeStats.avgTaskCloseTime = avgTaskCloseTime;
          rangeStats.avgCsatScores = avgCsatScores;
        }
        rangeStatsList.push(rangeStats);
        if (interval === 'w' || interval === 'd') {
          if (rangeStatsList.length == 1) {
            handleCount = 0;
            abandonCount = 0;
          } else if (rangeStatsList.length == 2) {
            handleCount = 60;
            abandonCount = 10;
          } else if (rangeStatsList.length == 6) {
            handleCount = 50;
            abandonCount = 5;
          } else {
            handleCount = handleCount + changeValue;
            abandonCount = abandonCount - (changeValue / 3);
          }
        } else {
          handleCount = handleCount + changeValue;
          abandonCount = abandonCount - (changeValue / 3);
        }
        if (abandonCount < 0) {
          abandonCount = 0;
        }

        avgTaskWaitTime = Math.min(avgTaskWaitTime + 1, 10);
        avgTaskCloseTime = Math.min(avgTaskCloseTime + 1, 6);
        avgCsatScores = Math.min(avgCsatScores + 0.1, 5.0);
      });
      return rangeStatsList;
    }

    function getFormatter(interval) {
      switch (interval) {
        case 'w':
          return weekFormatter;
        default:
          return momentFormatter;
      }
    }

    function momentFormatter(time, format) {
      return time.format(format);
    }

    function weekFormatter(time, format) {
      return momentFormatter(time.endOf('week'), format);
    }
  }
})();
