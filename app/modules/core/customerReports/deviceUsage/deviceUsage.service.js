(function () {
  'use strict';

  angular
    .module('Core')
    .service('DeviceUsageService', DeviceUsageService);

  /* @ngInject */
  function DeviceUsageService($log, $q, $http, UrlConfig, Authinfo, $translate, HttpRequestCanceller) {

    var urlBase = UrlConfig.getAdminServiceUrl() + 'organization';
    var localUrlBase = 'http://berserk.rd.cisco.com:8080/atlas-server/admin/api/v1/organization';

    var csdmUrlBase = UrlConfig.getCsdmServiceUrl() + '/organization';

    function getDataForRange(start, end, granularity, deviceCategories, models, api) {
      var startDate = moment(start);
      var endDate = moment(end);

      //$log.info("categories parameter ignored in V2:", deviceCategories);

      if (_.isEmpty(models)) {
        models = 'aggregate';
      } else {
        models = models.join();
      }
      if (startDate.isValid() && endDate.isValid() && startDate.isBefore(endDate) /*&& endDate.isBefore(now)*/) {
        if (api === 'local') {
          urlBase = localUrlBase;
        }
        var url = urlBase + '/' + Authinfo.getOrgId() + '/reports/device/usage?';
        url = url + 'interval=day'; // As long week and month is not implemented
        url = url + '&from=' + start + '&to=' + end;
        //url = url + '&categories=' + deviceCategories;
        url = url + '&categories=aggregate';
        url = url + '&countryCodes=aggregate';
        url = url + '&accounts=aggregate';
        url = url + '&models=' + models;
        return getUsageData(url, granularity)
          .then(function (res) {
            return addMissingDaysInfo(res, start, end);
          })
          .then(function (res) {
            res.reportItems = reduceAllData(res.reportItems, granularity);
            return res;
          });
      } else {
        return $q.reject("Date problems").promise;
      }

    }

    function getBaseOrgUrl() {
      return urlBase + '/' + Authinfo.getOrgId() + "/";
    }

    function getUsageData(url) {
      return cancelableHttpGET(url).then(function (response) {
        if (!response.data.items) {
          response.data.items = [];
        }
        return response.data.items;
      }, function (reject) {
        $log.warn("Reject", reject);
        return $q.reject(analyseReject(reject));
      });
    }

    function addMissingDaysInfo(usageData, start, end) {
      return getMissingDays(start, end).then(function (missingDays) {
        var current = moment(start);
        var final = moment(end);
        while (current.isSameOrBefore(final)) {
          var day = current.format('YYYY-MM-DD');
          if (isDayMissing(missingDays, day)) {
            //$log.warn("Adding missing day", day);
            var missingDayData = {
              date: day,
              callDuration: 0,
              callCount: 0,
              inserted: true,
            };
            usageData.push(missingDayData);
          }
          current.add(1, 'days');
        }
        usageData.sort(function (a, b) {
          return moment(a.date).isBefore(moment(b.date));
        });

        if (missingDays.length > 0) {
          return { reportItems: usageData, missingDays: { missingDays: true, count: missingDays.length } };
        } else {
          return { reportItems: usageData, missingDays: { missingDays: false } };
        }
      });

    }

    function isDayMissing(missingDays, currentDay) {
      var dateMissing = _.find(missingDays, function (missingDay) {
        return (moment(missingDay.date).format("YYYYMMDD") == (moment(currentDay).format("YYYYMMDD")));
      });
      return dateMissing != undefined;
    }

    function getMissingDays(start, end) {
      var url = getBaseOrgUrl() + "reports/device/data_availability?interval=day&from=" + start + "&to=" + end;
      return cancelableHttpGET(url).then(function (response) {
        var items = response.data.items; // .available
        var missingDays = _.filter(items, (function (item) {
          return (item.available === false);
        }));
        return missingDays;
      }, function (reject) {
        $log.warn("Reject missing days request", reject);
        return $q.reject(analyseReject(reject));
      });
    }

    function analyseReject(reject) {

      if (reject.status === -1) {
        reject.statusText = 'Operation timed Out';
        reject.data = {
          message: 'Operation timed out',
        };
      }
      return reject;
    }

    function reduceAllData(items, granularity) {
      var reduced = _.chain(items).reduce(function (result, item) {
        var date = pickDateBucket(item, granularity);
        if (typeof result[date] === 'undefined') {
          result[date] = {
            callCount: 0,
            totalDuration: 0,
          };
        }
        if (_.isNil(item.callCount) || _.isNaN(item.callCount)) {
          $log.warn('Missing call count for', item);
          item.callCount = 0;
        }

        if (_.isNil(item.callDuration) || _.isNaN(item.callDuration)) {
          $log.warn('Missing call duration for', item);
          item.callDuration = 0;
        }

        result[date].callCount += item.callCount;
        result[date].totalDuration += item.callDuration;
        return result;
      }, {}).map(function (value, key) {
        value.totalDurationY = (value.totalDuration / 3600).toFixed(2);
        var timeFormatted = key.substr(0, 4) + '-' + key.substr(4, 2) + '-' + key.substr(6, 2);
        value.time = timeFormatted;
        return value;
      }).value();
      return reduced;
    }

    function extractStats(reduced, start, end, models) {
      var deferredAll = $q.defer();
      var stats = {
        most: [],
        least: [],
        noOfDevices: 0,
        noOfCalls: calculateTotalNoOfCalls(reduced),
        totalDuration: calculateTotalDuration(reduced),
      };
      var limit = 20;
      $q.all([getLeast(start, end, models, limit), getMost(start, end, models, limit), getTotalNoOfUsedDevices(start, end, models)]).then(function (results) {
        stats.least = results[0];
        stats.most = results[1];
        stats.noOfDevices = results[2];

        // Preliminary compatibility with V1
        _.each(stats.least, function (item) {
          item.totalDuration = item.callDuration;
        });

        // Preliminary compatibility with V1
        _.each(stats.most, function (item) {
          item.totalDuration = item.callDuration;
        });

        deferredAll.resolve(stats);
      }).catch(function (ex) {
        deferredAll.reject(ex);
      });

      return deferredAll.promise;
    }

    function getTotalNoOfUsedDevices(start, end, models) {
      if (_.isEmpty(models)) {
        models = '__';
      } else {
        models = models.join();
      }
      var url = getBaseOrgUrl() +
        "reports/device/usage/count?interval=day&from="
        + start + "&to=" + end
        + "&models=" + models
        //+ "&excludeUnused=false";
        + "&excludeUnused=true";

      return cancelableHttpGET(url).then(function (response) {
        return response.data.items[0].count;
      });
    }

    function calculateTotalNoOfCalls(data) {
      return _.sumBy(data, function (item) {
        return item.callCount;
      });
    }

    function calculateTotalDuration(data) {
      return _.sumBy(data, function (item) {
        return item.totalDuration;
      });
    }

    function getLeast(start, end, models, limit) {
      if (_.isEmpty(models)) {
        models = '__';
      } else {
        models = models.join();
      }

      //TODO: Include model when backend supports it

      var url = getBaseOrgUrl() + "reports/device/usage/aggregate?interval=day&from=" + start
        + "&to=" + end
        //+ "&accounts=__&categories=__&models=" + models
        + "&countryCodes=aggregate&models=" + models

        + "&orderBy=callDuration&descending=false&limit=" + limit;
        //+ "&orderBy=callDuration&descending=false&excludeUnused=true&limit=" + limit;

      return cancelableHttpGET(url).then(function (response) {
        return response.data.items;
      });
    }

    function getMost(start, end, models, limit) {
      if (_.isEmpty(models)) {
        models = '__';
      } else {
        models = models.join();
      }
      //&countryCodes=aggregate&orderBy=callDuration&descending=true&limit=20
      var url = getBaseOrgUrl() + "reports/device/usage/aggregate?interval=day&from=" + start
        + "&to=" + end
        //+ "&accounts=__&categories=__&models=" + models
        + "&countryCodes=aggregate&models=" + models

        + "&orderBy=callDuration&descending=true&limit=" + limit;
      return cancelableHttpGET(url).then(function (response) {
        return response.data.items;
      });
    }

    function pickDateBucket(item, granularity) {
      var date = moment(item.date).startOf(granularity);
      switch (granularity) {
        case 'day':
          return date.format('YYYYMMDD');
        case 'week':
          //return moment(formattedDate).startOf('isoWeek').format('YYYYMMDD');
          return moment(item.date).startOf('isoWeek').format('YYYYMMDD');
        case 'month':
          return date.format('YYYYMMDD');
      }
    }

    function resolveDeviceData(devices) {
      var promises = [];

      _.each(devices, function (device) {
        var csdmUrl = csdmUrlBase + '/' + Authinfo.getOrgId() + '/places/';
        promises.push(cancelableHttpGET(csdmUrl + device.accountId)
          .then(function (res) {
            return res.data;
          })
          .catch(function (err) {
            //$log.info("Problems resolving device", err);
            var infoText = "";
            if (err.status === -1) {
              infoText = $translate.instant('reportsPage.usageReports.timeoutWhenTryingToResolveNameFor') + " device id=" + device.accountId;
            } else {
              infoText = $translate.instant('reportsPage.usageReports.nameNotFoundFor') + " device id=" + device.accountId;
            }
            return {
              "displayName": $translate.instant('reportsPage.usageReports.nameNotResolvedFor') + " id=" + device.accountId,
              "info": infoText,
            };
          })
        );
      });
      return $q.all(promises);
    }

    function cancelableHttpGET(url) {
      var config = {
        timeout: HttpRequestCanceller.newCancelableTimeout(),
      };

      return $http
        .get(url, config)
        .catch(function (error) {
          error.cancelled = _.get(error, 'config.timeout.cancelled', false);
          error.timedout = _.get(error, 'config.timeout.timedout', false);
          return $q.reject(error);
        });
    }

    function cancelAllRequests() {
      return HttpRequestCanceller.cancelAll();
    }

    return {
      getDataForRange: getDataForRange,
      extractStats: extractStats,
      resolveDeviceData: resolveDeviceData,
      reduceAllData: reduceAllData,
      cancelAllRequests: cancelAllRequests,
    };
  }
}());
