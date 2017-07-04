import { ICluster } from 'modules/hercules/hybrid-services.types';
import { Notification } from 'modules/core/notifications';
import { HybridServicesExtrasService } from 'modules/hercules/services/hybrid-services-extras.service';

interface IClusterWithAllowedredirectTarget extends ICluster {
  allowedRedirectTarget: any;
}

export class CompleteregistrationOrRemoveExpresswayCtrl implements ng.IComponentController {

  private cluster: IClusterWithAllowedredirectTarget;
  private connectorType: string;

  /* @ngInject */
  constructor(
    private $modal,
    private $state: ng.ui.IStateService,
    private $window: ng.IWindowService,
    private HybridServicesExtrasService: HybridServicesExtrasService,
    private Notification: Notification,
  ) {

  }

  public $onInit() {
    if (this.cluster && _.size(this.cluster.connectors) === 0) {
      this.HybridServicesExtrasService.getPreregisteredClusterAllowList(this.cluster.id)
        .then(allowList => {
          this.cluster.allowedRedirectTarget = allowList[0];
        })
        .catch(error => {
          this.Notification.errorWithTrackingId(error, 'hercules.genericFailure');
        });
    }
  }

  public openDeleteConfirm(): void {
    this.$modal.open({
      resolve: {
        cluster: () => {
          return this.cluster;
        },
      },
      controller: 'ClusterDeregisterController',
      controllerAs: 'clusterDeregister',
      templateUrl: 'modules/hercules/rename-and-deregister-cluster-section/deregister-dialog.html',
      type: 'dialog',
    }).result
    .then(() => {
      if (this.connectorType === 'c_cal') {
        this.$state.go('calendar-service.list');
      } else if (this.connectorType === 'c_ucmc') {
        this.$state.go('call-service.list');
      }
    });
  }

  public goToExpressway(hostname: string): void {
    this.$window.open('https://' + encodeURIComponent(hostname) + '/fusionregistration');
  }

}

export class CompleteregistrationOrRemoveExpresswayComponent implements ng.IComponentOptions {
  public controller = CompleteregistrationOrRemoveExpresswayCtrl;
  public templateUrl = 'modules/hercules/cluster-sidepanel/complete-registration-or-remove-expressway/complete-registration-or-remove-expressway.html';
  public bindings = {
    cluster: '<',
    connectorType: '<',
  };
}
