require('./customer-reports.scss');
const WebexMetricsServices = require('./webexMetrics/webexMetrics.service');

export default angular
  .module('core.customer-reports', [
    require('modules/core/scripts/services/authinfo'),
    require('modules/core/config/config').default,
  ])
  .service('WebexMetricsService', WebexMetricsServices)
  .constant('LoadingTimeout', 120000)
  .name;
