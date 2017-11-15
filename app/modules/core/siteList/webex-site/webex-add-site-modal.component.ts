import './webex-site.scss';

import { IWebExSite, IConferenceLicense } from 'modules/core/setupWizard/meeting-settings/meeting-settings.interface';
import { SetupWizardService } from 'modules/core/setupWizard/setup-wizard.service';
import { WebExSiteService, Actions } from './webex-site.service';
import { Notification } from 'modules/core/notifications';
import { EventNames } from './webex-site.constants';

export interface IStep {
  name: string;
  event?: EventNames;
}

class WebexAddSiteModalController implements ng.IComponentController {

  // parameters for child controls
  public sitesArray: IWebExSite[] = [];
  public conferenceLicensesInSubscription: IConferenceLicense[];
  public audioPackage: string | null;
  public audioPartnerName?: string;
  public subscriptionList: {
    id: string;
    isPending: boolean;
  }[] = [];

  // parameters received
  public singleStep?: number;
  public modalTitle: string;
  public dismiss: Function;

  // used in own ui
  public currentSubscriptionId?: string;
  public isLoading = false;
  public steps: IStep[];
  public currentStep = 0;
  public firstStep = 0;
  private totalSteps = 4;
  private isCanProceed = true;
  private webexSiteDetailsList = [];
  private ccaspSubscriptionId?: string;
  private transferCode?: string;

  /* @ngInject */
  constructor(
    private Notification: Notification,
    private SetupWizardService: SetupWizardService,
    private $rootScope: ng.IRootScopeService,
    private $translate: ng.translate.ITranslateService,
    private WebExSiteService: WebExSiteService,
  ) {

    this.steps = [{
      name: 'SELECT_SUBSCRIPTION',
    }, {
      name: 'TRANSFER_SITE',
      event: EventNames.VALIDATE_TRANSFER_SITE,
    }, {
      name: 'ADD_SITES',
      event: EventNames.ADD_SITES,
    }, {
      name: 'DISTRIBUTE_LICENSES',
    }];
  }

  public $onInit(): void {
    this.subscriptionList = this.SetupWizardService.getEnterpriseSubscriptionListWithStatus();
    const hasActionableSubscriptions = !_.isEmpty(this.subscriptionList) && !_.first(this.subscriptionList).isPending;
    if (hasActionableSubscriptions) {
      // if there are any non-pending subs the first will be non-pending
      const firstSubscription = _.first(this.subscriptionList);
      this.changeCurrentSubscription(firstSubscription.id);
      if (this.subscriptionList.length === 1 && _.isNil(this.singleStep)) {
        this.firstStep = 1;
        this.next();
      }
    } else {
      this.currentSubscriptionId = _.get(this.subscriptionList, '[0].id', '');
      this.isCanProceed = false;
      this.totalSteps = 1;
      this.singleStep = 1;
    }
  }

  public $onChanges(changes: ng.IOnChangesObject): void {
    if (changes.singleStep) {
      if (!_.isNil(changes.singleStep.currentValue)) {
        this.singleStep = this.currentStep = changes.singleStep.currentValue;
        this.totalSteps = 1;
      }
    }
    if (changes.subscriptionId) {
      this.changeCurrentSubscription(changes.subscriptionId.currentValue);
    }
  }

  // wizard navigation logic
  public cancel(): void {
    this.dismiss();
  }

  public isNextDisabled(): boolean {
    switch (this.currentStep) {
      case 0:
        return _.isEmpty(this.currentSubscriptionId) || !this.isCanProceed;
      case 1:
      case 2:
      case 3:
        return !this.isCanProceed;
      default:
        return true;
    }
  }

  public hasNext(): boolean {
    return this.currentStep < (this.totalSteps - 1);
  }

  //if there is not an event associated with a step: - proceed. Otherwise - emit event and set loading
  public next(): void {
    if (this.hasNext()) {
      const event = this.steps[this.currentStep].event;
      if (event) {
        this.isLoading = true;
        this.$rootScope.$broadcast(event);
      } else {
        this.advanceStep();
      }
    } else {
      this.saveData();
    }
  }

  public setNextEnabled(isCanProceed) {
    this.isCanProceed = isCanProceed;
  }

  private advanceStep(canProceed?: boolean) {
    this.currentStep = this.currentStep + 1;
    // you can just breeze through transfer sites. Next is enabled
    if (this.steps[this.currentStep].name !== 'TRANSFER_SITE') {
      this.isCanProceed = canProceed || false;
    }
  }

  public getCurrentStep(): number {
    return this.currentStep - this.firstStep + 1;
  }

  public getTotalSteps(): number {
    return this.totalSteps - this.firstStep;
  }

  // callbacks from components
  public changeCurrentSubscription(subscriptionId, needsSetup?: boolean) {
    if (needsSetup) {
      this.$rootScope.$broadcast(EventNames.LAUNCH_MEETING_SETUP);
      this.dismiss();
    } else {
      this.currentSubscriptionId = subscriptionId;
      this.conferenceLicensesInSubscription = this.SetupWizardService.getConferenceLicensesBySubscriptionId(subscriptionId);
      this.setAudioPackageInfo(subscriptionId);
      this.sitesArray = this.WebExSiteService.transformExistingSites(this.conferenceLicensesInSubscription);
    }
  }

  public addTransferredSites(sites, transferCode, isValid) {
    this.isLoading = false;
    if (isValid) {
      this.sitesArray = _.concat(this.sitesArray, sites);
      this.transferCode = transferCode;
      // if transferring a site - we dont have to add new one
      this.advanceStep(!_.isNil(transferCode));
    }
  }

  public addNewSites(sites, isValid) {
    this.sitesArray = _.concat(this.sitesArray, sites);
    this.isLoading = false;
    if (isValid) {
      this.advanceStep();
    }
  }

  public updateSitesWithNewDistribution(sitesWithLicenseDetail, isValid) {
    if (isValid) {
      this.webexSiteDetailsList = sitesWithLicenseDetail;
      this.isCanProceed = true;
    } else {
      this.webexSiteDetailsList = [];
      this.isCanProceed = false;
    }
  }

  private setAudioPackageInfo(subscripionId): void {
    const audioPackage = this.WebExSiteService.getAudioPackageInfo(subscripionId);
    this.audioPackage = audioPackage.audioPackage;
    if (this.audioPackage) {
      this.audioPartnerName = audioPackage.audioPartnerName;
      this.ccaspSubscriptionId = audioPackage.ccaspSubscriptionId;
    }
  }

  private saveData() {
    const action = (this.singleStep === 3) ? Actions.UPDATE : Actions.ADD;
    const payload = this.WebExSiteService.constructWebexLicensesPayload(this.webexSiteDetailsList, this.currentSubscriptionId || '',
    action, this.audioPartnerName, this.ccaspSubscriptionId, this.transferCode);
    this.SetupWizardService.updateSitesInActiveSubscription(payload)
      .then(() => {
        // TODO algendel: 10/30/17 - get real copy.
        this.Notification.success(this.$translate.instant('webexSiteManagement.addSiteSuccess'));
      })
      .catch((response) => {
        this.Notification.errorWithTrackingId(response);
      })
      .finally(() => {
        this.dismiss();
      });
  }
}

export class WebexAddSiteModalComponent implements ng.IComponentOptions {
  public controller = WebexAddSiteModalController;
  public template = require('./webex-add-site-modal.html');
  public bindings = {
    modalTitle: '<',
    dismiss: '&',
    singleStep: '<',
  };
}

