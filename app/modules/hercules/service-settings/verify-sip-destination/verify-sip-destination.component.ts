import { L2SipService, ISipDestinationSteps, VerificationStep } from 'modules/hercules/services/l2sip-service';
import { Notification } from 'modules/core/notifications';

class VerifySipDestinationComponentCtrl implements ng.IComponentController {

  public resultSet: VerificationStep[];
  public destinationUrl: string;
  private onDestinationSave: Function;
  private onResultReady: Function;
  private onTestStarted: Function;

  public loading = false;

  /* @ngInject */
  constructor(
    private L2SipService: L2SipService,
    private Notification: Notification,
  ) {}

  public $onChanges(changes: {[bindings: string]: ng.IChangesObject<any>}) {
    const { destinationUrl } = changes;
    if (destinationUrl && destinationUrl.currentValue) {
      this.destinationUrl = destinationUrl.currentValue;
    }
  }

  public runTests(): void {
    this.loading = true;
    this.onTestStarted();
    this.L2SipService.verifySipDestination(this.destinationUrl, true)
      .then((result: ISipDestinationSteps) => {
        this.resultSet =  result.steps;
        this.onResultReady({
          succeeded: this.didTestSucceed(this.resultSet),
          resultSet: this.resultSet,
        });
      })
      .catch((error) => {
        this.Notification.errorWithTrackingId(error, 'hercules.settings.verifySipDestination.testHadUnexpectedError');
      })
      .finally(() => {
        this.loading = false;
      });
  }

  private didTestSucceed(resultSet): boolean {
    return !_.some(resultSet, (result: VerificationStep) => {
      return result.severity === 'Error';
    });
  }

  public save(): void {
    this.onDestinationSave();
  }
}

export class VerifySipDestinationComponent implements ng.IComponentOptions {
  public controller = VerifySipDestinationComponentCtrl;
  public templateUrl = 'modules/hercules/service-settings/verify-sip-destination/verify-sip-destination.html';
  public bindings = {
    destinationUrl: '<',
    onDestinationSave: '&',
    onResultReady: '&',
    onTestStarted: '&',
  };
}
