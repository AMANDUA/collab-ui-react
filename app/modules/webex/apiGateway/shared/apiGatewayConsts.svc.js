(function () {
  'use strict';

  /* @ngInject */
  function WebExApiGatewayConstsService() {
    this.csvRequests = {
      csvStatus: 'csvStatus',
      csvExport: 'csvExport',
      csvImport: 'csvImport',
      csvFileDownload: 'csvFileDownload',
    };

    this.csvAPIs = [{
      request: this.csvRequests.csvStatus,
      api: 'importexportstatus',
      method: 'POST',
      contentType: 'application/json;charset=utf-8',
      data: {},
    },

    {
      request: this.csvRequests.csvExport,
      api: 'export',
      method: 'POST',
      contentType: 'application/json;charset=utf-8',
      data: {},
    },

    {
      request: this.csvRequests.csvImport,
      api: 'import',
      method: 'POST',
      headers: {
        contentType: 'undefined',
      },
      data: {},
    },

    {
      request: this.csvRequests.csvFileDownload,
      api: null,
      method: 'POST',
      contentType: 'application/json;charset=utf-8',
      data: {},
    },
    ];

    this.csvJobTypes = {
      typeNone: 0,
      typeImport: 1,
      typeExport: 2,
    };

    this.csvJobStatus = {
      statusQueued: 0,
      statusPreProcess: 1,
      statusCompleted: 2,
      statusInProcess: 3,
    };

    this.csvStates = {
      authTokenError: 'authTokenError',
      none: 'none',
      exportInProgress: 'exportInProgress',
      exportCompletedNoErr: 'exportCompletedNoErr',
      exportCompletedWithErr: 'exportCompletedWithErr',
      importInProgress: 'importInProgress',
      importCompletedNoErr: 'importCompletedNoErr',
      importCompletedWithErr: 'importCompletedWithErr',
    };

    this.csvStatusTypes = [
      this.csvStates.authTokenError,
      this.csvStates.none,
      this.csvStates.exportInProgress,
      this.csvStates.exportCompletedNoErr,
      this.csvStates.exportCompletedWithErr,
      this.csvStates.importInProgress,
      this.csvStates.importCompletedNoErr,
      this.csvStates.importCompletedWithErr,
    ]; // csvStatusTypes[]
  } // end top level function

  module.exports = WebExApiGatewayConstsService;
})();
