import { IToolkitModalService } from 'modules/core/modal';

class HybridCalendarO365InactiveCardController implements ng.IComponentController {
  /* @ngInject */
  constructor(
    private $modal: IToolkitModalService,
    private $translate: ng.translate.ITranslateService,
    private ModalService,
  ) {}

  public openPrerequisites(): void {
    this.ModalService.open({
      hideDismiss: true,
      title: 'Not implemented yet',
      message: '🐻',
      close: this.$translate.instant('common.close'),
    });
  }

  public openSetUp(): void {
    this.$modal.open({
      template: '<office-365-setup-modal class="modal-content" close="$close()" dismiss="$dismiss()"></office-365-setup-modal>',
      type: 'full',
    });
  }
}

export class HybridCalendarO365InactiveCardComponent implements ng.IComponentOptions {
  public controller = HybridCalendarO365InactiveCardController;
  public template = `
    <article>
      <div class="inactive-card_header card_header--stretched">
        <h4 translate="servicesOverview.cards.hybridCalendar.title"></h4>
        <div class="inactive-card_logo"><img src="/images/hybrid-services/Office_365_logo_small.png" alt="{{::'servicesOverview.cards.hybridCalendar.office365Title' | translate}}"></div>
      </div>
      <div class="inactive-card_content">
        <p translate="servicesOverview.cards.hybridCalendar.description"></p>
      </div>
      <div class="inactive-card_footer">
        <!-- <p><button class="btn btn--link" ng-click="$ctrl.openPrerequisites()" translate="servicesOverview.genericButtons.prereq"></button></p> -->
        <p><button class="btn btn--primary" ng-click="$ctrl.openSetUp()" translate="servicesOverview.genericButtons.setup"></button></p>
      </div>
    </article>
  `;
}
