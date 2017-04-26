'use strict';

describe('Controller: ServiceSetup', function () {
  var $scope, $state, $previousState, $q, $httpBackend, ServiceSetup, Notification, HuronConfig, HuronCustomer;
  var Authinfo, VoicemailMessageAction;
  var model, customer, voicemail, avrilSites, externalNumberPool, usertemplate, form, timeZone, ExternalNumberService, ModalService, modalDefer, messageAction, FeatureToggleService, languages, countries;
  var $rootScope, PstnService, HuronCustomerService;
  var dialPlanDetailsNorthAmerica = [{
    countryCode: "+1",
    extensionGenerated: "false",
    steeringDigitRequired: "true",
    supportSiteCode: "true",
    supportSiteSteeringDigit: "true",
  }];

  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$rootScope_, _$previousState_, _$q_, _ServiceSetup_, _Notification_, _HuronConfig_, _$httpBackend_,
    _HuronCustomer_, _HuronCustomerService_, _ExternalNumberService_, _ModalService_, _Authinfo_, _VoicemailMessageAction_, _FeatureToggleService_,
    _PstnService_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope;
    $q = _$q_;
    ServiceSetup = _ServiceSetup_;
    Notification = _Notification_;
    HuronCustomer = _HuronCustomer_;
    HuronCustomerService = _HuronCustomerService_;
    ExternalNumberService = _ExternalNumberService_;
    ModalService = _ModalService_;
    HuronConfig = _HuronConfig_;
    $httpBackend = _$httpBackend_;
    Authinfo = _Authinfo_;
    modalDefer = $q.defer();
    VoicemailMessageAction = _VoicemailMessageAction_;
    $previousState = _$previousState_;
    PstnService = _PstnService_;
    FeatureToggleService = _FeatureToggleService_;

    customer = {
      "uuid": "84562afa-2f35-474f-ba0f-2def42864e12",
      "name": "Atlas_Test_JP650",
      "servicePackage": "DEMO_STANDARD",
      "links": [{
        "rel": "common",
        "href": "/api/v1/common/customers/84562afa-2f35-474f-ba0f-2def42864e12",
      }, {
        "rel": "voicemail",
        "href": "/api/v1/voicemail/customers/84562afa-2f35-474f-ba0f-2def42864e12",
      }, {
        "rel": "voice",
        "href": "/api/v1/voice/customers/84562afa-2f35-474f-ba0f-2def42864e12",
      }],
    };

    timeZone = [{
      id: 'America/Los_Angeles',
      label: 'America/Los_Angeles',
    }];
    voicemail = {
      name: "Simon",
      pilotNumber: "+16506679080",
      label: "(650) 667-9080",
    };
    usertemplate = [{
      timeZone: '3',
      timeZoneName: 'America/Los_Angeles',
      alias: '1',
      objectId: 'fd87d99c-98a4-45db-af59-ebb9a6f18fdd',
    }];
    externalNumberPool = [{
      directoryNumber: null,
      pattern: "+14084744518",
      uuid: 'c0d5c7d8-306a-48db-af93-3cba6d433db0',
    }];

    $state = {
      current: {
        data: {
          firstTimeSetup: false,
        },
      },
    };

    form = {
      '$invalid': false,
      'ftswLocalDialingRadio': {
        $setValidity: function () { },
      },
    };

    messageAction = getJSONFixture('huron/json/settings/messageAction.json');
    languages = getJSONFixture('huron/json/settings/languages.json');
    countries = getJSONFixture('huron/json/settings/countries.json');
    avrilSites = getJSONFixture('huron/json/settings/AvrilSite.json');

    spyOn($previousState, 'get').and.returnValue({
      state: {
        name: 'test.state',
      },
    });

    spyOn(ServiceSetup, 'createInternalNumberRange').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'deleteInternalNumberRange').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'listSites').and.callFake(function () {
      ServiceSetup.sites = [model.site];
      return $q.resolve();
    });
    spyOn(ServiceSetup, 'createSite').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'updateSite').and.returnValue($q.resolve());

    spyOn(HuronCustomer, 'get').and.returnValue($q.resolve(customer));
    spyOn(HuronCustomer, 'put').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'listVoicemailTimezone').and.returnValue($q.resolve(usertemplate));
    spyOn(ServiceSetup, 'loadExternalNumberPool').and.returnValue($q.resolve(externalNumberPool));
    spyOn(ServiceSetup, 'updateCustomer').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'updateVoicemailTimezone').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'updateVoicemailUserTemplate').and.returnValue($q.resolve());
    spyOn(ExternalNumberService, 'refreshNumbers').and.returnValue($q.resolve());
    spyOn(PstnService, 'getCustomer').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'listInternalNumberRanges').and.callFake(function () {
      ServiceSetup.internalNumberRanges = model.numberRanges;
      return $q.resolve();
    });

    spyOn(ServiceSetup, 'getTimeZones').and.returnValue($q.resolve(timeZone));
    spyOn(ServiceSetup, 'getSiteLanguages').and.returnValue($q.resolve(languages));
    spyOn(ServiceSetup, 'getSiteCountries').and.returnValue($q.resolve(countries));
    spyOn(Notification, 'notify');
    spyOn(Notification, 'errorResponse');
    spyOn(HuronCustomerService, 'getVoiceCustomer').and.returnValue($q.resolve({
      dialPlanDetails: dialPlanDetailsNorthAmerica,
    }));
    spyOn(HuronCustomerService, 'updateVoiceCustomer').and.returnValue($q.resolve());
    spyOn(ModalService, 'open').and.returnValue({
      result: modalDefer.promise,
    });

    spyOn(Authinfo, 'getOrgName').and.returnValue('Cisco Org Name');
    spyOn(Authinfo, 'getOrgId').and.returnValue(customer.uuid);

    spyOn(VoicemailMessageAction, 'get').and.returnValue($q.resolve(messageAction));
    spyOn(VoicemailMessageAction, 'update').and.returnValue($q.resolve());
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(false));

    spyOn(ServiceSetup, 'getAvrilSite').and.returnValue($q.resolve(avrilSites));
    spyOn(ServiceSetup, 'updateAvrilSite').and.returnValue($q.resolve());
    spyOn(ServiceSetup, 'createAvrilSite').and.returnValue($q.resolve());

    $httpBackend
      .expectGET(HuronConfig.getCmiUrl() + '/voice/customers/' + customer.uuid + '/directorynumbers')
      .respond([]);
    $httpBackend
      .expectGET(HuronConfig.getCesUrl() + '/customers/' + customer.uuid + '/callExperiences')
      .respond([{
        itemID: 0,
      }]);
    $httpBackend
      .expectGET(HuronConfig.getCmiV2Url() + '/customers/' + customer.uuid + '/features/huntgroups')
      .respond([]);
    $httpBackend
      .expectGET(HuronConfig.getCmiV2Url() + '/customers/' + customer.uuid + '/dialplans')
      .respond({
        premiumNumbers: ['800', '900'],
      });
  }));
  describe('Existing Functioanlity with Feature Toggle ON Tests', function () {
    var controller;
    beforeEach(inject(function ($controller) {
      $scope = $rootScope;
      model = {
        site: {
          uuid: '777-888-666',
          steeringDigit: '5',
          siteSteeringDigit: '6',
          siteCode: '200',
          voicemailPilotNumber: "+16506679080",
          timeZone: {
            id: 'America/Los_Angeles',
            label: 'America/Los_Angeles',
          },
          preferredLanguage: {
            label: 'English (United States)',
            value: 'en_US',
          },
          country: {
            label: 'United States',
            value: 'US',
          },
          voicemailPilotNumberGenerated: false,
        },
        numberRanges: [{
          beginNumber: '5000',
          endNumber: '5999',
          uuid: '555-666-777',
        }, {
          beginNumber: '6000',
          endNumber: '6999',
        }, {
          beginNumber: '4000',
          endNumber: '4000',
        }],
        previousSiteCode: 200,
      };
      spyOn(ServiceSetup, 'getSite').and.returnValue($q.resolve(model.site));
      spyOn(ServiceSetup, 'getVoicemailPilotNumber').and.returnValue($q.resolve(voicemail));

      controller = $controller('ServiceSetupCtrl', {
        $scope: $scope,
        $state: $state,
        ServiceSetup: ServiceSetup,
      });

      controller.form = form;
      $scope.$apply();
      $httpBackend.flush();

      controller.firstTimeSetup = true;
    }));
    describe('auto attendants returns an array with an element', function () {
      it('should set the disableExtensions property as true', function () {
        expect(controller.model.disableExtensions).toEqual(true);
      });
    });

    describe('initController when is first time setup', function () {
      beforeEach(function () {
        $state.current.data.firstTimeSetup = true;
      });

      //TODO: re-enable option '8' once it is an acceptable steering digit
      xit('should have the default site steering digit in the steeringDigits array', function () {
        var index = _.indexOf(controller.steeringDigits, '8');
        expect(index).toEqual(7);
      });
    });

    describe('initController when is not first time setup', function () {

      it('should have customer service info', function () {
        expect(controller.hasVoicemailService).toEqual(true);
      });

      it('should have internal number ranges', function () {
        expect(controller.model.numberRanges).toEqual(model.numberRanges);
      });
    });

    describe('deleteInternalNumberRange', function () {

      it('should remove from list and notify success', function () {
        var index = 0;
        var internalNumberRange = model.numberRanges[index];
        controller.deleteInternalNumberRange(model.numberRanges[0]);
        $scope.$apply();

        expect(ServiceSetup.deleteInternalNumberRange).toHaveBeenCalled();
        expect(controller.model.numberRanges).not.toContain(internalNumberRange);
      });

      it('should remove from list and not notify', function () {
        var index = 1;
        var internalNumberRange = model.numberRanges[index];
        controller.deleteInternalNumberRange(internalNumberRange);
        $scope.$apply();

        expect(ServiceSetup.deleteInternalNumberRange).not.toHaveBeenCalled();
        expect(Notification.notify).not.toHaveBeenCalled();
        expect(controller.model.numberRanges).not.toContain(internalNumberRange);
      });

      it('should remove singleNumberRange and not notify', function () {
        var index = 2;
        var internalNumberRange = model.numberRanges[index];
        controller.deleteInternalNumberRange(internalNumberRange);
        $scope.$apply();

        expect(ServiceSetup.deleteInternalNumberRange).not.toHaveBeenCalled();
        expect(Notification.notify).not.toHaveBeenCalled();
        expect(controller.model.numberRanges).not.toContain(internalNumberRange);
      });

      it('should notify error on error', function () {
        ServiceSetup.deleteInternalNumberRange.and.returnValue($q.reject());

        var index = 0;
        var internalNumberRange = model.numberRanges[index];
        controller.deleteInternalNumberRange(internalNumberRange);
        $scope.$apply();

        expect(ServiceSetup.deleteInternalNumberRange).toHaveBeenCalled();
        expect(Notification.errorResponse).toHaveBeenCalled();
        expect(controller.model.numberRanges).toContain(internalNumberRange);
      });
    });

    describe('initNext', function () {
      it('customer without voice service should update customer to heal missing voice service', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.hasVoiceService = false;
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.model.site.preferredLanguage = {
          value: 'en_US',
        };
        controller.model.site.country = {
          value: 'US',
        };
        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(HuronCustomer.put).toHaveBeenCalled();
        expect(ServiceSetup.createSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer with voicemail service should create site', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.model.site.preferredLanguage = {
          value: 'en_US',
        };
        controller.model.site.country = {
          value: 'US',
        };
        controller.previousTimeZone = controller.model.site.timeZone;
        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.createSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer with voicemail should not disable if user cancels voicemail modal warning', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);

        modalDefer.reject();
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).not.toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).not.toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).toHaveBeenCalled();
      });

      it('customer with voicemail service should not create site when update customer fails', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        ServiceSetup.updateCustomer.and.returnValue($q.reject());
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.createSite).not.toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
      });

      it('customer with voicemail service should not create site when create site fails', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.model.site.preferredLanguage = {
          value: 'en_US',
        };
        controller.model.site.country = {
          value: 'US',
        };
        controller.previousTimeZone = controller.model.site.timeZone;
        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        ServiceSetup.createSite.and.returnValue($q.reject());
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.createSite).toHaveBeenCalled();
        expect(controller.hasSites).toEqual(false);
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
      });

      it('customer with voicemail service should not update site when update site fails', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        ServiceSetup.updateSite.and.returnValue($q.reject());
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
      });

      it('customer with voicemail service should not update site when update customer fails', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        ServiceSetup.updateCustomer.and.returnValue($q.reject());
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).not.toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
      });

      it('customer with voicemail service should not update site when update voicemail timezone fails', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'bogus',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        ServiceSetup.updateVoicemailTimezone.and.returnValue($q.reject());
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
      });

      it('customer with voicemail service should not update timezone when timezone id is missing', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          label: 'bogus',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        ServiceSetup.updateVoicemailTimezone.and.returnValue($q.reject());
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
      });

      it('customer with voicemail service should create site and change voicemail timezone', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.model.ftswCompanyVoicemail.ftswVoicemailToEmail = true;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.model.site.preferredLanguage = {
          id: 'es_US',
        };
        controller.model.site.country = {
          value: 'US',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.createSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer with voicemail service should not update customer or site on no change', function () {
        var selectedPilotNumber = {
          label: voicemail.label,
          pattern: voicemail.pilotNumber,
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.model.ftswCompanyVoicemail.ftswVoicemailToEmail = true;
        controller.model.ftswCompanyVoicemail.ftswExternalVoicemail = true;

        controller.hasVoicemailService = true;
        controller.voicemailMessageAction = {
          objectId: '1',
          voicemailAction: 3,
        };

        controller.model.voicemailPrefix.value = '6';

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).not.toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).not.toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer with voicemail service should not update customer but update site with TZ data', function () {
        var selectedPilotNumber = {
          label: voicemail.label,
          pattern: voicemail.pilotNumber,
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.model.ftswCompanyVoicemail.ftswExternalVoicemail = true;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'bogus',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).not.toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer with voicemail service and VM Pilot must update customer and site with TZ data', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'bogus',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer without voicemail service must update site with TZ data', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = false;
        controller.model.site.timeZone = {
          id: 'bogus',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer with voicemail service should create voice only site', function () {
        controller.hasSites = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = undefined;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.model.site.preferredLanguage = {
          id: 'es_US',
        };
        controller.model.site.country = {
          value: 'US',
        };
        controller.previousTimeZone = controller.model.site.timeZone;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        modalDefer.resolve();
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.createSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).toHaveBeenCalled();
      });

      it('customer without voicemail should not disable voicemail', function () {
        controller.hasSites = true;
        controller.model.site.voicemailPilotNumber = undefined;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = false;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = undefined;
        controller.hasVoicemailService = false;
        controller.model.voicemailPrefix.value = '6';

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).not.toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).not.toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer without voicemail should update site when customer has pilot number misconfig', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = false;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer without voicemail should update site', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = false;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer enabling voicemail should update site and voicemail timezone', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = false;
        controller.model.site.timeZone = {
          id: 'bogus',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('avril enabled customer enabling voicemail should update avril site and voicemail timezone', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = false;
        controller.model.site.timeZone = {
          id: 'bogus',
        };

        controller.model.site.preferredLanguage = {
          id: 'es_US',
        };
        controller.model.site.country = {
          value: 'US',
        };
        controller.previousTimeZone = controller.model.site.timeZone;

        controller.voicemailAvrilCustomer = true;
        controller.customer.servicePackage = 'VOICE_VOICEMAIL_AVRIL';
        controller.avrilTzUpdated = true;

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateAvrilSite).toHaveBeenCalled();
        expect(ServiceSetup.getAvrilSite).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalled();
        expect(VoicemailMessageAction.update).not.toHaveBeenCalled();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('customer with new outbound steering digit should update site', function () {
        controller.hasSites = true;
        controller.model.ftswSteeringDigit = '5';
        controller.model.site.steeringDigit = '1';
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
      });

      it('should notify error if createInternalNumberRange fails', function () {
        ServiceSetup.createInternalNumberRange.and.returnValue($q.reject());

        var promise = controller.initNext();
        $scope.$apply();

        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
        expect(promise.$$state.value).toEqual('Site/extension create failed.');
      });

      it('should call createInternalNumberRange() if hideFieldInternalNumberRange is false', function () {
        controller.hideFieldInternalNumberRange = false;
        controller.initNext();
        $scope.$apply();
        expect(ServiceSetup.createInternalNumberRange).toHaveBeenCalled();
      });

      it('should call not createInternalNumberRange() if hideFieldInternalNumberRange is true', function () {
        controller.hideFieldInternalNumberRange = true;
        controller.initNext();
        $scope.$apply();
        expect(ServiceSetup.createInternalNumberRange).not.toHaveBeenCalled();
      });
    });

    describe('setServiceValues', function () {

    });

    describe('initnext.updateTimezone', function () {

      it('should notify error if timeZone Id is not a string', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 3,
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).not.toHaveBeenCalled();
        expect(Notification.notify).toHaveBeenCalledWith(jasmine.any(Array), 'error');
      });

      it('should pass timeZone Id to ServiceSetup.updateVoicemailTimezone', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };

        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.hasVoicemailService = true;
        controller.model.site.timeZone = {
          id: 'America/Chicago',
        };

        //remove singlenumber range for it to pass
        controller.deleteInternalNumberRange(model.numberRanges[2]);
        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ServiceSetup.updateVoicemailTimezone).toHaveBeenCalledWith(controller.model.site.timeZone.id, usertemplate[0].objectId);
      });
    });

    describe('initnext.updatePreferredLanguage', function () {
      it('should update preferred language when preferred language selection changes', function () {
        var newLanguage = {
          label: 'French (Canadian)',
          value: 'fr_CA',
        };
        controller.model.site.preferredLanguage = newLanguage;

        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
      });
    });

    describe('initnext.updateDefaultCountry', function () {
      it('should update default country when country selection changes', function () {
        var newCountry = {
          label: 'Canada',
          value: 'CA',
        };
        controller.model.site.country = newCountry;

        controller.initNext();
        $scope.$apply();

        expect(ServiceSetup.updateSite).toHaveBeenCalled();
      });
    });

    describe('Voicemail Access Prefix', function () {
      it('should change the extension length and change site code', function () {
        $scope.to = {};
        controller._buildVoicemailPrefixOptions($scope);
        controller.model.site.extensionLength = '5';
        $scope.$apply();
        expect(controller.model.site.siteCode).toEqual('10');
      });

      it('should handle $scope.to being undefined', function () {
        controller._buildVoicemailPrefixOptions($scope);
        controller.model.site.extensionLength = '5';
        $scope.$apply();
        expect(controller.model.site.siteCode).toEqual('10');
      });

      it('should set voicemail prefix to intersect with extension range and trigger warning', function () {
        controller.model.voicemailPrefix.label = '1100';
        controller.model.displayNumberRanges = [{
          beginNumber: 1000,
          endNumber: 1999,
        }];

        expect(controller.siteSteeringDigitWarningValidation()).toBe(true);
      });

      it('should set outbound dial digit to have the same starting digit as an extension range and trigger warning', function () {
        controller.model.site.steeringDigit = '1';
        controller.model.displayNumberRanges = [{
          beginNumber: 1000,
          endNumber: 1999,
        }];

        expect(controller.steeringDigitWarningValidation()).toBe(true);
      });

      it('should set site dial digit and outbound dial digit to have the same value and trigger error', function () {
        controller.model.voicemailPrefix.value = '1';
        controller.model.site.steeringDigit = '1';
        var localscope = {
          fields: [{
            formControl: {
              $setValidity: function () { },
            },
          }],
        };

        expect(controller.siteAndSteeringDigitErrorValidation('', '', localscope)).toBe(true);
      });

      it('should change the change site steering digit and send with the update site', function () {
        controller.model.voicemailPrefix.value = '1';
        controller.initNext();
        $scope.$apply();
        expect(ServiceSetup.updateSite).toHaveBeenCalledWith(model.site.uuid,
          {
            siteSteeringDigit: '1',
            voicemailPilotNumber: 'undefined8040506021015100215030504070415',
            voicemailPilotNumberGenerated: 'true',
          });
      });
    });

    describe('dialling habits', function () {
      it('should not call HuronCustomerService when dialling habit is not changed', function () {
        controller.model.regionCode = '';
        controller.model.initialRegionCode = '';
        controller.initNext();
        $scope.$apply();
        expect(HuronCustomerService.updateVoiceCustomer).not.toHaveBeenCalled();
      });

      it('should call HuronCustomerService when dialling habit is changed', function () {
        controller.model.regionCode = '214';
        controller.model.initialRegionCode = '';
        controller.initNext();
        $scope.$apply();
        expect(HuronCustomerService.updateVoiceCustomer).toHaveBeenCalled();
      });
    });
  });


  describe('VoiceMail with Generated VoiceMail Pilot Tests', function () {
    var controller;
    beforeEach(inject(function ($controller) {
      $scope = $rootScope;
      model = {
        site: {
          uuid: '777-888-666',
          steeringDigit: '5',
          siteSteeringDigit: '6',
          siteCode: '200',
          voicemailPilotNumber: "+911234123412341234123412341234123412341234",
          timeZone: {
            id: 'America/Los_Angeles',
            label: 'America/Los_Angeles',
          },
          voicemailPilotNumberGenerated: 'true',
        },
        numberRanges: [{
          beginNumber: '5000',
          endNumber: '5999',
          uuid: '555-666-777',
        }, {
          beginNumber: '6000',
          endNumber: '6999',
        }, {
          beginNumber: '4000',
          endNumber: '4000',
        }],
      };
      voicemail = {
        name: "Simon",
        pilotNumber: "+911234123412341234123412341234123412341234",
        label: "(650) 667-9080",
      };
      spyOn(ServiceSetup, 'getSite').and.returnValue($q.resolve(model.site));
      spyOn(ServiceSetup, 'getVoicemailPilotNumber').and.returnValue($q.resolve(voicemail));
      spyOn(ServiceSetup, 'generateVoiceMailNumber').and.returnValue('+911234123412341234123412341234123412341234');
      controller = $controller('ServiceSetupCtrl', {
        $scope: $scope,
        $state: $state,
        ServiceSetup: ServiceSetup,
      });

      controller.form = form;

      $scope.$apply();
      $httpBackend.flush();

      controller.firstTimeSetup = true;
    }));
    describe('Site Create/Update and voicemail update Tests', function () {

      it('voicemail pilot number set to generatedVoicemailNumber', function () {
        expect(controller.model.ftswCompanyVoicemail.ftswExternalVoicemail).toEqual(false);
        expect(controller.model.site.voicemailPilotNumber).toEqual('+911234123412341234123412341234123412341234');
      });

      it('site and voicemail is created with a voice pilot set to generated value', function () {
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.model.site.country = {
          value: 'US',
        };
        controller.hasSites = false;
        controller.model.site.voicemailPilotNumber = undefined;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswExternalVoicemail = false;
        controller.hasVoicemailService = true;
        controller.initNext();
        $scope.$apply();
        expect(ServiceSetup.createSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });

      it('voicemail pilot number  is updated with a DID value', function () {
        var selectedPilotNumber = {
          pattern: '+19728965000',
          label: '(972) 896-5000',
        };
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.hasSites = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailNumber = selectedPilotNumber;
        controller.model.ftswCompanyVoicemail.ftswExternalVoicemail = true;
        controller.hasVoicemailService = true;
        controller.initNext();
        $scope.$apply();
        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
        expect(ModalService.open).not.toHaveBeenCalled();
      });
    });
  });
  describe('VoiceMail with updating Generated VoiceMail Pilot Tests', function () {
    var controller;
    beforeEach(inject(function ($controller) {
      $scope = $rootScope;
      model = {
        site: {
          uuid: '777-888-666',
          steeringDigit: '5',
          siteSteeringDigit: '6',
          siteCode: '200',
          voicemailPilotNumber: "+6506679080",
          timeZone: {
            id: 'America/Los_Angeles',
            label: 'America/Los_Angeles',
          },
          voicemailPilotNumberGenerated: false,
        },
        numberRanges: [{
          beginNumber: '5000',
          endNumber: '5999',
          uuid: '555-666-777',
        }, {
          beginNumber: '6000',
          endNumber: '6999',
        }, {
          beginNumber: '4000',
          endNumber: '4000',
        }],
      };
      voicemail = {
        name: "Simon",
        pilotNumber: "+6506679080",
        label: "(650) 667-9080",
      };
      spyOn(ServiceSetup, 'getSite').and.returnValue($q.resolve(model.site));
      spyOn(ServiceSetup, 'getVoicemailPilotNumber').and.returnValue($q.resolve(voicemail));
      spyOn(ServiceSetup, 'generateVoiceMailNumber').and.returnValue('+911234123412341234123412341234123412341234');
      controller = $controller('ServiceSetupCtrl', {
        $scope: $scope,
        $state: $state,
        ServiceSetup: ServiceSetup,
      });

      controller.form = form;

      $scope.$apply();
      $httpBackend.flush();

      controller.firstTimeSetup = true;
    }));
    describe('Site and voicemail update with generated Voice Mail Pilot with Feature Toggle ON Tests', function () {

      it('voicemail pilot number set to generatedVoicemailNumber', function () {
        expect(controller.model.site.voicemailPilotNumber).toEqual('+6506679080');
      });

      it('site and voicemail is updated with generated voice pilot', function () {
        controller.model.site.timeZone = {
          id: 'bogus',
        };
        controller.hasSites = true;
        controller.model.site.voicemailPilotNumber = undefined;
        controller.model.ftswCompanyVoicemail.ftswCompanyVoicemailEnabled = true;
        controller.model.ftswCompanyVoicemail.ftswExternalVoicemail = false;
        controller.hasVoicemailService = true;
        controller.initNext();
        $scope.$apply();
        expect(ServiceSetup.updateSite).toHaveBeenCalled();
        expect(ServiceSetup.updateCustomer).toHaveBeenCalled();
      });
    });
  });
});
