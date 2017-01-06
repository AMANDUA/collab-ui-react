describe('OverviewCareCard', function () {

  var OverviewCareCard, $rootScope;
  var dummyStats = getJSONFixture('sunlight/json/features/careReport/sunlightReportStats.json');

  afterEach(function () {
    OverviewCareCard = $rootScope = undefined;
  });

  afterAll(function () {
    dummyStats = undefined;
  });

  beforeEach(angular.mock.module('Core'));

  function dependencies(_OverviewCareCard_, _$rootScope_) {
    OverviewCareCard = _OverviewCareCard_;
    $rootScope = _$rootScope_;
  }

  beforeEach(inject(dependencies));

  it('should create disabled care card', function () {
    var card = OverviewCareCard.createCard();
    $rootScope.$apply();
    expect(card.enabled).toBe(false);
    expect(card.showHealth).toBe(true);
    expect(card.trial).toBe(false);
    expect(card.name).toEqual('overview.cards.care.title');
  });

  it('should set incomingChatTasksCount when handler is called', function () {
    var card = OverviewCareCard.createCard();
    $rootScope.$apply();
    card.reportDataEventHandler({ name: 'incomingChatTasksLoaded' }, dummyStats.overviewStats);
    expect(card.current).toBe(dummyStats.overviewStats.data.values[0].count);
    expect(card.previous).toBe(dummyStats.overviewStats.data.values[1].count);
  });

  it('should mark health status to warning', function () {
    var card = OverviewCareCard.createCard();
    $rootScope.$apply();
    expect(card.showHealth).toBe(true);
    var data = {
      components: [{
        id: card.helper.statusIds.SPARK_CARE,
        status: 'partial_outage'
      }]
    };
    card.healthStatusUpdatedHandler(data);
    expect(card.healthStatus).toEqual('warning');
  });

  it('should create enabled care card with trial disabled', function () {
    var card = OverviewCareCard.createCard();
    $rootScope.$apply();
    card.licenseEventHandler([
      {
        licenseId: "CDC_ff9406ba-c9e1-4def-b4e3-e33fdcadea32",
        offerName: "CDC",
        licenseType: "CARE",
        volume: 50,
        isTrial: false,
        trialId: "a8ef58a7-8c5d-4674-93e4-08d2b36f4f95",
        status: "ACTIVE",
        partnerEmail: "admin@fancy-lawyer.com"
      }
    ]);
    expect(card.enabled).toBe(true);
    expect(card.trial).toBe(false);
    expect(card.showHealth).toBe(true);
  });

  it('should create enabled care card with trial enabled', function () {
    var card = OverviewCareCard.createCard();
    $rootScope.$apply();
    card.licenseEventHandler([
      {
        licenseId: "CDC_ff9406ba-c9e1-4def-b4e3-e33fdcadea32",
        offerName: "CDC",
        licenseType: "CARE",
        volume: 50,
        isTrial: true,
        trialId: "a8ef58a7-8c5d-4674-93e4-08d2b36f4f95",
        status: "ACTIVE",
        partnerEmail: "admin@fancy-lawyer.com"
      }
    ]);
    expect(card.enabled).toBe(true);
    expect(card.trial).toBe(true);
    expect(card.showHealth).toBe(true);
  });

  it('should create enabled care card if org is test org', function () {
    var card = OverviewCareCard.createCard();
    $rootScope.$apply();
    card.licenseEventHandler([]);
    card.orgEventHandler({
      id: "b1de2d84-c9b1-485b-9698-b35e95c6107f",
      displayName: "Sunlight",
      isTestOrg: true,
      licenses: [],
      success: true
    });
    expect(card.enabled).toBe(true);
    expect(card.trial).toBe(false);
    expect(card.showHealth).toBe(true);
  });
});
