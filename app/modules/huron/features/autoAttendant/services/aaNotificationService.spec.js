'use strict';

describe('Service: AANotificationService', function () {
  var AANotificationService, Notification;
  var key = 'CES0005';
  var trackingId = 'ATLAS_09d583dc-e55a-2574-7862-ff14fe6b9aed_2';
  var description = 'No Database Entries found for the specified criteria';
  var error = {
    key: key,
    message: [description],
    trackingId: trackingId,
  };
  var data = {
    error: error,
  };
  var response = {
    data: data,
  };

  var message = 'autoAttendant.errorCreateCe';
  var parameters = {
    name: 'AA',
    statusText: 'failure',
    status: '500',
  };

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function (_AANotificationService_, _Notification_) {
    AANotificationService = _AANotificationService_;
    Notification = _Notification_;

    spyOn(Notification, 'notify');
    spyOn(Notification, 'error');
    spyOn(Notification, 'errorResponse');
  }));

  afterEach(function () {

  });

  describe('errorResponse', function () {
    it('should parse through response and call core Notification for CES', function () {
      AANotificationService.errorResponse(response, message, parameters);
      expect(Notification.notify).toHaveBeenCalledWith(
        'autoAttendant.errorCreateCe Key: CES0005 Description: No Database Entries found for the specified criteria TrackingId: ATLAS_09d583dc-e55a-2574-7862-ff14fe6b9aed_2', 'error');
    });
  });

  describe('errorResponse', function () {
    var data = {
      errorMessage: 'improper uuid format in request',
    };
    var response = {
      data: data,
    };

    it('should parse through response and call core Notification for CMI', function () {
      AANotificationService.errorResponse(response, message, parameters);
      expect(Notification.errorResponse).toHaveBeenCalledWith(response, message, parameters);
    });
  });

  describe('errorResponse', function () {
    var error = {
      key: key,
      message: 'message field is not an object',
      trackingId: trackingId,
    };
    var data = {
      error: error,
    };
    var response = {
      data: data,
    };

    it('should parse through response with data.error.message which is not an object', function () {
      AANotificationService.errorResponse(response, message, parameters);
      expect(Notification.notify).toHaveBeenCalledWith(
        'autoAttendant.errorCreateCe Key: CES0005 Description: message field is not an object TrackingId: ATLAS_09d583dc-e55a-2574-7862-ff14fe6b9aed_2', 'error');
    });
  });

  describe('errorResponse', function () {
    var response = {};

    it('should just print messsage if no data.error or data.message', function () {
      AANotificationService.errorResponse(response, message, parameters);
      expect(Notification.error).toHaveBeenCalledWith(message, parameters);
    });
  });
});
