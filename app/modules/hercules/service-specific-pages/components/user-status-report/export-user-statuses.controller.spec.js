'use strict';

describe('ExportUserStatusesController', function () {
  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Hercules'));

  var vm, Authinfo, scope, $httpBackend, $q, $rootScope, UserDetails, USSService, ClusterService, ExcelService, ResourceGroupService;

  beforeEach(function () {
    angular.mock.module(function ($provide) {
      Authinfo = {
        getServices: function () {
          return [{
            ciName: 'squared-fusion-cal',
            displayName: 'myService',
          }];
        },
        getOrgId: sinon.stub().returns('5632-f806-org'),
      };
      $provide.value('Authinfo', Authinfo);
    });
  });

  beforeEach(inject(function ($controller, _$rootScope_, _$httpBackend_, _$q_, _UserDetails_, _ResourceGroupService_) {
    $q = _$q_;
    $httpBackend = _$httpBackend_;
    UserDetails = _UserDetails_;
    ResourceGroupService = _ResourceGroupService_;
    $httpBackend
      .when('GET', '/connectors/')
      .respond({});

    $rootScope = _$rootScope_;
    scope = $rootScope.$new();

    ExcelService = {
      createFile: sinon.stub(),
      downloadFile: sinon.stub(),
    };

    var userStatusSummary = [{
      serviceId: 'squared-fusion-cal',
      total: 14,
      notActivated: 2,
      activated: 0,
      error: 12,
      deactivated: 0,
      notEntitled: 0,
    }];

    USSService = {
      getAllStatuses: function () {
        return $q.resolve(
          _.range(51).map(function (item, i) {
            return {
              userId: 'DEADBEEF' + i,
              orgId: '0FF1CE',
              connectorId: 'c_cal@aaa',
              serviceId: 'squared-fusion-uc',
              entitled: true,
              state: 'notActivated',
            };
          })
        );
      },
    };
    sinon.spy(USSService, 'getAllStatuses');

    ClusterService = {
      getConnector: function (id) {
        return $q.resolve({
          id: id,
          cluster_id: 'a5140c4a-9f6e-11e5-a58e-005056b12db1',
          display_name: 'Calendar Connector',
          host_name: 'deadbeef.rd.cisco.com',
          cluster_name: 'deadbeef.rd.cisco.com',
          connector_type: 'c_cal',
        });
      },
    };
    sinon.spy(ClusterService, 'getConnector');

    UserDetails = {
      getUsers: function (stateInfos) {
        return $q.resolve(stateInfos);
      },
      getCSVColumnHeaders: function () {
        return ['whatever', 'foo', 'bar'];
      },
    };
    sinon.spy(UserDetails, 'getUsers');
    sinon.spy(ResourceGroupService, 'getAll');

    ResourceGroupService = {
      getAll: function () {
        return $q.resolve([]);
      },
    };

    var $modalInstance = {
      close: sinon.stub(),
    };

    vm = $controller('ExportUserStatusesController', {
      $scope: scope,
      $modalInstance: $modalInstance,
      servicesId: ['squared-fusion-cal'],
      userStatusSummary: userStatusSummary,
      Authinfo: Authinfo,
      USSService: USSService,
      UserDetails: UserDetails,
      ExcelService: ExcelService,
      ClusterService: ClusterService,
      ResourceGroupService: ResourceGroupService,
    });
    vm.statusTypes = [{
      stateType: 'notActivated',
      count: 51,
      selected: true,
    }];
  }));

  it('should have sane default on init', function () {
    vm.selectedServiceId = 'squared-fusion-cal';
    expect(vm.exportingUserStatusReport).toBe(false);
    expect(vm.progress.total).toBe(0);
    expect(vm.progress.current).toBe(0);
    expect(vm.progress.exportCanceled).toBe(false);
  });

  it('should cancel exporting when calling cancelExport()', function () {
    vm.selectedServiceId = 'squared-fusion-cal';
    vm.cancelExport();
    expect(vm.progress.exportCanceled).toBe(true);
  });

  describe('exportCSV', function () {
    it('should call USSService.getStatuses', function () {
      vm.exportCSV();
      $rootScope.$apply();
      expect(USSService.getAllStatuses.called).toBe(true);
    });
    it('should call ClusterService.getConnector if there at least one connectorId', function () {
      vm.exportCSV();
      $rootScope.$apply();
      expect(ClusterService.getConnector.called).toBe(true);
    });
    it('should call UserDetails.getUsers as much as it has to', function () {
      vm.exportCSV();
      $rootScope.$apply();
      expect(UserDetails.getUsers.callCount).toBe(2);
    });
    it('should call ExcelService.createFile and ExcelService.downloadFile', function () {
      vm.exportCSV();
      $rootScope.$apply();
      expect(ExcelService.createFile.called).toBe(true);
      expect(ExcelService.downloadFile.called).toBe(true);
    });
    it('should not actually finish export when exportCanceled is true', function () {
      vm.exportCanceled = true;
      vm.exportCSV()
        .catch(function (err) {
          expect(err).toEqual('User Status Report download canceled');
        });
      $rootScope.$apply();
    });
    it('should call set exportingUserStatusReport to false when finished', function () {
      vm.exportCSV();
      expect(vm.exportingUserStatusReport).toBe(true);
      $rootScope.$apply();
      expect(vm.exportingUserStatusReport).toBe(false);
    });
  });
});
