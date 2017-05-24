'use strict';

describe('Controller: AddResourceController', function () {
  var controller, $scope, $controller, $q, modalInstanceMock, translateMock, windowMock, clusterServiceMock, fusionClusterServiceMock, hybridServicesExtrasServiceMock, FmsOrgSettingsMock, ResourceGroupService;

  var clusterIdOfNewCluster = 'c6b4d8f1-6d34-465c-8d6d-b541058fc15e';
  var newConnectorType = 'c_cal';

  beforeEach(angular.mock.module('Squared'));
  beforeEach(angular.mock.module('Hercules'));
  beforeEach(inject(dependencies));
  beforeEach(initController);

  function dependencies($rootScope, _$controller_, _$q_, _ResourceGroupService_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $q = _$q_;
    ResourceGroupService = _ResourceGroupService_;
  }

  function initController() {
    translateMock = {
      instant: jasmine.createSpy('instant'),
    };

    modalInstanceMock = {
      close: jasmine.createSpy('close'),
    };

    windowMock = {
      open: jasmine.createSpy('open'),
    };

    hybridServicesExtrasServiceMock = {
      addPreregisteredClusterToAllowList: function () {
        return $q.resolve({});
      },
    };

    FmsOrgSettingsMock = {
      get: function () {
        return $q.resolve({
          expresswayClusterReleaseChannel: 'stable',
        });
      },
    };
    fusionClusterServiceMock = {
      provisionConnector: function () {
        return $q.resolve({
          id: clusterIdOfNewCluster,
        });
      },
      preregisterCluster: function () {
        return $q.resolve({
          id: clusterIdOfNewCluster,
        });
      },
      getAll: function () {
        return $q.resolve([{
          url: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d',
          id: 'fe5acf7a-6246-484f-8f43-3e8c910fc50d',
          name: 'Test Expressway Cluster 01 – starting with c_ucmc but no c_cal',
          connectors: [{
            url: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/clusters/01deb566-2cac-11e6-847d-005056bf13dd/connectors/c_cal@03C36F68',
            id: 'c_cal@03C36F68',
            connectorType: 'c_cal',
            upgradeState: 'upgraded',
            state: 'offline',
            hostname: 'host1.example.org',
            hostSerial: '03C36F68',
            alarms: [],
            runningVersion: '8.7-1.0.2966',
            packageUrl: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/channels/stable/packages/c_cal',
          }, {
            url: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/clusters/01deb566-2cac-11e6-847d-005056bf13dd/connectors/c_mgmt@03C36F68',
            id: 'c_mgmt@03C36F68',
            connectorType: 'c_mgmt',
            upgradeState: 'upgraded',
            state: 'offline',
            hostname: 'host1.example.org',
            hostSerial: '03C36F68',
            alarms: [],
            runningVersion: '8.7-1.0.2966',
            packageUrl: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/channels/stable/packages/c_mgmt',
          }],
          state: 'fused',
          releaseChannel: 'stable',
          provisioning: [{
            connectorType: 'c_mgmt',
          }, {
            connectorType: 'c_ucmc',
          }],
          targetType: 'c_mgmt',
          servicesStatuses: [{
            serviceId: 'squared-fusion-uc',
            state: {
              name: 'offline',
              severity: 3,
              label: 'error',
            },
          }],
        }, {
          url: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/6f090d26-0d32-11e6-bda1-005056001268',
          id: '6f090d26-0d32-11e6-bda1-005056001268',
          name: 'Test Expressway Cluster 02 – starting with both c_ucmc and c_cal',
          connectors: [{
            url: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/clusters/01deb566-2cac-11e6-847d-005056bf13dd/connectors/c_cal@03C36F68',
            id: 'c_cal@03C36F68',
            connectorType: 'c_cal',
            upgradeState: 'upgraded',
            state: 'offline',
            hostname: 'both.example.org',
            hostSerial: '0C379CB8',
            alarms: [],
            runningVersion: '8.7-1.0.2966',
            packageUrl: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/channels/stable/packages/c_cal',
          }],
          state: 'fused',
          releaseChannel: 'stable',
          provisioning: [{
            connectorType: 'c_cal',
          }, {
            connectorType: 'c_ucmc',
          }],
          targetType: 'c_mgmt',
          servicesStatuses: [{
            serviceId: 'squared-fusion-uc',
            state: {
              name: 'offline',
              severity: 3,
              label: 'error',
            },
          }, {
            serviceId: 'squared-fusion-cal',
            state: {
              name: 'offline',
              severity: 3,
              label: 'error',
            },
          }],
        }, {
          url: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/2a394f17-bf73-4f01-a29e-eee22df86615',
          id: '2a394f17-bf73-4f01-a29e-eee22df86615',
          name: 'Test Expressway Cluster 03 – starting with c_cal and no c_ucmc',
          connectors: [{
            url: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/clusters/01deb566-2cac-11e6-847d-005056bf13dd/connectors/c_cal@03C36F68',
            id: 'c_cal@03C36F68',
            connectorType: 'c_cal',
            upgradeState: 'upgraded',
            state: 'offline',
            hostname: 'calendar.example.org',
            hostSerial: '55379CB8',
            alarms: [],
            runningVersion: '8.7-1.0.2966',
            packageUrl: 'https://hercules-intb.ciscospark.com/hercules/api/v2/organizations/fe5acf7a-6246-484f-8f43-3e8c910fc50d/channels/stable/packages/c_cal',
          }],
          state: 'fused',
          releaseChannel: 'stable',
          provisioning: [{
            connectorType: 'c_mgmt',
          }, {
            connectorType: 'c_cal',
          }],
          targetType: 'c_mgmt',
          servicesStatuses: [{
            serviceId: 'squared-fusion-cal',
            state: {
              name: 'offline',
              severity: 3,
              label: 'error',
            },
          }],
        }]);
      },
    };

    spyOn(ResourceGroupService, 'getAllAsOptions').and.returnValue($q.resolve({}));

    controller = $controller('AddResourceController', {
      $scope: $scope,
      $modalInstance: modalInstanceMock,
      $window: windowMock,
      $translate: translateMock,
      connectorType: newConnectorType,
      serviceId: 'squared-fusion-cal',
      ClusterService: clusterServiceMock,
      HybridServicesClusterService: fusionClusterServiceMock,
      FmsOrgSettings: FmsOrgSettingsMock,
      HybridServicesExtrasService: hybridServicesExtrasServiceMock,
      firstTimeSetup: false,
      ResourceGroupService: ResourceGroupService,
    });
    $scope.$apply();
  }

  describe('provision connectors to an existing cluster', function () {

    it('should find and populate the dropdown with only the one Expressway that does not have calendar', function () {
      expect(controller.expresswayOptions.length).toBe(1);
      expect(controller.expresswayOptions[0].value).toBe('fe5acf7a-6246-484f-8f43-3e8c910fc50d');
      expect(controller.expresswayOptions[0].label).toBe('Test Expressway Cluster 01 – starting with c_ucmc but no c_cal');
    });

    it('should tell the modal that it must proceed when a connector has been provisioned', function () {
      controller.provisionExpresswayWithNewConnector('fe5acf7a-6246-484f-8f43-3e8c910fc50d', newConnectorType);
      $scope.$apply();
      expect(controller.provisioningToExistingExpresswayCompleted).toBe(true);
    });

    it('should parse the hostname from the connector list of the cluster, and make it available to the view', function () {
      controller.provisionExpresswayWithNewConnector('fe5acf7a-6246-484f-8f43-3e8c910fc50d', newConnectorType);
      $scope.$apply();
      expect(controller.hostname).toBe('host1.example.org');
    });

    it('should not touch the hostname if it cannot find a better one when parsing the connector list', function () {
      controller.hostname = 'old_hostname';
      controller.provisionExpresswayWithNewConnector('invalid_cluster_id', newConnectorType);
      $scope.$apply();
      expect(controller.hostname).toBe('old_hostname');
    });

    it('should provision the new connector, but nothing else', function () {
      spyOn(fusionClusterServiceMock, 'provisionConnector');
      fusionClusterServiceMock.provisionConnector.and.returnValue($q.resolve({
        id: clusterIdOfNewCluster,
      }));
      controller.preregisterAndProvisionExpressway(newConnectorType);
      $scope.$apply();
      expect(fusionClusterServiceMock.provisionConnector).toHaveBeenCalledWith(clusterIdOfNewCluster, newConnectorType);
      expect(fusionClusterServiceMock.provisionConnector).toHaveBeenCalledTimes(1);
    });

    it('should add the new cluster to the FMS allow-list exactly once, and with the correct clusterId', function () {
      spyOn(hybridServicesExtrasServiceMock, 'addPreregisteredClusterToAllowList').and.returnValue($q.resolve({
        id: clusterIdOfNewCluster,
      }));
      controller.preregisterAndProvisionExpressway(newConnectorType);
      controller.hostname = 'hostnameProvidedByUser';
      $scope.$apply();
      expect(hybridServicesExtrasServiceMock.addPreregisteredClusterToAllowList).toHaveBeenCalledTimes(1);
      expect(hybridServicesExtrasServiceMock.addPreregisteredClusterToAllowList).toHaveBeenCalledWith('hostnameProvidedByUser', 3600, clusterIdOfNewCluster);
    });

    it('should not show the Resource Group step unless you are feature toggled', function () {
      $scope.$apply();
      expect(controller.optionalSelectResourceGroupStep).toBe(false);
    });
  });
  describe('check for existing hostnames', function () {
    it('Verify connectors get populated', function () {
      expect(controller.connectors.length).toBe(1);
    });

    it('should create a warning if hostname is previously used', function () {
      controller.hostname = 'host1.example.org';
      expect(controller.warning()).toBe(true);
    });

    it('should not create a warning if hostname is previously not used', function () {
      controller.hostname = 'neverUsedHostname.example.org';
      expect(controller.warning()).toBe(false);
    });
  });

});
