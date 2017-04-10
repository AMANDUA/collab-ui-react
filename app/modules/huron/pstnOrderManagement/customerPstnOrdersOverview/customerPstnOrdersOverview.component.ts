export class CustomerPstnOrdersOverviewComponent implements ng.IComponentOptions {
  public controller = CustomerPstnOrdersOverviewCtrl;
  public templateUrl = 'modules/huron/pstnOrderManagement/customerPstnOrdersOverview/customerPstnOrdersOverview.html';
  public bindings = {
    currentCustomer: '<',
  };
}

export class CustomerPstnOrdersOverviewCtrl implements ng.IComponentController {
  public currentCustomer: {};
  /* @ngInject */
}
