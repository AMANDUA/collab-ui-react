import moduleName from './index';

describe('HybridServicesUserSidepanelSectionComponent', () => {

  let $componentController, $q, $scope, CloudConnectorService, FeatureToggleService, ServiceDescriptorService, $timeout, Notification, USSService;

  const defaultUser = {
    name: 'Julius Caesar',
    entitlements: [],
    licenseID: ['something', 'and', 'more things'],
  };

  beforeEach(angular.mock.module(moduleName));
  afterEach(cleanup);

  function cleanup() {
    $componentController = $q = $scope = CloudConnectorService = FeatureToggleService = ServiceDescriptorService = $timeout = Notification = USSService = undefined;
  }

  function initController(user?) {
    const ctrl = $componentController('hybridServicesUserSidepanelSection', {}, {
      user: user || defaultUser,
    });
    ctrl.$onChanges({
      user: {
        previousValue: undefined,
        currentValue: user || defaultUser,
        isFirstChange() {
          return true;
        },
      },
    });
    $scope.$apply();
    return ctrl;
  }

  describe('premises-based hybrid services', () => {

    beforeEach(angular.mock.module(mockDependencies));

    function mockDependencies($provide) {
      const Authinfo = {
        getLicenses: jasmine.createSpy('getLicenses').and.returnValue(['license1', 'license2']),
        isEntitled: jasmine.createSpy('isEntitled').and.callFake(service => (service === 'squared-fusion-cal' || service === 'squared-fusion-uc' || service === 'spark-hybrid-impinterop')),
        getOrgId: jasmine.createSpy('getOrgId').and.returnValue('12'),
      };
      $provide.value('Authinfo', Authinfo);
    }

    beforeEach(inject(dependencies));
    beforeEach(initSpies);

    function dependencies (_$componentController_, _$q_, $rootScope, _FeatureToggleService_, _ServiceDescriptorService_) {
      $componentController = _$componentController_;
      $q = _$q_;
      $scope = $rootScope.$new();
      FeatureToggleService = _FeatureToggleService_;
      ServiceDescriptorService = _ServiceDescriptorService_;
    }

    function initSpies() {
      spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve({}));
      spyOn(ServiceDescriptorService, 'getServices').and.returnValue($q.resolve([{
        id: 'squared-fusion-uc',
        enabled: true,
      }, {
        id: 'squared-fusion-cal',
        enabled: false,
      }, {
        id: 'spark-hybrid-impinterop',
        enabled: true,
      }]));
    }

    it('should not show the section if there are no licenses assigned to the user', () => {
      const unlicensedUser = {
        licenseID: [],
      };
      const controller = initController(unlicensedUser);
      expect(controller.isLicensed).toBe(false);
    });

    it('should show the section if there is at least one paid license assigned to the user', () => {
      const licensedUser = {
        licenseID: ['This is a paid license'],
      };
      const controller = initController(licensedUser);
      expect(controller.isLicensed).toBe(true);
    });

    it('should only take into account the hybrid services an org is entitled to in CI', () => {
      const controller = initController();
      expect(controller.allServicesinOrg.length).toBe(3);
    });

    it('should amend the services list with setup data from FMS', () => {
      const controller = initController();
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'squared-fusion-cal').isSetup).toBe(false);
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'squared-fusion-uc').isSetup).toBe(true);
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'spark-hybrid-impinterop').isSetup).toBe(true);

    });

    it('should hide Hybrid Call if the user is entitled to Huron', () => {
      const huronUser = {
        name: 'Caligula',
        entitlements: ['ciscouc'],
        licenseID: ['ciscouc'],
      };
      const controller = initController(huronUser);
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'squared-fusion-uc').enabled).toBe(false);

    });
  });

  describe('cloud-based hybrid services', () => {

    beforeEach(angular.mock.module(mockDependencies));

    function mockDependencies($provide) {
      const Authinfo = {
        getLicenses: jasmine.createSpy('getLicenses').and.returnValue(['license1', 'license2']),
        isEntitled: jasmine.createSpy('isEntitled').and.callFake((service) => {
          return (service === 'squared-fusion-gcal' || service === 'squared-fusion-cal');
        }),
        getOrgId: jasmine.createSpy('getOrgId').and.returnValue('12'),
      };
      $provide.value('Authinfo', Authinfo);
    }

    beforeEach(inject(dependencies));
    beforeEach(initSpies);

    function dependencies (_$componentController_, _$q_, $rootScope, _CloudConnectorService_, _FeatureToggleService_, _ServiceDescriptorService_) {
      $componentController = _$componentController_;
      $q = _$q_;
      $scope = $rootScope.$new();
      CloudConnectorService = _CloudConnectorService_;
      FeatureToggleService = _FeatureToggleService_;
      ServiceDescriptorService = _ServiceDescriptorService_;
    }

    function initSpies() {
      spyOn(CloudConnectorService, 'getService').and.returnValue($q.resolve({
        setup: true,
      }));
      spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve({}));
      spyOn(ServiceDescriptorService, 'getServices').and.returnValue($q.resolve([{
        id: 'squared-fusion-gcal',
        enabled: true,
      }, {
        id: 'squared-fusion-cal',
        enabled: true,
      }]));
    }

    it('should check status with CloudConnectorService if the org is entitled to Google Calendar ', () => {
      initController();
      expect(CloudConnectorService.getService.calls.count()).toBe(1);

    });

    it('should overwrite the Exchange-based status to enabled=false if Google Calendar also is enabled, so that we only show Calendar once in the template ', () => {

      const userWithBothEntitlements = {
        entitlements: ['squared-fusion-gcal'],
        licenseID: ['something', 'and', 'more things'],
      };

      const controller = initController(userWithBothEntitlements);
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'squared-fusion-gcal').enabled).toBe(true);
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'squared-fusion-cal').enabled).toBe(false);
    });

  });

  describe('USS and callback usage', () => {

    beforeEach(angular.mock.module(mockDependencies));

    function mockDependencies($provide) {
      const Authinfo = {
        getLicenses: jasmine.createSpy('getLicenses').and.returnValue(['license1', 'license2']),
        isEntitled: jasmine.createSpy('isEntitled').and.callFake(service => (service === 'squared-fusion-uc' || service === 'spark-hybrid-impinterop')),
        getOrgId: jasmine.createSpy('getOrgId').and.returnValue('12'),
      };
      $provide.value('Authinfo', Authinfo);
    }

    beforeEach(inject(dependencies));
    beforeEach(initSpies);

    function dependencies (_$componentController_, _$q_, $rootScope, _$timeout_, _FeatureToggleService_, _Notification_, _ServiceDescriptorService_, _USSService_) {
      $componentController = _$componentController_;
      $q = _$q_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
      FeatureToggleService = _FeatureToggleService_;
      Notification = _Notification_;
      ServiceDescriptorService = _ServiceDescriptorService_;
      USSService = _USSService_;
    }

    function initSpies() {
      spyOn($timeout, 'cancel').and.callThrough();
      spyOn(USSService, 'getStatusesForUser');
      spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve({}));
      spyOn(Notification, 'errorWithTrackingId');
      spyOn(ServiceDescriptorService, 'getServices').and.returnValue($q.resolve([{
        id: 'squared-fusion-uc',
        enabled: true,
      }]));
    }

    it('should call USS with the correct userId', () => {
      USSService.getStatusesForUser.and.returnValue($q.resolve({}));
      const userId = '12345';
      const user = {
        id: userId,
        name: 'Marcus Aurelius',
        entitlements: ['squared-fusion-uc'],
        licenseID: ['something', 'and', 'more things'],
      };
      initController(user);
      expect(USSService.getStatusesForUser).toHaveBeenCalledWith(userId);
    });

    it('should use USS data to populate services statuses for the user', () => {
      USSService.getStatusesForUser.and.returnValue($q.resolve([{
        serviceId: 'squared-fusion-uc',
        state: 'activated',
      }, {
        serviceId: 'spark-hybrid-impinterop',
        state: 'notActivated',
      }]));
      const user = {
        id: 'something',
        name: 'Nero',
        entitlements: ['squared-fusion-uc', 'spark-hybrid-impinterop'],
        licenseID: ['something', 'and', 'more things'],
      };
      const controller = initController(user);
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'squared-fusion-uc').status.state).toEqual('activated');
      expect(_.find(controller.allServicesinOrg, (service: any) => service.id === 'spark-hybrid-impinterop').status.state).toEqual('notActivated');
    });

    it('should start subscribing to recurring updates, and call USS once for every $timeout cycle', () => {
      USSService.getStatusesForUser.and.returnValue($q.resolve({}));
      const user = {
        name: 'Claudius',
        licenseID: ['something', 'and', 'more things'],
      };
      const controller = initController(user);
      expect(controller.userSubscriptionTimer).toBeDefined();
      expect(USSService.getStatusesForUser.calls.count()).toBe(1);
      $timeout.flush();
      expect(USSService.getStatusesForUser.calls.count()).toBe(2);
      $timeout.flush();
      expect(USSService.getStatusesForUser.calls.count()).toBe(3);
    });

    it('should cancel the USS subscription on destroy, and make sure that no notification is displayed', () => {
      USSService.getStatusesForUser.and.returnValue($q.resolve({}));
      const user = {
        name: 'Claudius',
        licenseID: ['something', 'and', 'more things'],
      };
      const controller = initController(user);
      expect(controller.userSubscriptionTimer).toBeDefined();
      controller.$onDestroy();
      expect($timeout.cancel).toHaveBeenCalledTimes(1);
      expect($timeout.cancel).toHaveBeenCalledWith(controller.userSubscriptionTimer);
      expect(Notification.errorWithTrackingId).not.toHaveBeenCalled();
    });

    it('should reload user data when something has changed in a child component', () => {
      USSService.getStatusesForUser.and.returnValue($q.resolve({}));
      const user = {
        name: 'Galba',
        licenseID: ['something', 'and', 'more things'],
      };
      const controller = initController(user);
      expect(USSService.getStatusesForUser.calls.count()).toBe(1);
      expect(ServiceDescriptorService.getServices.calls.count()).toBe(1);
      controller.userUpdatedCallback({
        refresh: true,
      });
      expect(USSService.getStatusesForUser.calls.count()).toBe(2);
      expect(ServiceDescriptorService.getServices.calls.count()).toBe(2);
    });
  });
});
