(function () {
  'use strict';

  angular
    .module('Messenger')
    .factory('CiService', CiService);

  /* @ngInject */
  function CiService($q, Authinfo, Log, UserListService, Userservice, Config) {
    // Interface ---------------------------------------------------------------

    // Internal storage
    var user = null;

    var ciService = {
      getCiAdmins: getCiAdmins,
      getCiNonAdmins: getCiNonAdmins,
      getEntitlements: getEntitlements,
      getRoles: getRoles,
      getUser: getUser,
      hasEntitlement: hasEntitlement,
      hasEntitlements: hasEntitlements,
      hasRole: hasRole,
      isLoggedInToPartnerPortal: isLoggedInToPartnerPortal,
      isOrgManager: isOrgManager,
    };

    // Return the service
    return ciService;

    ////////////////////////////////////////////////////////////////////////////

    // Implementation ----------------------------------------------------------

    function getCiAdmins(admins) {
      getUsers(true, admins);
    }

    function getCiNonAdmins(nonAdmins) {
      getUsers(false, nonAdmins);
    }

    function getEntitlements() {
      var defer = $q.defer();

      getUser()
        .then(function (user) {
          defer.resolve(user.entitlements);
        }, function (errorMsg) {
          defer.reject('Failed getting user entitlements: ' + errorMsg);
        });

      return defer.promise;
    }

    function getRoles() {
      var defer = $q.defer();

      getUser()
        .then(function (user) {
          defer.resolve(user.roles);
        }, function (errorMsg) {
          defer.reject('Failed getting user roles: ' + errorMsg);
        });

      return defer.promise;
    }

    function getUser() {
      var defer = $q.defer();

      if (null === user) {
        Userservice.getUser('me', function (data, status) {
          if (data.success) {
            user = data;
            defer.resolve(data);
          } else {
            defer.reject('Getting user info failed: ' + status);
          }
        });
      } else {
        defer.resolve(user);
      }

      return defer.promise;
    }

    function getUsers(getAdmins, receivedUsers) {
      UserListService.listUsers(0, 20, null, null, function (data) {
        var i = 0;

        if (true === data.success) {
          var users = data.Resources;

          for (i = 0; i < users.length; i++) {
            var user = users[i];

            receivedUsers.push({
              userName: user.userName,
              DisplayName: user.displayName,
              id: user.id,
              status: user.userStatus,
              created: user.meta.created,
              ci_entitlements: user.entitlements,
              ci_roles: user.roles,
            });
          }
        } else {
          var errors = data.Errors;

          for (i = 0; i < errors.length; i++) {
            var error = errors[i];
            Log.error('Error ' + (i + 1) + ': Code ' + error.code + '; Error Code ' + error.errorCode + ': "' + error.description + '"');
          }
        }
      }, '', getAdmins);
    }

    function hasEntitlement(entitlement) {
      var defer = $q.defer();

      getEntitlements()
        .then(function (entitlements) {
          defer.resolve(entitlements.indexOf(entitlement) > -1);
        }, function (errorMsg) {
          defer.reject('Failed getting user entitlements: ' + errorMsg);
        });

      return defer.promise;
    }

    function hasEntitlements(requestedEntitlements) {
      var defer = $q.defer();

      getEntitlements()
        .then(function (entitlements) {
          var result = true;

          for (var entitlement in requestedEntitlements) {
            entitlement = requestedEntitlements[entitlement];

            if (entitlements.indexOf(entitlement) < 0) {
              result = false;
              break;
            }
          }

          defer.resolve(result);
        }, function (errorMsg) {
          defer.reject('Failed getting user entitlements: ' + errorMsg);
        });

      return defer.promise;
    }

    function hasRole(role) {
      var defer = $q.defer();

      getRoles()
        .then(function (roles) {
          defer.resolve(roles.indexOf(role) > -1);
        }, function (errorMsg) {
          defer.reject(errorMsg);
        });

      return defer.promise;
    }

    function isLoggedInToPartnerPortal() {
      return Authinfo.hasRole('PARTNER_ADMIN');
    }

    function isOrgManager() {
      return Userservice.getUser('me', _.noop)
        .then(function (response) {
          return _.some(response.data.managedOrgs, {
            orgId: Authinfo.getOrgId(),
            role: Config.backend_roles.full_admin,
          });
        });
    }
  }
})();
