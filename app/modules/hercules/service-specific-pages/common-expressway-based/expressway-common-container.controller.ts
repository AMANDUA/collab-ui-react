import { ClusterService } from 'modules/hercules/services/cluster-service';
import { Notification } from 'modules/core/notifications';
import { ConnectorType } from 'modules/hercules/hybrid-services.types';

export abstract class ExpresswayContainerController {

  public backState = 'services-overview';
  public userStatusesSummary = [];
  protected subscribeStatusesSummary: any;

  /* @ngInject */

  constructor(
    private $modal,
    private $scope: ng.IScope,
    private $state: ng.ui.IStateService,
    private Authinfo,
    private ClusterService: ClusterService,
    protected hasPartnerRegistrationFeatureToggle,
    protected Notification: Notification,
    protected ServiceDescriptor,
    private ServiceStateChecker,
    protected USSService,
    protected servicesId: string[],
    private connectorType: ConnectorType,
  ) {

    this.firstTimeSetup();
    this.extractSummary();
    this.subscribeStatusesSummary = this.USSService.subscribeStatusesSummary('data', this.extractSummary.bind(this));
    this.ClusterService.subscribe('data', this.updateNotifications.bind(this), {
      scope: this.$scope,
    });
  }

  private updateNotifications(): void {
    this.ServiceStateChecker.checkState(this.servicesId[0]);
  }

  public extractSummary(): void {
    this.userStatusesSummary = this.USSService.extractSummaryForAService(this.servicesId);
    this.ServiceStateChecker.checkUserStatuses(this.servicesId[0]);
  }

  protected firstTimeSetup(): void {
    this.ServiceDescriptor.isServiceEnabled(this.servicesId[0]).then((enabled) => {
      if (enabled) {
        return;
      }
      if (this.Authinfo.isCustomerLaunchedFromPartner() && !this.hasPartnerRegistrationFeatureToggle) {
        this.$modal.open({
          templateUrl: 'modules/hercules/service-specific-pages/components/add-resource/partnerAdminWarning.html',
          type: 'dialog',
        });
        return;
      }
      this.$modal.open({
        resolve: {
          connectorType: () => this.connectorType,
          serviceId: () => this.servicesId[0],
          firstTimeSetup: true,
        },
        controller: 'AddResourceController',
        controllerAs: 'vm',
        templateUrl: 'modules/hercules/service-specific-pages/common-expressway-based/add-resource-modal.html',
        type: 'small',
      })
        .result
        .catch(() => {
          this.$state.go('services-overview');
        });
    }).catch((response) => {
      this.Notification.errorWithTrackingId(response, 'hercules.genericFailure');
    });
  }

}
