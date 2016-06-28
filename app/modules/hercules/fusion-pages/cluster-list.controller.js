(function () {
  'use strict';

  angular
    .module('Hercules')
    .controller('FusionClusterListController', FusionClusterListController);

  /* @ngInject */
  function FusionClusterListController($filter, $q, $state, $translate, hasFeatureToggle, FusionClusterService, XhrNotificationService) {
    if (!hasFeatureToggle) {
      // simulate a 404
      $state.go('login');
    }

    var vm = this;
    var clustersCache = [];
    var activeFilter = 'all';

    vm.loading = true;
    vm.backState = 'services-overview';
    vm.displayedClusters = [];
    vm.placeholder = {
      name: $translate.instant('hercules.fusion.list.all'),
      filterValue: 'all',
      count: 0
    };
    vm.filters = [{
      name: $translate.instant('hercules.fusion.list.expressway'),
      filterValue: 'expressway',
      count: 0
    }, {
      name: $translate.instant('hercules.fusion.list.mediafusion'),
      filterValue: 'mediafusion',
      count: 0
    }];
    vm.countHosts = countHosts;
    vm.setFilter = setFilter;
    vm.searchData = searchData;
    vm.openService = openService;
    vm.openSettings = openSettings;
    vm._helpers = {
      formatTimeAndDate: formatTimeAndDate,
      hasServices: hasServices
    };

    loadClusters();

    function loadClusters() {
      FusionClusterService.getAll()
        .then(addMissingUpgradeScheduleToClusters)
        .then(function (clusters) {
          clustersCache = clusters;
          updateFilters();
          vm.displayedClusters = clusters;
        }, XhrNotificationService.notify)
        .finally(function () {
          vm.loading = false;
        });
    }

    function countHosts(cluster) {
      return _.chain(cluster.connectors)
        .map('hostname')
        .uniq()
        .size()
        .value();
    }

    function addMissingUpgradeScheduleToClusters(clusters) {
      // .clusterUpgradeSchedule is populated when getting the list of clusters
      // only when the upgrade schedule has been explicitely set by the admin.
      // Otherwise it's not there but we can get it by fetching directly the
      // cluster data…
      var promises = clusters.map(function (cluster) {
        if (cluster.clusterUpgradeSchedule) {
          return cluster;
        } else {
          return FusionClusterService.getUpgradeSchedule(cluster.id)
            .then(function (upgradeSchedule) {
              cluster.clusterUpgradeSchedule = upgradeSchedule;
              return cluster;
            });
        }
      });
      return $q.all(promises);
    }

    function updateFilters() {
      var expresswayClusters = _.filter(clustersCache, 'type', 'expressway');
      var mediafusionClusters = _.filter(clustersCache, 'type', 'mediafusion');
      vm.placeholder.count = clustersCache.length;
      vm.filters[0].count = expresswayClusters.length;
      vm.filters[1].count = mediafusionClusters.length;
    }

    function setFilter(filter) {
      activeFilter = filter.filterValue || 'all';
      if (filter.filterValue === 'expressway') {
        vm.displayedClusters = _.filter(clustersCache, 'type', 'expressway');
      } else if (filter.filterValue === 'mediafusion') {
        vm.displayedClusters = _.filter(clustersCache, 'type', 'mediafusion');
      } else {
        vm.displayedClusters = clustersCache;
      }
    }

    function searchData(searchStr) {
      if (searchStr === '') {
        vm.displayedClusters = clustersCache;
      } else {
        // Filter on the cluster name only
        vm.displayedClusters = $filter('filter')(clustersCache, {
          name: searchStr
        });
      }
    }

    function openService(serviceId, clusterId) {
      if (serviceId === 'squared-fusion-uc') {
        $state.go('call-service.list', {
          'clusterId': clusterId
        });
      } else if (serviceId === 'squared-fusion-cal') {
        $state.go('calendar-service.list', {
          'clusterId': clusterId
        });
      } else if (serviceId === 'squared-fusion-media') {
        $state.go('media-service.list');
      }
    }

    function openSettings(type, id) {
      $state.go(type + '-settings', {
        id: id
      });
    }

    function formatTimeAndDate(clusterUpgradeSchedule) {
      var time = labelForTime(clusterUpgradeSchedule.scheduleTime);
      var day = labelForDay(clusterUpgradeSchedule.scheduleDays[0]);
      return time + ' ' + day;
    }

    function labelForTime(time) {
      var currentLanguage = $translate.use();
      if (currentLanguage === 'en_US') {
        return moment(time, 'HH:mm').format('hh:mm A');
      } else {
        return time;
      }
    }

    function labelForDay(day) {
      var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      var keys = _.reduce(days, function (result, day, i) {
        // the days in shcedule upgrade starts at 1 == monday and ends with 7 == sunday
        // (API made by a British :))
        result[i + 1] = day;
        return result;
      }, {});
      return $translate.instant('weekDays.everyDay', {
        day: $translate.instant('weekDays.' + keys[day])
      });
    }

    function hasServices(cluster) {
      return cluster.servicesStatuses.some(function (serviceStatus) {
        return serviceStatus.serviceId !== 'squared-fusion-mgmt' && serviceStatus.total > 0;
      });
    }
  }
})();