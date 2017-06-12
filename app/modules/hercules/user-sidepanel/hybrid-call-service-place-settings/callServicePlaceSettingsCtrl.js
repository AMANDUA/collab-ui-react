(function () {
  'use strict';

  angular
    .module('Hercules')
    .controller('CallServicePlaceSettingsCtrl', CallServicePlaceSettingsCtrl);

  /*@ngInject*/
  function CallServicePlaceSettingsCtrl($scope, $state, $stateParams, Authinfo, Userservice, Notification, USSService, HybridServicesClusterService, UriVerificationService, DomainManagementService, $translate, ResourceGroupService, UCCService, HybridServicesI18NService) {

    $scope.userId = $stateParams.currentUserId;

    $scope.saveLoading = false;
    $scope.domainVerificationError = false;
    $scope.currentUser = $stateParams.currentUser || $stateParams.getCurrentPlace();
    $scope.isPlace = $scope.currentUser.accountType === 'MACHINE';
    $scope.isUser = !$scope.isPlace;
    var isEntitled = function (ent) {
      return $scope.currentUser.entitlements && $scope.currentUser.entitlements.indexOf(ent) > -1;
    };
    var isSetup = function (id) {
      var extension = _.find($stateParams.extensions, { id: id });
      return extension ? extension.isSetup : false;
    };

    $scope.isInvitePending = Userservice.isInvitePending($scope.currentUser);
    $scope.localizedServiceName = $translate.instant('hercules.serviceNames.' + $stateParams.extensionId);
    $scope.localizedConnectorName = $translate.instant('hercules.connectorNames.' + $stateParams.extensionId);
    $scope.localizedOnboardingWarning = $translate.instant('hercules.userSidepanel.warningInvitePending', {
      ServiceName: $scope.localizedServiceName,
    });

    $scope.callServiceAware = {
      id: 'squared-fusion-uc',
      name: 'squaredFusionUC',
      entitled: isEntitled('squared-fusion-uc'), // Tracks the entitlement as set in the UI (toggle)
      directoryUri: null,
      currentUserEntitled: isEntitled('squared-fusion-uc'), // Tracks the actual entitlement on the user
    };
    $scope.callServiceConnect = {
      id: 'squared-fusion-ec',
      name: 'squaredFusionEC',
      entitled: isEntitled('squared-fusion-ec'), // Tracks the entitlement as set in the UI (toggle)
      orgEntitled: Authinfo.isFusionEC(),
      enabledInFMS: false,
      currentUserEntitled: isEntitled('squared-fusion-ec'), // Tracks the actual entitlement on the user
      userId: $scope.currentUser.id,
    };
    $scope.resourceGroup = {
      show: false,
      saving: false,
      init: function () {
        this.options = [{ label: $translate.instant('hercules.resourceGroups.noGroupSelected'), value: '' }];
        this.selected = this.current = this.options[0];
        this.shouldWarn = false;
      },
      reset: function () {
        this.selected = this.current;
        this.saving = false;
        this.displayWarningIfNecessary();
      },
      hasChanged: function () {
        return this.selected !== this.current;
      },
      displayWarningIfNecessary: function () {
        if (_.size(this.options) > 1) {
          ResourceGroupService.resourceGroupHasEligibleCluster($scope.resourceGroup.selected.value, 'c_ucmc')
          .then(function (hasEligibleCluster) {
            $scope.resourceGroup.shouldWarn = !hasEligibleCluster;
          });
        }
      },
    };
    $scope.resourceGroup.init();

    // Only show callServiceConnect if it's enabled
    if ($scope.callServiceConnect.orgEntitled) {
      $scope.callServiceConnect.enabledInFMS = isSetup($scope.callServiceConnect.id);
    }

    $scope.$watch('callServiceAware.entitled', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.setShouldShowButtons();
      }
    });

    $scope.$watch('callServiceConnect.entitled', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.setShouldShowButtons();
      }
    });

    if ($scope.isPlace && $scope.currentUser.externalLinkedAccounts) {
      var existingHybridCallLink = _.head(_.filter($scope.currentUser.externalLinkedAccounts, function (linkedAccount) {
        return linkedAccount && (linkedAccount.providerID === 'squared-fusion-uc');
      }));
      if (existingHybridCallLink) {
        $scope.mailID = existingHybridCallLink.accountGUID;
      }
    }

    var entitlementHasChanged = function () {
      return $scope.callServiceConnect.entitled !== isEntitled($scope.callServiceConnect.id) || $scope.callServiceAware.entitled !== isEntitled($scope.callServiceAware.id);
    };

    var resetStatusesIfEntitlementChanged = function () {
      if ($scope.callServiceConnect.entitled !== isEntitled($scope.callServiceConnect.id)) {
        $scope.callServiceConnect.status = null;
      }
      if ($scope.callServiceAware.entitled !== isEntitled($scope.callServiceAware.id)) {
        $scope.callServiceAware.status = null;
      }
    };

    var updateStatus = function (userIsRefreshed) {
      if ($scope.isInvitePending) {
        return;
      }
      $scope.updatingStatus = true;
      USSService.getStatusesForUser($scope.currentUser.id).then(function (statuses) {
        $scope.callServiceAware.status = _.find(statuses, function (status) {
          return $scope.callServiceAware.id === status.serviceId;
        });
        refreshUserInUssIfServiceEntitledButNoStatus($scope.callServiceAware, userIsRefreshed);
        $scope.callServiceConnect.status = _.find(statuses, function (status) {
          return $scope.callServiceConnect.id === status.serviceId;
        });
        refreshUserInUssIfServiceEntitledButNoStatus($scope.callServiceConnect, userIsRefreshed);
        if ($scope.callServiceAware.status && $scope.callServiceAware.status.clusterId) {
          HybridServicesClusterService.get($scope.callServiceAware.status.clusterId).then(function (cluster) {
            $scope.callServiceAware.homedCluster = cluster;
            $scope.callServiceAware.homedConnector = _.find(cluster.connectors, { id: $scope.callServiceAware.status.connectorId });
          });
        }
        if ($scope.callServiceAware.status && $scope.callServiceAware.status.lastStateChange) {
          $scope.callServiceAware.status.lastStateChangeText = HybridServicesI18NService.getTimeSinceText($scope.callServiceAware.status.lastStateChange);
        }
        if ($scope.callServiceConnect.status && $scope.callServiceConnect.status.lastStateChange) {
          $scope.callServiceConnect.status.lastStateChangeText = HybridServicesI18NService.getTimeSinceText($scope.callServiceConnect.status.lastStateChange);
        }
        if ($scope.callServiceAware.entitled && $scope.callServiceAware.status) {
          UCCService.getUserDiscovery($scope.currentUser.id).then(function (userDiscovery) {
            $scope.callServiceAware.directoryUri = userDiscovery.directoryURI;
            if ($scope.callServiceAware.directoryUri) {
              DomainManagementService.getVerifiedDomains().then(function (domainList) {
                if (!UriVerificationService.isDomainVerified(domainList, $scope.callServiceAware.directoryUri)) {
                  $scope.domainVerificationError = true;
                }
              });
            } else {
              $scope.domainVerificationError = false;
            }
          });
        }
      }).catch(function (response) {
        Notification.errorWithTrackingId(response, 'hercules.userSidepanel.readUserStatusFailed');
      }).finally(function () {
        $scope.updatingStatus = false;
      });
    };

    var refreshUserInUss = function () {
      if ($scope.isInvitePending) {
        return;
      }
      USSService.refreshEntitlementsForUser($scope.currentUser.id).catch(function (response) {
        Notification.errorWithTrackingId(response, 'hercules.userSidepanel.refreshUserFailed');
      }).finally(function () {
        updateStatus(true);
      });
    };

    var refreshUserInUssIfServiceEntitledButNoStatus = function (service, secondPass) {
      // If we find no status in USS and the service is entitled, we try to refresh the user in USS and reload the statuses
      // This can happen if USS has not been notified by CI in a reasonable time after entitled
      if (!service.status && isEntitled(service.id)) {
        if (secondPass) {
          // This means we've done a refresh and it didn't help so we give up with a cryptic error message
          service.status = { state: 'unknown', entitled: true };
          Notification.error('hercules.userSidepanel.refreshUserDidNoGood');
        } else {
          refreshUserInUss();
        }
      }
    };

    var setSelectedResourceGroup = function (resourceGroupId) {
      var selectedGroup = _.find($scope.resourceGroup.options, function (group) {
        return group.value === resourceGroupId;
      });
      if (selectedGroup) {
        $scope.resourceGroup.selected = selectedGroup;
        $scope.resourceGroup.current = selectedGroup;
        $scope.resourceGroup.displayWarningIfNecessary();
      } else {
        $scope.resourceGroup.cannotFindResouceGroup = true;
      }
    };

    var readResourceGroups = function () {
      ResourceGroupService.getAllAsOptions().then(function (options) {
        if (options.length > 0) {
          $scope.resourceGroup.options = $scope.resourceGroup.options.concat(options);
          if ($scope.callServiceAware.status && $scope.callServiceAware.status.resourceGroupId) {
            setSelectedResourceGroup($scope.callServiceAware.status.resourceGroupId);
          } else {
            USSService.getUserProps($scope.currentUser.id).then(function (props) {
              if (props.resourceGroups && props.resourceGroups[$scope.callServiceAware.id]) {
                setSelectedResourceGroup(props.resourceGroups[$scope.callServiceAware.id]);
              } else {
                $scope.resourceGroup.displayWarningIfNecessary();
              }
            });
          }
          $scope.resourceGroup.show = true;
        }
      });
    };

    updateStatus();
    readResourceGroups();

    var addEntitlementToCurrentUser = function (entitlement) {
      if (!_.includes($scope.currentUser.entitlements, entitlement)) {
        $scope.currentUser.entitlements.push(entitlement);
      }
      $scope.callServiceAware.currentUserEntitled = isEntitled($scope.callServiceAware.id);
      $scope.callServiceConnect.currentUserEntitled = isEntitled($scope.callServiceConnect.id);
    };

    var removeEntitlementFromCurrentUser = function (entitlement) {
      _.remove($scope.currentUser.entitlements, function (e) {
        return e === entitlement;
      });
      $scope.callServiceAware.currentUserEntitled = isEntitled($scope.callServiceAware.id);
      $scope.callServiceConnect.currentUserEntitled = isEntitled($scope.callServiceConnect.id);
    };

    var updateEntitlements = function () {
      $scope.savingEntitlements = true;
      $scope.savingAwareEntitlement = $scope.callServiceAware.currentUserEntitled !== $scope.callServiceAware.entitled;
      $scope.savingConnectEntitlement = $scope.callServiceConnect.currentUserEntitled !== $scope.callServiceConnect.entitled;
      var user = [{
        'address': $scope.currentUser.userName,
      }];
      var entitlements = [{
        entitlementName: $scope.callServiceAware.name,
        entitlementState: $scope.callServiceAware.entitled === true ? 'ACTIVE' : 'INACTIVE',
      }];
      if ($scope.callServiceConnect.orgEntitled && $scope.callServiceConnect.enabledInFMS) {
        entitlements.push({
          entitlementName: $scope.callServiceConnect.name,
          entitlementState: $scope.callServiceAware.entitled === true && $scope.callServiceConnect.entitled === true ? 'ACTIVE' : 'INACTIVE',
        });
      }

      Userservice.updateUsers(user, null, entitlements, 'updateEntitlement', function (data) {
        var entitleResult = {
          msg: null,
          type: 'null',
        };
        if (data.success) {
          var userStatus = data.userResponse[0].status;
          if (userStatus === 200) {
            resetStatusesIfEntitlementChanged();
            if (!$scope.currentUser.entitlements) {
              $scope.currentUser.entitlements = [];
            }
            if ($scope.callServiceAware.entitled) {
              addEntitlementToCurrentUser($scope.callServiceAware.id);
            } else {
              removeEntitlementFromCurrentUser($scope.callServiceAware.id);
              $scope.callServiceConnect.entitled = false;
            }
            if ($scope.callServiceConnect.orgEntitled && $scope.callServiceConnect.enabledInFMS) {
              if ($scope.callServiceConnect.entitled) {
                addEntitlementToCurrentUser($scope.callServiceConnect.id);
              } else {
                removeEntitlementFromCurrentUser($scope.callServiceConnect.id);
              }
            }
            $scope.setShouldShowButtons();
            refreshUserInUss();
          } else if (userStatus === 404) {
            entitleResult.msg = $translate.instant('hercules.userSidepanel.entitlements-dont-exist', {
              userName: $scope.currentUser.userName,
            });
            entitleResult.type = 'error';
          } else if (userStatus === 409) {
            entitleResult.msg = $translate.instant('hercules.userSidepanel.previously-updated');
            entitleResult.type = 'error';
          } else {
            entitleResult.msg = $translate.instant('hercules.userSidepanel.not-updated', {
              userName: $scope.currentUser.userName,
            });
            entitleResult.type = 'error';
          }
          if (userStatus !== 200) {
            Notification.notify([entitleResult.msg], entitleResult.type);
          }

        } else {
          entitleResult = {
            msg: $translate.instant('hercules.userSidepanel.not-updated', {
              userName: $scope.currentUser.userName,
            }),
            type: 'error',
          };
          Notification.notify([entitleResult.msg], entitleResult.type);
        }
        $scope.savingEntitlements = $scope.savingAwareEntitlement = $scope.savingConnectEntitlement = false;
        $scope.saving = $scope.resourceGroup.saving;
      });
    };

    $scope.setResourceGroupOnUser = function (resourceGroupId) {
      $scope.resourceGroup.saving = true;
      var props = { userId: $scope.currentUser.id, resourceGroups: { 'squared-fusion-uc': resourceGroupId } };
      USSService.updateUserProps(props).then(function () {
        $scope.resourceGroup.current = $scope.resourceGroup.selected;
        $scope.setShouldShowButtons();
        $scope.resourceGroup.cannotFindResouceGroup = false;
        Notification.success('hercules.resourceGroups.resourceGroupSaved');
      }).catch(function (error) {
        Notification.errorWithTrackingId(error, 'hercules.resourceGroups.failedToSetGroup');
      }).finally(function () {
        $scope.resourceGroup.saving = false;
        $scope.saving = $scope.savingEntitlements;
      });
    };

    $scope.save = function () {
      $scope.savingEntitlements = false;
      $scope.resourceGroup.saving = false;
      $scope.saving = true;
      if (entitlementHasChanged()) {
        updateEntitlements();
      }
      if ($scope.resourceGroup.hasChanged()) {
        $scope.setResourceGroupOnUser($scope.resourceGroup.selected.value);
      }
    };

    $scope.reset = function () {
      $scope.callServiceAware.entitled = isEntitled($scope.callServiceAware.id);
      $scope.callServiceConnect.entitled = isEntitled($scope.callServiceConnect.id);
      $scope.resourceGroup.reset();
      $scope.showButtons = false;
    };

    $scope.editCloudberryServices = function (service) {
      $stateParams.editService(service);
    };

    $scope.closePreview = function () {
      $state.go('users.list');
    };

    $scope.getStatus = function (status) {
      return USSService.decorateWithStatus(status);
    };

    $scope.navigateToCallSettings = function () {
      $state.go('call-service.settings');
    };

    $scope.selectedResourceGroupChanged = function () {
      $scope.resourceGroup.displayWarningIfNecessary();
      $scope.setShouldShowButtons();
    };

    $scope.setShouldShowButtons = function () {
      if ($scope.resourceGroup.show) {
        if ($scope.resourceGroup.hasChanged()) {
          $scope.showButtons = true;
          return;
        }
      }
      $scope.showButtons = entitlementHasChanged();
    };
  }

}());
