(function () {
  'use strict';

  angular
    .module('Hercules')
    .factory('FusionClusterStatesService', FusionClusterStatesService);

  /* @ngInject */
  function FusionClusterStatesService() {
    var service = {
      getStateSeverity: getStateSeverity,
      getSeverityLabel: getSeverityLabel,
      getMergedUpgradeState: getMergedUpgradeState,
      getMergedStateSeverity: getMergedStateSeverity,
      getStatusIndicatorCSSClass: getStatusIndicatorCSSClass,
    };

    return service;

    ////////////////

    function connectorHasAlarms(connector) {
      return connector.alarms.length > 0;
    }

    function mapStateToSeverity(state) {
      var value = 0;
      switch (state) {
        case 'running':
          break;
        case 'not_installed':
          value = 1;
          break;
        case 'disabled':
        case 'downloading':
        case 'installing':
        case 'not_configured':
        case 'uninstalling':
        case 'registered':
          value = 2;
          break;
        case 'not_operational':
        case 'has_alarms':
        case 'offline':
        case 'stopped':
        case 'unknown':
        default:
          value = 3;
      }
      return value;
    }

    function getStateSeverity(data) {
      // We give a severity and a weight to all possible states.
      // This has to be synced with the the API consumed
      // by Atlas' general overview page (in the Hybrid Services card)

      // Also note that this function accepts both a connector or just a string
      var state = data;
      if (_.isString(data.state)) {
        // Duck typing, if it has a state it must be a connector!
        // Override the state with 'has_alarms' if necessary
        if (connectorHasAlarms(data)) {
          state = 'has_alarms';
        } else {
          state = data.state;
        }
      }

      return mapStateToSeverity(state);
    }

    function getSeverityLabel(value) {
      var label = '';
      switch (value) {
        case 0:
          label = 'ok';
          break;
        case 1:
          label = 'unknown';
          break;
        case 2:
          label = 'warning';
          break;
        case 3:
          label = 'error';
          break;
      }
      return label;
    }

    function getSeverityCssClass(value) {
      var cssClass = '';
      switch (value) {
        case 0:
          cssClass = 'success';
          break;
        case 1:
          cssClass = 'disabled';
          break;
        case 2:
          cssClass = 'warning';
          break;
        case 3:
          cssClass = 'danger';
          break;
      }
      return cssClass;
    }

    function getMergedUpgradeState(connectors) {
      var allAreUpgraded = _.every(connectors, { upgradeState: 'upgraded' });
      return allAreUpgraded ? 'upgraded' : 'upgrading';
    }

    // Special function, returning a FULL state with a name, a severity and
    // a severity label
    function getMergedStateSeverity(connectors) {
      var stateSeverity;
      if (connectors.length === 0) {
        stateSeverity = getStateSeverity('not_installed');
        return {
          name: 'not_installed',
          severity: stateSeverity,
          label: getSeverityLabel(stateSeverity),
          cssClass: getSeverityCssClass(stateSeverity),
        };
      }
      var mostSevereConnector = _.chain(connectors)
        .sortBy(function (connector) {
          return getStateSeverity(connector);
        })
        .last()
        .value();
      stateSeverity = getStateSeverity(mostSevereConnector);
      return {
        name: connectorHasAlarms(mostSevereConnector) && mapStateToSeverity(mostSevereConnector.state) < 3 ? 'has_alarms' : mostSevereConnector.state,
        severity: stateSeverity,
        label: getSeverityLabel(stateSeverity),
        cssClass: getSeverityCssClass(stateSeverity),
      };
    }

    function getStatusIndicatorCSSClass(status) {
      var cssClass;
      switch (status) {
        case 'operational':
          cssClass = 'success';
          break;
        case 'outage':
          cssClass = 'danger';
          break;
        case 'setupNotComplete':
          cssClass = 'default';
          break;
        case 'impaired':
        case 'unknown':
        default:
          cssClass = 'warning';
      }
      return cssClass;
    }
  }
})();
