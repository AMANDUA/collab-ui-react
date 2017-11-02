

class WebexSiteSubscriptionCtrl implements ng.IComponentController {

  /* @ngInject */
  constructor(
    private $state: ng.ui.IStateService,
    private $translate: ng.translate.ITranslateService,
  ) {
  }
  public subscriptionForm: ng.IFormController;

  public currentSubscriptionId;
  public currentSubscription: {
    id: string;
    isPending: boolean;
  };
  public selectPlaceholder = this.$translate.instant('common.select');
  public subscriptions: {
    id: string;
    isPending: boolean;
  }[];
  //public subscriptionList
  public onSubscriptionChange: Function;
  public onValidationStatusChange: Function;
  public isPending = false;

  public $onInit() {
    this.currentSubscription = _.find(this.subscriptions, { id: this.currentSubscriptionId });
    if (this.currentSubscription.isPending) {
      this.isPending = true;
    }
  }

  public setSubscription() {
    this.isPending = this.currentSubscription.isPending;
    this.onValidationStatusChange({ isValid: !this.currentSubscription.isPending });
    if (!this.currentSubscription.isPending) {
      this.onSubscriptionChange({ subId: this.currentSubscription.id });
    }
  }

  public goToMeetingSetup() {
    this.$state.go('setupwizardmodal', {
      currentTab: 'meetingSettings',
      onlyShowSingleTab: true,
      showStandardModal: true,
    });
  }
}

export class WebexSiteSubscriptionComponent implements ng.IComponentOptions {
  public controller = WebexSiteSubscriptionCtrl;
  public template = require('./webex-site-subscription.html');
  public bindings = {
    subscriptions: '<',
    onSubscriptionChange: '&',
    currentSubscriptionId: '<',
    onValidationStatusChange: '&',
  };
}

