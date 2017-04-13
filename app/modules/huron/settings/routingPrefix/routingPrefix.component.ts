class RoutingPrefixCtrl implements ng.IComponentController {
  public routingPrefix: string | null;
  public onChangeFn: Function;
  public prefixRadio: string = 'none';
  public messages: any = {};

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
  ) {}

  public $onInit(): void {
    this.messages = {
      required: this.$translate.instant('validation.required'),
      pattern: this.$translate.instant('serviceSetupModal.routingPrefix.numericOnlyError'),
      minlength: this.$translate.instant('serviceSetupModal.routingPrefix.tooShortError'),
      maxlength: this.$translate.instant('serviceSetupModal.routingPrefix.tooLongError'),
    };
  }

  public $onChanges(changes: { [bindings: string]: ng.IChangesObject }): void {
    const { routingPrefix } = changes;
    if (routingPrefix) {
      if (_.isNull(routingPrefix.currentValue)) {
        this.prefixRadio = 'none';
      } else {
        this.prefixRadio = 'reserve';
      }
    }
  }

  public onNoneClicked(): void {
    this.routingPrefix = null;
    this.onRoutingPrefixChanged();
  }

  public onRoutingPrefixChanged(): void {
    this.onChangeFn({
      routingPrefix: this.routingPrefix,
    });
  }

}

export class RoutingPrefixComponent implements ng.IComponentOptions {
  public controller = RoutingPrefixCtrl;
  public templateUrl = 'modules/huron/settings/routingPrefix/routingPrefix.html';
  public bindings = {
    routingPrefix: '<',
    onChangeFn: '&',
  };
}
