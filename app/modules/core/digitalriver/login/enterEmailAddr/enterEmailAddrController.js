(function () {
  'use strict';

  angular
    .module('Core')
    .controller('enterEmailAddrController', enterEmailAddrController);

  /* @ngInject */
  function enterEmailAddrController($window, $translate, Userservice) {

    var vm = this;

    vm.handleEnterEmailAddr = function () {
      if (!vm.email || 0 === vm.email.trim().length) {
        vm.error = $translate.instant('digitalRiver.enterEmailAddr.validation.emptyEmail');
        return;
      }

      Userservice.getUserFromEmail(vm.email)
        .then(function (result) {
          if (result.data.success === true) {
            $window.location.href = (_.get(result, 'data.data.exists', false) === true ? "/#/drLoginForward" : "/#/createAccount") + "?email=" + vm.email;
          } else {
            vm.error = _.get(result, 'data.message', $translate.instant('digitalRiver.validation.unexpectedError'));
          }
        }, function (result, status) {
          vm.error = _.get(result, 'data.message', $translate.instant('digitalRiver.validation.unexpectedError'));
        });
    };

  }
})();