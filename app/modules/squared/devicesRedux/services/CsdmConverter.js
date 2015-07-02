'use strict';

angular.module('Squared').service('CsdmConverter',

  /* @ngInject  */
  function ($translate) {

    function Device(obj) {
      this.url = obj.url;
      this.mac = obj.mac;
      this.ip = getIp(obj);
      this.serial = obj.serial;
      this.product = getProduct(obj);
      this.hasIssues = hasIssues(obj);
      this.software = getSoftware(obj);
      this.isOnline = getIsOnline(obj);
      this.displayName = obj.displayName;
      this.cssColorClass = getCssColorClass(obj);
      this.readableState = getReadableState(obj);
      this.needsActivation = getNeedsActivation(obj);
      this.diagnosticsEvents = getDiagnosticsEvents(obj);
      this.readableActivationCode = getReadableActivationCode(obj);
    }

    function Code(obj) {
      obj.state = obj.status;
      this.url = obj.url;
      this.displayName = obj.displayName;
      this.readableState = getReadableState(obj);
      this.cssColorClass = getCssColorClass(obj);
      this.needsActivation = getNeedsActivation(obj);
      this.activationCode = obj.activationCode;
      this.readableActivationCode = getReadableActivationCode(obj);
    }

    var convertCodes = function (data) {
      return _.mapValues(data, function (obj) {
        return new Code(obj);
      });
    };

    var convertDevices = function (data) {
      return _.mapValues(data, function (obj) {
        return new Device(obj);
      });
    };

    var getProduct = function (obj) {
      return obj.product == 'UNKNOWN' ? '' : obj.product;
    };

    var getSoftware = function (obj) {
      return _.chain(getEvents(obj))
        .where({
          type: 'software',
          level: 'INFO'
        })
        .pluck('description')
        .first()
        .value();
    };

    var getIp = function (obj) {
      return _.chain(getEvents(obj))
        .where({
          type: 'ip',
          level: 'INFO'
        })
        .pluck('description')
        .first()
        .value();
    };

    var hasIssues = function (obj) {
      return obj.status && obj.status.level && obj.status.level != 'OK';
    };

    var getDiagnosticsEvents = function (obj) {
      return _.map(getNotOkEvents(obj), function (e) {
        return diagnosticsEventTranslated(e);
      });
    };

    var diagnosticsEventTranslated = function (e) {
      if (isTranslatable('CsdmStatus.errorCodes.' + e.type + '.type')) {
        return {
          type: translateOrDefault('CsdmStatus.errorCodes.' + e.type + '.type', e.type),
          message: translateOrDefault('CsdmStatus.errorCodes.' + e.type + '.message', e.description)
        };
      } else if (e.description) {
        return {
          type: $translate.instant('CsdmStatus.errorCodes.unknown.type'),
          message: $translate.instant('CsdmStatus.errorCodes.unknown.message_with_description', {
            errorCode: e.type,
            description: e.description
          })
        };
      } else {
        return {
          type: $translate.instant('CsdmStatus.errorCodes.unknown.type'),
          message: $translate.instant('CsdmStatus.errorCodes.unknown.message', {
            errorCode: e.type
          })
        };
      }
    };

    var translateOrDefault = function (translateString, defaultValue) {
      if (isTranslatable(translateString)) {
        return $translate.instant(translateString);
      } else {
        return defaultValue;
      }
    };

    var isTranslatable = function (key) {
      return $translate.instant(key) !== key;
    };

    var getNotOkEvents = function (obj) {
      return _.reject(getEvents(obj), function (e) {
        return e.level == 'INFO' && (e.type == 'ip' || e.type == 'software');
      });
    };

    var getEvents = function (obj) {
      return (obj.status && obj.status.events) || [];
    };

    var getNeedsActivation = function (obj) {
      return obj.state == 'UNCLAIMED';
    };

    var getReadableActivationCode = function (obj) {
      if (obj.activationCode) {
        return obj.activationCode.match(/.{4}/g).join(' ');
      }
    };

    var getIsOnline = function (obj) {
      return (obj.status || {}).connectionStatus == 'CONNECTED';
    };

    var getReadableState = function (obj) {
      if (hasIssues(obj)) {
        return t('CsdmStatus.issuesDetected');
      }
      switch (obj.state) {
      case 'UNCLAIMED':
        return t('CsdmStatus.NeedsActivation');
      case 'CLAIMED':
        switch ((obj.status || {}).connectionStatus) {
        case 'CONNECTED':
          return t('CsdmStatus.Online');
        default:
          return t('CsdmStatus.Offline');
        }
      }
      return t('CsdmStatus.Unknown');
    };

    var getCssColorClass = function (obj) {
      if (hasIssues(obj)) {
        return 'device-status-red';
      }
      switch (obj.state) {
      case 'UNCLAIMED':
        return 'device-status-yellow';
      case 'CLAIMED':
        switch ((obj.status || {}).connectionStatus) {
        case 'CONNECTED':
          return 'device-status-green';
        default:
          return 'device-status-gray';
        }
      }
      return 'device-status-yellow';
    };

    var t = function (key) {
      return $translate.instant(key);
    };

    return {
      convert: convertDevices,
      convertDevices: convertDevices,
      convertCodes: convertCodes,
      Code: Code
    };

  }
);
