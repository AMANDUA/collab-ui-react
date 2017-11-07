'use strict';

describe('Care Feature Delete Ctrl', function () {
  var controller, $rootScope, $q, $scope, $stateParams, $timeout, $translate, CareFeatureList, CvaService, Log, Notification, Authinfo, EvaService;
  var deferred, cvaDeferred, evaDeferred;

  var spiedAuthinfo = {
    getOrgId: jasmine.createSpy('getOrgId').and.returnValue('1'),
  };
  var successResponse = {
    status: 200,
    statusText: 'OK',
  };
  var failureResponse = {
    data: 'Internal Server Error',
    status: 500,
    statusText: 'Internal Server Error',
  };

  beforeEach(angular.mock.module('Sunlight'));
  beforeEach(angular.mock.module(function ($provide) {
    $provide.value('Authinfo', spiedAuthinfo);
  }));

  beforeEach(inject(function (_$rootScope_, $controller, _$stateParams_, _$timeout_, _$translate_, _$q_, _Authinfo_, _CareFeatureList_, _CvaService_, _EvaService_, _Notification_, _Log_) {
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $q = _$q_;
    $stateParams = _$stateParams_;
    $translate = _$translate_;
    $timeout = _$timeout_;
    CareFeatureList = _CareFeatureList_;
    CvaService = _CvaService_;
    Notification = _Notification_;
    Log = _Log_;
    controller = $controller;
    Authinfo = _Authinfo_;
    EvaService = _EvaService_;

    deferred = $q.defer();
    cvaDeferred = $q.defer();
    evaDeferred = $q.defer();
    spyOn(CareFeatureList, 'deleteTemplate').and.returnValue(deferred.promise);
    spyOn(CvaService, 'deleteConfig').and.returnValue(cvaDeferred.promise);
    spyOn(EvaService, 'deleteExpertAssistant').and.returnValue(evaDeferred.promise);
    spyOn(Notification, 'success');
    spyOn(Notification, 'error');
    spyOn(Notification, 'errorWithTrackingId');
    spyOn($rootScope, '$broadcast').and.callThrough();
  }));

  afterEach(function () {
    controller = $rootScope = $q = $scope = $stateParams = $timeout = $translate = CareFeatureList = CvaService = Log = Notification = Authinfo = EvaService = deferred = cvaDeferred = evaDeferred = undefined;
  });

  $stateParams = {
    deleteFeatureId: 123,
    deleteFeatureName: 'Sunlight Dev Template',
    deleteFeatureType: 'Ch',
  };

  var cvaStateParams = {
    deleteFeatureId: 123,
    deleteFeatureName: 'Customer Virtual Assistant Dev Config',
    deleteFeatureType: 'customerVirtualAssistant',
  };

  var evaStateParams = {
    deleteFeatureId: 123,
    deleteFeatureName: 'Expert Virtual Assistant Dev Config',
    deleteFeatureType: 'expertVirtualAssistant',
  };

  function callController(_stateParams) {
    controller = controller('CareFeaturesDeleteCtrl', {
      $rootScope: $rootScope,
      $scope: $scope,
      $stateParams: _stateParams,
      $timeout: $timeout,
      $translate: $translate,
      Authinfo: Authinfo,
      CareFeatureList: CareFeatureList,
      Log: Log,
      Notification: Notification,
    });
  }

  it('should delete chat template successfully', function () {
    callController($stateParams);
    controller.deleteFeature();
    deferred.resolve(successResponse);
    $scope.$apply();
    $timeout.flush();
    expect($rootScope.$broadcast).toHaveBeenCalledWith('CARE_FEATURE_DELETED');
    expect(Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
      featureName: $stateParams.deleteFeatureName,
    });
  });

  it('should fail at deleting chat template', function () {
    callController($stateParams);
    controller.deleteFeature();
    deferred.reject(failureResponse);
    $scope.$apply();
    $timeout.flush();
    expect(Notification.errorWithTrackingId).toHaveBeenCalledWith(failureResponse, jasmine.any(String), {
      featureName: $stateParams.deleteFeatureName,
    });
  });

  it('should delete CVA config successfully', function () {
    callController(cvaStateParams);
    controller.deleteFeature();
    cvaDeferred.resolve(successResponse);
    $scope.$apply();
    $timeout.flush();
    expect($rootScope.$broadcast).toHaveBeenCalledWith('CARE_FEATURE_DELETED');
    expect(Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
      featureName: cvaStateParams.deleteFeatureName,
    });
  });

  it('should fail at deleting CVA config', function () {
    callController(cvaStateParams);
    controller.deleteFeature();
    cvaDeferred.reject(failureResponse);
    $scope.$apply();
    $timeout.flush();
    expect(Notification.errorWithTrackingId).toHaveBeenCalledWith(failureResponse, jasmine.any(String), {
      featureName: cvaStateParams.deleteFeatureName,
    });
  });

  it('should delete EVA config successfully', function () {
    callController(evaStateParams);
    controller.deleteFeature();
    evaDeferred.resolve(successResponse);
    $scope.$apply();
    $timeout.flush();
    expect($rootScope.$broadcast).toHaveBeenCalledWith('CARE_FEATURE_DELETED');
    expect(Notification.success).toHaveBeenCalledWith(jasmine.any(String), {
      featureName: evaStateParams.deleteFeatureName,
    });
  });

  it('should fail at deleting EVA config', function () {
    callController(evaStateParams);
    controller.deleteFeature();
    evaDeferred.reject(failureResponse);
    $scope.$apply();
    $timeout.flush();
    expect(Notification.errorWithTrackingId).toHaveBeenCalledWith(failureResponse, jasmine.any(String), {
      featureName: evaStateParams.deleteFeatureName,
    });
  });
});
