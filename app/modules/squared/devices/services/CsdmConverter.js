(function () {
  'use strict';

  angular.module('Squared').service('CsdmConverter',

    /* @ngInject  */
    function ($translate) {

      function CloudberryDevice(obj) {
        this.url = obj.url;
        this.isCloudberryDevice = true;
        this.type = 'cloudberry';
        this.mac = obj.mac;
        this.ip = getIp(obj);
        this.serial = obj.serial;
        this.sipUrl = obj.sipUrl;
        this.createTime = obj.createTime;
        this.cisUuid = obj.cisUuid;
        this.product = getProduct(obj);
        this.hasIssues = hasIssues(obj);
        this.software = getSoftware(obj);
        this.isOnline = getIsOnline(obj);
        this.lastConnectionTime = getLastConnectionTime(obj);
        this.tags = getTags(obj.description);
        this.displayName = obj.displayName;
        this.accountType = obj.accountType || 'MACHINE';
        this.photos = _.isEmpty(obj.photos) ? null : obj.photos;
        this.cssColorClass = getCssColorClass(obj);
        this.state = getState(obj);
        this.upgradeChannel = getUpgradeChannel(obj);
        this.readableActiveInterface = getActiveInterface(obj);
        this.diagnosticsEvents = getDiagnosticsEvents(obj);
        this.rsuKey = obj.remoteSupportUser && obj.remoteSupportUser.token;
        this.canDelete = true;
        this.canReportProblem = true;
        this.hasRemoteSupport = true;
        this.hasAdvancedSettings = true;
        this.supportsCustomTags = true;
        this.update = function (updated) {
          this.displayName = updated.displayName;
        };
        this.image = "images/devices-hi/" + (obj.imageFilename || 'unknown.png');
      }

      function HuronDevice(obj) {
        this.url = obj.url;
        this.type = 'huron';
        this.isATA = (obj.product || '').indexOf('ATA') > 0;
        this.mac = obj.mac;
        this.ip = getIp(obj);
        this.cisUuid = obj.cisUuid;
        this.isOnline = getIsOnline(obj);
        this.canReset = true;
        this.canDelete = true;
        this.canReportProblem = true;
        this.supportsCustomTags = true;
        this.accountType = obj.accountType || 'PERSON';
        this.displayName = obj.displayName;
        this.tags = getTags(decodeHuronTags(obj.description));
        this.cssColorClass = getCssColorClass(obj);
        this.state = getState(obj);
        this.photos = _.isEmpty(obj.photos) ? null : obj.photos;
        this.isHuronDevice = true;
        this.product = obj.product in huron_model_map ? huron_model_map[obj.product].displayName : getProduct(obj);
        this.image = "images/devices-hi/" + (obj.imageFilename || 'unknown.png');
        this.huronId = getHuronId(obj);
        this.addOnModuleCount = obj.addOnModuleCount;
      }

      var huron_model_map = {
        "MODEL_CISCO_7811": {
          displayName: "Cisco 7811",
        },
        "MODEL_CISCO_7821": {
          displayName: "Cisco 7821",
        },
        "MODEL_CISCO_7832": {
          displayName: "Cisco 7832",
        },
        "MODEL_CISCO_7841": {
          displayName: "Cisco 7841",
        },
        "MODEL_CISCO_7861": {
          displayName: "Cisco 7861",
        },
        "MODEL_CISCO_8811": {
          displayName: "Cisco 8811",
        },
        "MODEL_CISCO_8831": {
          displayName: "Cisco 8831",
        },
        "MODEL_CISCO_8841": {
          displayName: "Cisco 8841",
        },
        "MODEL_CISCO_8845": {
          displayName: "Cisco 8845",
        },
        "MODEL_CISCO_8851": {
          displayName: "Cisco 8851",
        },
        "MODEL_CISCO_8851NR": {
          displayName: "Cisco 8851NR",
        },
        "MODEL_CISCO_8861": {
          displayName: "Cisco 8861",
        },
        "MODEL_CISCO_8865": {
          displayName: "Cisco 8865",
        },
        "MODEL_CISCO_8865NR": {
          displayName: "Cisco 8865NR",
        },
        "MODEL_CISCO_ATA_190": {
          displayName: "Cisco ATA190-SC Port 1",
        },
      };

      function Code(obj) {
        this.expiryTime = obj.expiryTime;
        this.activationCode = obj.activationCode;
      }

      function updatePlaceFromItem(place, item) {

        if (item.isPlace) {
          updatePlaceFromPlace(place, item);
        } else {
          updatePlaceFromDevice(place, item);
        }
      }

      function updatePlaceFromDevice(place, device) {
        var updatedPlace = place;
        updatedPlace.type = device.type || updatedPlace.type;
        updatedPlace.cisUuid = device.cisUuid || device.uuid;
        updatedPlace.displayName = device.displayName;
        updatedPlace.sipUrl = device.sipUrl;
        Place.bind(updatedPlace)(updatedPlace);
      }

      function updatePlaceFromPlace(place, placeToUpdateFrom) {

        if (_.isEmpty(placeToUpdateFrom.devices)) {
          placeToUpdateFrom = _.merge(placeToUpdateFrom, _.pick(place, ['devices']));
        }
        Place.bind(place)(placeToUpdateFrom);
        place.devices = placeToUpdateFrom.devices;
      }

      function Place(obj) {
        this.url = obj.url;
        this.isPlace = true;
        this.type = obj.type || (obj.machineType == 'lyra_space' ? 'cloudberry' : 'huron');
        this.readableType = getLocalizedType(this.type);
        this.entitlements = obj.entitlements;
        this.cisUuid = obj.cisUuid || obj.uuid;
        this.displayName = obj.displayName;
        this.sipUrl = obj.sipUrl;
        this.numbers = obj.numbers;
        this.canDelete = true;
        this.accountType = obj.placeType || 'MACHINE';
        this.image = "images/devices-hi/unknown.png";
        this.devices = convertDevicesForPlace(obj.devices || {}, this.type, this.displayName);
        this.codes = obj.codes || {};
      }

      // Hack, these two fields should be set correctly in CSDM. Adding here until we can fix this.
      function convertDevicesForPlace(devices, type, displayName) {
        var converted = type === 'huron' ? convertHuronDevices(devices) : convertCloudberryDevices(devices);
        return _.map(converted, function (device) {
          device.accountType = 'MACHINE';
          device.displayName = displayName;
          return device;
        });
      }

      function decodeHuronTags(description) {
        var tagString = _.replace(description, /\['/g, '["').replace(/']/g, '"]').replace(/',/g, '",').replace(/,'/g, ',"');
        return tagString;
      }

      function convertCloudberryDevices(data) {
        return _.mapValues(data, convertCloudberryDevice);
      }

      function convertHuronDevices(data) {
        return _.mapValues(data, convertHuronDevice);
      }

      function convertPlaces(data) {
        return _.mapValues(data, convertPlace);
      }

      function convertCloudberryDevice(data) {
        return new CloudberryDevice(data);
      }

      function convertHuronDevice(data) {
        return new HuronDevice(data);
      }

      function convertPlace(data) {
        return new Place(data);
      }

      function convertCode(data) {
        return new Code(data);
      }

      function getProduct(obj) {
        return obj.product == 'UNKNOWN' ? '' : obj.product || obj.description;
      }

      function getSoftware(obj) {
        return _.chain(getEvents(obj))
          .filter({
            type: 'software',
            level: 'INFO',
          })
          .map('description')
          .head()
          .value();
      }

      function getUpgradeChannel(obj) {
        var channel = _.chain(getEvents(obj))
          .filter({
            type: 'upgradeChannel',
            level: 'INFO',
          })
          .map('description')
          .head()
          .value();

        var labelKey = 'CsdmStatus.upgradeChannels.' + channel;
        var label = $translate.instant('CsdmStatus.upgradeChannels.' + channel);
        if (label === labelKey) {
          label = channel;
        }
        return {
          label: label,
          value: channel,
        };
      }

      function getActiveInterface(obj) {
        if (obj.status) {
          var translationKey = 'CsdmStatus.activeInterface.' + (obj.status.activeInterface || '').toLowerCase();
          if (isTranslatable(translationKey)) {
            return $translate.instant(translationKey);
          }
        }
      }

      function getIp(obj) {
        return _.chain(getEvents(obj))
          .filter({
            type: 'ip',
            level: 'INFO',
          })
          .map('description')
          .head()
          .value();
      }

      function hasIssues(obj) {
        return getIsOnline(obj) && obj.status && obj.status.level && obj.status.level != 'OK';
      }

      function getDiagnosticsEvents(obj) {
        if (hasIssues(obj)) {
          return _.map(getNotOkEvents(obj), function (e) {
            return diagnosticsEventTranslated(e);
          });
        }
        return [];
      }

      function diagnosticsEventTranslated(e) {
        if (isTranslatable('CsdmStatus.errorCodes.' + e.type + '.type')) {
          return {
            type: translateOrDefault('CsdmStatus.errorCodes.' + e.type + '.type', e.type),
            message: translateOrDefault('CsdmStatus.errorCodes.' + e.type + '.message', e.description, e.references),
          };
        } else if (e.description) {
          return {
            type: $translate.instant('CsdmStatus.errorCodes.unknown.type'),
            message: $translate.instant('CsdmStatus.errorCodes.unknown.message_with_description', {
              errorCode: e.type,
              description: e.description,
            }),
          };
        } else {
          return {
            type: $translate.instant('CsdmStatus.errorCodes.unknown.type'),
            message: $translate.instant('CsdmStatus.errorCodes.unknown.message', {
              errorCode: e.type,
            }),
          };
        }
      }

      function translateOrDefault(translateString, defaultValue, parameters) {
        if (isTranslatable(translateString)) {
          return $translate.instant(translateString, parameters);
        } else {
          return defaultValue;
        }
      }

      function isTranslatable(key) {
        return $translate.instant(key) !== key;
      }

      function getNotOkEvents(obj) {
        var events = _.reject(getEvents(obj), function (e) {
          return e.level == 'INFO' && (e.type == 'ip' || e.type == 'software' || e.type == 'upgradeChannel');
        });
        return events;
      }

      function getEvents(obj) {
        return (obj.status && obj.status.events) || [];
      }

      function getIsOnline(obj) {
        return (obj.status || {}).connectionStatus == 'CONNECTED';
      }

      function getLastConnectionTime(obj) {
        moment.localeData(moment.locale())._calendar.sameElse = 'lll';
        return (obj.status && obj.status.lastStatusReceivedTime) ? moment(obj.status.lastStatusReceivedTime).calendar() : null;
      }

      function getHuronId(obj) {
        return obj.url && obj.url.substr(obj.url.lastIndexOf('/') + 1);
      }

      function getState(obj) {
        switch ((obj.status || {}).connectionStatus) {
          case 'CONNECTED':
            if (hasIssues(obj)) {
              return {
                readableState: t('CsdmStatus.OnlineWithIssues'),
                priority: "1",
              };
            }
            return {
              readableState: t('CsdmStatus.Online'),
              priority: "5",
            };
          default:
            return {
              readableState: t('CsdmStatus.Offline'),
              priority: "2",
            };
        }
      }

      function getCssColorClass(obj) {
        switch ((obj.status || {}).connectionStatus) {
          case 'CONNECTED':
            if (hasIssues(obj)) {
              return 'warning';
            }
            return 'success';
          default:
            return 'danger';
        }
      }

      function getLocalizedType(type) {
        if (type === 'huron') {
          return t('addDeviceWizard.chooseDeviceType.deskPhone');
        }
        return t('addDeviceWizard.chooseDeviceType.roomSystem');
      }

      function t(key) {
        return $translate.instant(key);
      }

      function getTags(description) {
        if (!description) {
          return [];
        }
        try {
          var tags = JSON.parse(description);
          return _.uniq(tags);
        } catch (e) {
          try {
            tags = JSON.parse("[\"" + description + "\"]");
            return _.uniq(tags);
          } catch (e) {
            return [];
          }
        }
      }

      return {
        updatePlaceFromItem: updatePlaceFromItem,
        convertPlace: convertPlace,
        convertPlaces: convertPlaces,
        convertCode: convertCode,
        convertCloudberryDevice: convertCloudberryDevice,
        convertCloudberryDevices: convertCloudberryDevices,
        convertHuronDevice: convertHuronDevice,
        convertHuronDevices: convertHuronDevices,
      };

    }
  );
})();
