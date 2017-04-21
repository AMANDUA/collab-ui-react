(function () {
  'use strict';

  module.exports = TrialMessageService;

  /* @ngInject */
  function TrialMessageService(Config) {
    var _trialData;
    var service = {
      getData: getData,
      reset: reset,
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
        'type': Config.offerTypes.message,
        'enabled': false,
        'details': {},
      };

      _trialData = _.cloneDeep(defaults);
      return _trialData;
    }
  }
})();
