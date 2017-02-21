(function () {
  'use strict';

  angular.module('Huron')
    .controller('PstnSwivelNumbersCtrl', PstnSwivelNumbersCtrl);

  /* @ngInject */
  function PstnSwivelNumbersCtrl($translate, $state, $timeout, PstnSetup, PstnSetupService, Notification, TelephoneNumberService) {
    var vm = this;

    vm.hasCarriers = PstnSetup.isCarrierExists;
    vm.hasBackButton = hasBackButton;
    vm.goBack = goBack;
    vm.validateSwivelNumbers = validateSwivelNumbers;
    vm.getExampleNumbers = TelephoneNumberService.getExampleNumbers;

    vm.tokenfieldid = 'swivelAddNumbers';
    vm.tokenplaceholder = $translate.instant('didManageModal.inputPlacehoder');
    vm.tokenoptions = {
      delimiter: [',', ';'],
      createTokensOnBlur: true,
      limit: 50,
      tokens: [],
      minLength: 9,
      beautify: false,
    };
    vm.tokenmethods = {
      createtoken: createToken,
      createdtoken: createdToken,
      edittoken: editToken,
    };

    init();

    ////////////////////////

    function init() {
      vm.provider = PstnSetup.getProvider();
      vm.swivelNumbers = PstnSetup.getNumbers();
      TelephoneNumberService.setRegionCode(vm.provider.country);
      $timeout(function () {
        setSwivelNumberTokens(vm.swivelNumbers);
      }, 100);
    }

    function editToken(e) {
      // If invalid token, show the label text in the edit input
      if (e.attrs.invalid) {
        e.attrs.value = e.attrs.label;
      }
    }

    function createToken(e) {
      if (e.attrs.value.charAt(0) !== '+') {
        e.attrs.value = '+'.concat(e.attrs.value);
      }
      try {
        e.attrs.value = e.attrs.label = phoneUtils.formatE164(e.attrs.value);
      } catch (e) {
        //noop
      }

      var duplicate = _.find(getSwivelNumberTokens(), {
        value: e.attrs.value,
      });
      if (duplicate) {
        e.attrs.duplicate = true;
      }
    }

    function createdToken(e) {
      if (e.attrs.duplicate) {
        $timeout(function () {
          var tokens = getSwivelNumberTokens();
          tokens = tokens.splice(_.indexOf(tokens, e.attrs), 1);
          Notification.error('pstnSetup.duplicateNumber', {
            number: e.attrs.label,
          });
          setSwivelNumberTokens(tokens.map(function (token) {
            return token.value;
          }));
        });
      } else if (!TelephoneNumberService.internationalNumberValidator(e.attrs.value)) {
        angular.element(e.relatedTarget).addClass('invalid');
        e.attrs.invalid = true;
      }
    }

    function setSwivelNumberTokens(tokens) {
      $('#' + vm.tokenfieldid).tokenfield('setTokens', tokens);
    }

    function getSwivelNumberTokens() {
      return $('#' + vm.tokenfieldid).tokenfield('getTokens');
    }

    function validateSwivelNumbers() {
      var tokens = getSwivelNumberTokens() || [];
      var invalid = _.find(tokens, {
        invalid: true,
      });
      if (invalid) {
        Notification.error('pstnSetup.invalidNumberPrompt');
      } else if (tokens.length === 0) {
        Notification.error('pstnSetup.orderNumbersPrompt');
      } else {
        //set numbers for if they go back
        PstnSetup.setNumbers(tokens);
        var numbers = _.map(tokens, function (number) {
          return number.value;
        });
        var swivelOrder = [{
          data: {
            numbers: numbers,
          },
          numberType: PstnSetupService.NUMTYPE_DID,
          orderType: PstnSetupService.SWIVEL_ORDER,
        }];
        PstnSetup.setOrders(swivelOrder);
        $state.go('pstnSetup.review');
      }
    }

    function hasBackButton() {
      return !PstnSetup.isCarrierExists() && !PstnSetup.isSingleCarrierReseller();
    }

    function goBack() {
      $state.go('pstnSetup');
    }

  }
})();
