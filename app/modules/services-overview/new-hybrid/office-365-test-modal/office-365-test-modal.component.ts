import { CloudConnectorService } from 'modules/hercules/services/calendar-cloud-connector.service';
import { Notification } from 'modules/core/notifications';

import './office-365-test-modal.scss';

class Office365TestModalController implements ng.IComponentController {
  public close: Function;
  public dismiss: Function;
  public validationMessages = {
    required: this.$translate.instant('common.invalidRequired'),
    email: this.$translate.instant('common.invalidEmail'),
  };
  public emailTestingForm: ng.IFormController;
  public email: string;
  public loading = false;
  public success = false;

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private $state: ng.ui.IStateService,
    private Authinfo,
    private CloudConnectorService: CloudConnectorService,
    private Notification: Notification,
    private Userservice,
  ) {}

  public $onInit() {
    if (!_.isUndefined(this.Authinfo.getPrimaryEmail())) {
      this.email = this.Authinfo.getPrimaryEmail();
    } else {
      this.Userservice.getUser('me', false, _.noop).then((response) => {
        const data = response.data;
        if (data.emails) {
          this.Authinfo.setEmails(data.emails);
          this.email = this.Authinfo.getPrimaryEmail();
        }
      });
    }
  }

  public test(email: string): void {
    this.loading = true;
    this.CloudConnectorService.confirmO365Provisioning(email)
      .then(() => {
        this.success = true;
      })
      .catch((error) => {
        this.loading = false;
        // TODO: if status === 412 use an error message saying that it's a timeout and that
        // they should try again
        this.Notification.errorWithTrackingId(error, 'hercules.genericFailure');
      });
  }

  public handleKeypress(event: KeyboardEvent): void {
    if (event.keyCode === 13 && this.emailTestingForm.$valid) {
      this.test(this.email);
    }
  }

  public goToUsers(): void {
    this.dismiss();
    this.$state.go('users.list');
  }

  public manageUsers(): void {
    this.dismiss();
    this.$state.go('users.list')
      .then(() => {
        this.$state.go('users.manage.picker');
      });
  }
}

export class Office365TestModalComponent implements ng.IComponentOptions {
  public controller = Office365TestModalController;
  public template = require('modules/services-overview/new-hybrid/office-365-test-modal/office-365-test-modal.html');
  public bindings = {
    close: '&',
    dismiss: '&',
  };
}