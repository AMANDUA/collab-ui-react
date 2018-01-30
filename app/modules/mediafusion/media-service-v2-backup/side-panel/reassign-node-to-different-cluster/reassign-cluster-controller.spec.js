'use strict';

describe('Controller: ReassignClusterControllerV2', function () {
  beforeEach(angular.mock.module('Mediafusion'));
  var connector, controller, cluster, MediaClusterServiceV2, $q, $translate, modalInstanceMock, windowMock, clusterList, httpMock, Notification, HybridServicesClusterService;
  beforeEach(inject(function ($controller, _MediaClusterServiceV2_, _Notification_, _$q_, _$translate_, _$httpBackend_, _HybridServicesClusterService_) {
    connector = {
      hostname: 'hostname',
      id: 'id',
    };
    cluster = {
      id: 'a',
      name: 'b',
      properties: {
        'mf.group.displayName': 'trichy',
      },
      assigned_property_sets: '606599c8-8e72-491f-9212-153a0877eb84', // or whatever you prefer
    };

    clusterList = [{
      id: 'a',
      name: 'name1',
      targetType: 'mf_mgmt',
    }, {
      id: 'a',
      name: 'name1',
      targetType: 'c_mgmt',
    }];

    MediaClusterServiceV2 = _MediaClusterServiceV2_;
    HybridServicesClusterService = _HybridServicesClusterService_;
    Notification = _Notification_;
    httpMock = _$httpBackend_;
    httpMock.when('GET', /^\w+.*/).respond({});
    $q = _$q_;
    $translate = _$translate_;
    modalInstanceMock = {
      close: jasmine.createSpy('close'),
    };
    windowMock = {
      open: jasmine.createSpy('open'),
    };
    spyOn(HybridServicesClusterService, 'getAll').and.returnValue($q.resolve(clusterList));

    controller = $controller('ReassignClusterControllerV2', {
      cluster: cluster,
      MediaClusterServiceV2: MediaClusterServiceV2,
      Notification: Notification,
      $q: $q,
      $translate: $translate,
      $modalInstance: modalInstanceMock,
      $window: windowMock,
      connector: connector,
    });
  }));
  it('check if ReassignClusterControllerV2 is Defined', function () {
    expect(controller).toBeDefined();
  });
  it('check if HybridServicesClusterService.moveEcpNode is called with  clusterId', function () {
    httpMock.when('POST', /^\w+.*/).respond({});
    controller.clusterDetail = {
      id: 'id',
    };
    spyOn(HybridServicesClusterService, 'moveEcpNode').and.returnValue($q.resolve({}));
    controller.reassign();
    httpMock.verifyNoOutstandingExpectation();
    expect(controller.saving).toBe(true);
    expect(HybridServicesClusterService.moveEcpNode).toHaveBeenCalled();
  });
  it('should notify error when HybridServicesClusterService.moveEcpNode call fails', function () {
    httpMock.when('POST', /^\w+.*/).respond(500, null);
    controller.clusterDetail = {
      id: 'id',
    };
    controller.selectedCluster = 'testCluster1';
    spyOn(HybridServicesClusterService, 'moveEcpNode').and.returnValue($q.reject());
    controller.reassign();
    httpMock.verifyNoOutstandingExpectation();
    expect(HybridServicesClusterService.moveEcpNode).toHaveBeenCalled();
    expect(controller.error).toBe('mediaFusion.reassign.reassignErrorMessage');
  });
  it('check if HybridServicesClusterService.preregisterCluster is called with  clusterId', function () {
    httpMock.when('POST', /^\w+.*/).respond({});
    controller.clusterDetail = null;
    controller.selectModel = {
      '10.196.5.251': 'MFA_TEST3',
      '10.196.5.246': 'MFA_TEST4',
    };
    controller.clusters = [{
      id: 'a050fcc7-9ade-4790-a06d-cca596910421',
      name: 'MFA_TEST2',
    }];
    spyOn(HybridServicesClusterService, 'preregisterCluster').and.returnValue($q.resolve({}));
    controller.reassign();
    httpMock.verifyNoOutstandingExpectation();
    expect(controller.saving).toBe(true);
    expect(HybridServicesClusterService.preregisterCluster).toHaveBeenCalled();
  });
  it('should notify error when preregisterCluster call fails', function () {
    httpMock.when('POST', /^\w+.*/).respond(500, null);
    controller.clusterDetail = null;
    spyOn(Notification, 'error');
    spyOn(HybridServicesClusterService, 'preregisterCluster').and.returnValue($q.reject());
    controller.reassign();
    httpMock.verifyNoOutstandingExpectation();
    expect(Notification.error).toHaveBeenCalled();
  });
  it('check if mf_mgmt is filtered into options', function () {
    httpMock.verifyNoOutstandingExpectation();
    expect(controller.options.length).toBe(1);
  });
  it('canContinue should enable continue button when the field is filled', function () {
    controller.selectedCluster = 'testCluster1';
    controller.selectPlaceholder = 'testCluster2';
    controller.canContinue();
    expect(controller.canContinue()).toBeTruthy();
  });
  it('canContinue should disable continue button when the field is empty', function () {
    controller.selectedCluster = '';
    controller.selectPlaceholder = 'testCluster2';
    controller.canContinue();
    expect(controller.canContinue()).toBeFalsy();
  });
});
