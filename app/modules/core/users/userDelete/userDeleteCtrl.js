'use strict';

angular.module('Core')
  .controller('UserDeleteCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$q', 'Log', 'Authinfo', 'Userservice', 'Notification', 'Config', '$translate', 'HuronUser', 'SyncService',
    function ($scope, $rootScope, $state, $stateParams, $q, Log, Authinfo, Userservice, Notification, Config, $translate, HuronUser, SyncService) {

      $scope.deleteUserOrgId = $stateParams.deleteUserOrgId;
      $scope.deleteUserUuId = $stateParams.deleteUserUuId;
      $scope.deleteUsername = $stateParams.deleteUsername;
      $scope.deleteUserdisplayName = $stateParams.deleteUserdisplayName;
      $scope.userName = $stateParams.userName;
      $scope.isMsgrSyncEnabled = false;

      $scope.getMessengerSyncStatus = getMessengerSyncStatus;
      $scope.inputstr = {
        response: ""
      };
      $scope.patt = $translate.instant('usersPage.yes');

      $scope.deleteCheck = function () {
        if ($scope.inputstr.response.toUpperCase() === $scope.patt) {
          return false;
        } else {
          return true;
        }
      };

      function deleteSuccess() {
        $scope.deleteUserButtonLoad = false;
        Notification.notify([$translate.instant('usersPage.deleteUserSuccess', {
          email: $scope.deleteUsername
        })], 'success');

        setTimeout(function () {
          $rootScope.$broadcast('USER_LIST_UPDATED');
        }, 500);
      }

      function deleteHuron() {
        HuronUser.delete($scope.deleteUserUuId)
          .then(function () {
            deleteSuccess();
          })
          .catch(function (response) {
            if (response.status !== 404) {
              Notification.errorResponse(response);
            } else {
              deleteSuccess();
            }
          });
      }

      function getMessengerSyncStatus() {
        SyncService.isMessengerSyncEnabled()
          .then(function (isIt) {
            $scope.isMsgrSyncEnabled = isIt;
          }, function (errorMsg) {
            Log.error(errorMsg);
          });
      }
      if (null !== Authinfo.getOrgId()) {
        getMessengerSyncStatus();
      }

      $scope.deactivateUser = function () {
        var userData = {
          email: $scope.deleteUsername
        };
        $scope.deleteUserButtonLoad = true;
        Log.debug('Deactivating user ' + $scope.deleteUsername);
        Userservice.deactivateUser(userData)
          .success(function (data, status) {
            deleteHuron();
            if (angular.isFunction($scope.$dismiss)) {
              $scope.$dismiss();
            }
          })
          .error(function (data, status) {
            Log.warn('Could not delete the user', data);
            var error = null;
            if (status) {
              error = $translate.instant('errors.statusError', {
                status: status
              });
              if (data && angular.isString(data.message)) {
                error += ' ' + $translate.instant('usersPage.messageError', {
                  message: data.message
                });
              }
            } else {
              error = 'Request failed.';
              if (angular.isString(data)) {
                error += ' ' + data;
              }
              Notification.notify(error, 'error');
            }
            Notification.notify([error], 'error');
            $scope.deleteUserButtonLoad = false;
          });
      };
    }
  ]);
