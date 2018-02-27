(function () {
  'use strict';

  angular.module('Squared')
    .controller('BillingCtrl', BillingCtrl);

  /* @ngInject */
  function BillingCtrl($scope, $filter, $translate, Notification, Log, PageParam, $stateParams, BillingService) {
    var enc;
    $scope.orderDetails = [];

    if (PageParam.getParam('enc')) {
      enc = PageParam.getParam('enc');
      PageParam.clear();
    } else if ($stateParams.enc) {
      enc = $stateParams.enc;
    }

    var getOrderStatus = function (enc) {
      BillingService.getOrderStatus(enc, function (data, status) {
        if (data.success) {
          $scope.orderDetails.push(data);
        } else {
          Log.debug('Failed to retrieve order status. Status: ' + status);
          Notification.error('billingPage.errOrderStatus', {
            status: status,
          });
        }
      });
    };

    if (enc != null) {
      getOrderStatus(enc);
    }

    $scope.resendCustomerEmail = function (orderId) {
      BillingService.resendCustomerEmail(orderId, function (data, status) {
        if (data != null) {
          Notification.success('billingPage.customerEmailSuccess');
        } else {
          Log.debug('Failed to resend customer email. Status: ' + status);
          Notification.error('billingPage.errCustomerEmail', {
            status: status,
          });
        }
        angular.element('.open').removeClass('open');
      });
    };

    $scope.resendPartnerEmail = function (orderId) {
      BillingService.resendPartnerEmail(orderId, function (data, status) {
        if (data != null) {
          Notification.success('billingPage.partnerEmailSuccess');
        } else {
          Log.debug('Failed to resend customer email. Status: ' + status);
          Notification.error('billingPage.errPartnerEmail', {
            status: status,
          });
        }
        angular.element('.open').removeClass('open');
      });
    };

    var actionsTemplate = '<span cs-dropdown class="actions-menu">' +
      '<button cs-dropdown-toggle id="actionsButton" class="btn--none dropdown-toggle" ng-click="$event.stopPropagation()" ng-class="dropdown-toggle" aria-label="' +
      $translate.instant('common.close') + '">' +
      '<i class="icon icon-three-dots"></i>' +
      '</button>' +
      '<ul cs-dropdown-menu class="dropdown-menu dropdown-primary" role="menu">' +
      '<li id="resendCustomerEmail"><a href ng-click="$event.stopPropagation(); grid.appScope.resendCustomerEmail(row.entity.orderId); "><span translate="billingPage.sendCustomer"></span></a></li>' +
      '<li ng-if="row.entity.partnerOrgId" id="resendPartnerEmail"><a href ng-click="$event.stopPropagation(); grid.appScope.resendPartnerEmail(row.entity.orderId); "><span translate="billingPage.sendPartner"></span></a></li>' +
      '</ul>' +
      '</span>';

    $scope.gridOptions = {
      data: 'orderDetails',
      multiSelect: false,
      showFilter: false,
      rowHeight: 44,
      enableRowHeaderSelection: false,
      enableColumnResize: true,
      enableColumnMenus: false,
      onRegisterApi: function (gridApi) {
        $scope.gridApi = gridApi;
      },
      columnDefs: [{
        field: 'sbpOrderId',
        displayName: $filter('translate')('billingPage.sbpOrderId'),
        sort: {
          direction: 'asc',
          priority: 0,
        },
      }, {
        field: 'action',
        displayName: $filter('translate')('billingPage.action'),
        sortable: false,
        cellTemplate: actionsTemplate,
      }],
    };
  }
})();
