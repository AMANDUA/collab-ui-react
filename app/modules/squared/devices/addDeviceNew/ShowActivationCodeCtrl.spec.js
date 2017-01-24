'use strict';

describe('ShowActivationCodeCtrl: Ctrl', function () {
  var controller, stateParams, $q, state, $scope, CsdmDataModelService, CsdmHuronPlaceService;
  var OtpService, CsdmEmailService, Notification, ActivationCodeEmailService, UserListService;
  var $controller;

  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Squared'));

  beforeEach(inject(function (_$controller_, _$q_, $rootScope, _CsdmDataModelService_, _CsdmHuronPlaceService_, _OtpService_, _CsdmEmailService_, _ActivationCodeEmailService_, _Notification_, _UserListService_) {
    $scope = $rootScope.$new();
    $controller = _$controller_;
    $q = _$q_;
    state = {};
    stateParams = {};
    CsdmDataModelService = _CsdmDataModelService_;
    CsdmHuronPlaceService = _CsdmHuronPlaceService_;
    OtpService = _OtpService_;
    CsdmEmailService = _CsdmEmailService_;
    Notification = _Notification_;
    ActivationCodeEmailService = _ActivationCodeEmailService_;
    UserListService = _UserListService_;
  }));

  function initController() {
    controller = $controller('ShowActivationCodeCtrl', {
      $scope: $scope,
      $state: state,
      $stateParams: stateParams,
      CsdmDataModelService: CsdmDataModelService
    });
  }

  afterEach(function () {
    jasmine.getJSONFixtures().clearCache();
  });
  beforeEach(installPromiseMatchers);

  describe('Initialization', function () {
    it('sets all the necessary fields', function () {
      var title = 'title';
      var deviceType = 'testDevice';
      var accountType = 'testAccount';
      var deviceName = 'deviceName';
      var displayName = 'displayName';
      var email = 'email@address.com';
      var userCisUuid = 'userCisUuid';
      var userFirstName = 'userFirstName';
      var place = { cisUuid: 'adfav22a' };
      stateParams.wizard = {
        state: function () {
          return {
            data: {
              title: title,
              account: {
                deviceType: deviceType,
                type: accountType,
                name: deviceName,
                cisUuid: place.cisUuid
              },
              recipient: {
                displayName: displayName,
                email: email,
                cisUuid: userCisUuid,
                firstName: userFirstName
              }
            }
          };
        }
      };
      initController();

      expect(controller.title).toBe(title);
      expect(controller.account.deviceType).toBe(deviceType);
      expect(controller.account.type).toBe(accountType);
      expect(controller.account.name).toBe(deviceName);
      expect(controller.account.cisUuid).toBe(place.cisUuid);
      expect(controller.selectedUser.nameWithEmail).toBe(displayName + ' (' + email + ')');
      expect(controller.selectedUser.email).toBe(email);
      expect(controller.selectedUser.cisUuid).toBe(userCisUuid);
      expect(controller.selectedUser.firstName).toBe(userFirstName);
    });

    it('hides back button when showing code without wizard', function () {
      stateParams.wizard = {
        state: function () {
          return {
            data: {
              function: 'showCode',
              account: {},
              recipient: {}
            }
          };
        }
      };
      initController();

      expect(controller.hideBackButton).toBe(true);
    });

    it('shows back button when showing code with wizard', function () {
      stateParams.wizard = {
        state: function () {
          return {
            data: {
              account: {},
              recipient: {}
            }
          };
        }
      };
      initController();

      expect(controller.hideBackButton).toBe(false);
    });

    it('controller has the sendActivationEmail function', function () {
      expect(controller.sendActivationCodeEmail).toBeDefined();
    });
  });

  describe('Search User', function () {
    var customerOrgId;
    var adminFirstName;
    var adminLastName;
    var adminDisplayName;
    var adminUserName;
    var adminCisUuid;
    var adminOrgId;
    var returnedDataCustomerOrg;
    beforeEach(function () {
      stateParams.wizard = {
        state: function () {
          return {
            data: {
              admin: {
                firstName: adminFirstName,
                lastName: adminLastName,
                displayName: adminDisplayName,
                userName: adminUserName,
                cisUuid: adminCisUuid,
                organizationId: adminOrgId
              },
              account: {
                organizationId: customerOrgId,
                type: 'shared'
              },
              recipient: {}
            }
          };
        }
      };
      spyOn(UserListService, 'listUsers').and.callFake(function (startIndex, count, sortBy, sortOrder, callback) {
        callback(returnedDataCustomerOrg);
      });
      spyOn(CsdmDataModelService, 'createCsdmPlace').and.returnValue($q.resolve({}));
      spyOn(CsdmDataModelService, 'createCodeForExisting').and.returnValue($q.resolve());
    });

    it('does not add admin to results when admin is in his own org', function () {
      customerOrgId = 'customerOrgId';
      adminFirstName = 'adminFirstName';
      adminLastName = 'adminLastName';
      adminDisplayName = 'adminDisplayName';
      adminUserName = 'adminUserName';
      adminCisUuid = 'adminCisUuid';
      adminOrgId = 'adminOrgId';
      returnedDataCustomerOrg = {
        Resources: [
          {
            displayName: 'test',
            userName: '',
            meta: {}
          }
        ]
      };
      initController();
      var resultPromise = controller.searchUser('tes');
      var promiseExecuted = false;
      expect(resultPromise.then).toBeDefined();
      resultPromise.then(function (result) {
        expect(result.length).toBe(1);
        expect(result[0].displayName).toBe('test');
        expect(UserListService.listUsers).toHaveBeenCalledTimes(1);
        promiseExecuted = true;
      }).catch(function () {
        fail();
      });
      $scope.$digest();
      expect(promiseExecuted).toBeTruthy();
    });

    it('adds admin to results when admin is in an org he is partner for', function () {
      customerOrgId = 'customerOrgId';
      adminFirstName = 'adminFirstName';
      adminLastName = 'adminLastName';
      adminDisplayName = 'adminDisplayName';
      adminUserName = 'adminUserName';
      adminCisUuid = 'adminCisUuid';
      adminOrgId = 'adminOrgId';
      returnedDataCustomerOrg = {
        Resources: [
          {
            displayName: 'atest',
            userName: '',
            meta: {}
          }
        ]
      };
      initController();
      var resultPromise = controller.searchUser('adm');
      var promiseExecuted = false;
      expect(resultPromise.then).toBeDefined();
      resultPromise.then(function (result) {
        expect(result.length).toBe(2);
        expect(result[0].displayName).toBe('adminDisplayName');
        expect(result[1].displayName).toBe('atest');
        expect(UserListService.listUsers).toHaveBeenCalledTimes(1);
        promiseExecuted = true;
      }).catch(function () {
        fail();
      });
      $scope.$digest();
      expect(promiseExecuted).toBeTruthy();
    });

    it('no results in customer still shows admin', function () {
      customerOrgId = 'customerOrgId';
      adminFirstName = 'adminFirstName';
      adminLastName = 'adminLastName';
      adminDisplayName = 'adminDisplayName';
      adminUserName = 'adminUserName';
      adminCisUuid = 'adminCisUuid';
      adminOrgId = 'adminOrgId';
      returnedDataCustomerOrg = {
        Resources: []
      };
      initController();
      var resultPromise = controller.searchUser('adm');
      var promiseExecuted = false;
      expect(resultPromise.then).toBeDefined();
      resultPromise.then(function (result) {
        expect(result.length).toBe(1);
        expect(result[0].displayName).toBe('adminDisplayName');
        expect(UserListService.listUsers).toHaveBeenCalledTimes(1);
        promiseExecuted = true;
      }).catch(function () {
        fail();
      });
      $scope.$digest();
      expect(promiseExecuted).toBeTruthy();
    });

    it('search string shorter than 3 characters returns empty resultset', function () {
      initController();
      var resultPromise = controller.searchUser('te');
      var promiseExecuted = false;
      expect(resultPromise.then).toBeDefined();
      resultPromise.then(function (result) {
        expect(result.length).toBe(0);
        expect(UserListService.listUsers).toHaveBeenCalledTimes(0);
        promiseExecuted = true;
      }).catch(function () {
        fail();
      });
      $scope.$digest();
      expect(promiseExecuted).toBeTruthy();
    });
  });

  describe('Add device', function () {
    var cisUuid;
    var userOrgId;
    var userCisUuid;
    var deviceName;
    var deviceOrgId;
    var activationCode;
    var expiryTime;
    var directoryNumber;
    var externalNumber;
    var userEmail;
    var userFirstName;
    var cloudberryNewPlace;
    var cloudberryExistingPlace;
    var huronNewPlace;
    var huronExistingPlace;
    var huronExistingUser;
    var expectedEmailInfo;
    var entitlements;

    beforeEach(function () {
      cisUuid = 'testId';
      userCisUuid = '09u0testId';
      userOrgId = '01gyq8awg-orgId';
      deviceName = "name";
      deviceOrgId = "05oaj2fdj-orgId";
      activationCode = '1234567887654321';
      expiryTime = '1337-01-01T13:37:00.000Z';
      directoryNumber = '1234';
      externalNumber = '4321';
      userEmail = 'user@example.org';
      userFirstName = 'userFirstName';
      entitlements = ['something', 'else'];

      cloudberryNewPlace = {
        state: function () {
          return {
            data: {
              account: {
                deviceType: 'cloudberry',
                type: 'shared',
                name: deviceName,
                organizationId: deviceOrgId,
                entitlements: entitlements,
                directoryNumber: directoryNumber,
                externalNumber: externalNumber
              },
              recipient: {
                organizationId: userOrgId,
                cisUuid: userCisUuid,
                email: userEmail
              }
            }
          };
        }
      };

      cloudberryExistingPlace = {
        state: function () {
          return {
            data: {
              account: {
                deviceType: 'cloudberry',
                type: 'shared',
                cisUuid: cisUuid,
                organizationId: deviceOrgId
              },
              recipient: {
                organizationId: userOrgId,
                cisUuid: userCisUuid,
                email: userEmail
              }
            }
          };
        }
      };
      huronNewPlace = {
        state: function () {
          return {
            data: {
              account: {
                deviceType: 'huron',
                type: 'shared',
                name: deviceName,
                organizationId: deviceOrgId,
                directoryNumber: directoryNumber,
                externalNumber: externalNumber,
              },
              recipient: {
                organizationId: userOrgId,
                cisUuid: userCisUuid,
                email: userEmail
              }
            }
          };
        }
      };
      huronExistingPlace = {
        state: function () {
          return {
            data: {
              account: {
                deviceType: 'huron',
                type: 'shared',
                cisUuid: cisUuid,
                organizationId: deviceOrgId
              },
              recipient: {
                organizationId: userOrgId,
                cisUuid: userCisUuid,
                email: userEmail
              }
            }
          };
        }
      };
      huronExistingUser = {
        state: function () {
          return {
            data: {
              account: {
                deviceType: 'huron',
                type: 'personal',
                username: userEmail,
                organizationId: deviceOrgId
              },
              recipient: {
                email: userEmail,
                firstName: userFirstName,
                cisUuid: userCisUuid,
                organizationId: userOrgId,
              }
            }
          };
        }
      };

      expectedEmailInfo = {
        toCustomerId: userOrgId,
        toUserId: userCisUuid,
        machineAccountCustomerId: deviceOrgId,
        machineAccountId: cisUuid,
        activationCode: activationCode,
        expiryTime: localized(expiryTime)
      };
    });

    describe('of type cloudberry', function () {

      describe('with new place', function () {
        beforeEach(function () {
          stateParams.wizard = cloudberryNewPlace;
          spyOn(CsdmDataModelService, 'createCsdmPlace').and.returnValue($q.resolve({ cisUuid: cisUuid }));
          spyOn(CsdmDataModelService, 'createCodeForExisting').and.returnValue($q.resolve({
            activationCode: activationCode,
            expiryTime: expiryTime
          }));
          initController();
          $scope.$digest();
        });

        it('creates a new place and otp', function () {
          expect(CsdmDataModelService.createCsdmPlace).toHaveBeenCalledWith(deviceName, entitlements, directoryNumber, externalNumber);
          expect(CsdmDataModelService.createCodeForExisting).toHaveBeenCalledWith(cisUuid);
          expect(controller.qrCode).toBeTruthy();
          expect(controller.activationCode).toBe(activationCode);
          expect(controller.expiryTime).toBe(expiryTime);
        });

        describe('sending an activation email', function () {

          it('should send it to selected user and notify success', function () {
            spyOn(CsdmEmailService, 'sendCloudberryEmail').and.returnValue($q.resolve({}));
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(CsdmEmailService.sendCloudberryEmail).toHaveBeenCalledWith(expectedEmailInfo);
            expect(Notification.notify).toHaveBeenCalledWith(['generateActivationCodeModal.emailSuccess'], 'success', 'generateActivationCodeModal.emailSuccessTitle');
          });

          it('should try to send email and notify error', function () {
            spyOn(CsdmEmailService, 'sendCloudberryEmail').and.returnValue($q.reject({}));
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(Notification.notify).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe('with existing place', function () {
        beforeEach(function () {
          stateParams.wizard = cloudberryExistingPlace;
          spyOn(CsdmDataModelService, 'createCodeForExisting').and.returnValue($q.resolve({
            activationCode: activationCode,
            expiryTime: expiryTime
          }));
          initController();
          $scope.$digest();
        });


        it('creates an otp', function () {
          expect(CsdmDataModelService.createCodeForExisting).toHaveBeenCalledWith(cisUuid);
          expect(controller.qrCode).toBeTruthy();
          expect(controller.activationCode).toBe(activationCode);
          expect(controller.expiryTime).toBe(expiryTime);
        });

        describe('sending an activation email', function () {

          it('should send it to selected user and notify success', function () {
            spyOn(CsdmEmailService, 'sendCloudberryEmail').and.returnValue($q.resolve({}));
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(CsdmEmailService.sendCloudberryEmail).toHaveBeenCalledWith(expectedEmailInfo);
            expect(Notification.notify).toHaveBeenCalledWith(['generateActivationCodeModal.emailSuccess'], 'success', 'generateActivationCodeModal.emailSuccessTitle');
          });

          it('should try to send email and notify error', function () {
            spyOn(CsdmEmailService, 'sendCloudberryEmail').and.returnValue($q.reject({}));
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(Notification.notify).toHaveBeenCalledTimes(1);
          });
        });
      });
    });

    describe('of type huron', function () {

      describe('with new place', function () {
        var newPlace;
        beforeEach(function () {
          stateParams.wizard = huronNewPlace;

          newPlace = { cisUuid: cisUuid };
          spyOn(CsdmDataModelService, 'createCmiPlace').and.returnValue($q.resolve(newPlace));
          spyOn(CsdmHuronPlaceService, 'createOtp').and.returnValue($q.resolve({
            activationCode: activationCode,
            expiryTime: expiryTime
          }));
          initController();
          $scope.$digest();
        });


        it('creates a new place and otp', function () {
          expect(CsdmDataModelService.createCmiPlace).toHaveBeenCalledWith(deviceName, directoryNumber, externalNumber);
          expect(CsdmHuronPlaceService.createOtp).toHaveBeenCalledWith(cisUuid);
          expect(controller.qrCode).toBeTruthy();
          expect(controller.activationCode).toBe(activationCode);
          expect(controller.expiryTime).toBe(expiryTime);
          expect(controller.account.cisUuid).toBe(newPlace.cisUuid);
        });

        describe('sending an activation email', function () {

          it('should send it to selected user and notify success', function () {
            spyOn(CsdmEmailService, 'sendHuronEmail').and.returnValue($q.resolve({}));
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(CsdmEmailService.sendHuronEmail).toHaveBeenCalledWith(expectedEmailInfo);
            expect(Notification.notify).toHaveBeenCalledWith(['generateActivationCodeModal.emailSuccess'], 'success', 'generateActivationCodeModal.emailSuccessTitle');
          });

          it('should try to send email and notify error', function () {
            spyOn(CsdmEmailService, 'sendHuronEmail').and.returnValue($q.reject({}));
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(Notification.notify).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe('with existing place', function () {
        beforeEach(function () {
          stateParams.wizard = huronExistingPlace;
          spyOn(CsdmHuronPlaceService, 'createOtp').and.returnValue($q.resolve({
            activationCode: activationCode,
            expiryTime: expiryTime
          }));
          initController();
          $scope.$digest();
        });

        it('creates an otp', function () {
          expect(CsdmHuronPlaceService.createOtp).toHaveBeenCalledWith(cisUuid);
          expect(controller.qrCode).toBeTruthy();
          expect(controller.activationCode).toBe(activationCode);
          expect(controller.expiryTime).toBe(expiryTime);
        });

        describe('sending an activation email', function () {

          it('should send it to selected user and notify success', function () {
            spyOn(CsdmEmailService, 'sendHuronEmail').and.returnValue($q.resolve());
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(CsdmEmailService.sendHuronEmail).toHaveBeenCalledWith(expectedEmailInfo);
            expect(Notification.notify).toHaveBeenCalledWith(['generateActivationCodeModal.emailSuccess'], 'success', 'generateActivationCodeModal.emailSuccessTitle');
          });

          it('should try to send email and notify error', function () {
            spyOn(CsdmEmailService, 'sendHuronEmail').and.returnValue($q.reject());
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(Notification.notify).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe('with existing user', function () {
        beforeEach(function () {
          stateParams.wizard = huronExistingUser;
          spyOn(OtpService, 'generateOtp').and.returnValue($q.resolve({
            code: activationCode,
            friendlyExpiresOn: expiryTime
          }));
          initController();
          $scope.$digest();
        });

        it('creates an otp', function () {
          expect(OtpService.generateOtp).toHaveBeenCalledWith(userEmail);
          expect(controller.qrCode).toBeTruthy();
          expect(controller.activationCode).toBe(activationCode);
          expect(controller.expiryTime).toBe(expiryTime);
        });

        describe('sending an activation email', function () {
          it('should send it to selected user and notify success', function () {
            // $httpBackend.expectPOST(HuronConfig.getEmailUrl() + '/email/activationcode', {});
            spyOn(ActivationCodeEmailService, 'save').and.callFake(function (a, emailInfo, success) {
              expect(emailInfo.email).toBe(userEmail);
              expect(emailInfo.firstName).toBe(userFirstName);
              expect(emailInfo.oneTimePassword).toBe(activationCode);
              expect(emailInfo.expiresOn).toBe(localized(expiryTime));
              expect(emailInfo.userId).toBe(userCisUuid);
              expect(emailInfo.customerId).toBe(userOrgId);
              success();
            });
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            // $httpBackend.flush();
            // expect(ActivationCodeEmailService.save).toHaveBeenCalled();
            // expect(Notification.notify).toHaveBeenCalled();
            expect(Notification.notify).toHaveBeenCalledWith(['generateActivationCodeModal.emailSuccess'], 'success', 'generateActivationCodeModal.emailSuccessTitle');
          });

          it('should try to send email and notify error', function () {
            spyOn(ActivationCodeEmailService, 'save').and.callFake(function (a, emailInfo, success, error) {
              error();
            });
            spyOn(Notification, 'notify').and.callThrough();

            controller.sendActivationCodeEmail();
            $scope.$digest();
            expect(Notification.notify).toHaveBeenCalled();
          });
        });
      });
    });
  });

  function localized(date) {
    var timezone = jstz.determine().name();
    if (timezone === null || _.isUndefined(timezone)) {
      timezone = 'UTC';
    }

    return moment(date || undefined).local().tz(timezone).format('LLL (z)');
  }
});
