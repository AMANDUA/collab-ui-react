'use strict';

describe('Controller: AABuilderContainerCtrl', function () {
  var $scope, $modal;
  var AAModelService, AAUiModelService, AAValidationService;

  var uiModel = {
    isClosedHours: false,
    isHolidays: false,
  };
  var aaModel = {
    aaRecord: {
      scheduleId: undefined,
    },
  };

  var fakeModal = {
    result: {
      then: function (okCallback, cancelCallback) {
        this.okCallback = okCallback;
        this.cancelCallback = cancelCallback;
      },
    },
    close: function (item) {
      this.result.okCallback(item);
    },
    dismiss: function (type) {
      this.result.cancelCallback(type);
    },
  };

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$rootScope_, _$modal_, _AAModelService_, _AAUiModelService_, _AAValidationService_) {
    $scope = _$rootScope_;
    $modal = _$modal_;

    AAUiModelService = _AAUiModelService_;
    AAModelService = _AAModelService_;
    AAValidationService = _AAValidationService_;

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(uiModel);
    spyOn(AAModelService, 'getAAModel').and.returnValue(aaModel);

    spyOn($modal, 'open').and.returnValue(fakeModal);

    this.compileComponent('aaBuilderContainer');
  }));

  describe('openScheduleModal', function () {
    it('should not open the Modal on Validation error', function () {
      spyOn(AAValidationService, 'isValidCES').and.returnValue(false);

      this.controller.openScheduleModal();

      expect($modal.open).not.toHaveBeenCalled();
    });
    it('should open the Modal on Validation success', function () {
      spyOn(AAValidationService, 'isValidCES').and.returnValue(true);

      this.controller.openScheduleModal();
      fakeModal.close({
        holidays: [],
        hours: [],
      });

      $scope.$apply();

      expect($modal.open).toHaveBeenCalled();
    });
  });

  describe('getScheduleTitle', function () {
    it('should receive the schedule all day message', function () {
      var title = this.controller.getScheduleTitle();

      expect(title).toEqual('autoAttendant.scheduleAllDay');
    });

    it('should receive the generic schedule when isClosedHours is false', function () {
      uiModel.isClosedHours = false;
      uiModel.isHolidays = true;

      var title = this.controller.getScheduleTitle();

      expect(title).toEqual('autoAttendant.schedule');
    });

    it('should receive the generic schedule when isHolidays is false', function () {
      uiModel.isClosedHours = true;
      uiModel.isHolidays = false;

      var title = this.controller.getScheduleTitle();

      expect(title).toEqual('autoAttendant.schedule');
    });

    it('should receive the schedule all day message when both are true', function () {
      uiModel.isClosedHours = true;
      uiModel.isHolidays = true;

      var title = this.controller.getScheduleTitle();

      expect(title).toEqual('autoAttendant.schedule');
    });
  });
});
