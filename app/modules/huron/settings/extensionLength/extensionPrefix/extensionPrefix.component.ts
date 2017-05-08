import { ExtensionLengthService } from './extensionLength.service';
import { Notification } from 'modules/core/notifications';

class ExtensionPrefixCtrl implements ng.IComponentController {
  public extensionPrefix: string;
  public newExtensionLength: string;
  public oldExtensionLength: string;
  public prefixLength: number;
  public close: Function;
  public dismiss: Function;
  public extensionPrefixForm: ng.IFormController;
  public processing: boolean = false;
  public exampleExtensionHelpText: string = '';

  /* @ngInject */
  constructor(
    private ExtensionLengthService: ExtensionLengthService,
    private $translate: ng.translate.ITranslateService,
    private Notification: Notification,
  ) { }

  public $onInit(): void {
    this.prefixLength = _.toSafeInteger(this.newExtensionLength) - _.toSafeInteger(this.oldExtensionLength);
    this.exampleExtensionHelpText = this.getExampleExtension(this.extensionPrefix);
  }

  public onExtensionPrefixChanges() {
    this.exampleExtensionHelpText = this.getExampleExtension(this.extensionPrefix);
  }

  public save(): void {
    this.processing = true;
    this.ExtensionLengthService.saveExtensionLength(this.newExtensionLength, this.extensionPrefix)
      .then( () => {
        this.Notification.success('serviceSetupModal.extensionLengthSaveSuccess');
        this.close();
      })
      .catch(error => {
        this.Notification.errorWithTrackingId(error, 'serviceSetupModal.extensionLengthSaveFail');
      })
      .finally( () => this.processing = false);
  }

  private getExampleExtension(extensionPrefix: string): string {
    return this.$translate.instant('serviceSetupModal.extensionPrefixExample', { prefix: extensionPrefix });
  }

}

export class ExtensionPrefixComponent implements ng.IComponentOptions {
  public controller = ExtensionPrefixCtrl;
  public templateUrl = 'modules/huron/settings/extensionLength/extensionPrefix/extensionPrefix.html';
  public bindings = {
    newExtensionLength: '<',
    oldExtensionLength: '<',
    close: '&',
    dismiss: '&',
  };
}
