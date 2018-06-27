import { CtBaseController } from './ctBase.controller';
class CtAgentUnavailableController extends CtBaseController {

  private cardMode;
  /* @ngInject*/
  constructor(
    public $stateParams: ng.ui.IStateParamsService,
    public CTService,
    public $translate: ng.translate.ITranslateService,
    public TemplateWizardService,
  ) {

    super($stateParams, TemplateWizardService, CTService, $translate);
    this.TemplateWizardService.setCardMode(this.cardMode);
  }

  public $onInit(): void {
    super.$onInit();
    this.setAgentUnavailablePageValidation();
  }

  public setAgentUnavailablePageValidation(): void {
    this.TemplateWizardService.pageValidationResult.isAgentUnavailableValid =
      this.TemplateWizardService.isValidField(this.template.configuration.pages.agentUnavailable.fields.agentUnavailableMessage.displayText, this.lengthValidationConstants.multiLineMaxCharLimit) &&
      this.TemplateWizardService.isInputValid(this.template.configuration.pages.agentUnavailable.fields.agentUnavailableMessage.displayText);
  }
}

export class CtAgentUnavailableComponent implements ng.IComponentOptions {
  public controller = CtAgentUnavailableController;
  public template = require('modules/sunlight/features/customerSupportTemplate/wizardPagesComponent/ctAgentUnavailable.tpl.html');
  public bindings = {
    cardMode: '@',
  };
}

export default angular
  .module('Sunlight')
  .component('ctAgentUnavailableComponent', new CtAgentUnavailableComponent())
  .name;