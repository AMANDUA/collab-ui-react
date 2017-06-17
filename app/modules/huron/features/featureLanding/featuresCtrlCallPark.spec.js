'use strict';

describe('Features Controller', function () {
  var featureCtrl, $rootScope, $scope, $modal, $q, $state, $filter, $timeout, Authinfo, HuntGroupService, PhoneNumberService, Log, Notification, getDeferred, AutoAttendantCeInfoModelService, AAModelService, FeatureToggleService, CallParkService, CallPickupGroupService, PagingGroupService;
  var listOfCPs = getJSONFixture('huron/json/features/callPark/cpList.json');
  var emptyListOfCPs = {
    callparks: [],
  };
  var getCPListSuccessResp = function (data) {
    return data;
  };
  var getCPListFailureResp = {
    data: 'Internal Server Error',
    status: 500,
    statusText: 'Internal Server Error',
  };
  var callParks = {
    callparks: [{
      id: 'bbcd1234-abcd-abcd-abcddef123456',
      cardName: 'Marketing',
      startRange: '5010',
      endRange: '5012',
      memberCount: 3,
      featureName: 'huronFeatureDetails.cp',
      filterValue: 'CP',
    }, {
      id: 'abcd1234-abcd-abcd-abcddef123456',
      cardName: 'Technical Support',
      startRange: '5010',
      endRange: '5010',
      memberCount: 2,
      featureName: 'huronFeatureDetails.cp',
      filterValue: 'CP',
    }],
  };

  var singlePark = {
    callparks: [{
      uuid: 'abcd1234-abcd-abcd-abcddef123456',
      name: 'Technical Support',
      startRange: '5010',
      endRange: '5010',
      memberCount: 2,
    }],
  };

  var $event = {
    preventDefault: function () {},
    stopImmediatePropagation: function () {},
  };


  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$rootScope_, $controller, _$q_, _$modal_, _$state_, _$filter_, _$timeout_, _Authinfo_, _HuntGroupService_, _PagingGroupService_, _CallPickupGroupService_, _PhoneNumberService_, _AutoAttendantCeInfoModelService_, _AAModelService_, _Log_, _Notification_, _FeatureToggleService_, _CallParkService_) {
    $rootScope = _$rootScope_;
    $scope = _$rootScope_.$new();
    $modal = _$modal_;
    $state = _$state_;
    $filter = _$filter_;
    $timeout = _$timeout_;
    $q = _$q_;
    Authinfo = _Authinfo_;
    HuntGroupService = _HuntGroupService_;
    PagingGroupService = _PagingGroupService_;
    CallPickupGroupService = _CallPickupGroupService_;
    CallParkService = _CallParkService_;
    PhoneNumberService = _PhoneNumberService_;
    AutoAttendantCeInfoModelService = _AutoAttendantCeInfoModelService_;
    AAModelService = _AAModelService_;
    Log = _Log_;
    Notification = _Notification_;
    FeatureToggleService = _FeatureToggleService_;

    //create mock deferred object which will be used to return promises
    getDeferred = $q.defer();

    //Using a Jasmine Spy to return a promise when methods of the HuntGroupService are called
    spyOn(HuntGroupService, 'getHuntGroupList').and.returnValue($q.resolve([]));
    spyOn(CallParkService, 'getCallParkList').and.returnValue(getDeferred.promise);
    spyOn(AutoAttendantCeInfoModelService, 'getCeInfosList').and.returnValue($q.resolve([]));
    spyOn(PagingGroupService, 'getListOfPagingGroups').and.returnValue($q.resolve());
    spyOn(CallPickupGroupService, 'getListOfPickupGroups').and.returnValue($q.resolve());
    spyOn(AAModelService, 'newAAModel').and.returnValue(getDeferred.promise);
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(true));
    spyOn($state, 'go');
    spyOn(Notification, 'success');
    spyOn(Notification, 'errorResponse');

    featureCtrl = $controller('HuronFeaturesCtrl', {
      $scope: $scope,
      $modal: $modal,
      $state: $state,
      $filter: $filter,
      $timeout: $timeout,
      Authinfo: Authinfo,
      CallParkService: CallParkService,
      PhoneNumberService: PhoneNumberService,
      Log: Log,
      Notification: Notification,
    });
  }));

  //TODO: re-enable after feature toggles are removed
  it('should get list of callParks and then store the data in listOfFeatures', function () {
    getDeferred.resolve(getCPListSuccessResp(listOfCPs.callparks));
    $scope.$apply();
    $timeout.flush();
    expect(featureCtrl.listOfFeatures).toEqual(callParks.callparks);
  });
  it('should get list of callParks and if there is any data, should change the pageState to showFeatures', function () {
    getDeferred.resolve(getCPListSuccessResp(listOfCPs.callparks));
    $scope.$apply();
    $timeout.flush();
    expect(featureCtrl.pageState).toEqual('showFeatures');
  });
  it('should get list of callParks and if data received is empty, should change the pageState to newFeature', function () {
    getDeferred.resolve(getCPListSuccessResp(emptyListOfCPs.callparks));
    $scope.$apply();
    $timeout.flush();
    expect(featureCtrl.pageState).toEqual('NewFeature');
  });
  it('should get list of callParks and if back end call fails should show error notification', function () {
    getDeferred.reject(getCPListFailureResp);
    $scope.$apply();
    $timeout.flush();
    expect(Notification.errorResponse).toHaveBeenCalledWith(getCPListFailureResp,
      'huronFeatureDetails.failedToLoad', {
        featureType: 'huronFeatureDetails.cpName',
      });
  });
  it('should set the pageState to Loading when controller is getting data from back-end', function () {
    $timeout.flush();
    expect(featureCtrl.pageState).toEqual('Loading');
    getDeferred.resolve(getCPListSuccessResp(listOfCPs.callparks));
    $scope.$apply();
    $timeout.flush();
    expect(featureCtrl.pageState).toEqual('showFeatures');
  });
  it('should set the pageState to Reload when controller fails to load the data for all features from back-end', function () {
    $timeout.flush();
    expect(featureCtrl.pageState).toEqual('Loading');
    getDeferred.reject(getCPListFailureResp);
    $scope.$apply();
    $timeout.flush();
    expect(featureCtrl.pageState).toEqual('Reload');
  });
  it('should be able call delete a callPark function and call the $state service', function () {
    getDeferred.resolve(getCPListSuccessResp(emptyListOfCPs.callparks));
    $scope.$apply();
    $timeout.flush();
    featureCtrl.deleteHuronFeature(callParks.callparks[0], $event);
    expect($state.go).toHaveBeenCalledWith('huronfeatures.deleteFeature', {
      deleteFeatureName: callParks.callparks[0].cardName,
      deleteFeatureId: callParks.callparks[0].id,
      deleteFeatureType: 'CP',
    });
  });
  it('should receive the HURON_FEATURE_DELETED event when a callPark gets deleted', function () {
    $rootScope.$broadcast('HURON_FEATURE_DELETED', {
      deleteFeatureName: callParks.callparks[0].cardName,
      deleteFeatureId: callParks.callparks[0].id,
      deleteFeatureType: 'CP',
    });
    expect(featureCtrl.listOfFeatures).not.toEqual(jasmine.arrayContaining([callParks.callparks[0]]));
  });
  it('should receive the HURON_FEATURE_DELETED event and set pageState to newFeature if they are no features to show', function () {
    $timeout.flush();
    featureCtrl.listOfFeatures = [];
    expect(featureCtrl.pageState).toEqual('Loading');
    getDeferred.resolve(getCPListSuccessResp(singlePark.callparks));
    $scope.$apply();
    $timeout.flush();
    expect(featureCtrl.pageState).toEqual('showFeatures');
    $rootScope.$broadcast('HURON_FEATURE_DELETED', {
      deleteFeatureName: callParks.callparks[0].cardName,
      deleteFeatureId: callParks.callparks[0].id,
      deleteFeatureType: 'CP',
    });
    expect(featureCtrl.listOfFeatures).not.toEqual(jasmine.arrayContaining([callParks.callparks[0]]));
    expect(featureCtrl.pageState).toEqual('NewFeature');
  });
  it('should set the view to callParks when CP filter is selected', function () {
    getDeferred.resolve(getCPListSuccessResp(listOfCPs.callparks));
    $scope.$apply();
    $timeout.flush();
    featureCtrl.setFilter('CP');
    expect(featureCtrl.listOfFeatures).toEqual(jasmine.arrayContaining(callParks.callparks));
  });
  it('should take search query and display the results according to search query', function () {
    getDeferred.resolve(getCPListSuccessResp(listOfCPs.callparks));
    $scope.$apply();
    $timeout.flush();
    featureCtrl.searchData(callParks.callparks[0].cardName);
    expect(featureCtrl.listOfFeatures).toEqual([callParks.callparks[0]]);
  });
});
