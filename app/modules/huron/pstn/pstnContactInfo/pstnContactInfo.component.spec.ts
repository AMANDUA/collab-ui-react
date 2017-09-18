import pstnContactInfo from './index';

describe('Component: PstnContactInfoComponent', () => {
  const FIRST_NAME_INPUT = '#firstName';
  const COMPANY_NAME_INPUT = '#companyName';
  const EMAIL_ADDRESS_INPUT = '#emailAddress';
  const CONFIRM_EMAIL_ADDRESS_INPUT = '#confirmEmailAddress';

  beforeEach(function () {
    this.initModules(pstnContactInfo);
    this.injectDependencies(
      '$scope',
      '$timeout',
    );
    this.$scope.contact = {
      companyName: 'Company Name',
      firstName: 'First',
      lastName: 'Last',
      emailAddress: 'company@gmail.com',
      confirmEmailAddress: 'company@gmail.com',
    };
  });

  function initComponent() {
    this.compileComponent('ucPstnContactInfo', {
      contact: 'contact',
    });
  }

  describe('init', () => {
    beforeEach(initComponent);

    it('should have first name input with value initialized', function () {
      expect(this.view.find(FIRST_NAME_INPUT)).toExist();
      expect(this.view.find(FIRST_NAME_INPUT).val()).toEqual('First');

      expect(this.view.find(COMPANY_NAME_INPUT)).toExist();
      expect(this.view.find(COMPANY_NAME_INPUT).val()).toEqual('Company Name');

      expect(this.view.find(EMAIL_ADDRESS_INPUT)).toExist();
      expect(this.view.find(EMAIL_ADDRESS_INPUT).val()).toEqual('company@gmail.com');

      expect(this.view.find(CONFIRM_EMAIL_ADDRESS_INPUT)).toExist();
      expect(this.view.find(CONFIRM_EMAIL_ADDRESS_INPUT).val()).toEqual(this.view.find(EMAIL_ADDRESS_INPUT).val());
    });

  });
});
