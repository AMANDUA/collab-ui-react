import './_settings.scss';
import { SettingSection } from './settingSection';
import { AuthenticationSetting } from './authenticationSetting.component';
import { BrandingSetting } from './brandingSetting.component';
import { DomainsSetting } from './domainsSetting.component';
import { RetentionSetting } from './retentionSetting.component';
import { SecuritySetting } from './securitySetting.component';
import { SipDomainSetting } from './sipDomainSetting.component';
import { SupportSetting } from './supportSection/supportSetting.component';
import { PrivacySetting } from './privacySection/privacySettings.component';

export class SettingsCtrl {

  public security: SettingSection;
  public privacy: SettingSection;
  public domains: SettingSection;
  public sipDomain: SettingSection;
  public authentication: SettingSection;
  public branding: SettingSection;
  public support: SettingSection;
  public retention: SettingSection;

  /* @ngInject */
  constructor(
    private Authinfo,
    private Orgservice,
    private FeatureToggleService,
  ) {
    // provide these settings to everyone
    this.initBranding();
    this.support = new SupportSetting();

    // if they are not a partner, provide everything else
    if (!this.Authinfo.isPartner()) {
      this.initSecurity();
      this.authentication = new AuthenticationSetting();
      this.domains = new DomainsSetting();
      this.privacy = new PrivacySetting();
      this.sipDomain = new SipDomainSetting();
      this.initRetention();
    }
  }

  private initBranding() {
    if (this.Authinfo.isPartner() || this.Authinfo.isDirectCustomer()) {
      this.branding = new BrandingSetting();
    } else if (this.Authinfo.isCustomerAdmin()) {
      this.Orgservice.getOrg(_.noop).then(response => {
        if (_.get(response, 'data.orgSettings.allowCustomerLogos')) {
          this.branding = new BrandingSetting();
        }
      });
    }
  }

  private initSecurity() {
    this.FeatureToggleService.atlasPinSettingsGetStatus().then((toggle) => {
      if (toggle) {
        this.security = new SecuritySetting();
      }
    });
  }

  private initRetention() {
    this.FeatureToggleService.atlasDataRetentionSettingsGetStatus().then((toggle) => {
      if (toggle) {
        this.retention = new RetentionSetting();
      }
    });
  }
}
angular
  .module('Core')
  .controller('SettingsCtrl', SettingsCtrl);
