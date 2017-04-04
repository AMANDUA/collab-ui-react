import { PrivateTrunkPrereqService } from 'modules/hercules/private-trunk/prereq/private-trunk-prereq.service';
import { IToolkitModalService } from 'modules/core/modal';

export class PrivateTrunkSetupCtrl implements ng.IComponentController {
  private static readonly MAX_INDEX: number = 4;
  private static readonly MIN_INDEX: number = 1;
  public domainSelected: Array<string> = [];
  public onChangeFn: Function;
  public isNext: boolean = false;
  public currentStepIndex: number;
  public isNextButton: boolean = false;
  public domains: Array<string>;

  /* @ngInject */
  constructor(
    private PrivateTrunkPrereqService: PrivateTrunkPrereqService,
    private $state: ng.ui.IStateService,
    private $modal: IToolkitModalService,
  ) {
  }

  public $onInit(): void {
    this.currentStepIndex = 1;
    this.PrivateTrunkPrereqService.getVerifiedDomains().then(verifiedDomains => {
      this.domains = verifiedDomains;
    });
  }

  public nextStep(): void {
    this.currentStepIndex = (this.currentStepIndex < PrivateTrunkSetupCtrl.MAX_INDEX) ? ++this.currentStepIndex : this.currentStepIndex;
  }

  public previousStep(): void {
    this.currentStepIndex = (this.currentStepIndex > PrivateTrunkSetupCtrl.MIN_INDEX) ? --this.currentStepIndex : this.currentStepIndex;
  }

  public setSelectedDomain(nextButton: boolean, domains: Array<string>): void {
    this.domainSelected = domains;
    this.isNextButton = nextButton;
  }

  public dismiss(): void {
    this.$modal.open({
      templateUrl: 'modules/hercules/private-trunk/setup/private-trunk-cancel-confirm.html',
      type: 'dialog',
    })
      .result.then(() => {
        this.PrivateTrunkPrereqService.dismissModal();
        this.$state.go('services-overview');
      });
  }

}

export class PrivateTrunkSetupComponent implements ng.IComponentOptions {
  public controller = PrivateTrunkSetupCtrl;
  public templateUrl = 'modules/hercules/private-trunk/setup/private-trunk-setup.html';
  public bindings = {
    domains: '<',
  };
}