'use strict';

describe('Partner Reports', function () {
  var customer = 'Spark UC Report Test Partner';
  var e2eCustomer = 'Spark UC Reports E2E Tests';
  var time = ['Last 7 Days', 'Last 4 Weeks', 'Last 3 Months'];
  var lowerTime = ['last seven days', 'last four weeks', 'last three months'];

  describe('Log In', function () {
    it('should login to partner reports page', function () {
      login.login('partner-reports', '#/partner/reports');
    });
  });

  describe('Reports Page', function () {
    it('should verify report type buttons', function () {
      utils.expectIsPresent(reports.pageTitle);
      utils.expectText(reports.allTypes, 'All');
      utils.expectText(reports.engagement, 'Engagement');
      utils.expectText(reports.quality, 'Quality');
    });

    it('should verify customer dropdown', function () {
      reports.enabledFilters(reports.customerSelect);
      reports.clickFilter(reports.customerSelect);
      reports.numOptions(reports.customerSelect).then(function (totalOptions) {
        utils.expectTruthy(totalOptions > 0);
      });
      reports.clickFilter(reports.customerSelect);
    });

    it('should verify time dropdown', function () {
      reports.enabledFilters(reports.timeSelect);
      reports.clickFilter(reports.timeSelect);
      for (var i = 0; i < time.length; i++) {
        reports.verifyOption(reports.timeSelect, time[i]);
      }
      reports.clickFilter(reports.timeSelect);
    });

    it('should show all reports', function () {
      // active users
      utils.expectIsDisplayed(reports.activeHeader);
      utils.expectIsDisplayed(reports.activeDescription);
      utils.expectTextToBeSet(reports.activeDescription, lowerTime[0]);
      utils.expectIsDisplayed(reports.activeUsersChart);

      // most active users
      utils.expectIsNotDisplayed(reports.partnermostActiveHeader);
      utils.expectIsNotDisplayed(reports.partnerMostActiveDescription);
      utils.expectIsNotDisplayed(reports.activeUsersTable);
      //reports.showHideActiveVisibility(true, false, true);

      // active user population
      utils.expectIsDisplayed(reports.activePopulationHeader);
      utils.expectIsDisplayed(reports.activePopulationDescription);
      utils.expectIsDisplayed(reports.activePopulationGraph);

      // registered endpoints
      utils.expectIsDisplayed(reports.endpointsHeader);
      utils.expectIsDisplayed(reports.endpointDescription);
      utils.expectTextToBeSet(reports.endpointDescription, lowerTime[0]);
      utils.expectIsDisplayed(reports.registeredEndpointsTable);
      reports.confirmCustomerInTable(e2eCustomer, reports.registeredEndpointsTable, true);

      // call metrics
      utils.expectIsDisplayed(reports.metricsHeader);
      utils.expectIsDisplayed(reports.metricsDescription);
      utils.expectTextToBeSet(reports.metricsDescription, lowerTime[0]);
      utils.expectIsDisplayed(reports.callMetricsGraph);

      // device media quality
      utils.expectIsDisplayed(reports.mediaHeader);
      utils.expectIsDisplayed(reports.mediaDescription);
      utils.expectIsDisplayed(reports.mediaQualityGraph);
    });

    it('should be able to change time period', function () {
      reports.clickFilter(reports.timeSelect);
      utils.click(reports.getOption(reports.timeSelect, time[1]));
    });

    it('should be able to change customers', function () {
      reports.clickFilter(reports.customerSelect);
      utils.click(reports.getOption(reports.customerSelect, customer));
    });

    it('should change to display only engagement reports', function () {
      utils.click(reports.engagement);

      // engagement graphs
      utils.expectIsDisplayed(reports.activeHeader);
      utils.expectIsDisplayed(reports.activeDescription);
      utils.expectIsDisplayed(reports.activeUsersChart);

      utils.expectIsDisplayed(reports.activePopulationHeader);
      utils.expectIsDisplayed(reports.activePopulationDescription);
      utils.expectIsDisplayed(reports.activePopulationGraph);

      utils.expectIsDisplayed(reports.endpointsHeader);
      utils.expectIsDisplayed(reports.endpointDescription);
      utils.expectIsDisplayed(reports.registeredEndpointsTable);

      // quality graphs
      utils.expectIsNotDisplayed(reports.callMetricsGraph);
      utils.expectIsNotDisplayed(reports.mediaQualityGraph);
    });

    it('should change to display only quality reports', function () {
      utils.click(reports.quality);

      // engagement graphs
      utils.expectIsNotDisplayed(reports.activeUsersChart);
      utils.expectIsNotDisplayed(reports.activePopulationGraph);
      utils.expectIsNotDisplayed(reports.registeredEndpointsTable);

      // quality graphs
      utils.expectIsDisplayed(reports.metricsHeader);
      utils.expectIsDisplayed(reports.metricsDescription);
      utils.expectIsDisplayed(reports.callMetricsGraph);

      utils.expectIsDisplayed(reports.mediaHeader);
      utils.expectIsDisplayed(reports.mediaDescription);
      utils.expectIsDisplayed(reports.mediaQualityGraph);
    });

    it('should change to display all reports', function () {
      utils.click(reports.allTypes);

      // active users
      utils.expectIsDisplayed(reports.activeHeader);
      utils.expectIsDisplayed(reports.activeDescription);
      utils.expectTextToBeSet(reports.activeDescription, lowerTime[1]);
      utils.expectIsDisplayed(reports.activeUsersChart);

      // most active users
      utils.expectIsNotDisplayed(reports.partnermostActiveHeader);
      utils.expectIsNotDisplayed(reports.partnerMostActiveDescription);
      utils.expectIsNotDisplayed(reports.activeUsersTable);

      // active user population
      utils.expectIsDisplayed(reports.activePopulationHeader);
      utils.expectIsDisplayed(reports.activePopulationDescription);
      utils.expectIsDisplayed(reports.activePopulationGraph);

      // registered endpoints
      utils.expectIsDisplayed(reports.endpointsHeader);
      utils.expectIsDisplayed(reports.endpointDescription);
      utils.expectTextToBeSet(reports.endpointDescription, lowerTime[1]);
      utils.expectIsDisplayed(reports.registeredEndpointsTable);
      reports.confirmCustomerInTable(e2eCustomer, reports.registeredEndpointsTable, true);

      // call metrics
      utils.expectIsDisplayed(reports.metricsHeader);
      utils.expectIsDisplayed(reports.metricsDescription);
      utils.expectTextToBeSet(reports.metricsDescription, lowerTime[1]);
      utils.expectIsDisplayed(reports.callMetricsGraph);

      // device media quality
      utils.expectIsDisplayed(reports.mediaHeader);
      utils.expectIsDisplayed(reports.mediaDescription);
      utils.expectIsDisplayed(reports.mediaQualityGraph);
    });

    // Deactivating until missing data issue resolved
    xit('should be able to show/hide most active users', function () {
      reports.showHideActiveVisibility(true, false, true);
      utils.expectIsDisplayed(reports.showmostActiveButton);
      utils.expectIsNotDisplayed(reports.activeUsersTable);
      utils.click(reports.showmostActiveButton);
      reports.showHideActiveVisibility(false, true, true);

      utils.expectIsDisplayed(reports.activeUsersTable);
      utils.expectCountToBeGreater(reports.activeUsersTableContent, 0);
      utils.click(reports.hidemostActiveButton);
      reports.showHideActiveVisibility(true, false, true);
    });
  });
});
