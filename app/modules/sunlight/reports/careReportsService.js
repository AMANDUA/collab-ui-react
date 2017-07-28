(function () {
  'use strict';

  angular.module('Sunlight')
    .service('CareReportsService', CareReportsService);

  /* @ngInject */
  function CareReportsService($translate, CareReportsGraphService, chartColors) {
    var today = true;

    function dummifyGraph(chartConfig) {
      var dummyColors = [chartColors.grayLightOne, chartColors.grayLightTwo];
      if (today) {
        dummyColors = [chartColors.grayLightOne, chartColors.grayLightTwo, chartColors.grayLightThree, chartColors.grayLightFour];
      }

      var dummyGraphs = _.map(chartConfig.graphs, function (graph, i) {
        return _.assign(graph, {
          fillAlphas: 1,
          showBalloon: false,
          lineColor: dummyColors[i],
          fillColors: dummyColors[i],
          pattern: '',
        });
      });
      chartConfig.export.enabled = false;
      chartConfig.graphs = dummyGraphs;
      chartConfig.chartCursor.cursorAlpha = 0;
      return chartConfig;
    }

    function showTaskIncomingGraph(div, data, categoryAxisTitle, title, isToday) {
      var chartConfig = getTaskIncomingGraphConfig(data, categoryAxisTitle, title, isToday);
      return AmCharts.makeChart(div, chartConfig);
    }

    function showTaskIncomingDummy(div, data, categoryAxisTitle, title, isToday) {
      var chartConfig = getTaskIncomingGraphConfig(data, categoryAxisTitle, title, isToday);

      dummifyGraph(chartConfig);

      return AmCharts.makeChart(div, chartConfig);
    }

    function getTaskIncomingGraphConfig(data, categoryAxisTitle, title, isToday) {
      today = isToday;
      var exportReport = CareReportsGraphService.getBaseVariable('export');
      exportReport.enabled = true;

      var titles = CareReportsGraphService.getBaseVariable('title');
      if (!_.isUndefined(title)) {
        titles[0].text = title;
        titles[0].enabled = true;
      }

      var chartCursor = CareReportsGraphService.getBaseVariable('chartCursor');
      chartCursor.cursorAlpha = 1;

      var categoryAxis = CareReportsGraphService.getBaseVariable('axis');
      categoryAxis.startOnAxis = true;
      categoryAxis.title = categoryAxisTitle;

      var legend = CareReportsGraphService.getBaseVariable('legend');
      legend.equalWidths = !isToday;

      var valueAxes = [CareReportsGraphService.getBaseVariable('axis')];
      valueAxes[0].title = $translate.instant('careReportsPage.tasks');

      var abandonedGraph = {
        title: $translate.instant('careReportsPage.abandoned'),
        lineColor: chartColors.alertsBase,
        fillColors: chartColors.colorLightRedFill,
        valueField: 'numTasksAbandonedState',
        showBalloon: true,
        balloonFunction: balloonTextForTaskVolume,
      };

      var handledGraph = {
        title: $translate.instant('careReportsPage.handled'),
        lineColor: chartColors.ctaBase,
        valueField: 'numTasksHandledState',
      };

      var graphsPartial = [handledGraph, abandonedGraph];
      var graphs = _.map(graphsPartial, function (graph) {
        return _.defaults(graph, CareReportsGraphService.getBaseVariable('graph'));
      });

      return CareReportsGraphService.buildChartConfig(data, legend, graphs, chartCursor,
              'createdTime', categoryAxis, valueAxes, exportReport, titles);
    }

    function showTaskOfferedGraph(div, data, categoryAxisTitle, title, isToday) {
      var chartConfig = getTaskOfferedGraphConfig(data, categoryAxisTitle, title, isToday);
      return AmCharts.makeChart(div, chartConfig);
    }

    function showTaskOfferedDummy(div, data, categoryAxisTitle, title, isToday) {
      var chartConfig = getTaskOfferedGraphConfig(data, categoryAxisTitle, title, isToday);

      dummifyGraph(chartConfig);

      return AmCharts.makeChart(div, chartConfig);
    }

    function getTaskOfferedGraphConfig(data, categoryAxisTitle, title, isToday) {
      today = isToday;
      var exportReport = CareReportsGraphService.getBaseVariable('export');
      exportReport.enabled = true;

      var titles = CareReportsGraphService.getBaseVariable('title');
      if (!_.isUndefined(title)) {
        titles[0].text = title;
        titles[0].enabled = true;
      }

      var chartCursor = CareReportsGraphService.getBaseVariable('chartCursor');
      chartCursor.cursorAlpha = 1;

      var categoryAxis = CareReportsGraphService.getBaseVariable('axis');
      categoryAxis.startOnAxis = true;
      categoryAxis.title = categoryAxisTitle;

      var legend = CareReportsGraphService.getBaseVariable('legend');
      legend.equalWidths = !isToday;

      var valueAxes = [CareReportsGraphService.getBaseVariable('axis')];
      valueAxes[0].title = $translate.instant('careReportsPage.percentage');
      valueAxes[0].stackType = '100%';

      var percentMissedGraph = {
        title: $translate.instant('careReportsPage.missed'),
        lineColor: chartColors.alertsBase,
        fillColors: chartColors.colorLightRedFill,
        valueField: 'tasksMissed',
        showBalloon: true,
        balloonFunction: balloonTextForTaskOffered,
      };

      var percentAcceptedGraph = {
        title: $translate.instant('careReportsPage.accepted'),
        lineColor: chartColors.ctaBase,
        valueField: 'tasksAccepted',
      };

      var graphsPartial = [percentAcceptedGraph, percentMissedGraph];
      var graphs = _.map(graphsPartial, function (graph) {
        return _.defaults(graph, CareReportsGraphService.getBaseVariable('graph'));
      });

      return CareReportsGraphService.buildChartConfig(data, legend, graphs, chartCursor,
              'createdTime', categoryAxis, valueAxes, exportReport, titles);
    }

    function balloonTextForTaskVolume(graphDataItem, graph) {
      var numTasksAbandonedState = _.get(graphDataItem, 'dataContext.numTasksAbandonedState', 0);
      var numTasksHandledState = _.get(graphDataItem, 'dataContext.numTasksHandledState', 0);
      var categoryRange = setCategoryRange(graph.categoryAxis.title, graphDataItem.category);
      var balloonText = '<span class="care-graph-text">' + $translate.instant('careReportsPage.abandoned') + ' ' + numTasksAbandonedState + '</span><br><span class="care-graph-text">' + $translate.instant('careReportsPage.handled') + ' ' + numTasksHandledState + '</span>';

      return categoryRange + balloonText;
    }

    function balloonTextForTaskOffered(graphDataItem, graph) {
      var tasksOffered = _.get(graphDataItem, 'dataContext.tasksOffered', 0);
      var tasksMissed = _.get(graphDataItem, 'dataContext.tasksMissed', 0);
      var tasksAccepted = _.get(graphDataItem, 'dataContext.tasksAccepted', 0);
      var percentageTasksAccepted = tasksOffered > 0 ? Math.round((tasksAccepted / tasksOffered) * 100) : 0;
      var percentageTasksMissed = tasksOffered > 0 ? Math.min(Math.round((tasksMissed / tasksOffered) * 100), 100) : 0;
      var categoryRange = setCategoryRange(graph.categoryAxis.title, graphDataItem.category);
      var balloonText = '<span class="care-graph-text">' + $translate.instant('careReportsPage.accepted') + ' ' + percentageTasksAccepted + '%' + '</span><br><span class="care-graph-text">' + $translate.instant('careReportsPage.missed') + ' ' + percentageTasksMissed + '%' + '</span>';
      return categoryRange + balloonText;
    }

    function balloonTextForTaskTime(graphDataItem, graph) {
      var convertToMillis = 60 * 1000;
      var avgTaskWaitTime = _.get(graphDataItem, 'dataContext.avgTaskWaitTime', 0);
      var avgTaskCloseTime = _.get(graphDataItem, 'dataContext.avgTaskCloseTime', 0);
      var categoryRange = setCategoryRange(graph.categoryAxis.title, graphDataItem.category);
      var balloonText = '<span class="care-graph-text">' + $translate.instant('careReportsPage.avgQueueTime') + ' ' + millisToTime(avgTaskWaitTime * convertToMillis) + '</span><br><span class="care-graph-text">' + $translate.instant('careReportsPage.avgHandleTime') + ' ' + millisToTime(avgTaskCloseTime * convertToMillis) + '</span>';

      return categoryRange + balloonText;
    }

    function balloonTextForTaskAggregate(graphDataItem, graph) {
      var numPendingTasks = _.get(graphDataItem, 'dataContext.numPendingTasks', 0);
      var numWorkingTasks = _.get(graphDataItem, 'dataContext.numWorkingTasks', 0);
      var categoryRange = setCategoryRange(graph.categoryAxis.title, graphDataItem.category);
      var balloonText = '<span class="care-graph-text">' + $translate.instant('careReportsPage.in-queue') + ' ' + numPendingTasks + '</span><br><span class="care-graph-text">' + $translate.instant('careReportsPage.assigned') + ' ' + numWorkingTasks + '</span>';

      return categoryRange + balloonText;
    }

    function balloonTextForAvgCsat(graphDataItem, graph) {
      var avgCsatScores = _.get(graphDataItem, 'dataContext.avgCsatScores', 0);
      var categoryRange = setCategoryRange(graph.categoryAxis.title, graphDataItem.category);
      var balloonText = '<span class="care-graph-text">' + $translate.instant('careReportsPage.avgCsat') + ' ' + avgCsatScores + '</span><br>';

      return categoryRange + balloonText;
    }

    function millisToTime(durationInMillis) {
      var convertInSeconds = 1000;
      var convertInMinutes = 1000 * 60;
      var convertInHours = 1000 * 60 * 60;
      var radix = 10;
      var seconds = parseInt((durationInMillis / convertInSeconds) % 60, radix);
      var minutes = parseInt((durationInMillis / convertInMinutes) % 60, radix);
      var hours = parseInt((durationInMillis / convertInHours), radix);

      var timeFormat = '';
      if (hours != 0) {
        timeFormat = hours + 'h ';
      }
      if (minutes != 0) {
        timeFormat = timeFormat + minutes + 'm ';
      }
      if (seconds != 0) {
        timeFormat = timeFormat + seconds + 's';
      }
      if (timeFormat) {
        return timeFormat;
      } else {
        return '0s';
      }
    }

    function setCategoryRange(categoryAxisTitle, category) {
      var categoryRange = '';
      if (categoryAxisTitle === 'Hours') {
        var start = moment(category, 'HH:mm').subtract(1, 'hours').format('HH:mm');
        categoryRange = '<span>' + start + ' - ' + category + '</span><br>';
      }

      return categoryRange;
    }

    function showTaskTimeGraph(div, data, categoryAxisTitle, title) {
      var chartConfig = getTaskTimeGraphConfig(data, categoryAxisTitle, title);
      return AmCharts.makeChart(div, chartConfig);
    }

    function showTaskTimeDummy(div, data, categoryAxisTitle, title) {
      var chartConfig = getTaskTimeGraphConfig(data, categoryAxisTitle, title);

      dummifyGraph(chartConfig);

      return AmCharts.makeChart(div, chartConfig);
    }

    function getTaskTimeGraphConfig(data, categoryAxisTitle, title) {
      var exportReport = CareReportsGraphService.getBaseVariable('export');
      exportReport.enabled = true;

      var titles = CareReportsGraphService.getBaseVariable('title');
      if (!_.isUndefined(title)) {
        titles[0].text = title;
        titles[0].enabled = true;
      }

      var chartCursor = CareReportsGraphService.getBaseVariable('chartCursor');
      chartCursor.cursorAlpha = 1;

      var categoryAxis = CareReportsGraphService.getBaseVariable('axis');
      categoryAxis.startOnAxis = true;
      categoryAxis.title = categoryAxisTitle;

      var legend = CareReportsGraphService.getBaseVariable('legend');

      var valueAxes = [CareReportsGraphService.getBaseVariable('axis')];
      valueAxes[0].title = $translate.instant('careReportsPage.taskTimeLabel');

      var pattern = {
        url: 'line_pattern.png',
        width: 14,
        height: 14,
      };

      var queueGraph = {
        title: $translate.instant('careReportsPage.queueTime'),
        lineColor: chartColors.attentionBase,
        fillColors: chartColors.attentionBase,
        valueField: 'avgTaskWaitTime',
        dashLength: 2,
        fillAlphas: 1,
        pattern: pattern,
        showBalloon: true,
        balloonFunction: balloonTextForTaskTime,
      };
      var handleGraph = {
        title: $translate.instant('careReportsPage.handleTime'),
        lineColor: chartColors.ctaBase,
        fillColors: chartColors.colorLightGreenFill,
        valueField: 'avgTaskCloseTime',
      };

      var graphsPartial = [handleGraph, queueGraph];
      var graphs = _.map(graphsPartial, function (graph) {
        return _.defaults(graph, CareReportsGraphService.getBaseVariable('graph'));
      });

      return CareReportsGraphService.buildChartConfig(data, legend, graphs, chartCursor,
              'createdTime', categoryAxis, valueAxes, exportReport, titles);
    }

    function showTaskAggregateGraph(div, data, categoryAxisTitle, title) {
      var chartConfig = getTaskAggregateGraphConfig(data, categoryAxisTitle, title);
      return AmCharts.makeChart(div, chartConfig);
    }

    function showTaskAggregateDummy(div, data, categoryAxisTitle, title) {
      var chartConfig = getTaskAggregateGraphConfig(data, categoryAxisTitle, title);

      dummifyGraph(chartConfig);

      return AmCharts.makeChart(div, chartConfig);
    }

    function getTaskAggregateGraphConfig(data, categoryAxisTitle, title) {
      var exportReport = CareReportsGraphService.getBaseVariable('export');
      exportReport.enabled = true;

      var titles = CareReportsGraphService.getBaseVariable('title');
      if (!_.isUndefined(title)) {
        titles[0].text = title;
        titles[0].enabled = true;
      }

      var chartCursor = CareReportsGraphService.getBaseVariable('chartCursor');
      chartCursor.cursorAlpha = 1;

      var categoryAxis = CareReportsGraphService.getBaseVariable('axis');
      categoryAxis.startOnAxis = true;
      categoryAxis.title = categoryAxisTitle;

      var legend = CareReportsGraphService.getBaseVariable('legend');

      var valueAxes = [CareReportsGraphService.getBaseVariable('axis')];
      valueAxes[0].title = $translate.instant('careReportsPage.tasks');

      var pattern = {
        url: 'line_pattern.png',
        width: 14,
        height: 14,
      };

      var inQueueGraph = {
        title: $translate.instant('careReportsPage.in-queue'),
        lineColor: chartColors.attentionBase,
        fillColors: chartColors.attentionBase,
        valueField: 'numPendingTasks',
        dashLength: 2,
        fillAlphas: 1,
        pattern: pattern,
        showBalloon: true,
        balloonFunction: balloonTextForTaskAggregate,
      };

      var assignedGraph = {
        title: $translate.instant('careReportsPage.assigned'),
        lineColor: chartColors.attentionBase,
        fillColors: chartColors.colorLightYellowFill,
        valueField: 'numWorkingTasks',
      };

      var graphsPartial = [assignedGraph, inQueueGraph];
      var graphs = _.map(graphsPartial, function (graph) {
        return _.defaults(graph, CareReportsGraphService.getBaseVariable('graph'));
      });

      return CareReportsGraphService.buildChartConfig(data, legend, graphs, chartCursor,
              'createdTime', categoryAxis, valueAxes, exportReport, titles);
    }

    function showAverageCsatGraph(div, data, categoryAxisTitle, title) {
      var chartConfig = getAverageCsatGraphConfig(data, categoryAxisTitle, title);
      return AmCharts.makeChart(div, chartConfig);
    }

    function showAverageCsatDummy(div, data, categoryAxisTitle, title) {
      var chartConfig = getAverageCsatGraphConfig(data, categoryAxisTitle, title);

      dummifyGraph(chartConfig);

      return AmCharts.makeChart(div, chartConfig);
    }

    function getAverageCsatGraphConfig(data, categoryAxisTitle, title) {
      var exportReport = CareReportsGraphService.getBaseVariable('export');
      exportReport.enabled = true;

      var titles = CareReportsGraphService.getBaseVariable('title');
      if (!_.isUndefined(title)) {
        titles[0].text = title;
        titles[0].enabled = true;
      }

      var chartCursor = CareReportsGraphService.getBaseVariable('chartCursor');
      chartCursor.cursorAlpha = 1;

      var categoryAxis = CareReportsGraphService.getBaseVariable('axis');
      categoryAxis.startOnAxis = true;
      categoryAxis.title = categoryAxisTitle;

      var legend = '';

      var valueAxes = [CareReportsGraphService.getBaseVariable('axis')];
      valueAxes[0].title = $translate.instant('careReportsPage.csatRating');
      valueAxes[0].maximum = 5;

      var csatGraph = {
        title: $translate.instant('careReportsPage.averageCsat'),
        lineColor: chartColors.ctaBase,
        fillColors: chartColors.brandWhite,
        valueField: 'avgCsatScores',
        showBalloon: true,
        balloonFunction: balloonTextForAvgCsat,
        bullet: 'circle',
        bulletAlpha: 0,
        bulletBorderAlpha: 0,
        bulletSize: 2,
      };
      var graphsPartial = [csatGraph];
      var graphs = _.map(graphsPartial, function (graph) {
        return _.defaults(graph, CareReportsGraphService.getBaseVariable('graph'));
      });

      return CareReportsGraphService.buildChartConfig(data, legend, graphs, chartCursor,
              'createdTime', categoryAxis, valueAxes, exportReport, titles);
    }

    var service = {
      showTaskIncomingGraph: showTaskIncomingGraph,
      showTaskIncomingDummy: showTaskIncomingDummy,
      showTaskOfferedGraph: showTaskOfferedGraph,
      showTaskOfferedDummy: showTaskOfferedDummy,
      showTaskTimeGraph: showTaskTimeGraph,
      showTaskTimeDummy: showTaskTimeDummy,
      showAverageCsatGraph: showAverageCsatGraph,
      showAverageCsatDummy: showAverageCsatDummy,
      showTaskAggregateGraph: showTaskAggregateGraph,
      showTaskAggregateDummy: showTaskAggregateDummy,
      getTaskIncomingGraphConfig: getTaskIncomingGraphConfig,
      getTaskOfferedGraphConfig: getTaskOfferedGraphConfig,
      getTaskTimeGraphConfig: getTaskTimeGraphConfig,
      getAverageCsatGraphConfig: getAverageCsatGraphConfig,
      getTaskAggregateGraphConfig: getTaskAggregateGraphConfig,
      millisToTime: millisToTime,
    };

    return service;
  }
})();
