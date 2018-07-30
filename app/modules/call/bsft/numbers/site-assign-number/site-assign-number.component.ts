class SiteAssignNumberCtrl implements ng.IComponentController {
  public mainNumber: string;
  public vmNumber: string;
  public onChangeFn: Function;
  public onChangeVmFn: Function;
  public numberOptions: string[];
  public form: ng.IFormController;
  public placeholder: string;

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
  ) {
    this.placeholder = this.$translate.instant('common.selectNumber');
  }
  public onNumberChanged(): void {
    this.onChangeFn({
      number: this.mainNumber,
    });
  }
  public onVMNumberChanged(): void {
    this.onChangeVmFn({
      vmnumber: this.vmNumber,
    });
  }
}

export class SiteAssignNumberComponent implements ng.IComponentOptions {
  public controller = SiteAssignNumberCtrl;
  public template = require('modules/call/bsft/numbers/site-assign-number/site-assign-number.component.html');
  public bindings = {
    onChangeFn: '&',
    onChangeVmFn: '&',
    numberOptions: '<',
    mainNumber: '<',
    vmNumber: '<',
  };
}
