(function () {
  'use strict';

  angular
    .module('Gemini')
    .controller('servicePartnerCtrl', servicePartnerCtrl);

  /* @ngInject */
  function servicePartnerCtrl(gemService, Notification) {
    var vm = this;
    vm.loading = true;
    gemService.getSpData().then(function (res) {
      var resJson = _.get(res.content, 'data');
      if (resJson.returnCode) {
        Notification.error('gemini.errorCode.loadError');
        return;
      }

      if (resJson.body.length) {
        vm.loading = false;
        vm.data = resJson.body;
      } else {
        Notification.error('gemini.msg.splsResponseErr');
      }
    });
  }
})();
