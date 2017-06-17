'use strict';

describe('Template: partnerProfile', function () {
  beforeEach(function () {
    this.initModules('Core', 'WebExApp');
    this.injectDependencies(
      '$controller',
      '$compile',
      '$templateCache',
      '$q',
      '$scope',
      'Authinfo',
      'BrandService',
      'FeatureToggleService',
      'ITProPackService',
      'Notification',
      'Orgservice',
      'WebexClientVersion',
      'UserListService'
    );

    spyOn(this.Authinfo, 'isPartner');
    spyOn(this.FeatureToggleService, 'atlas2017NameChangeGetStatus').and.returnValue(this.$q.resolve(false));
    spyOn(this.ITProPackService, 'hasITProPackPurchased').and.returnValue(this.$q.resolve(false));
    spyOn(this.Notification, 'success');
    spyOn(this.Notification, 'error');
    spyOn(this.Notification, 'errorResponse');
    spyOn(this.Orgservice, 'setOrgSettings').and.returnValue(this.$q.resolve());
    spyOn(this.UserListService, 'listPartners');
    spyOn(this.BrandService, 'getLogoUrl').and.returnValue(this.$q.resolve());
    spyOn(this.WebexClientVersion, 'getWbxClientVersions').and.returnValue(this.$q.resolve());
    spyOn(this.WebexClientVersion, 'getPartnerIdGivenOrgId').and.returnValue(this.$q.resolve());
    spyOn(this.WebexClientVersion, 'getTemplate').and.returnValue(this.$q.resolve());
    spyOn(this.WebexClientVersion, 'postOrPutTemplate').and.returnValue(this.$q.resolve());
    spyOn(this.Orgservice, 'getOrg').and.callFake(function (callback) {
      callback({
        success: true,
        orgSettings: {},
      });
    });

    this.initComponent = function () {
      this.$controller('PartnerProfileCtrl', {
        $scope: this.$scope,
      });
      var template = this.$templateCache.get('modules/core/partnerProfile/partnerProfile.tpl.html');
      var elem = angular.element(template);
      elem.find('#brandingTpl').remove();
      this.view = this.$compile(elem)(this.$scope);
      this.$scope.$apply();
    };
  });

  describe('Regular Admin', function () {
    beforeEach(function () {
      this.BUTTON_CONTAINER = '.save-section';
      this.INVISIBLE = 'invisible';

      this.initComponent();
    });

    it('Problem site 0 radio should have an appropriate label', verifyRadioAndLabel('problemSiteRadio0'));
    it('Problem site 1 radio should have an appropriate label', verifyRadioAndLabel('problemSiteRadio1'));
    it('Help site 0 radio should have an appropriate label', verifyRadioAndLabel('helpSiteRadio0'));
    it('Help site 0 radio should have an appropriate label', verifyRadioAndLabel('helpSiteRadio1'));

    describe('Form Buttons', function () {
      it('should not be visible without form changes', expectButtonContainerNotVisible);
      it('should be visible after form changes', changeValueAndExpectButtonContainerVisible);

      describe('should be dismissed', function () {
        beforeEach(changeValueAndExpectButtonContainerVisible);
        afterEach(expectButtonContainerNotVisible);

        it('when cancel button is clicked', function () {
          spyOn(this.$scope, 'init').and.callThrough();
          this.view.find('#orgProfileCancelBtn').click();

          expect(this.$scope.init).toHaveBeenCalled();
        });

        it('when save button is clicked', function () {
          spyOn(this.$scope, 'validation').and.callThrough();
          this.view.find('#orgProfileSaveBtn').click();

          expect(this.$scope.validation).toHaveBeenCalled();
          expect(this.Notification.success).toHaveBeenCalled();
        });
      });
    });

    function changeValueAndExpectButtonContainerVisible() {
      this.view.find('#partnerHelpUrl').val('newHelpUrl').change();
      expect(this.view.find(this.BUTTON_CONTAINER)).not.toHaveClass(this.INVISIBLE);
    }

    function expectButtonContainerNotVisible() {
      expect(this.view.find(this.BUTTON_CONTAINER)).toHaveClass(this.INVISIBLE);
    }
  });

  describe('2017 name update', function () {
    it('should contain partnerProfile.matchingDescr when atlas2017NameChangeGetStatus is false', function () {
      this.initComponent();
      expect(this.view.text()).toContain('partnerProfile.matchingDescr');
      expect(this.view.text()).not.toContain('partnerProfile.matchingDescrNew');
    });

    it('should contain partnerProfile.matchingDescrNew when atlas2017NameChangeGetStatus is true', function () {
      this.FeatureToggleService.atlas2017NameChangeGetStatus.and.returnValue(this.$q.resolve(true));
      this.initComponent();
      expect(this.view.text()).toContain('partnerProfile.matchingDescrNew');
    });
  });

  function verifyRadioAndLabel(id) {
    return function () {
      var radio = this.view.find('#' + id);
      var label = radio.next(); // Label should be next dom element for radio style rendering
      expect(radio.is('input')).toBeTruthy();
      expect(radio).toHaveAttr('type', 'radio');
      expect(label.is('label')).toBeTruthy();
      expect(label).toHaveAttr('for', id);
    };
  }
});
