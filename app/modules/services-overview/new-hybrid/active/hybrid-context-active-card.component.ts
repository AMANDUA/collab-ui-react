class HybridContextActiveCardController implements ng.IComponentController {
  /* @ngInject */
  constructor(
  ) {}
}

export class HybridContextActiveCardComponent implements ng.IComponentOptions {
  public controller = HybridContextActiveCardController;
  public template = `
    <article>
      <div class="active-card_header">
        <h4 translate="servicesOverview.cards.hybridContext.title"></h4>
      </div>
      <div class="active-card_content">
        <p translate="servicesOverview.cards.hybridContext.description"></p>
        <p><span>Resources</span></p>
        <p><a ui-sref="context-resources">View all</a></p>
      </div>
      <div class="active-card_footer">
        <a ui-sref="context-resources">
          <cs-statusindicator ng-model="$ctrl.serviceStatus.cssClass"></cs-statusindicator>
          <span translate="{{'servicesOverview.cardStatus.'+$ctrl.serviceStatus.status}}"></span>
        </a>
      </div>
    </article>
  `;
  public bindings = {
    serviceStatus: '<',
  };
}