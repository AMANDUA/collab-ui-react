import { UCCService } from 'modules/hercules/services/ucc-service';
import { HybridServiceUserSidepanelHelperService } from 'modules/hercules/services/hybrid-services-user-sidepanel-helper.service';
import { Notification } from 'modules/core/notifications/notification.service';
import { ServiceDescriptorService } from 'modules/hercules/services/service-descriptor.service';
import { USSService, IUserStatusWithExtendedMessages } from 'modules/hercules/services/uss.service';

interface IOptions {
  callServiceAware: any;
  callServiceConnect: any;
}

class HybridCallServiceAggregatedSectionCtrl implements ng.IComponentController {

  public loadingPage = true;

  public userId: string;
  public userEmailAddress: string;
  public callServiceAware: IUserStatusWithExtendedMessages | undefined;
  public callServiceConnect: IUserStatusWithExtendedMessages | undefined;
  public voicemailEnabled = false;
  public callServiceConnectEnabledForOrg: boolean;

  public resourceGroupId: string;

  /* @ngInject */
  constructor(
    private $rootScope: ng.IRootScopeService,
    private FeatureToggleService,
    private HybridServiceUserSidepanelHelperService: HybridServiceUserSidepanelHelperService,
    private Notification: Notification,
    private ServiceDescriptorService: ServiceDescriptorService,
    private USSService: USSService,
    private UCCService: UCCService,
  ) { }

  public $onInit() {
    this.getUserFromUSS(this.userId);
    this.isConnectSetUp();
    this.getOrgVoicemailStatus();
  }

  private isConnectSetUp() {
    this.ServiceDescriptorService.isServiceEnabled('squared-fusion-ec')
      .then((enabled: boolean) => {
        this.callServiceConnectEnabledForOrg = enabled;
      })
      .catch((error) => {
        this.Notification.errorWithTrackingId(error, 'hercules.userSidepanel.couldNotReadConnectStatus');
      });
  }

  private getUserFromUSS(userId) {
    this.loadingPage = true;
    this.HybridServiceUserSidepanelHelperService.getDataFromUSS(userId)
      .then(([userStatusAware, userStatusConnect]) => {
        this.callServiceAware = userStatusAware;
        this.callServiceConnect = userStatusConnect;
      })
      .then(() => {
        if (this.callServiceAware && this.callServiceAware.resourceGroupId) {
          this.resourceGroupId = this.callServiceAware.resourceGroupId;
        }
      })
      .catch((error) => {
        this.Notification.errorWithTrackingId(error, 'hercules.genericFailure');
      })
      .finally(() => {
        this.loadingPage = false;
      });
  }

  public getStatus(status: string) {
    return this.USSService.decorateWithStatus(status);
  }

  public getOrgVoicemailStatus() {
    this.FeatureToggleService.supports(this.FeatureToggleService.features.atlasHybridVoicemail)
      .then((supported: boolean) => {
        if (supported) {
          this.UCCService.getOrgVoicemailConfiguration()
            .then((data) => {
              this.voicemailEnabled = data.voicemailOrgEnableInfo.orgHybridVoicemailEnabled;
            });
        }
      });
  }

  public onEntitlementChanges = (changes: IOptions) => {
    this.callServiceAware = changes.callServiceAware;
    this.callServiceConnect = changes.callServiceConnect;
    if (this.callServiceAware && this.callServiceAware.resourceGroupId) {
      this.resourceGroupId = this.callServiceAware.resourceGroupId;
    }
    this.$rootScope.$broadcast('entitlementsUpdated');
  }

}

export class HybridCallServiceAggregatedSectionComponent implements ng.IComponentOptions {
  public controller = HybridCallServiceAggregatedSectionCtrl;
  public templateUrl = 'modules/hercules/user-sidepanel/hybrid-call-service-aggregated-section/hybrid-call-service-aggregated-section.component.html';
  public bindings = {
    userId: '<',
    userEmailAddress: '<',
  };
}
