import testModule from './index';
import { SupportSettingsController } from './support.section.controller';

describe('Controller: PartnerProfileCtrl', () => {
  let $scope, $controller, controller, $q;
  let Notification, Orgservice, UserListService, BrandService, FeatureToggleService, WebexClientVersion;

  beforeEach(angular.mock.module(testModule));
  beforeEach(inject(dependencies));
  beforeEach(initSpies);
  beforeEach(initController);

  function dependencies($rootScope, _$controller_, _$q_, _Notification_, _Orgservice_, _UserListService_, _BrandService_, _FeatureToggleService_, _WebexClientVersion_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $q = _$q_;
    Notification = _Notification_;
    Orgservice = _Orgservice_;
    UserListService = _UserListService_;
    BrandService = _BrandService_;
    FeatureToggleService = _FeatureToggleService_;
    WebexClientVersion = _WebexClientVersion_;
  }

  function initSpies() {
    spyOn(Notification, 'success');
    spyOn(Notification, 'error');
    spyOn(Notification, 'errorResponse');
    spyOn(Orgservice, 'setOrgSettings').and.returnValue($q.resolve());
    spyOn(UserListService, 'listPartners');
    spyOn(Orgservice, 'getOrg');
    spyOn(BrandService, 'getLogoUrl').and.returnValue($q.resolve('logoUrl'));
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(false));
    spyOn(WebexClientVersion, 'getWbxClientVersions').and.returnValue($q.resolve());
    spyOn(WebexClientVersion, 'getPartnerIdGivenOrgId').and.returnValue($q.resolve());
    spyOn(WebexClientVersion, 'getTemplate').and.returnValue($q.resolve());
  }

  function initController() {
    controller = $controller(SupportSettingsController, {
      $scope: $scope,
    });
    $scope.$apply();
  }

  describe('validation()', () => {

    describe('showCustomHelpSiteSaveButton', () => {

      describe('checkBox enabled and url set', () => {
        beforeEach(() => {
          controller.customHelpSite.enable = true;
          controller.customHelpSite.url = 'initialUrl';
        });

        it('should not show save button if it was enabled with the same url', () => {
          controller.oldCustomHelpSite.enable = true;
          controller.oldCustomHelpSite.url = 'initialUrl';
          expect(controller.showCustomHelpSiteSaveButton).toBeFalsy();
        });

        it('should show save button if it was enabled with a different url', () => {
          controller.oldCustomHelpSite.enable = true;
          controller.oldCustomHelpSite.url = 'oldDifferentUrl';
          expect(controller.showCustomHelpSiteSaveButton).toBeTruthy();
        });

        it('should show save button if it was disabled', () => {
          controller.oldCustomHelpSite.enable = false;
          expect(controller.showCustomHelpSiteSaveButton).toBeTruthy();
        });

        it('should show not save button if it was disabled but has no url now', () => {
          controller.oldCustomHelpSite.enable = false;
          controller.customHelpSite.url = '';
          expect(controller.showCustomHelpSiteSaveButton).toBeFalsy();
        });
      });

      describe('checkBox disabled', () => {

        it('should not show save button if it was disabled', () => {
          controller.customHelpSite.enable = false;
          controller.oldCustomHelpSite.enable = false;

          expect(controller.showCustomHelpSiteSaveButton).toBeFalsy();
        });

        it('should show save button if it was enabled', () => {
          controller.customHelpSite.enable = false;
          controller.oldCustomHelpSite.enable = true;
          expect(controller.showCustomHelpSiteSaveButton).toBeTruthy();
        });
      });
    });

    describe('saving org settings data', () => {

      it('saves data via Orgservice', () => {
        controller.useCustomSupportUrl = controller.problemSiteInfo.cisco;
        controller.useCustomHelpSite = controller.helpSiteInfo.cisco;
        controller.useCustomSupportUrl = controller.problemSiteInfo.ext;
        controller.customSupport.url = 'supportUrl';
        controller.customSupport.text = 'this is support text';
        controller.allowReadOnlyAccess = false;
        controller.useCustomHelpSite = controller.helpSiteInfo.ext;
        controller.customHelpSite.url = 'helpUrl';
        controller.saveUseCustomHelpSite();
        controller.saveUseCustomSupportUrl();
        let expectedOrgSettingsPart1 = {
          reportingSiteUrl: 'supportUrl',
          reportingSiteDesc: 'this is support text',
          // helpUrl: 'helpUrl',
          // isCiscoHelp: false,
          isCiscoSupport: false,
          // allowReadOnlyAccess: false,
          // allowCrashLogUpload: false
        };
        let expectedOrgSettingsPart2 = {
          // reportingSiteUrl: 'supportUrl',
          // reportingSiteDesc: 'this is support text',
          helpUrl: 'helpUrl',
          isCiscoHelp: false,
          // isCiscoSupport: false,
          // allowReadOnlyAccess: false,
          // allowCrashLogUpload: false
        };

        expect(Orgservice.setOrgSettings).toHaveBeenCalledWith(null, expectedOrgSettingsPart1);
        expect(Orgservice.setOrgSettings).toHaveBeenCalledWith(null, expectedOrgSettingsPart2);
      });

    });

    describe('should save successfully', () => {
      afterEach(() => {
        saveAndNotifySuccess();
      });

      it('with default cisco options', () => {
        controller.useCustomSupportUrl = controller.problemSiteInfo.cisco;
        controller.useCustomHelpSite = controller.helpSiteInfo.cisco;
      });

      it('with custom problem site', () => {
        controller.useCustomSupportUrl = controller.problemSiteInfo.ext;
        controller.supportUrl = 'supportUrl';
      });

      it('with custom help site', () => {
        controller.useCustomHelpSite = controller.helpSiteInfo.ext;
        controller.helpUrl = 'helpUrl';
      });

      function saveAndNotifySuccess() {
        controller.saveUseCustomHelpSite();
        controller.saveUseCustomSupportUrl();
        expect(controller.savingProgress).toEqual(true);
        $scope.$apply();
        expect(controller.savingProgress).toEqual(false);
        expect(Notification.success).toHaveBeenCalledWith('partnerProfile.processing');
      }
    });

    describe('should notify error response', () => {
      beforeEach(initSpyFailure);

      it('when update fails', saveAndNotifyErrorResponse);

      function initSpyFailure() {
        Orgservice.setOrgSettings.and.returnValue($q.reject({}));
      }

      function saveAndNotifyErrorResponse() {
        controller.saveUseCustomHelpSite();
        controller.saveUseCustomSupportUrl();
        expect(controller.savingProgress).toEqual(true);
        $scope.$apply();
        expect(controller.savingProgress).toEqual(false);
        expect(Notification.errorResponse).toHaveBeenCalled();
      }
    });

    describe('should notify validation error', () => {
      afterEach(saveAndNotifyError);

      it('when picking a custom problem site without a value', () => {
        controller.useCustomSupportUrl = controller.problemSiteInfo.ext;
        controller.customSupport.url = '';
      });

      it('when picking a custom help site without a value', () => {
        controller.useCustomHelpSite = controller.helpSiteInfo.ext;
        controller.customHelpSite.url = '';
      });

      function saveAndNotifyError() {
        controller.saveUseCustomHelpSite();
        controller.saveUseCustomSupportUrl();
        $scope.$apply();
        expect(Notification.error).toHaveBeenCalledWith('partnerProfile.orgSettingsError');
      }
    });
  });

});
