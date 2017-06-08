import { HybridServicesI18NService } from 'modules/hercules/services/hybrid-services-i18n.service';
import { HybridServiceUserSidepanelHelperService, IEntitlementNameAndState, IUserStatus } from 'modules/hercules/services/hybrid-services-user-sidepanel-helper.service';

class HybridCallServiceConnectUserSettingsCtrl implements ng.IComponentController {

  public loadingPage = true;
  public savingPage = false;
  public couldNotReadUser = false;

  private userId: string;
  private userEmailAddress: string;
  private entitlementUpdatedCallback: Function;

  public userStatusAware: IUserStatus;
  private userStatusConnect: IUserStatus;

  public entitledToggle: boolean;
  public userIsCurrentlyEntitled: boolean;
  public newEntitlementValue: boolean | undefined;

  public voicemailFeatureToggled: boolean;

  /* @ngInject */
  constructor(
    private $state: ng.ui.IStateService,
    private HybridServicesI18NService: HybridServicesI18NService,
    private HybridServiceUserSidepanelHelperService: HybridServiceUserSidepanelHelperService,
    private Notification,
    private USSService,
  ) { }

  public $onInit() {
    if (this.userId) {
      this.getDataFromUSS(this.userId);
    }
  }

  public $onChanges(changes: {[bindings: string]: ng.IChangesObject}) {
    const { userId, userEmailAddress,  entitlementUpdatedCallback } = changes;
    if (userId && userId.currentValue) {
      this.userId = userId.currentValue;
      this.getDataFromUSS(this.userId);
    }
    if (userEmailAddress && userEmailAddress.currentValue) {
      this.userEmailAddress = userEmailAddress.currentValue;
    }
    if (entitlementUpdatedCallback && entitlementUpdatedCallback.currentValue) {
      this.entitlementUpdatedCallback = entitlementUpdatedCallback.currentValue;
    }
  }

  private getDataFromUSS(userId: string) {
    this.loadingPage = true;
    return this.HybridServiceUserSidepanelHelperService.getDataFromUSS(userId)
      .then(([userStatusAware, userStatusConnect]) => {
        this.userStatusAware = userStatusAware;
        this.userStatusConnect = userStatusConnect;
      })
      .then(() => {
        if (this.userStatusConnect && this.userStatusConnect.entitled) {
          this.entitledToggle = this.userIsCurrentlyEntitled = this.userStatusConnect.entitled;
        } else {
          this.entitledToggle = this.userIsCurrentlyEntitled = false;
        }

        if (this.userStatusConnect && this.userStatusConnect.lastStateChange) {
          this.userStatusConnect.lastStateChangeText = this.HybridServicesI18NService.getTimeSinceText(this.userStatusConnect.lastStateChange);
        }
      })
      .catch((error) => {
        this.couldNotReadUser = true;
        this.Notification.errorWithTrackingId(error, 'hercules.userSidepanel.readUserStatusFailed');
      })
      .finally(() => {
        this.loadingPage = false;
      });
  }

  public saveData() {
    this.savingPage = true;

    let entitlements: IEntitlementNameAndState[] = [{
      entitlementName: 'squaredFusionUC',
      entitlementState: 'ACTIVE',
    }, {
      entitlementName: 'squaredFusionEC',
      entitlementState: this.newEntitlementValue ? 'ACTIVE' : 'INACTIVE',
    }];

    this.HybridServiceUserSidepanelHelperService.saveUserEntitlements(this.userId, this.userEmailAddress, entitlements)
      .then(() => {
        if (!this.newEntitlementValue) {
          this.userIsCurrentlyEntitled = false;
        } else {
          this.userIsCurrentlyEntitled = true;
        }
        this.newEntitlementValue = undefined;
        this.loadingPage = true;
        return this.getDataFromUSS(this.userId)
          .then(() => {
            this.entitlementUpdatedCallback({
              options: {
                callServiceAware: this.userStatusAware,
                callServiceConnect: this.userStatusConnect,
              },
            });
          });

      })
      .catch((error) => {
        this.Notification.error('hercules.userSidepanel.not-updated-specific', {
          userName: this.userEmailAddress,
          error: error.message,
        });
      })
      .finally(() => {
        this.savingPage = false;
      });

  }

  public changeEntitlement(newEntitlementValue) {
    this.newEntitlementValue = newEntitlementValue;
  }

  public showSaveButton() {
    return !_.isUndefined(this.newEntitlementValue) && this.newEntitlementValue !== this.userIsCurrentlyEntitled;
  }

  public cancel() {
    this.newEntitlementValue = undefined;
    this.entitledToggle = !this.entitledToggle;
  }

  public getStatus(status) {
    return this.USSService.decorateWithStatus(status);
  }

  public goToAwarePanel() {
    this.$state.go('user-overview.hybrid-services-squared-fusion-uc.aware-settings', {
      userId: this.userId,
      userEmailAddress: this.userEmailAddress,
      onEntitlementChange: (arg) => {
        this.entitlementUpdatedCallback({
          options: arg,
        });
      },
    });
  }

}

export class HybridCallServiceConnectUserSettingsComponent implements ng.IComponentOptions {
  public controller = HybridCallServiceConnectUserSettingsCtrl;
  public templateUrl = 'modules/hercules/user-sidepanel/hybrid-call-service-connect-user-settings/hybrid-call-service-connect-user-settings.component.html';
  public bindings = {
    userId: '<',
    userEmailAddress: '<',
    entitlementUpdatedCallback: '&',
    voicemailFeatureToggled: '<',
  };
}
