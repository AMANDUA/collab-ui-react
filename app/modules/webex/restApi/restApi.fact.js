(function () {
  'use strict';

  /* @ngInject */
  function WebExRestApiFact(
    $http,
    $q,
    WebExApiGatewayConstsService
  ) {
    var _this = this;

    this.sendRestApiReq = function (
      httpReq,
      resolve,
      reject
    ) {
      // var funcName = "sendRestApiReq()";
      // var logMsg = "";

      // logMsg = funcName + "\n" +
      //   "httpReq.url=" + JSON.stringify(httpReq.url);
      // $log.log(logMsg);

      $http(
        httpReq
      ).then(
        function (response) {
          resolve(response.data);
        }
      ).catch(
        function (response) {
          reject(response.data);
        }
      );
    }; //sendRestApiReq()

    return {

      csvApiRequest: function (
        mockFlag,
        mockCsvStatusReq,
        httpsReqObj
      ) {
        // var funcName = "csvApiRequest()";
        // var logMsg = "";

        // $log.log(funcName);

        if (!mockFlag) {
          return $q(
            function (resolve, reject) {
              _this.sendRestApiReq(
                httpsReqObj,
                resolve,
                reject
              );
            }
          );
        }

        var mockResult = null;

        if (null == mockCsvStatusReq) {
          mockResult = {};
        } else {
          // mock the request csv status result

          if (WebExApiGatewayConstsService.csvStates.authTokenError == mockCsvStatusReq) {
            mockResult = {
              errorCode: '060502',
              errorMessage: 'Auth token is invalid.',
            };

            return $q.reject(mockResult);
          }
          if (WebExApiGatewayConstsService.csvStates.none == mockCsvStatusReq) {
            mockResult = {
              jobType: WebExApiGatewayConstsService.csvJobTypes.typeNone,
            };
          } else if (WebExApiGatewayConstsService.csvStates.exportInProgress == mockCsvStatusReq) {
            mockResult = {
              jobType: WebExApiGatewayConstsService.csvJobTypes.typeExport,
              request: WebExApiGatewayConstsService.csvJobStatus.statusQueued,
            };
          } else if (WebExApiGatewayConstsService.csvStates.exportCompletedNoErr == mockCsvStatusReq) {
            mockResult = {
              jobType: WebExApiGatewayConstsService.csvJobTypes.typeExport,
              request: WebExApiGatewayConstsService.csvJobStatus.statusCompleted,
              created: '03/23/16 12:41 AM',
              started: '03 / 23 / 16 12: 41 AM',
              finished: '03/23/16 12:41 AM',
              totalRecords: 5,
              successRecords: 5,
              failedRecords: 0,
              exportFileLink: 'http://google.com',
            };
          } else if (WebExApiGatewayConstsService.csvStates.exportCompletedWithErr == mockCsvStatusReq) {
            mockResult = {
              jobType: WebExApiGatewayConstsService.csvJobTypes.typeExport,
              request: WebExApiGatewayConstsService.csvJobStatus.statusCompleted,
              created: '03/23/16 12:41 AM',
              started: '03 / 23 / 16 12: 41 AM',
              finished: '03/23/16 12:41 AM',
              totalRecords: 5,
              successRecords: 4,
              failedRecords: 1,
              exportFileLink: 'http://google.com',
            };
          } else if (WebExApiGatewayConstsService.csvStates.importInProgress == mockCsvStatusReq) {
            mockResult = {
              jobType: WebExApiGatewayConstsService.csvJobTypes.typeImport,
              request: WebExApiGatewayConstsService.csvJobStatus.statusQueued,
            };
          } else if (WebExApiGatewayConstsService.csvStates.importCompletedNoErr == mockCsvStatusReq) {
            mockResult = {
              jobType: WebExApiGatewayConstsService.csvJobTypes.typeImport,
              request: WebExApiGatewayConstsService.csvJobStatus.statusCompleted,
              importFileName: 'fakeImport.csv',
              created: '03/23/16 12:41 AM',
              started: '03 / 23 / 16 12: 41 AM',
              finished: '03/23/16 12:41 AM',
              totalRecords: 5,
              successRecords: 5,
              failedRecords: 0,
            };
          } else if (WebExApiGatewayConstsService.csvStates.importCompletedWithErr == mockCsvStatusReq) {
            mockResult = {
              jobType: WebExApiGatewayConstsService.csvJobTypes.typeImport,
              request: WebExApiGatewayConstsService.csvJobStatus.statusCompleted,
              importFileName: 'fakeImport.csv',
              created: '03/23/16 12:41 AM',
              started: '03 / 23 / 16 12: 41 AM',
              finished: '03/23/16 12:41 AM',
              totalRecords: 5,
              successRecords: 3,
              failedRecords: 2,
              errorLogLink: 'http://yahoo.com',
            };
          }
        }

        return $q.resolve(mockResult);
      }, // csvApiRequest()
    }; // return
  } // top level function()

  module.exports = WebExRestApiFact;
})();
