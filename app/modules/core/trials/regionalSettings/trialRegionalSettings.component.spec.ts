describe('Component: trialRegionalSettings', () => {
  const COUNTRY_SELECT = '.csSelect-container[name="defaultCountry"]';
  const DROPDOWN_OPTIONS = '.dropdown-menu ul li a';
  const PLACEHOLDER = '.placeholder';
  const ERROR_DIV = 'div.ellipsis span.text-wrap';
  const ERROR_MSG = 'common.invalidRequired';

  beforeEach(function () {
    this.initModules('trial.regionalSettings');
    this.injectDependencies('$scope', '$q', 'HuronCountryService', 'FeatureToggleService');

    let countryList = getJSONFixture('core/json/trials/countryList.json');

    this.$scope.onChangeFn = jasmine.createSpy('onChangeFn');
    spyOn(this.HuronCountryService, 'getCountryList').and.returnValue(countryList);
    this.$scope.defaultCountry = '';
  });

  function initComponent() {
    this.compileComponent('trialRegionalSettings', {
      callTrialEnabled: 'callTrialEnabled',
      defaultCountry: '',
      onChangeFn: 'onChangeFn(country)',
      showError: 'true',
      selectName: 'defaultCountry',
    });
  }

  describe('Without country feature toggles', () => {
    beforeEach(function () {
      spyOn(this.FeatureToggleService, 'supports').and.returnValue(false);
    });
    beforeEach(initComponent);

    it('should have a drop down select box with 2 options, US and Canada', function () {
      expect(this.view).toContainElement(COUNTRY_SELECT);
      expect(this.controller.countryList.length).toBe(2);
      expect(this.view.find(COUNTRY_SELECT).find(DROPDOWN_OPTIONS).get(0)).toHaveText('Canada');
    });

    it('should have a placeholder', function () {
      expect(this.view.find(PLACEHOLDER)).toHaveText('serviceSetupModal.defaultCountryPlaceholder');
    });

    it('should invoke onChangeFn when a country is selected', function () {
      this.view.find(COUNTRY_SELECT).find(DROPDOWN_OPTIONS).get(0).click();
      expect(this.$scope.onChangeFn).toHaveBeenCalledWith(jasmine.objectContaining({
        id: 'CA',
      }));
    });

    describe('and call trial is false', () => {
      beforeEach(function () {
        this.$scope.callTrialEnabled = false;
        this.$scope.$apply();
      });

      it('should add N/A to the country list', function () {
        expect(this.controller.countryList.length).toBe(3);
        expect(this.view.find(COUNTRY_SELECT).find(DROPDOWN_OPTIONS).get(2)).toHaveText('serviceSetupModal.notApplicable');
      });
    });
  });

  describe('With federation feature toggle', () => {
    beforeEach(function () {
      spyOn(this.FeatureToggleService, 'supports').and.returnValue(true);
    });
    beforeEach(initComponent);

    it('should have a drop down select box with European options', function () {
      expect(this.view).toContainElement(COUNTRY_SELECT);
      expect(this.view.find(COUNTRY_SELECT).find(DROPDOWN_OPTIONS).get(0)).toHaveText('Austria');
      expect(this.view).toContainElement(ERROR_DIV);
      expect(this.view.find(ERROR_DIV)).toHaveText(ERROR_MSG);
    });

    it('should have a placeholder', function () {
      expect(this.view.find(PLACEHOLDER)).toHaveText('serviceSetupModal.defaultCountryPlaceholder');
    });

    it('should invoke onChangeFn when a country is selected', function () {
      this.view.find(COUNTRY_SELECT).find(DROPDOWN_OPTIONS).get(0).click();
      expect(this.$scope.onChangeFn).toHaveBeenCalledWith(jasmine.objectContaining({
        id: 'AT',
      }));
      expect(this.view).not.toContainElement(ERROR_DIV);
    });

    describe('When call trial is false', () => {
      beforeEach(function () {
        this.$scope.callTrialEnabled = false;
        this.$scope.$apply();
      });

      it('should add N/A to the country list', function () {
        expect(this.controller.countryList.length).toBe(15);
        expect(this.view.find(COUNTRY_SELECT).find(DROPDOWN_OPTIONS).get(14)).toHaveText('serviceSetupModal.notApplicable');
      });
    });
  });

});
