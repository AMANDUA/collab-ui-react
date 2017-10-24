import { Config } from 'modules/core/config/config';
import { DigitalRiverService } from 'modules/online/digitalRiver/digitalRiver.service';
import { IOrderDetail } from './myCompanyOrders.service';
import { Notification } from 'modules/core/notifications';
import { MyCompanyOrdersService } from './myCompanyOrders.service';

const COMPLETED = 'COMPLETED';
const CLOSED = 'CLOSED';
const TRIAL = 'Trial';
const FREE = 'Free';

class MyCompanyOrdersCtrl implements ng.IComponentController {

  public gridOptions: uiGrid.IGridOptions;
  public loading: boolean = false;
  public logoutLoading: boolean = true;
  public orderDetailList: IOrderDetail[] = [];

  public digitalRiverOrderHistoryUrl: string;
  public digitalRiverLogoutUrl: string;

  /* @ngInject */
  constructor(
    private $translate: angular.translate.ITranslateService,
    private Config: Config,
    private DigitalRiverService: DigitalRiverService,
    private Notification: Notification,
    private MyCompanyOrdersService: MyCompanyOrdersService,
  ) {}

  public $onInit(): void {
    this.loading = true;
    this.initGridOptions();
    this.MyCompanyOrdersService.getOrderDetails().then(orderDetails => {
      // create a modified version of the order details to display in the table, excluding closed orders
      _.map(_.filter(orderDetails, orderDetail => orderDetail.status !== CLOSED), (origOrderDetail: any) => {
        const orderDetail: IOrderDetail = {
          externalOrderId: origOrderDetail.externalOrderId,
          orderDate: origOrderDetail.orderDate,
          total: origOrderDetail.total,
          productDescriptionList: _.map<string, string>(origOrderDetail.productList, 'description').join(', '),
          isTrial: false,
          status: this.$translate.instant('myCompanyOrders.pending'),
          invoiceURL: '',
        };
        if (_.includes(orderDetail.productDescriptionList, TRIAL) ||
            _.includes(orderDetail.productDescriptionList, FREE)) {
          // trial orders don't display a price
          orderDetail.isTrial = true;
        } else {
          // generate the URL to display the Digital River invoice
          const product = _.includes(orderDetail.productDescriptionList, this.Config.onlineProducts.webex)
            ? this.Config.onlineProducts.webex : this.Config.onlineProducts.spark;
          this.DigitalRiverService.getInvoiceUrl(orderDetail.externalOrderId, product)
            .then((invoiceUrl: string): void => {
              orderDetail.invoiceURL = invoiceUrl;
            });
        }
        if (COMPLETED === origOrderDetail.status) {
          orderDetail.status = this.$translate.instant('myCompanyOrders.completed');
        } else if (this.Config.webexSiteStatus.PENDING_PARM === origOrderDetail.status) {
          orderDetail.status = this.$translate.instant('myCompanyOrders.pendingActivation');
        }
        this.orderDetailList.push(orderDetail);
      });
      // sort orders with newest on top
      this.orderDetailList.sort((a: IOrderDetail, b: IOrderDetail): number => {
        if (a.orderDate < b.orderDate) {
          return 1;
        } else {
          return 0;
        }
      });
    }).catch((response) => {
      this.Notification.errorWithTrackingId(response, 'myCompanyOrders.loadError');
    }).finally(() => {
      this.loading = false;
    });
  }

  private initGridOptions(): void {
    this.gridOptions = {
      data: '$ctrl.orderDetailList',
      multiSelect: false,
      rowHeight: 45,
      enableRowSelection: false,
      enableRowHeaderSelection: false,
      enableColumnMenus: false,
      enableHorizontalScrollbar: 0,
      columnDefs: [{
        name: 'externalOrderId',
        displayName: this.$translate.instant('myCompanyOrders.numberHeader'),
        width: '14%',
      }, {
        name: 'productDescriptionList',
        displayName: this.$translate.instant('myCompanyOrders.descriptionHeader'),
        width: '*',
      }, {
        name: 'orderDate',
        displayName: this.$translate.instant('myCompanyOrders.dateHeader'),
        cellFilter: 'date',
        width: '14%',
      }, {
        name: 'status',
        displayName: this.$translate.instant('myCompanyOrders.statusHeader'),
        width: '14%',
      }, {
        name: 'total',
        displayName: this.$translate.instant('myCompanyOrders.priceHeader'),
        cellTemplate: require('modules/core/myCompany/orders/myCompanyOrdersAction.tpl.html'),
        width: '14%',
      }],
    };
  }
}

angular
  .module('Core')
  .component('myCompanyOrders', {
    template: require('modules/core/myCompany/orders/myCompanyOrders.tpl.html'),
    controller: MyCompanyOrdersCtrl,
  });
