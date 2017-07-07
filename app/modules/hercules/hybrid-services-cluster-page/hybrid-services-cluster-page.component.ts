import { HybridServicesClusterService } from 'modules/hercules/services/hybrid-services-cluster.service';

class HybridServicesClusterPageCtrl implements ng.IComponentController {
  public tabs: { title: string, state: string }[] = [];
  public title: string;
  public titleValues: object;
  public backUrl: string = 'cluster-list';
  public hasNodesViewFeatureToggle: boolean;

  /* @ngInject */
  constructor(
    private $rootScope: ng.IRootScopeService,
    private $scope: ng.IScope,
    private HybridServicesClusterService: HybridServicesClusterService,
  ) {}

  public $onChanges(changes: { [bindings: string]: ng.IChangesObject<any> }) {
    const { clusterId } = changes;
    if (clusterId && clusterId.currentValue) {
      this.init(clusterId.currentValue);
    }
  }

  private updateName(name: string): void {
    this.title = 'hercules.expresswayClusterSettings.pageTitle';
    this.titleValues = {
      clusterName: name,
    };
  }

  private init(id) {
    this.HybridServicesClusterService.get(id)
      .then(cluster => {
        this.updateName(cluster.name);
        let route;
        switch (cluster.targetType) {
          case 'c_mgmt':
            route = 'expressway';
            break;
          case 'mf_mgmt':
            route = 'mediafusion';
            break;
          case 'hds_app':
            route = 'hds';
            break;
          case 'ucm_mgmt':
            route = 'cucm';
            break;
          default:
            route = '';
        }
        // Don't show any tabs if the "Nodes" one is not available. Only the "Settings" tab would be weird
        if (this.hasNodesViewFeatureToggle) {
          this.tabs = [{
            title: 'common.nodes',
            state: `${route}-cluster.nodes`,
          }, {
            title: 'common.settings',
            state: `${route}-cluster.settings`,
          }];
        }
      });

    const deregister = this.$rootScope.$on('cluster-name-update', (_event, name) => {
      this.updateName(name);
    });

    this.$scope.$on('$destroy', deregister);
  }
}

export class HybridServicesClusterPageComponent implements ng.IComponentOptions {
  public controller = HybridServicesClusterPageCtrl;
  public templateUrl = 'modules/hercules/hybrid-services-cluster-page/hybrid-services-cluster-page.html';
  public bindings = {
    clusterId: '<',
    hasNodesViewFeatureToggle: '<',
  };
}
