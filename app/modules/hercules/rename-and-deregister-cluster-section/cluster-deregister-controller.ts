import { ICluster } from 'modules/hercules/hybrid-services.types';
import { Notification } from 'modules/core/notifications/notification.service';
import { PrivateTrunkService } from 'modules/hercules/private-trunk/private-trunk-services/private-trunk.service';

export class ClusterDeregisterController {

  public loading = false;

  /* @ngInject */
  constructor(
    private $modalInstance,
    private $translate: ng.translate.ITranslateService,
    private cluster: ICluster,
    private FusionClusterService,
    private PrivateTrunkService: PrivateTrunkService,
    private Notification: Notification,
  ) { }

  public deregister() {

    this.loading = true;
    if (this.cluster.targetType === 'ept') {
      this.PrivateTrunkService.removePrivateTrunkResource(this.cluster.id)
        .then(() => {
          this.Notification.success(this.$translate.instant('hercules.renameAndDeregisterComponent.deregisterConfirmPopup', {
            clusterName: this.cluster.name,
          }));
          this.$modalInstance.close();
        })
        .catch((error) => {
          this.Notification.errorWithTrackingId(error, 'hercules.genericFailure');
          this.loading = false;
        });
    } else {
      this.FusionClusterService.deregisterCluster(this.cluster.id)
        .then(() => {
          this.Notification.success(this.$translate.instant('hercules.renameAndDeregisterComponent.deregisterConfirmPopup', {
            clusterName: this.cluster.name,
          }));
          this.$modalInstance.close();
        })
        .catch((error) => {
          this.Notification.errorWithTrackingId(error, 'hercules.genericFailure');
          this.loading = false;
        });
    }

  }
}

angular
  .module('Hercules')
  .controller('ClusterDeregisterController', ClusterDeregisterController);