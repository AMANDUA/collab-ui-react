(function () {
  'use strict';

  /* @ngInject */
  function MediaServiceController(XhrNotificationService, MediaServiceActivation, $state,
    $modal, $scope, $log, $translate, Authinfo, MediaClusterService) {

    MediaClusterService.subscribe('data', clustersUpdated, {
      scope: $scope
    });

    var vm = this;
    vm.loading = true;
    vm.state = $state;
    vm.selectedRow = -1;
    vm.pollHasFailed = false;
    vm.showInfoPanel = true;
    vm.deleteClusterId = null;
    vm.deleteSerial = null;
    vm.showPreview = true;
    vm.deleteConnectorName = null;
    vm.serviceEnabled = false;
    vm.currentServiceType = "mf_mgmt";
    vm.currentServiceId = "squared-fusion-media";
    vm.clusters = _.values(MediaClusterService.getClusters());
    vm.aggregatedClusters = _.values(MediaClusterService.getAggegatedClusters());
    vm.clusterLength = clusterLength;
    //vm.serviceNotInstalled = serviceNotInstalled;
    //vm.selectedClusterAggregatedStatus = selectedClusterAggregatedStatus;
    //vm.enableService = enableService;
    vm.showClusterDetails = showClusterDetails;

    vm.clusterListGridOptions = {
      data: 'med.aggregatedClusters',
      enableSorting: false,
      multiSelect: false,
      showFilter: false,
      showFooter: false,
      rowHeight: 75,
      rowTemplate: 'modules/mediafusion/media-service/resources/cluster-list-row-template.html',
      headerRowHeight: 44,
      columnDefs: [{
        field: 'groupName',
        displayName: 'Media Clusters',
        cellTemplate: 'modules/mediafusion/media-service/resources/cluster-list-display-name.html',
        width: '35%'
      }, {
        field: 'serviceStatus',
        displayName: 'Service Status',
        cellTemplate: 'modules/mediafusion/media-service/resources/cluster-list-status.html',
        width: '65%'
      }]
    };

    if (vm.currentServiceId == "squared-fusion-media") {
      $log.log("checking isServiceEnabled");
      vm.serviceEnabled = false;
      MediaServiceActivation.isServiceEnabled(vm.currentServiceId, function (a, b) {
        vm.serviceEnabled = b;
        vm.loading = false;
        //$log.log("isServiceEnabled :", b);
        //$log.log("clusters :", vm.clusters);
        //$log.log("aggregatedClusters :", vm.aggregatedClusters);
      });
    }

    function clusterLength() {
      return _.size(vm.clusters);
    }

    function clustersUpdated() {
      //ServiceStateChecker.checkState(vm.currentServiceType, vm.currentServiceId);
      $log.log("clustersUpdated :");
      vm.clusters = _.values(MediaClusterService.getClusters());
      $log.log("clustersUpdated clusters :", vm.clusters);
      vm.aggregatedClusters = _.values(MediaClusterService.getAggegatedClusters(vm.clusters));
      $log.log("clustersUpdated aggregatedClusters :", vm.aggregatedClusters);

    }

    function showClusterDetails(group) {
      vm.connector = group.clusters[0];
      vm.connectorId = group.clusters[0].id;
      if (vm.showPreview) {
        $state.go('connector-details', {
          connectorId: vm.connector.id,
          groupName: group.groupName,
          roleSelected: vm.connector.properties["mf.role"]
        });
      }
      vm.showPreview = true;
    }

    function enableMediaService(serviceId) {
      //$log.log("Entered enableMediaService");
      vm.waitForEnabled = true;
      MediaServiceActivation.setServiceEnabled(serviceId, true).then(
        function success() {
          //$log.log("media service enabled successfully");
          vm.enableOrpheusForMediaFusion();
        },
        function error(data, status) {
          //$log.log("Problems enabling media service");
          Notification.notify($translate.instant('mediaFusion.mediaServiceActivationFailure'));
        });
      //$scope.enableOrpheusForMediaFusion();
      vm.serviceEnabled = true;
      vm.waitForEnabled = false;
      //$log.log("Exiting enableMediaService, serviceEnabled:", $scope.serviceEnabled);
    }

    function enableOrpheusForMediaFusion() {
      //$log.log("Entered enableOrpheusForMediaFusion");
      MediaServiceActivation.getUserIdentityOrgToMediaAgentOrgMapping().then(
        function success(response) {
          var mediaAgentOrgIdsArray = [];
          var orgId = Authinfo.getOrgId();
          var updateMediaAgentOrgId = false;
          mediaAgentOrgIdsArray = response.data.mediaAgentOrgIds;
          //$log.log("User's Indentity Org to Calliope Media Agent Org mapping:", response);
          //$log.log("Identity Org Id:", response.data.identityOrgId);
          //$log.log("Media Agent Org Ids Array:", mediaAgentOrgIdsArray);

          // See if org id is already mapped to user org id 
          if (mediaAgentOrgIdsArray.indexOf(orgId) == -1) {
            mediaAgentOrgIdsArray.push(orgId);
            updateMediaAgentOrgId = true;
          }
          // See if "squared" org id is already mapped to user org id 
          if (mediaAgentOrgIdsArray.indexOf("squared") == -1) {
            mediaAgentOrgIdsArray.push("squared");
            updateMediaAgentOrgId = true;
          }

          if (updateMediaAgentOrgId) {
            //$log.log("Updated Media Agent Org Ids Array:", mediaAgentOrgIdsArray);
            vm.addUserIdentityToMediaAgentOrgMapping(mediaAgentOrgIdsArray);
          }
        },

        function error(errorResponse, status) {
          // Unable to find identityOrgId, add identityOrgId -> mediaAgentOrgId mapping
          var mediaAgentOrgIdsArray = [];
          mediaAgentOrgIdsArray.push(Authinfo.getOrgId());
          mediaAgentOrgIdsArray.push("squared");
          vm.addUserIdentityToMediaAgentOrgMapping(mediaAgentOrgIdsArray);
        });
    }

    function addUserIdentityToMediaAgentOrgMapping(mediaAgentOrgIdsArray) {
      MediaServiceActivation.setUserIdentityOrgToMediaAgentOrgMapping(mediaAgentOrgIdsArray).then(
        function success(response) {},
        function error(errorResponse, status) {
          Notification.notify([$translate.instant('mediaFusion.mediaAgentOrgMappingFailure', {
            failureMessage: errorResponse.message
          })], 'error');
        });
    }
  }

  /* @ngInject */
  function AlarmController($stateParams) {
    var vm = this;
    vm.alarm = $stateParams.alarm;
    vm.host = $stateParams.host;
  }

  /* @ngInject */
  function HostDetailsController($stateParams, $state, MediaClusterService, XhrNotificationService) {
    var vm = this;
    vm.host = $stateParams.host;
    vm.cluster = MediaClusterService.getClusters()[$stateParams.clusterId];
    vm.serviceType = $stateParams.serviceType;
    vm.connector = function () {
      var service = _.find(vm.cluster.services, {
        service_type: vm.serviceType
      });
      return _.find(service.connectors, function (connector) {
        return connector.host.serial == vm.host.serial;
      });
    };

    vm.deleteHost = function () {
      return MediaClusterService.deleteHost(vm.cluster.id, vm.connector().host.serial).then(function () {
        if (MediaClusterService.getClusters()[vm.cluster.id]) {
          $state.go('cluster-details', {
            clusterId: vm.cluster.id
          });
        } else {
          $state.sidepanel.close();
        }
      }, XhrNotificationService.notify);
    };
  }

  /* @ngInject */
  function MediaClusterSettingsController($modal, $stateParams, MediaClusterService, $scope, XhrNotificationService) {
    var vm = this;
    vm.clusterId = $stateParams.clusterId;
    vm.serviceType = $stateParams.serviceType;
    vm.cluster = MediaClusterService.getClusters()[vm.clusterId];
    vm.saving = false;

    vm.selectedService = function () {
      return _.find(vm.cluster.services, {
        service_type: vm.serviceType
      });
    };
    /*
        vm.serviceNotInstalled = function () {
          return ServiceStatusSummaryService.serviceNotInstalled(vm.serviceType, vm.cluster);
        };*/

    vm.showDeregisterDialog = function () {
      $modal.open({
        resolve: {
          cluster: function () {
            return vm.cluster;
          }
        },
        controller: 'ClusterDeregisterController',
        controllerAs: "clusterDeregister",
        templateUrl: 'modules/hercules/cluster-deregister/deregister-dialog.html'
      });
    };
  }

  angular
    .module('Mediafusion')
    .controller('MediaServiceController', MediaServiceController)
    .controller('MediaClusterSettingsController', MediaClusterSettingsController)
    .controller('AlarmController', AlarmController)
    .controller('HostDetailsController', HostDetailsController);
}());