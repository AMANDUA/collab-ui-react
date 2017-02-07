export interface IClusterIdStateParam extends ng.ui.IStateParamsService {
  clusterId?: any;
}

export interface IGridApiScope extends ng.IScope {
  gridApi?: any;
}

export class HybridServiceClusterListCtrl implements ng.IComponentController {

  public clusterList: any = {};
  public clusterListGridOptions = {};
  public getSeverity = this.FusionClusterStatesService.getSeverity;

  protected serviceId: string;
  protected connectorType: string;

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private $scope: IGridApiScope,
    private $state: ng.ui.IStateService,
    private $stateParams: IClusterIdStateParam,
    protected ClusterService,
    private FusionClusterService,
    private FusionClusterStatesService,
    private FusionUtils,
  ) {
    this.updateClusters = this.updateClusters.bind(this);
  }

  public $onInit() {
    this.connectorType = this.FusionUtils.serviceId2ConnectorType(this.serviceId);
    this.clusterList = this.ClusterService.getClustersByConnectorType(this.connectorType);
    this.clusterListGridOptions = {
      data: '$ctrl.clusterList',
      enableSorting: false,
      multiSelect: false,
      enableRowHeaderSelection: false,
      enableColumnResize: true,
      enableColumnMenus: false,
      rowHeight: 75,
      columnDefs: [{
        field: 'name',
        displayName: this.$translate.instant(`hercules.clusterListComponent.clusters-title-${this.serviceId}`),
        cellTemplate: 'modules/hercules/service-specific-pages/components/cluster-list/cluster-list-display-name.html',
        width: '35%',
      }, {
        field: 'serviceStatus',
        displayName: this.$translate.instant('hercules.clusterListComponent.status-title'),
        cellTemplate: 'modules/hercules/service-specific-pages/components/cluster-list/cluster-list-status.html',
        width: '65%',
      }],
      onRegisterApi: (gridApi) => {
        this.$scope.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged(this.$scope, (row) => {
          this.goToSidepanel(row.entity.id);
        });
        if (!_.isUndefined(this.$stateParams.clusterId) && this.$stateParams.clusterId !== null) {
          this.goToSidepanel(this.$stateParams.clusterId);
        }
      },
    };
    this.ClusterService.subscribe('data', this.updateClusters, {
      scope: this.$scope,
    });
  }

  protected updateClusters() {
    if (this.serviceId === 'squared-fusion-calendar' || this.serviceId === 'squared-fusion-uc') {
      this.FusionClusterService.setClusterAllowListInfoForExpressway(this.ClusterService.getClustersByConnectorType(this.connectorType))
        .then((clusters) => {
          this.clusterList = clusters;
        })
        .catch(() => {
          this.clusterList = this.ClusterService.getClustersByConnectorType(this.connectorType);
        });
    } else if (this.serviceId === 'spark-hybrid-datasecurity') {
      this.clusterList = this.ClusterService.getClustersByConnectorType('hds_app');
      this.clusterList.sort(this.sortByProperty('name'));
    }

  }

  private goToSidepanel(clusterId: string) {
    let routeMap = {
      'squared-fusion-cal': 'cluster-details',
      'squared-fusion-uc': 'cluster-details',
      'spark-hybrid-datasecurity': 'hds-cluster-details',
    };

    this.$state.go(routeMap[this.serviceId], {
      clusterId: clusterId,
      connectorType: this.connectorType,
    });

  }

  private sortByProperty(property) {
    return function(a, b) {
      return a[property].toLocaleUpperCase().localeCompare(b[property].toLocaleUpperCase());
    };
  }

}

export class HybridServiceClusterListComponent implements ng.IComponentOptions {
  public controller = HybridServiceClusterListCtrl;
  public templateUrl = 'modules/hercules/service-specific-pages/components/cluster-list/hybrid-service-cluster-list.html';
  public bindings = {
    serviceId: '<',
  };
}

export default angular
  .module('Hercules')
  .component('hybridServiceClusterList', new HybridServiceClusterListComponent())
  .name;
