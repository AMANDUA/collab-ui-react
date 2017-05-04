(function () {
  'use strict';

  var NUMTYPE_DID = require('modules/huron/pstn').NUMTYPE_DID;
  var NUMBER_ORDER = require('modules/huron/pstn').NUMBER_ORDER;
  module.exports = TrialPstnService;

  /* @ngInject */
  function TrialPstnService($q, Config, Notification, PstnServiceAddressService, PstnService) {
    var _trialData;
    var service = {
      getData: getData,
      reset: reset,
      createPstnEntityV2: createPstnEntityV2,
      resetAddress: resetAddress,
      checkForPstnSetup: checkForPstnSetup,
      setCountryCode: setCountryCode,
      getCountryCode: getCountryCode,
      getCarrierCapability: getCarrierCapability,
    };

    return service;

    ////////////////

    function getData() {
      return _trialData || _makeTrial();
    }

    function reset() {
      _makeTrial();
    }

    function _makeTrial() {
      var defaults = {
        type: Config.offerTypes.pstn,
        enabled: false,
        skipped: false,
        reseller: false,
        details: {
          isTrial: true,
          countryCode: PstnService.getCountryCode(),
          pstnProvider: {},
          swivelNumbers: [],
          pstnContractInfo: {
            companyName: '',
            firstName: '',
            lastName: '',
            emailAddress: '',
          },
          pstnNumberInfo: {
            state: {},
            areaCode: {},
            nxx: {},
            numbers: [],
          },
          pstnOrderData: [],
          emergAddr: {
            streetAddress: '',
            unit: '',
            city: '',
            state: '',
            zip: '',
          },
        },
      };

      _trialData = _.cloneDeep(defaults);
      return _trialData;
    }

    function createPstnEntityV2(customerOrgId, customerName) {
      return checkForPstnSetup(customerOrgId)
        .catch(function () {
          if (_trialData.details.pstnProvider.apiImplementation === "SWIVEL") {
            _trialData.details.pstnNumberInfo.numbers = _trialData.details.swivelNumbers;
            _trialData.details.pstnContractInfo.companyName = customerName;
            return createPstnCustomerV2(customerOrgId)
              .then(_.partial(createCustomerSite, customerOrgId))
              .then(_.partial(reserveNumbersWithCustomerV2, customerOrgId))
              .then(_.partial(orderNumbers, customerOrgId)); // Terminus V1 order API doesn't support swivel orders
          } else {
            return createPstnCustomerV2(customerOrgId)
              .then(_.partial(createCustomerSite, customerOrgId))
              .then(_.partial(reserveNumbersWithCustomerV2, customerOrgId))
              .then(_.partial(orderNumbersV2, customerOrgId));
          }
        });
    }

    function checkForPstnSetup(customerOrgId) {
      return PstnService.getCustomerV2(customerOrgId);
    }

    function reserveNumbersWithCustomerV2(customerOrgId) {
      if (_trialData.details.pstnProvider.apiImplementation !== "SWIVEL") {
        if (_.isString(_trialData.details.pstnNumberInfo.numbers[0])) {
          return PstnService.reserveCarrierInventoryV2(
            customerOrgId,
            _trialData.details.pstnProvider.uuid,
            _trialData.details.pstnNumberInfo.numbers,
            true
          ).then(function (reservationData) {
            var order = {
              data: {
                numbers: reservationData.numbers,
              },
              numberType: NUMTYPE_DID,
              orderType: NUMBER_ORDER,
              reservationId: reservationData.uuid,
            };
            _trialData.details.pstnOrderData.push(order);
          }).catch(function (response) {
            Notification.errorResponse(response, 'trialModal.pstn.error.reserveFail');
            return $q.reject(response);
          });
        } else {
          for (var i = 0; i < _trialData.details.pstnNumberInfo.numbers.length; i++) {
            _trialData.details.pstnOrderData.push(_trialData.details.pstnNumberInfo.numbers[i]);
          }
          return $q.resolve();
        }
      } else {
        return $q.resolve();
      }
    }

    function createPstnCustomerV2(customerOrgId) {
      return PstnService.createCustomerV2(
        customerOrgId,
        _trialData.details.pstnContractInfo.companyName,
        _trialData.details.pstnContractInfo.firstName,
        _trialData.details.pstnContractInfo.lastName,
        _trialData.details.pstnContractInfo.emailAddress,
        _trialData.details.pstnProvider.uuid,
        _trialData.details.isTrial
      ).catch(function (response) {
        Notification.errorResponse(response, 'trialModal.pstn.error.customerFail');
        return $q.reject(response);
      });
    }

    function orderNumbers(customerOrgId) {
      return PstnService.orderNumbers(
        customerOrgId,
        _trialData.details.pstnProvider.uuid,
        _trialData.details.pstnNumberInfo.numbers
      ).catch(function (response) {
        Notification.errorResponse(response, 'trialModal.pstn.error.orderFail');
        return $q.reject(response);
      });
    }

    function orderNumbersV2(customerOrgId) {
      return PstnService.orderNumbersV2(
        customerOrgId,
        _trialData.details.pstnOrderData
      ).catch(function (response) {
        Notification.errorResponse(response, 'trialModal.pstn.error.orderFail');
        return $q.reject(response);
      });
    }

    function createCustomerSite(customerOrgId) {
      if (_trialData.details.pstnProvider.apiImplementation !== "SWIVEL") {
        var address = {
          streetAddress: _trialData.details.emergAddr.streetAddress,
          unit: _trialData.details.emergAddr.unit,
          city: _trialData.details.emergAddr.city,
          state: _trialData.details.emergAddr.state,
          zip: _trialData.details.emergAddr.zip,
        };
        return PstnServiceAddressService.createCustomerSite(
          customerOrgId,
          _trialData.details.pstnContractInfo.companyName,
          address
        ).catch(function (response) {
          Notification.errorResponse(response, 'trialModal.pstn.error.siteFail');
          return $q.reject(response);
        });
      }
    }

    function resetAddress() {
      _trialData.details.emergAddr = {
        streetAddress: '',
        unit: '',
        city: '',
        state: '',
        zip: '',
      };
    }

    function getCountryCode() {
      return PstnService.getCountryCode();
    }

    function setCountryCode(countryCode) {
      getData();
      _trialData.details.countryCode = countryCode;
      PstnService.setCountryCode(countryCode);
    }

    function getCarrierCapability(capability) {
      var carrier = PstnService.getProvider();
      if (!carrier) {
        return false;
      }
      return carrier.getCapability(capability);
    }

  }
})();
