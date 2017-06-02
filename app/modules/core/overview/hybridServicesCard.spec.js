describe('OverviewHybridServicesCard', function () {
  var OverviewHybridServicesCard, $rootScope, Authinfo, FeatureToggleService, HybridServicesClusterService, $q, CloudConnectorService;

  afterEach(function () {
    OverviewHybridServicesCard = $rootScope = Authinfo = FeatureToggleService = HybridServicesClusterService = $q = undefined;
  });

  beforeEach(angular.mock.module('Hercules'));
  beforeEach(angular.mock.module('Squared'));
  beforeEach(angular.mock.module('Core'));

  function dependencies(_Authinfo_, _FeatureToggleService_, _OverviewHybridServicesCard_, _$rootScope_, _HybridServicesClusterService_, _$q_, _CloudConnectorService_) {
    OverviewHybridServicesCard = _OverviewHybridServicesCard_;
    $q = _$q_;
    $rootScope = _$rootScope_;
    Authinfo = _Authinfo_;
    FeatureToggleService = _FeatureToggleService_;
    HybridServicesClusterService = _HybridServicesClusterService_;
    CloudConnectorService = _CloudConnectorService_;
  }

  function initSpies() {
    spyOn(HybridServicesClusterService, 'getAll');
    spyOn(Authinfo, 'isEntitled').and.returnValue(true);
    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve(true));
    spyOn(CloudConnectorService, 'getService').and.returnValue($q.resolve({ serviceId: 'squared-fusion-gcal', setup: false, statusCss: 'default' }));
  }

  beforeEach(inject(dependencies));
  beforeEach(inject(initSpies));

  it('should not show card when no services are set up', function () {
    var clustersWithNothingInstalled = getJSONFixture('hercules/nothing-provisioned-cluster-list.json');
    HybridServicesClusterService.getAll.and.returnValue($q.resolve(clustersWithNothingInstalled));
    var card = OverviewHybridServicesCard.createCard();
    $rootScope.$apply();

    expect(card.enabled).toBe(false);
  });

  it('should not show a service that is not set up', function () {
    var clustersWithNoServices = getJSONFixture('hercules/nothing-provisioned-cluster-list.json');
    HybridServicesClusterService.getAll.and.returnValue($q.resolve(clustersWithNoServices));
    var card = OverviewHybridServicesCard.createCard();
    $rootScope.$apply();

    expect(card.serviceList[0].setup).toBe(false);
    expect(card.serviceList[1].setup).toBe(false);
    expect(card.serviceList[2].setup).toBe(false);
    expect(card.serviceList[3].setup).toBe(false);

  });

  it('should show the card when services are set up', function () {
    spyOn(HybridServicesClusterService, 'getStatusForService');
    HybridServicesClusterService.getStatusForService.and.returnValue({
      serviceId: '',
      setup: true,
      status: 'operational',
    });
    var clustersWithManyServices = getJSONFixture('hercules/disco-systems-cluster-list.json');
    HybridServicesClusterService.getAll.and.returnValue($q.resolve(clustersWithManyServices));

    var card = OverviewHybridServicesCard.createCard();
    $rootScope.$apply();

    expect(card.enabled).toBe(true);
  });

  it('should not show Call if it is not set up, but still show Calendar', function () {
    spyOn(HybridServicesClusterService, 'getStatusForService').and.callFake(function (serviceId) {
      return {
        serviceId: serviceId,
        setup: serviceId === 'squared-fusion-cal',
        status: 'operational',
      };
    });
    var clustersWithManyServices = getJSONFixture('hercules/disco-systems-cluster-list.json');
    HybridServicesClusterService.getAll.and.returnValue($q.resolve(clustersWithManyServices));

    var card = OverviewHybridServicesCard.createCard();
    $rootScope.$apply();

    expect(card.serviceList[0].setup).toBe(false);
    expect(card.serviceList[1].setup).toBe(true);
    expect(card.serviceList[2].setup).toBe(false);
  });

  it('should show card when google calendar is setup', function () {
    var clustersWithNothingInstalled = getJSONFixture('hercules/nothing-provisioned-cluster-list.json');
    HybridServicesClusterService.getAll.and.returnValue($q.resolve(clustersWithNothingInstalled));
    CloudConnectorService.getService.and.returnValue($q.resolve({ serviceId: 'squared-fusion-gcal', setup: true, statusCss: 'success' }));
    var card = OverviewHybridServicesCard.createCard();
    $rootScope.$apply();

    expect(card.enabled).toBe(true);
    expect(card.serviceList[0].setup).toBe(true);
  });
});
