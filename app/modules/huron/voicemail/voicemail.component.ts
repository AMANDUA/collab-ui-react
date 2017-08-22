import { HuronVoicemailService, VOICEMAIL_CHANGE } from './voicemail.service';
import { HuronUserService } from 'modules/huron/users/user.service';
import { Notification } from 'modules/core/notifications';

class VoicemailCtrl implements ng.IComponentController {
  public ownerId: string;
  public enableVoicemail: boolean;
  public customerId: string;
  public services: string[];
  public saveInProcess: boolean = false;
  public form: ng.IFormController;
  public watcher: string;
  /* @ngInject */
  public constructor(
    private HuronVoicemailService: HuronVoicemailService,
    private HuronUserService: HuronUserService,
    private $scope: ng.IScope,
    private $modal,
    private Notification: Notification,
  ) {}

  public $onInit(): void {
    if (this.ownerId) {
      this.HuronUserService.getUserServices(this.ownerId).then(data => {
        this.services = data;
        this.enableVoicemail = this.HuronVoicemailService.isEnabledForUser(this.services);
      });
    }
  }

  public save() {
    if (!this.enableVoicemail) {
      this.$modal.open({
        templateUrl: 'modules/huron/voicemail/disableConfirmation.tpl.html',
        scope: this.$scope,
        type: 'dialog',
      }).result.then(() => {
        this.saveInProcess = true;
        this.saveVoiceMail();
      });
    } else {
      this.saveVoiceMail();
    }
  }

  public saveVoiceMail() {
    this.HuronVoicemailService.update(this.ownerId, this.enableVoicemail, this.services).then(services => {
      this.services = services;
      this.Notification.success('voicemailPanel.success');
    })
      .catch((response) => {
        this.Notification.errorResponse(response, 'voicemailPanel.error');
      })
      .finally(() => {
        this.saveInProcess = false;
        this.reset();
        this.$scope.$emit(VOICEMAIL_CHANGE, this.enableVoicemail);
      });
  }

  public reset() {
    if (this.form) {
      this.form.$setPristine();
      this.form.$setUntouched();
    }
  }
}

export class VoicemailComponent implements ng.IComponentOptions {
  public controller = VoicemailCtrl;
  public templateUrl = 'modules/huron/voicemail/voicemail.html';
  public bindings = {
    ownerId: '<',
  };
}
