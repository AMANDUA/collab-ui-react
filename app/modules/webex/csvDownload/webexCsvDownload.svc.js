(function () {
  'use strict';

  /* global Uint8Array:false */

  angular.module('WebExApp').service('WebExCsvDownloadService', WebExCsvDownloadService);

  /* @ngInject */
  function WebExCsvDownloadService(
    $resource,
    $window,
    WebExUtilsFact,
    Log
  ) {
    var _this = this;

    this.getWebExCsv = function (
      fileDownloadUrl
    ) {
      var funcName = 'WebExCsvDownloadService.getWebExCsv()';
      var logMsg = '';

      logMsg = funcName + '\n' +
        'fileDownloadUrl=' + fileDownloadUrl;
      Log.debug(logMsg);

      var webexCsvResource = $resource(fileDownloadUrl, {}, {
        get: {
          method: 'POST',
          // override transformResponse function to return JSON; otherwise, $resource
          // returns string array in the case of CSV file download
          transformResponse: function (data) {
            var resultData = {
              content: data,
            };

            return resultData;
          }, // transformResponse()
        }, // get
      }); // $resource()

      return webexCsvResource.get('').$promise;
    }; // getWebExCsv()

    this.webexCreateObjectUrl = function (
      data,
      fileName
    ) {
      var funcName = 'webexCreateObjectUrl()';
      var logMsg = '';

      logMsg = funcName + '\n' +
        'data.length=' + data.length + '\n' +
        'fileName=' + fileName;
      Log.debug(logMsg);

      logMsg = funcName + '\n' +
        'data=' + JSON.stringify(data);
      Log.debug(logMsg);

      var intBytes = WebExUtilsFact.utf8ToUtf16le(data);
      var newData = new Uint8Array(intBytes);
      var blob = _this.getNewBlob(newData);

      logMsg = funcName + '\n' +
        'intBytes=' + intBytes;
      Log.debug(logMsg);

      // IE download option since IE won't download the created url
      if (_this.isWindowsIE()) {
        _this.windowsIEDownload(
          blob,
          fileName
        );
      }

      var oUrl = ($window.URL || $window.webkitURL).createObjectURL(blob);
      _this.objectUrl = oUrl;
      return oUrl;
    }; // webexCreateObjectUrl()

    this.getNewBlob = function (newData) {
      var blob = new $window.Blob([newData], {
        type: 'text/plain',
      });

      return blob;
    }; // getNewBlob()

    this.isWindowsIE = function () {
      var funcName = 'isWindowsIE()';
      var logMsg = '';

      var result = !!$window.navigator.msSaveOrOpenBlob;

      logMsg = funcName + '\n' +
        'result=' + result;
      Log.debug(logMsg);

      return result;
    }; // isWindowsIE()

    this.windowsIEDownload = function (
      blob,
      fileName
    ) {
      $window.navigator.msSaveOrOpenBlob(
        blob,
        fileName
      );
    }; // windowsIEDownload()

    this.revokeObjectUrl = function () {
      if (_this.objectUrl) {
        ($window.URL || $window.webkitURL).revokeObjectURL(_this.objectUrl);
        _this.objectUrl = null;
      }
    }; // revokeObjectUrl()
  } // WebExCsvDownloadService()
})();
