import { PrivateTrunkPrereqService } from 'modules/hercules/private-trunk/private-trunk-prereq';
import { Notification } from 'modules/core/notifications';

export class EPTInactiveCardController implements ng.IComponentController {
  public loading = true;
  public canSetup = false;

  /* @ngInject */
  constructor(
    private Notification: Notification,
    private PrivateTrunkPrereqService: PrivateTrunkPrereqService,
  ) {}

  public $onInit(): void {
    this.PrivateTrunkPrereqService.getVerifiedDomains()
      .then(domains => {
        this.canSetup = domains.length > 0;
      })
      .catch((err) => {
        this.Notification.errorWithTrackingId(err, 'hercules.genericFailure');
      })
      .finally(() => {
        this.loading = false;
      });
  }

  public openPrerequisites(): void {
    this.PrivateTrunkPrereqService.openPreReqModal();
  }

  public openSetUp(): void {
    this.PrivateTrunkPrereqService.openSetupModal();
  }
}

export class EPTInactiveCardComponent implements ng.IComponentOptions {
  public controller = EPTInactiveCardController;
  public template = `
    <article>
      <div class="inactive-card_header">
        <h4 translate="servicesOverview.cards.privateTrunk.title"></h4>
      </div>
      <div ng-if="$ctrl.loading">
        <i class="icon icon-spinner icon-2x"></i>
      </div>
      <div class="inactive-card_content" ng-if="!$ctrl.loading">
        <p translate="servicesOverview.cards.privateTrunk.description"></p>
      </div>
      <div class="inactive-card_footer" ng-if="!$ctrl.loading">
        <p><button class="btn btn--link" ng-click="$ctrl.openPrerequisites()" translate="servicesOverview.genericButtons.prereq"></button></p>
        <p><button class="btn btn--primary" ng-disabled="!$ctrl.canSetup" ng-click="$ctrl.openSetUp()" translate="servicesOverview.genericButtons.setup"></button></p>
      </div>
    </article>
  `;
}
