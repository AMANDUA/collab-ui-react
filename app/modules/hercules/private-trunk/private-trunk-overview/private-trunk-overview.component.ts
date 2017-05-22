
export class PrivateTrunkOverviewCtrl implements ng.IComponentController {

  public back: boolean = true;
  public backState = 'services-overview';
  public hasPrivateTrunkFeatureToggle: boolean;
  public tabs: [{ 'title': String, 'state': String }];
  public modalOptions: any = {
    template: '<private-trunk-setup class="modal-content" dismiss="$dismiss()"></private-trunk-setup>',
    type: 'full',
  };
  /* @ngInject */
  constructor (
    private $state: ng.ui.IStateService,
    private $translate: ng.translate.ITranslateService,
  ) {
  }

  public $onInit(): void {
    if (!this.hasPrivateTrunkFeatureToggle) {
      this.$state.go(this.backState);
    }

    this.tabs = [{
      title: this.$translate.instant('servicesOverview.cards.privateTrunk.buttons.resources'),
      state: 'private-trunk-overview.list',
    }, {
      title: this.$translate.instant('servicesOverview.cards.hybridCall.buttons.settings'),
      state: 'private-trunk-overview.settings',
    }];
  }

}

export class PrivateTrunkOverviewComponent implements ng.IComponentOptions {
  public controller = PrivateTrunkOverviewCtrl;
  public templateUrl = 'modules/hercules/private-trunk/private-trunk-overview/private-trunk-overview.html';
  public bindings = {
    hasPrivateTrunkFeatureToggle: '<',
  };
}