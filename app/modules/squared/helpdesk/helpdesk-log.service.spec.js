'use strict';

describe('Service: HelpdeskLogService', function () {
  beforeEach(angular.mock.module('Squared'));

  var Service, LogService, scope;

  beforeEach(inject(function (_HelpdeskLogService_, _LogService_, _$rootScope_) {
    Service = _HelpdeskLogService_;
    LogService = _LogService_;
    scope = _$rootScope_.$new();

    var lastPushedLog = {
      success: true,
      metadataList: [{
        filename: "lastLogFile",
        timestamp: "2016-02-08T09:18:54.238Z",
        platform: "0-1-2",
      }],
    };

    var logs = {
      success: true,
      metadataList: [{
        filename: "logFile1",
        timestamp: "2016-01-25T11:46:24.757Z",
        platform: "a-b-c",
      }, {
        filename: "logFile2",
        timestamp: "2016-02-04T11:02:48.354Z",
        platform: "d-e-f",
      }, {
        filename: "logFile3",
        timestamp: "2016-02-08T09:18:54.238Z",
        platform: "g-h-i",
      }, {
        filename: "logFile4",
        timestamp: "2016-01-25T11:19:19.443Z",
        platform: "j-k-l",
      }],
    };

    var download = {
      success: true,
      tempURL: 'http://download.com',
    };

    sinon.stub(LogService, 'searchLogs');
    sinon.stub(LogService, 'listLogs');
    sinon.stub(LogService, 'downloadLog');
    LogService.searchLogs.yields(lastPushedLog);
    LogService.listLogs.yields(logs);
    LogService.downloadLog.yields(download);
  }));

  it('fetches the last log on search', function (done) {
    Service.searchForLastPushedLog('searchterm').then(function (log) {
      expect(log.filename).toEqual("lastLogFile");
      expect(log.platform).toEqual("2");
      done();
    }, function (reason) {
      fail(reason);
    });
    scope.$apply();
  });

  it('fetches the last log on user id', function (done) {
    Service.getLastPushedLogForUser('userid').then(function (log) {
      expect(log.filename).toEqual("logFile3");
      expect(log.platform).toEqual("i");
      done();
    }, function (reason) {
      fail(reason);
    });
    scope.$apply();
  });

  it('can download log', function (done) {
    Service.downloadLog('filename').then(function (url) {
      expect(url).toEqual('http://download.com');
      done();
    }, function (reason) {
      fail(reason);
    });
    scope.$apply();
  });

});
