import { IMergedStateSeverity } from 'modules/hercules/services/hybrid-services-cluster-states.service';

export type ClusterTargetType = 'c_mgmt' | 'mf_mgmt' | 'hds_app' | 'ucm_mgmt' | 'cs_mgmt' | 'ept' | 'unknown';
export type ConnectorAlarmSeverity = 'critical' | 'error' | 'warning' | 'alert';
export type ConnectorMaintenanceMode = 'on' | 'off' | 'pending';
export type ConnectorState = 'running' | 'not_installed' | 'disabled' | 'downloading' | 'installing' | 'not_configured' | 'uninstalling' | 'registered' | 'initializing' | 'offline' | 'stopped' | 'not_operational' | 'unknown';
export type ConnectorType = 'c_mgmt' | 'c_cal' | 'c_ucmc' | 'mf_mgmt' | 'hds_app' | 'cs_mgmt' | 'cs_context' | 'ucm_mgmt' | 'c_serab' | 'c_imp';
export type ConnectorUpgradeState = 'upgraded' | 'upgrading' | 'pending';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type ExtendedConnectorState = ConnectorState | 'has_warning_alarms' | 'has_error_alarms' | 'not_registered' | 'no_nodes_registered';
export type HybridServiceId = 'squared-fusion-mgmt' | 'squared-fusion-cal' | 'squared-fusion-gcal' | 'squared-fusion-uc' | 'squared-fusion-ec' | 'squared-fusion-media' | 'spark-hybrid-datasecurity' | 'contact-center-context' | 'squared-fusion-khaos' | 'squared-fusion-servicability' | 'ept' | 'spark-hybrid-impinterop';
export type ServiceAlarmSeverity = 'error' | 'warning' | 'critical'; // TODO: check if that's really the only values
export type ServiceSeverity = 0 | 1 | 2 | 3;
export type ServiceSeverityLabel = 'ok' | 'unknown' | 'warning' | 'error';
export type StatusIndicatorCSSClass = 'success' | 'warning' | 'danger' | 'disabled';
export type TimeOfDay = '00:00' | '01:00' | '02:00' | '03:00' | '04:00' | '05:00' | '06:00' | '07:00' | '08:00' | '09:00' | '10:00' | '11:00' | '12:00' | '13:00' | '14:00' | '15:00' | '16:00' | '17:00' | '18:00' | '19:00' | '20:00' | '21:00' | '22:00' | '23:00';
export type HybridVoicemailStatus = 'NOT_CONFIGURED' | 'REQUESTED' | 'HYBRID_SUCCESS' | 'HYBRID_FAILED' | 'HYBRID_PARTIAL' | undefined ;

export interface IFMSOrganization {
  alarmsUrl: string;
  clusters: ICluster[];
  id: string;
  resourceGroups: IResourceGroup[];
  url: string;
  servicesUrl: string;
}

export interface IResourceGroup {
  id: string;
  name: string;
  releaseChannel: string;
}

export interface IUpgradeSchedule {
  moratoria: IMoratoria[];
  nextUpgradeWindow: ITimeWindow;
  scheduleDays: DayOfWeek[];
  scheduleTime: TimeOfDay;
  scheduleTimeZone: string;
  urgentScheduleTime: TimeOfDay;
  url: string;
}

export interface ICluster {
  connectors: IConnector[];
  id: string;
  name: string;
  provisioning: IConnectorProvisioning[];
  releaseChannel: string;
  resourceGroupId?: string;
  targetType: ClusterTargetType;
  upgradeSchedule: IUpgradeSchedule;
  upgradeScheduleUrl: string;
  url: string;
}

// ClusterService
export interface IExtendedCluster extends ICluster {
  aggregates: IClusterAggregate;
}

// HybridServicesClusterService
export interface IExtendedClusterFusion extends ICluster {
  servicesStatuses: IExtendedClusterServiceStatus[];
}

export interface IExtendedClusterServiceStatus {
  serviceId: HybridServiceId;
  state: IMergedStateSeverity;
  total: number;
}

export interface IHost {
  connectors: IConnector[];
  hostname: string;
  lastMaintenanceModeEnabledTimestamp: string;
  maintenanceMode: ConnectorMaintenanceMode;
  platform?: 'expressway';
  platformVersion?: string;
  serial: string;
  url: string;
}

export interface IClusterAggregate {
  alarms: IExtendedConnectorAlarm[];
  state: ExtendedConnectorState;
  upgradeState: 'upgraded' | 'upgrading';
  provisioning: IConnectorProvisioning;
  upgradeAvailable: boolean;
  upgradeWarning: boolean;
  hosts: IHostAggregate[];
}

export interface IMoratoria {
  timeWindow: ITimeWindow;
  id: string;
  url: string;
}

export interface ITimeWindow {
  endTime: string;
  startTime: string;
}

export interface IConnectorProvisioning {
  availablePackageIsUrgent: boolean;
  availableVersion: string;
  connectorType: ConnectorType;
  packageUrl: string;
  provisionedVersion: string;
  url: string;
}

export interface IConnector {
  alarms: IConnectorAlarm[];
  clusterId: string;
  clusterUrl: string;
  connectorStatus?: IConnectorStatus;
  connectorType: ConnectorType;
  createdAt: string;
  hostSerial: string;
  hostUrl: string;
  hostname: string;
  id: string;
  maintenanceMode: 'on' | 'off';
  runningVersion: string;
  state: ConnectorState;
  upgradeState: ConnectorUpgradeState;
  url: string;
}

export interface IConnectorStatus {
  clusterSerials?: string[];
  initialized?: boolean;
  maintenanceMode: ConnectorMaintenanceMode;
  operational: boolean;
  userCapacity?: number;
  services: {
    onprem: {
      address: string;
      type: 'uc_service' | 'cal_service' | 'mercury' | 'common_identity' | 'encryption_service' | 'cmr' | 'ebex_files' | 'fms';
      httpProxy: string;
      state: 'ok' | 'error';
      stateDescription: string;
      mercury?: {
        route: string;
        dataCenter: string;
      };
    }[];
    cloud: {
      address: string;
      type: 'ucm_cti' | 'ucm_axl' | 'exchange' | 'kms';
      version: string;
      state: 'ok' | 'error';
      stateDescription: string;
    }[];
  };
  users?: {
    assignedRoomCount: number;
    assignedUserCount: number;
    totalFaultyCount: number | null;
    totalSubscribedCount: number | null;
  };
}

export interface IExtendedConnector extends IConnector {
  extendedState: ExtendedConnectorState;
}

export interface IHostAggregate {
  alarms: IConnectorAlarm[];
  hostname: string;
  state: ConnectorState;
  upgradeState: ConnectorUpgradeState;
}

export interface IConnectorAlarm {
  id: string;
  // This hack should be removed once FMS starts using the correct format for alarm timestamps.
  firstReported: number | string;
  // This hack should be removed once FMS starts using the correct format for alarm timestamps.
  lastReported: number | string;
  severity: ConnectorAlarmSeverity;
  title: string;
  description: string;
  solution: string;
  solutionReplacementValues: {
    text: string;
    link: string;
  }[];
}

export interface IAlarmReplacementValues {
  key: string;
  value: string;
  type?: string;
}

export interface IServiceAlarm {
  url: string;
  serviceId: HybridServiceId;
  sourceId: 'uss' | 'ccc' | 'das';
  sourceType: 'connector' | 'cloud';
  alarmId: string;
  severity: ServiceAlarmSeverity;
  title: string;
  description: string;
  key: string;
  replacementValues: IAlarmReplacementValues[];
}

export interface IExtendedConnectorAlarm extends IConnectorAlarm {
  hostname: string;
  affectedNodes: string[];
}

export interface IResourceGroup {
  id: string;
  name: string;
  releaseChannel: string;
}

export interface IReleaseChannelsResponse {
  releaseChannels: IReleaseChannelEntitlement[];
}

export interface IReleaseChannelEntitlement {
  channel: string;
  entitled: boolean;
}

