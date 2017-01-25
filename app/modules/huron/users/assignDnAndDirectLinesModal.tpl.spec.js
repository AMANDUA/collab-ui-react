'use strict';

var csvDownloadModule = require('modules/core/csvDownload').default;

describe('Template: assignDnAndDirectLinesModal', function () {

  function init() {
    this.initModules('Core', 'Hercules', 'Huron', 'Messenger', 'Sunlight', 'WebExApp', csvDownloadModule);
    this.injectDependencies('$httpBackend', '$q', '$previousState', 'Orgservice', 'FeatureToggleService', 'CsvDownloadService', 'WebExUtilsFact');
    initDependencySpies.apply(this);
    this.compileView('OnboardCtrl', 'modules/huron/users/assignDnAndDirectLinesModal.tpl.html');
  }

  function initDependencySpies() {
    this.mock = {};
    this.mock.fusionServices = getJSONFixture('core/json/authInfo/fusionServices.json');
    this.mock.headers = getJSONFixture('core/json/users/headers.json');
    this.mock.getLicensesUsage = getJSONFixture('core/json/organizations/usage.json');

    spyOn(this.CsvDownloadService, 'getCsv').and.callFake(function (type) {
      if (type === 'headers') {
        return this.$q.when(this.mock.headers);
      } else {
        return this.$q.when({});
      }
    }.bind(this));

    spyOn(this.FeatureToggleService, 'supportsDirSync').and.returnValue(this.$q.when(false));
    spyOn(this.FeatureToggleService, 'atlasCareCallbackTrialsGetStatus').and.returnValue(this.$q.when(true));
    spyOn(this.FeatureToggleService, 'atlasSharedMeetingsGetStatus').and.returnValue(this.$q.when(false));
    spyOn(this.FeatureToggleService, 'supports').and.returnValue(this.$q.when(true));
    spyOn(this.Orgservice, 'getHybridServiceAcknowledged').and.returnValue(this.$q.when(this.mock.fusionServices));
    spyOn(this.Orgservice, 'getUnlicensedUsers');
    spyOn(this.Orgservice, 'getLicensesUsage').and.returnValue(this.$q.when(this.mock.getLicensesUsage));

    spyOn(this.$previousState, 'get').and.returnValue({
      state: {
        name: 'test.state'
      }
    });

    this.$httpBackend
      .whenGET('https://cmi.huron-int.com/api/v1/voice/customers/sites')
      .respond([{
        "mediaTraversalMode": "TURNOnly",
        "siteSteeringDigit": "8",
        "vmCluster": null,
        "uuid": "70b8d459-7f58-487a-afc8-02c0a82d53ca",
        "steeringDigit": "9",
        "timeZone": "America/Los_Angeles",
        "voicemailPilotNumberGenerated": "false"
      }]);
  }

  function initSpies() {
    spyOn(this.$scope, 'updateUserLicense');
  }

  var ONBOARD_BUTTON = '#btnOnboard';
  var CONVERT_BUTTON = '#btnConvert';
  var EDIT_SERVICES_BUTTON = '#btnEditServices';

  beforeEach(init);
  beforeEach(initSpies);

  describe('Onboard Flow', function () {
    beforeEach(initOnboardFlow);

    it('should show the onboard button', expectButtonToExist(ONBOARD_BUTTON, true));
    it('should not show the convert button', expectButtonToExist(CONVERT_BUTTON, false));
    it('should not show the edit services button', expectButtonToExist(EDIT_SERVICES_BUTTON, false));
  });

  describe('Convert Flow', function () {
    beforeEach(initConvertFlow);

    it('should not show the onboard button', expectButtonToExist(ONBOARD_BUTTON, false));
    it('should show the convert button', expectButtonToExist(CONVERT_BUTTON, true));
    it('should not show the edit services button', expectButtonToExist(EDIT_SERVICES_BUTTON, false));
  });

  describe('Edit Services Flow', function () {
    beforeEach(initEditServicesFlow);

    it('should not show the onboard button', expectButtonToExist(ONBOARD_BUTTON, false));
    it('should not show the convert button', expectButtonToExist(CONVERT_BUTTON, false));
    it('should show the edit services button', expectButtonToExist(EDIT_SERVICES_BUTTON, true));
    it('should call updateUserLicense() on click', function () {
      this.view.find(EDIT_SERVICES_BUTTON).click();
      expect(this.$scope.updateUserLicense).toHaveBeenCalled();
    });
  });

  function expectButtonToExist(button, shouldExist) {
    return function () {
      expect(this.view.find(button).length).toBe(shouldExist ? 1 : 0);
    };
  }

  function initOnboardFlow() {
    this.$scope.convertUsersFlow = false;
    this.$scope.editServicesFlow = false;
    this.$scope.$apply();
  }

  function initConvertFlow() {
    this.$scope.convertUsersFlow = true;
    this.$scope.editServicesFlow = false;
    this.$scope.$apply();
  }

  function initEditServicesFlow() {
    this.$scope.convertUsersFlow = false;
    this.$scope.editServicesFlow = true;
    this.$scope.$apply();
  }
});
