describe('component: speedDial', () => {
  const DROPDOWN_LIST = 'button[cs-dropdown-toggle]';
  const DROPDOWN_LIST_ADD = '.actions-services li:nth-child(1) a';

  const INPUT_NAME = 'input[name="label"]';
  const INPUT_NUMBER = 'div#speedDialsContainer input.phone-number';
  const SAVE_BUTTON = 'button.btn--primary';
  const READ_ONLY = '.sd-readonly-wrapper .sd-label';
  const DROPDOWN_LIST_REORDER = '.actions-services li:nth-child(2) a';
  const REORDER = '.sd-reorder';

  beforeEach(function() {
    this.initModules('huron.speed-dial');
    this.injectDependencies(
      '$scope',
      '$timeout',
      'SpeedDialService',
      '$q',
      'HuronCustomerService',
      'BlfInternalExtValidation',
      'Authinfo',
      'BlfURIValidation',
      'HuronConfig',
      '$httpBackend',
    );
    this.$scope.onChangeFn = jasmine.createSpy('onChangeFn');
    this.callDestInputs = ['external', 'uri', 'custom'];
    this.firstReordering = true;
    this.editing = false;
    this.reordering = false;
    this.callDest = { phonenumber: '1234' };
    // spyOn(this.SpeedDialService, 'updateSpeedDials').and.returnValue(this.$q.resolve(true));
    spyOn(this.SpeedDialService, 'getSpeedDials').and.returnValue(this.$q.resolve({
      speedDials: [],
    }));
    spyOn(this.SpeedDialService, 'updateSpeedDials').and.returnValue(this.$q.resolve());
    spyOn(this.Authinfo, 'getOrgId').and.returnValue('123');
    spyOn(this.HuronCustomerService, 'getVoiceCustomer').and.returnValue(this.$q.resolve({ uuid: '123', dialingPlanDetails: { regionCode: '', countryCode: '+1' } }));
    this.$httpBackend.whenGET(this.HuronConfig.getCmiUrl() + '/common/customers/' + this.Authinfo.getOrgId() + '/users/12345').respond(200);
  });

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  function initComponent() {
    this.compileComponent('ucSpeedDial', {
      ownerName: 'users',
      ownerId: '12345',
    });
    this.$scope.$apply();
  }

  describe('should have speeddial functionality', function () {

    beforeEach(initComponent);
    it('should have speed dial add functionality', function () {
      this.view.find(DROPDOWN_LIST).click();
      this.view.find(DROPDOWN_LIST_ADD).click();
      expect(this.view.find(INPUT_NAME)).toExist();
      expect(this.view.find(SAVE_BUTTON)).toBeDisabled();
      this.view.find(INPUT_NAME).val('Paul').change();
      this.view.find(INPUT_NUMBER).val('+1 214-781-8900').change();
      expect(this.view.find(SAVE_BUTTON)).not.toBeDisabled();
      this.view.find(SAVE_BUTTON).click();
      expect(this.view.find(READ_ONLY).get(0)).toHaveText('Paul');
      this.$httpBackend.flush();
    });

    it('should have speed dial reorder functionality', function () {
      this.view.find(DROPDOWN_LIST).click();
      this.view.find(DROPDOWN_LIST_ADD).click();
      this.view.find(INPUT_NAME).val('Home').change();
      this.view.find(INPUT_NUMBER).val('+1 214-345-3234').change();
      this.view.find(SAVE_BUTTON).click();
      expect(this.view.find(REORDER).get(0)).not.toExist();
      this.view.find(DROPDOWN_LIST).click();
      this.view.find(DROPDOWN_LIST_REORDER).click();
      expect(this.view.find(REORDER).get(0)).toExist();
      this.$httpBackend.flush();
    });
  });

  describe('should have blf functionality for validating extension', function () {
    let modelnumber, modeluri;
    beforeEach(initComponent);
    beforeEach(function () {
      modelnumber = {
        code: '',
        name: '',
        number: '',
        phoneNumber: '789',
      };
      modeluri = {
        code: '',
        name: '',
        number: '',
        phoneNumber: 'test@cisco',
      };
      spyOn(this.controller, 'extensionOwned').and.callThrough();
    });

    afterEach(function () {
      this.$httpBackend.verifyNoOutstandingExpectation();
      this.$httpBackend.verifyNoOutstandingRequest();
    });

    it('should have have blf enabled for valid number', function () {
      this.controller.optionSelected = 'custom';
      this.$httpBackend.whenGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/validate/internalextension?value=789').respond(200);
      this.controller.setSpeedDial(modelnumber);
      this.$timeout.flush();
      this.$httpBackend.flush();
      expect(this.controller.extension).toEqual('789');
      expect(this.controller.isValid).toBeTruthy();
    });

    it('should have have blf disabled for invalid number', function () {
      this.controller.optionSelected = 'custom';
      this.$httpBackend.whenGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/validate/internalextension?value=789').respond(500);
      this.controller.setSpeedDial(modelnumber);
      this.$timeout.flush();
      this.$httpBackend.flush();
      expect(this.controller.isValid).toBeFalsy();
    });

    it('should have have blf enabled for valid uri', function () {
      this.controller.optionSelected = 'uri';
      this.$httpBackend.whenGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/validate/uri?value=test@cisco').respond(200);
      this.controller.setSpeedDial(modeluri);
      this.$timeout.flush();
      this.$httpBackend.flush();
      expect(this.controller.isValid).toBeTruthy();
    });

    it('should have have blf disabled for invalid uri', function () {
      this.controller.optionSelected = 'uri';
      this.$httpBackend.whenGET(this.HuronConfig.getCmiV2Url() + '/customers/' + this.Authinfo.getOrgId() + '/validate/uri?value=test@cisco').respond(500);
      this.controller.setSpeedDial(modeluri);
      this.$timeout.flush();
      this.$httpBackend.flush();
      expect(this.controller.isValid).toBeFalsy();
    });
  });
});
