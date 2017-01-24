'use strict';

describe('Directive Controller: HybridServicesCtrl', function () {
  beforeEach(angular.mock.module('Hercules'));

  var vm, $rootScope, $controller, $timeout, $q, Authinfo, Config, USSService, ServiceDescriptor, Userservice, CloudConnectorService, FeatureToggleService;

  beforeEach(inject(function (_$rootScope_, _$controller_, _$timeout_, _Config_, _USSService_, _ServiceDescriptor_, _$q_, _Userservice_, _CloudConnectorService_, _FeatureToggleService_) {
    $rootScope = _$rootScope_;
    $controller = _$controller_;
    $timeout = _$timeout_;
    Config = _Config_;
    USSService = _USSService_;
    ServiceDescriptor = _ServiceDescriptor_;
    $q = _$q_;
    Userservice = _Userservice_;
    CloudConnectorService = _CloudConnectorService_;
    FeatureToggleService = _FeatureToggleService_;

    Authinfo = {
      getOrgId: sinon.stub().returns('dead-beef-123'),
      isEntitled: sinon.stub().returns(true),
      isFusion: sinon.stub().returns(true),
      getLicenses: sinon.stub().returns([])
    };

    sinon.stub(ServiceDescriptor, 'services').returns({});
    sinon.stub(Userservice, 'isInvitePending').returns(false);
    sinon.stub(CloudConnectorService, 'getService').returns($q.resolve({ setup: false }));
    sinon.stub(FeatureToggleService, 'supports').returns($q.resolve(false));

  }));

  it('should start with isEnabled as false', function () {
    vm = createController({});
    expect(vm.isEnabled).toBe(false);
  });

  it('should call ServiceDescriptor.services if the org has no license', function () {
    vm = createController({});
    $rootScope.$digest();
    expect(ServiceDescriptor.services.called).toBe(true);
  });

  it('should call ServiceDescriptor.services if the org has a license and the user too', function () {
    vm = createController({
      licenseID: ['MC_f36c1a2c-20d6-460d-9f55-01fc85d52e04_100_t30citest.webex.com']
    }, ['MC']);
    $rootScope.$digest();
    expect(ServiceDescriptor.services.called).toBe(true);
  });

  it('should NOT call ServiceDescriptor.services if the org has a license and but NOT the user', function () {
    vm = createController({}, ['MC']);
    $rootScope.$digest();
    expect(ServiceDescriptor.services.called).toBe(false);
  });

  it('should show aggregated status as error when Aware and Connects is entitled and Aware is activated but Connect is error', function () {
    vm = createController({}, ['MC']);

    var fusionUcNotActivated = {
      "serviceId": "squared-fusion-uc",
      "entitled": true,
      "state": "notActivated"
    };

    vm.extensions = [{
      "id": "squared-fusion-cal",
      "entitled": false,
      "enabled": true
    }, {
      "id": "squared-fusion-uc",
      "entitled": true,
      "enabled": true,
      "status": fusionUcNotActivated
    }, {
      "id": "squared-fusion-ec",
      "entitled": true,
      "enabled": true,
      "status": {
        "serviceId": "squared-fusion-ec",
        "entitled": true,
        "state": "error"
      }
    }];
    var mostSignificantStatus = vm.getStatus(fusionUcNotActivated);

    $rootScope.$digest();
    expect(mostSignificantStatus).toBe('error');
  });

  it('should show aggregated status as not activated when Aware and Connects is entitled but both statuses are not activated', function () {
    vm = createController({}, ['MC']);

    var fusionUcNotActivated = {
      "serviceId": "squared-fusion-uc",
      "entitled": true,
      "state": "notActivated"
    };

    vm.extensions = [{
      "id": "squared-fusion-cal",
      "entitled": false,
      "enabled": true
    }, {
      "id": "squared-fusion-uc",
      "entitled": true,
      "enabled": true,
      "status": fusionUcNotActivated
    }, {
      "id": "squared-fusion-ec",
      "entitled": true,
      "enabled": true,
      "status": {
        "serviceId": "squared-fusion-ec",
        "entitled": true,
        "state": "notActivated"
      }
    }];
    var mostSignificantStatus = vm.getStatus(fusionUcNotActivated);

    $rootScope.$digest();
    expect(mostSignificantStatus).toBe('pending_activation');
  });

  it('should show aggregated status as unknown when both Aware and Connects not entitled for user', function () {
    vm = createController({}, ['MC']);

    vm.extensions = [{
      "id": "squared-fusion-cal",
      "entitled": false,
      "enabled": true
    }, {
      "id": "squared-fusion-uc",
      "entitled": false,
      "enabled": true
    }, {
      "id": "squared-fusion-ec",
      "entitled": false,
      "enabled": true
    }];
    var mostSignificantStatus = vm.getStatus(undefined);

    $rootScope.$digest();
    expect(mostSignificantStatus).toBe('unknown');
  });

  function createController(user, orgLicenses) {
    if (orgLicenses) {
      Authinfo.getLicenses.returns(orgLicenses);
    }
    return $controller('HybridServicesCtrl', {
      $scope: $rootScope.$new(),
      $timeout: $timeout,
      Authinfo: Authinfo,
      Config: Config,
      USSService: USSService,
      ServiceDescriptor: ServiceDescriptor
    }, {
      user: user
    });
  }
});
