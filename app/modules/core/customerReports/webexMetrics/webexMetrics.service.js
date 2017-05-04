(function () {
  'use strict';

  angular
    .module('Core')
    .service('QlikService', QlikService);

  function QlikService($http) {
    var baseUrl = 'http://10.194.245.72:8080/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/singlesitereport2/basic_webex_report__vSiteId/599/ds2-qlikdemo/qlikuser1/ds2-qlikdemo';

    var service = {
      getQlikInfos: getQlikInfos,
    };

    return service;

    function extractData(response) {
      return response.data;
    }

    function getQlikInfos() {
      return $http.get(baseUrl).then(extractData);
    }

  }
}());
