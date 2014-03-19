'use strict';

angular.module('wx2AdminWebClientApp')
  .controller('UsersCtrl', ['$scope', '$location', '$window', 'Userservice', 'Log', 'Storage', 'Config', 'Authinfo', 'Auth',
    function($scope, $location, $window, Userservice, Log, Storage, Config, Authinfo, Auth) {

      $scope.status = null;
      $scope.results = null;

      //placeholder logic
      var checkPlaceholder = function(){
        console.log('checking placeholder');
        if(angular.element('.token-label').length > 0){
          console.log(angular.element('.token-label').length);
          angular.element('input').attr('placeholder','');
        }else{
          angular.element('input').attr('placeholder', 'Enter user(s) separated by commas or semi-colons.');
        }
      };

      //tokenfield setup - Should make it into a directive later.
      angular.element('#usersfield').tokenfield({
        delimiter: [',', ';'],
        createTokensOnBlur: true
      })
        .on('tokenfield:preparetoken', function(e) {
          //Removing anything in brackets from user data
          var value = e.token.value.replace(/ *\([^)]*\) */g, '');
          e.token.value = value;
        })
        .on('tokenfield:createtoken', function(e) {
          var emailregex = /\S+@\S+\.\S+/;
          var valid = emailregex.test(e.token.value);
          if (!valid) {
            angular.element(e.relatedTarget).addClass('invalid');
          }
          checkPlaceholder();
        })
        .on('tokenfield:removetoken', function() {
          checkPlaceholder();
        });

      //Populating authinfo data if empty.
      if (Authinfo.isEmpty()) {
        var token = Storage.get('accessToken');
        if (token) {
          Log.debug('Authorizing user... Populating admin data...');
          Auth.authorize(token, $scope);
        } else {
          Log.debug('No accessToken.');
        }
      }

      var getUsersList = function() {
        return $window.addressparser.parse(angular.element('#usersfield').tokenfield('getTokensList'));
      };

      $scope.isAddEnabled = function() {
        return Authinfo.isAddUserEnabled();
      };

      $scope.addUsers = function() {
        $scope.results = {
          resultList: []
        };
        $scope.error = null;
        var isComplete = true;
        var usersList = getUsersList();
        console.log(usersList);
        Log.debug('Entitlements: ', usersList);
        var callback = function(data, status) {
          if (data.success) {
            Log.info('User add request returned:', data);

            for (var i = 0; i < data.userResponse.length; i++) {
              var userResult = {
                'email': data.userResponse[i].email
              };

              var userStatus = data.userResponse[i].status;

              if (userStatus === 200) {
                userResult.message = 'added successfully';
                $scope.alertType = 'success';
              } else if (userStatus === 409) {
                userResult.message = 'already exists';
                $scope.alertType = 'danger';
                isComplete = false;
              } else {
                userResult.message = 'not added, status: ' + userStatus;
                $scope.alertType = 'danger';
                isComplete = false;
              }
              $scope.results.resultList.push(userResult);

            }

          } else {
            Log.warn('Could not add the user', data);
            if (status) {
              $scope.error = 'Request failed with status: ' + status + '. Message: ' + data;
            } else {
              $scope.error = 'Request failed: ' + data;
            }
            $scope.alertType = 'danger';
            isComplete = false;
          }

          if (isComplete) {
            angular.element('#usersfield').tokenfield('setTokens', ' ');
          } else {
            $scope.alertType = 'danger';
          }
          angular.element('#btnAdd').button('reset');

        };

        if (typeof usersList !== 'undefined' && usersList.length > 0) {
          angular.element('#btnAdd').button('loading');
          Userservice.addUsers(usersList, callback);
        } else {
          $scope.alertType = 'danger';
          console.log('No users entered.');
          var userResult = {
            message: 'Please enter valid user email(s).'
          };
          $scope.results = {
            resultList: []
          };
          $scope.results.resultList.push(userResult);
        }

      };

      $scope.entitleUsers = function() {
        var usersList = getUsersList();
        $scope.error = null;
        Log.debug('Entitlements: ', usersList);
        $scope.results = {
          resultList: []
        };
        var isComplete = true;
        var callback = function(data, status) {
          if (data.success) {
            Log.info('User successfully entitled', data);
            for (var i = 0; i < data.userResponse.length; i++) {

              var userResult = {
                'email': data.userResponse[i].email
              };

              var userStatus = data.userResponse[i].status;

              if (userStatus === 200) {
                userResult.message = 'entitled successfully';
                $scope.alertType = 'success';
              } else if (userStatus === 404) {
                userResult.message = 'does not exist';
                $scope.alertType = 'danger';
                isComplete = false;
              } else {
                userResult.message = 'not entitled, status: ' + userStatus;
                $scope.alertType = 'danger';
                isComplete = false;
              }

              $scope.results.resultList.push(userResult);

            }

          } else {
            Log.warn('Could not entitle the user', data);
            if (status) {
              $scope.error = 'Request failed with status: ' + status + '. Message: ' + data;
            } else {
              $scope.error = 'Request failed: ' + data;
            }
            $scope.alertType = 'danger';
            isComplete = false;
          }

          if (isComplete) {
            angular.element('#usersfield').tokenfield('setTokens', ' ');
          } else {
            $scope.alertType = 'danger';
          }
          angular.element('#btnEntitle').button('reset');

        };

        if (typeof usersList !== 'undefined' && usersList.length > 0) {
          angular.element('#btnEntitle').button('loading');
          Userservice.entitleUsers(usersList, callback);
        } else {
          console.log('No users entered.');
          $scope.alertType = 'danger';
          var userResult = {
            message: 'Please enter valid user email(s).'
          };
          $scope.results = {
            resultList: []
          };
          $scope.results.resultList.push(userResult);
        }

      };
    }
  ]);
