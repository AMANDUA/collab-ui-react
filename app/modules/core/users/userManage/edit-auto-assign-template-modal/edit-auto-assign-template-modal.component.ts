import { ISubscription } from 'modules/core/users/userAdd/assignable-services/shared';

class EditAutoAssignTemplateModalController implements ng.IComponentController {

  private prevState: string;
  private dismiss: Function;
  public sortedSubscriptions: ISubscription[];
  private stateData: any;  // TODO: better type

  /* @ngInject */
  constructor(
    private $state: ng.ui.IStateService,
    private Analytics,
    private Orgservice,
  ) {}

  public $onInit(): void {
    this.prevState = _.get<string>(this.$state, 'params.prevState', 'users.manage.picker');

    // restore state if provided
    const stateData = _.get(this.$state, 'params.stateData');
    if (stateData) {
      this.stateData = stateData;
      this.sortedSubscriptions = _.get(stateData, 'subscriptions');
      return;
    }

    this.Orgservice.getLicensesUsage()
      .then((subscriptions) => {
        this.sortedSubscriptions = _.sortBy(subscriptions, 'subscriptionId');
        this.stateData = {
          subscriptions: this.sortedSubscriptions,
        };
      });
  }

  public dismissModal(): void {
    this.Analytics.trackAddUsers(this.Analytics.eventNames.CANCEL_MODAL);
    this.dismiss();
  }

  public back(): void {
    this.$state.go(this.prevState);
  }

  public next(): void {
    this.$state.go('users.manage.edit-summary-auto-assign-template-modal', {
      stateData: this.stateData,
    });
  }

  public recvUpdate($event): void {
    const itemId = _.get($event, 'itemId');
    const item = _.get($event, 'item');
    if (!itemId || !item) {
      return;
    }
    // notes:
    // - item id can contain potentially period chars ('.')
    // - so we wrap interpolated value in double-quotes to prevent unintended deep property creation
    _.set(this.stateData, `items["${itemId}"]`, item);
  }
}

export class EditAutoAssignTemplateModalComponent implements ng.IComponentOptions {
  public controller = EditAutoAssignTemplateModalController;
  public template = require('./edit-auto-assign-template-modal.html');
  public bindings = {
    dismiss: '&?',
  };
}
