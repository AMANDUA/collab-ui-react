import { Notification } from 'modules/core/notifications';
import { IToolkitModalService } from 'modules/core/modal';
import { IConnectorAlarm, ICluster, ConnectorMaintenanceMode, ConnectorType, IHost, IConnector, ClusterTargetType, IConnectorProvisioning, ConnectorState } from 'modules/hercules/hybrid-services.types';
import { HybridServicesUtilsService } from 'modules/hercules/services/hybrid-services-utils.service';
import { HybridServicesClusterStatesService, IMergedStateSeverity } from 'modules/hercules/services/hybrid-services-cluster-states.service';
import { HybridServicesClusterService } from 'modules/hercules/services/hybrid-services-cluster.service';

interface ISimplifiedConnector {
  alarms: IConnectorAlarm[];
  connectorType: ConnectorType;
  hasUpgradeAvailable: boolean;
  id: string;
  maintenanceMode: ConnectorMaintenanceMode;
  originalState: ConnectorState;
  service: string;
  status: IMergedStateSeverity;
  statusName: string;
  upgradeState: string;
  version: string;
}

interface ISimplifiedNode {
  name: string;
  serial: string;
  pendingTooltip: string;
  platformVersion?: string;
  maintenanceMode: ConnectorMaintenanceMode;
  connectors: ISimplifiedConnector[];
}

interface IData {
  id: string;
  name: string;
  targetType: ClusterTargetType;
  nodes: ISimplifiedNode[];
}

class HybridServicesNodesPageCtrl implements ng.IComponentController {
  private REFRESH_INTERVAL = 30 * 1000;
  private refreshTimeout: ng.IPromise<void> | null = null;
  private clusterCache: ICluster;
  public connectorTypesWithUpgrade: ConnectorType[] = [];
  public nextUpgradeStartTime = '';
  public data: IData;
  public gridOptions = {};
  public loading = true; // first load
  public refreshing = false; // subsequant load of data
  public openedConnector: any;

  /* @ngInject */
  constructor(
    private $q: ng.IQService,
    private $modal: IToolkitModalService,
    private $timeout: ng.ITimeoutService,
    private $translate: ng.translate.ITranslateService,
    private $state: ng.ui.IStateService,
    private HybridServicesClusterService: HybridServicesClusterService,
    private HybridServicesClusterStatesService: HybridServicesClusterStatesService,
    private HybridServicesUtilsService: HybridServicesUtilsService,
    private ModalService,
    private Notification: Notification,
  ) {
    this.hybridConnectorsComparator = this.hybridConnectorsComparator.bind(this);
    this.getSerials = this.getSerials.bind(this);
    this.fetchNodes = this.fetchNodes.bind(this);
  }

  public $onChanges(changes: { [bindings: string]: ng.IChangesObject<any> }) {
    const { clusterId } = changes;
    if (clusterId && clusterId.currentValue) {
      this.loadCluster(clusterId.currentValue);
      this.HybridServicesClusterService.get(clusterId.currentValue)
        .then((info) => {
          this.nextUpgradeStartTime = moment(info.upgradeSchedule.nextUpgradeWindow.startTime).format('LLL');
        });
    }
  }

  public hybridConnectorsComparator(a, b) {
    return this.HybridServicesUtilsService.hybridConnectorsComparator(a.value, b.value);
  }

  public openSidepanel(connector: ISimplifiedConnector) {
    this.openedConnector = connector;
    this.$state.go('hybrid-services-connector-sidepanel', {
      connector: connector,
    });
    // TODO: find how to unselect the current line when closing sidepanel
  }

  public isSidepanelOpen(connector) {
    return this.openedConnector === connector;
  }

  public displayMaintenanceModeMenuItem(targetType: ClusterTargetType): boolean {
    return _.includes(<ConnectorType[]>['c_mgmt', 'mf_mgmt'], targetType);
  }

  public displayGoToNodeMenuItem(targetType: ClusterTargetType): boolean {
    return !_.includes(<ConnectorType[]>['mf_mgmt'], targetType);
  }

  public displayMoveNodeMenuItem(targetType: ClusterTargetType): boolean {
    return _.includes(<ConnectorType[]>['mf_mgmt'], targetType);
  }

  public displayDeregisterNodeMenuItem(targetType: ClusterTargetType): boolean {
    return _.includes(<ConnectorType[]>['mf_mgmt', 'hds_app'], targetType);
  }

  public enableMaintenanceMode(node: ISimplifiedNode): void {
    let message = this.$translate.instant('hercules.nodesPage.enableMaintenanceModeModal.message');
    if (this.data.targetType === 'c_mgmt') {
      message = this.$translate.instant('hercules.nodesPage.enableMaintenanceModeModal.expresswayMessage');
    }
    this.ModalService.open({
      title: this.$translate.instant('hercules.nodesPage.enableMaintenanceModeModal.title'),
      message: message,
      close: this.$translate.instant('common.enable'),
      dismiss: this.$translate.instant('common.cancel'),
    })
    .result
    .then(() => {
      return this.HybridServicesClusterService.updateHost(node.serial, {
        maintenanceMode: 'on',
      })
      .then(response => {
        this.loadCluster(this.data.id);
        return response;
      })
      .catch((error) => {
        this.Notification.errorWithTrackingId(error);
      });
    });
  }

  public disableMaintenanceMode(node: ISimplifiedNode): void {
    this.ModalService.open({
      title: this.$translate.instant('hercules.nodesPage.disableMaintenanceModeModal.title'),
      message: this.$translate.instant('hercules.nodesPage.disableMaintenanceModeModal.message'),
      close: this.$translate.instant('common.disable'),
      dismiss: this.$translate.instant('common.cancel'),
    })
    .result
    .then(() => {
      return this.HybridServicesClusterService.updateHost(node.serial, {
        maintenanceMode: 'off',
      })
      .then(() => {
        this.loadCluster(this.data.id);
      })
      .catch((error) => {
        this.Notification.errorWithTrackingId(error);
      });
    });
  }

  public openMoveNodeModal(node: ISimplifiedNode): void {
    this.$modal.open({
      resolve: {
        cluster: () => ({
          id: this.data.id,
          name: this.data.name,
        }),
        connector: () => ({
          id: node.connectors[0].id,
          hostname: node.name,
        }),
      },
      type: 'small',
      controller: 'ReassignClusterControllerV2',
      controllerAs: 'reassignCluster',
      templateUrl: 'modules/mediafusion/media-service-v2/side-panel/reassign-node-to-different-cluster/reassign-cluster-dialog.html',
    })
    .result
    .then(() => {
      this.loadCluster(this.data.id);
    });
  }

  public openDeregisterNodeModal(node: ISimplifiedNode): void {
    this.$modal.open({
      resolve: {
        connectorId: () => node.connectors[0].id,
      },
      type: 'dialog',
      controller: 'HostDeregisterControllerV2',
      controllerAs: 'hostDeregister',
      templateUrl: 'modules/mediafusion/media-service-v2/side-panel/deregister-node/host-deregister-dialog.html',
    })
    .result
    .then(() => {
      this.loadCluster(this.data.id);
    });
  }

  public $onDestroy(): void {
    if (this.refreshTimeout) {
      this.$timeout.cancel(this.refreshTimeout);
    }
  }

  private loadCluster(id) {
    if (this.refreshTimeout) {
      this.$timeout.cancel(this.refreshTimeout);
    }
    if (!this.loading) {
      this.refreshing = true;
    }
    return this.HybridServicesClusterService.get(id)
      .then((cluster: ICluster) => {
        this.clusterCache = cluster;
        return this.getSerials(cluster);
      })
      .then(this.fetchNodes)
      .then((nodes: IHost[]) => {
        this.data = this.processData(this.clusterCache, nodes);
        return this.data;
      })
      .catch(response => {
        this.Notification.errorWithTrackingId(response, 'hercules.nodesPage.loadingError');
      })
      .finally(() => {
        this.loading = false;
        this.refreshing = false;
        this.refreshTimeout = this.$timeout(() => {
          this.loadCluster(id);
        }, this.REFRESH_INTERVAL);
      });
  }

  private getSerials(cluster: ICluster): string[] {
    return _.chain(cluster.connectors)
      .map(connector => connector.hostSerial)
      .uniq()
      .value();
  }

  private fetchNodes(serials: string[]) {
    const promises = _.map(serials, (serial) => {
      return this.HybridServicesClusterService.getHost(serial);
    });
    return this.$q.all(promises);
  }

  public openUpgradeModal(connectorType): void {
    this.$modal.open({
      templateUrl: 'modules/hercules/connector-upgrade-modal/connector-upgrade-modal.html',
      type: 'small',
      controller: 'ConnectorUpgradeController',
      controllerAs: 'ConnectorUpgradeCtrl',
      resolve: {
        connectorType: () => connectorType,
        cluster: () => this.clusterCache,
      },
    })
    .result
    .then(() => {
      this.loadCluster(this.data.id);
    });
  }

  private processData(cluster: ICluster, nodes: IHost[]): IData {
    function hasUpgradeAvailable(provisioning: IConnectorProvisioning[], connector: IConnector): boolean {
      const provisioningType = _.find(provisioning, { connectorType: connector.connectorType });
      if (provisioningType) {
        // Upgrade available if:
        // - has the right type
        // - is not currently upgrading
        // - version is different from the available version
        return provisioningType.connectorType === connector.connectorType &&
          connector.upgradeState === 'upgraded' &&
          !_.isUndefined(provisioningType.availableVersion) && connector.runningVersion !== provisioningType.availableVersion;
      }
      return false;
    }
    const result: IData = {
      id: cluster.id,
      name: cluster.name,
      targetType: cluster.targetType,
      nodes: _.chain(nodes)
        .map((node) => {
          // We have to base the transformation on the connectors from `cluster`, not from `nodes` because of
          // https://sqbu-github.cisco.com/WebExSquared/fusion-management-service/issues/250
          const connectors = _.chain(cluster.connectors)
            .filter({ hostSerial: node.serial })
            .map(connector => {
              const mergedStatus = this.HybridServicesClusterStatesService.getMergedStateSeverity([connector]);
              const simplifiedConnector: ISimplifiedConnector = {
                alarms: connector.alarms,
                connectorType: connector.connectorType,
                hasUpgradeAvailable: hasUpgradeAvailable(cluster.provisioning, connector),
                id: connector.id,
                maintenanceMode: this.getMaintenanceModeForConnector(connector),
                originalState: connector.state,
                service: this.$translate.instant(`hercules.shortConnectorNameFromConnectorType.${connector.connectorType}`),
                status: mergedStatus,
                statusName: this.$translate.instant(`hercules.status.${mergedStatus.name}`),
                upgradeState: connector.upgradeState,
                version: connector.runningVersion,
              };
              return simplifiedConnector;
            })
            .value();

          return <ISimplifiedNode>{
            name: node.hostname,
            serial: node.serial,
            pendingTooltip: this.$translate.instant(`hercules.nodesPage.pendingTooltip`, { date: moment(node.lastMaintenanceModeEnabledTimestamp).format('LLL') }),
            platformVersion: node.platformVersion,
            maintenanceMode: node.maintenanceMode,
            connectors: connectors,
          };
        })
        .value(),
    };
    this.connectorTypesWithUpgrade = _.chain(result.nodes)
      .map((node) => node.connectors)
      .flatten<ISimplifiedConnector>()
      .filter((connector) => connector.hasUpgradeAvailable && connector.originalState !== 'offline')
      .map((connector) => connector.connectorType)
      .uniq()
      .value();
    return result;
  }

  private getMaintenanceModeForConnector(connector: IConnector): ConnectorMaintenanceMode {
    // `connector.maintenanceMode` should reflect the status it should be in (maps `maintenanceMode` on the node)
    // `connector.connectorStatus.maintenanceMode` is the latest mode received via an heartbeat
    const fromHeartbeat = _.get<IConnector, ConnectorMaintenanceMode>(connector, 'connectorStatus.maintenanceMode');
    if (connector.maintenanceMode === 'off') {
      return 'off';
    } else if (connector.maintenanceMode === 'on' && _.includes(['stopped', 'disabled', 'offline'], connector.state)) {
      return 'on';
    } else if (connector.maintenanceMode === 'on' && fromHeartbeat === 'off') {
      return 'pending';
    } else {
      return fromHeartbeat;
    }
  }
}

export class HybridServicesNodesPageComponent implements ng.IComponentOptions {
  public controller = HybridServicesNodesPageCtrl;
  public templateUrl = 'modules/hercules/hybrid-services-nodes-page/hybrid-services-nodes-page.html';
  public bindings = {
    clusterId: '<',
  };
}
