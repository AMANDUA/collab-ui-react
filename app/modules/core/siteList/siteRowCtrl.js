require('./_site-list.scss');

(function () {
  'use strict';

  angular
    .module('Core')
    .controller('WebExSiteRowCtrl', WebExSiteRowCtrl);

  /*@ngInject*/
  function WebExSiteRowCtrl($log, $modal, $scope, $sce, $state, $stateParams, $timeout, $translate, accountLinkingPhase2, FeatureToggleService, ModalService, TokenService, WebExUtilsFact, WebExSiteRowService, Utils) {
    var vm = this;
    vm.showGridData = false;
    vm.isShowAddSite = false;
    vm.canAddSite = WebExSiteRowService.canAddSite();
    vm.isAdminPage = Utils.isAdminPage();

    $log.debug('StateParams in sitreRowCrtl', $stateParams);

    var dontShowLinkedSites = accountLinkingPhase2;
    FeatureToggleService.atlasWebexAddSiteGetStatus().then(function (result) {
      vm.isShowAddSite = result;
    });

    WebExSiteRowService.initSiteRows(dontShowLinkedSites);
    vm.gridOptions = WebExSiteRowService.getGridOptions();

    vm.gridOptions.appScopeProvider = vm;

    vm.linkToReports = function (siteUrl) {
      $state.go('reports.webex-metrics', { siteUrl: siteUrl });
    };

    vm.linkToSiteAdminHomePage = function (siteUrl) {
      linkTOSiteAdminPage.call(vm, siteUrl, false);
    };

    vm.linkToSiteAdminLinkedPage = function (siteUrl) {
      linkTOSiteAdminPage.call(vm, siteUrl, true);
    };

    vm.trustSrc = function (src) {
      return $sce.trustAsResourceUrl(src);
    };

    vm.redistributeLicenses = function (entity) {
      if (vm.canModify(entity)) {
        $state.go('site-list-distribute-licenses', { subscriptionId: entity.billingServiceId });
      } else {
        var isOnlySite = isOnlySiteInSubscription(entity);
        var errorMessage = isOnlySite ? 'webexSiteManagement.redistributeRejectModalBodyOnlySite' : 'webexSiteManagement.redistributeRejectModalBodyPending';
        showRejectionModal(isOnlySite, 'webexSiteManagement.redistributeRejectModalTitle', errorMessage);
      }
    };

    vm.addSite = function () {
      if (WebExSiteRowService.hasNonPendingSubscriptions()) {
        $state.go('site-list-add');
      } else {
        showRejectionModal(false, 'webexSiteManagement.addSiteRejectModalTitle', 'webexSiteManagement.addSiteRejectPending');
      }
    };

    vm.canModify = function (entity) {
      return !isOnlySiteInSubscription(entity) && !WebExSiteRowService.isSubscriptionPending(entity.billingServiceId);
    };

    vm.deleteSite = function (entity) {
      var subscriptionId = entity.billingServiceId;
      var siteUrl = entity.siteUrl;
      if (vm.canModify(entity)) {
        $modal.open({
          type: 'dialog',
          template: require('./siteDeleteConfirmModal.tpl.html'),
          controller: function () {
            var ctrl = this;
            ctrl.siteUrl = siteUrl;
          },
          controllerAs: '$ctrl',
        }).result.then(function () {
          deleteSite(subscriptionId, siteUrl);
        });
      } else {
        var isOnlySite = isOnlySiteInSubscription(entity);
        var errorMessage = isOnlySite ? 'webexSiteManagement.deleteSiteRejectModalBodyOnlySite' : 'webexSiteManagement.deleteSiteRejectModalBodyPending';
        showRejectionModal(isOnlySite, 'webexSiteManagement.deleteSiteRejectModalTitle', errorMessage);
      }
    };
    vm.showGridData = true;

    // kill the csv poll when navigating away from the site list page
    $scope.$on('$destroy', function () {
      WebExSiteRowService.stopPolling();
      WebExSiteRowService.initSiteRowsObj(); // this will allow re-entry to this page to use fresh content
    });

    function deleteSite(subscriptionId, siteUrl) {
      var sites = WebExSiteRowService.getLicensesInSubscriptionGroupedBySites(subscriptionId);
      if (_.keys(sites).length === 2) {
        var remainingSite = moveLicensesToRemainingSite(subscriptionId, sites, siteUrl);
        WebExSiteRowService.deleteSite(siteUrl, remainingSite);
        //TODO: algendel 10/16/2017 -- call backend API to update licenses and remove the site.
      } else { //open modal to redistribute licenses
        $state.go('site-list-delete', { subscriptionId: subscriptionId, siteUrl: siteUrl });
      }
    }

    function isOnlySiteInSubscription(entity) {
      if (!entity.billingServiceId) {
        return true;
      }
      var siteUrl = _.keys(WebExSiteRowService.getLicensesInSubscriptionGroupedBySites(entity.billingServiceId, entity.siteUrl));
      return siteUrl.length === 1;
    }

    function moveLicensesToRemainingSite(subscriptionId, sites, urlToRemove) {
      var keys = _.keys(sites);
      _.pull(keys, urlToRemove);
      var siteToRemove = sites[urlToRemove];
      var remainingSite = _.map(sites[keys[0]], function (s) {
        return {
          offerName: s.offerName,
          volume: s.volume,
          siteUrl: s.siteUrl,
        };
      });

      _.forEach(siteToRemove, function (license) {
        var i = _.findIndex(remainingSite, { offerName: license.offerName });
        if (i > -1) {
          remainingSite[i].volume = remainingSite[i].volume + license.volume;
        } else {
          remainingSite.push(
            {
              offerName: license.offerName,
              volume: license.volume,
              siteUrl: license.siteUrl,
            });
        }
      });
      return remainingSite;
    }

    function linkTOSiteAdminPage(siteUrl, toLinkedPage) {
      var adminUrl = [];
      adminUrl.push(WebExUtilsFact.getSiteAdminUrl(siteUrl));
      if (toLinkedPage) {
        adminUrl.push('&mainPage=');
        adminUrl.push(encodeURIComponent('accountlinking.do?siteUrl='));
        adminUrl.push(WebExUtilsFact.getSiteName(siteUrl));
      }
      vm.siteAdminUrl = adminUrl.join('');

      vm.accessToken = TokenService.getAccessToken();
      $timeout(function () {
        angular.element('#webExLinkedSiteFormBtn').click();
      }, 100);
    }

    function goToMeetingSetup() {
      $state.go('setupwizardmodal', {
        currentTab: 'meetingSettings',
        onlyShowSingleTab: true,
        showStandardModal: true,
      });
    }

    function showRejectionModal(isOnlySite, title, errorMessage) {
      var params = {
        title: $translate.instant(title),
        message: $translate.instant(errorMessage),
      };
      if (isOnlySite) {
        params.close = $translate.instant('common.dismiss');
        params.hideDismiss = true;
        //close: isOnlySite ? undefined : $translate.instant('common.setUp'),
      } else {
        params.dismiss = $translate.instant('common.dismiss');
        params.close = $translate.instant('common.setUp');
      }
      ModalService.open(params).result.then(function () {
        if (!isOnlySite) {
          goToMeetingSetup();
        }
      });
    }
  } // WebExSiteRowCtrl()
})(); // top level function
