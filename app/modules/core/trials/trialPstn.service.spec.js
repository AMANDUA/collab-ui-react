'use strict';

describe('Service: TrialPstnService: ', function () {
  var $q, $rootScope, TrialPstnService, PstnService, FeatureToggleService;
  var customerOrgId, customerName, pstnProvider, swivelTrialNumbers;

  beforeEach(angular.mock.module('core.trial'));
  beforeEach(angular.mock.module('Core'));

  beforeEach(inject(function (_$q_, _$rootScope_, _TrialPstnService_, _PstnService_, _FeatureToggleService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    TrialPstnService = _TrialPstnService_;
    PstnService = _PstnService_;
    FeatureToggleService = _FeatureToggleService_;

    spyOn(FeatureToggleService, 'supports').and.returnValue($q.resolve());
    spyOn(PstnService, 'createCustomerV2').and.returnValue($q.resolve());
    spyOn(PstnService, 'getCustomerV2').and.returnValue($q.reject());
    spyOn(PstnService, 'orderNumbersV2Swivel').and.returnValue($q.resolve());
    spyOn(PstnService, 'orderNumbers').and.returnValue($q.resolve());
    spyOn(PstnService, 'createLocation').and.returnValue($q.resolve());
  }));

  customerOrgId = '5a949ed2-d212-4dc3-a918-4131fc2ccfc9';
  customerName = 'trial_pstn_service_customer';
  pstnProvider = {
    uuid: '6a949ed2-d212-4dc3-a918-4131fc2ccfc8',
    apiImplementation: 'SWIVEL',
  };
  swivelTrialNumbers = ['+4697793400', '+18007164851'];

  describe('should call the correct orderNumbers API for SWIVEL apiImplementation', function () {
    beforeEach(function () {
      var _trialData = TrialPstnService.getData();
      _trialData.details.pstnProvider = _.cloneDeep(pstnProvider);
      _trialData.details.swivelNumbers = _.cloneDeep(swivelTrialNumbers);
    });

    it('should call orderNumbersV2Swivel API if huronEnterprisePrivateTrunking feature toggle is on', function () {
      var _trialData = TrialPstnService.getData();
      _trialData.details.pstnProvider.apiImplementation = 'SWIVEL';
      FeatureToggleService.supports.and.returnValue($q.resolve(true));
      TrialPstnService.ftEnterprisePrivateTrunking = true;
      TrialPstnService.createPstnEntityV2(customerOrgId, customerName);
      $rootScope.$apply();

      expect(PstnService.orderNumbersV2Swivel).toHaveBeenCalledWith(customerOrgId, swivelTrialNumbers);
    });

    it('should call orderNumbers API if huronEnterprisePrivateTrunking feature toggle is off', function () {
      var _trialData = TrialPstnService.getData();
      _trialData.details.pstnProvider.apiImplementation = 'SWIVEL';
      FeatureToggleService.supports.and.returnValue($q.resolve(false));
      TrialPstnService.createPstnEntityV2(customerOrgId, customerName);
      $rootScope.$apply();

      expect(PstnService.orderNumbers).toHaveBeenCalledWith(customerOrgId, pstnProvider.uuid, swivelTrialNumbers);
    });
  });
});
