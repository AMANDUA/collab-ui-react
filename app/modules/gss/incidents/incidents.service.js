(function () {
  'use strict';

  angular
    .module('GSS')
    .factory('IncidentsService', IncidentsService);

  /* @ngInject */
  function IncidentsService($http, UrlConfig) {
    var baseUrl = UrlConfig.getGssUrl();

    var service = {
      getIncidents: getIncidents,
      createIncident: createIncident,
      deleteIncident: deleteIncident,
      getIncident: getIncident,
      updateIncidentNameAndImpact: updateIncidentNameAndImpact,
      getComponents: getComponents,
      updateIncident: updateIncident,
      getAffectedComponents: getAffectedComponents,
      updateIncidentMessage: updateIncidentMessage,
      deleteIncidentMessage: deleteIncidentMessage,
    };

    return service;

    function extractData(response) {
      return response.data;
    }

    function getIncidents(serviceId) {
      var url = baseUrl + '/services/' + serviceId + '/incidents';
      return $http.get(url).then(extractData);
    }

    function createIncident(serviceId, incident) {
      var url = baseUrl + '/services/' + serviceId + '/incidents';
      return $http.post(url, incident).then(extractData);
    }

    function deleteIncident(incidentId) {
      var url = baseUrl + '/incidents/' + incidentId;
      return $http.delete(url).then(extractData);
    }

    function getIncident(incidentId) {
      var url = baseUrl + '/incidents/' + incidentId;
      return $http.get(url).then(extractData);
    }

    function updateIncidentNameAndImpact(incidentId, incidentName, impact) {
      var url = baseUrl + '/incidents/' + incidentId;
      return $http.put(url, { incidentName: incidentName, impact: impact }).then(extractData);
    }

    function getComponents(serviceId) {
      var url = baseUrl + '/services/' + serviceId + '/components';
      return $http.get(url).then(extractData);
    }

    function updateIncident(incidentId, incidentData) {
      var url = baseUrl + '/incidents/' + incidentId + '/messages';
      return $http.post(url, incidentData).then(extractData);
    }

    function getAffectedComponents(messageId) {
      var url = baseUrl + '/incidents/messages/' + messageId;
      return $http.get(url).then(extractData);
    }

    function updateIncidentMessage(messageId, message) {
      var url = baseUrl + '/incidents/messages/' + messageId;
      return $http.put(url, message).then(extractData);
    }

    function deleteIncidentMessage(messageId) {
      var url = baseUrl + '/incidents/messages/' + messageId;
      return $http.delete(url).then(extractData);
    }
  }
}());
