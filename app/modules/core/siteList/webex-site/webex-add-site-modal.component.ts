import './webex-site.scss';

import { IWebExSite, IConferenceLicense, IWebexLicencesPayload } from 'modules/core/setupWizard/meeting-settings/meeting-settings.interface';
import { WebExSite } from 'modules/core/setupWizard/meeting-settings/meeting-settings.model';
import { SetupWizardService } from 'modules/core/setupWizard/setup-wizard.service';
import { Config } from 'modules/core/config/config';
import { EventNames } from './webex-site.constants';

class WebexAddSiteModalController implements ng.IComponentController {

  public currentStep = 0;
  public firstStep = 0;
  private static totalSteps = 4;
  private isCanProceed = true;
  public sitesArray: IWebExSite[] = [];
  public meetingLicenses: { offerName, volume }[] = [];
  public existingWebexSites;
  public conferenceServices;
  public subscriptionList: string[];
  public currentSubscription?: string;
  public audioLicenses: {}[] = [];
  public audioPackage?: string;
  private audioPartnerName = '';
  public distributedLicensesArray = [];
  public dismiss: Function;
  public isLoading = false;
  private events = [null, EventNames.validateTransferSite, EventNames.addSites, null];


  /* @ngInject */
  constructor(
    private Config: Config,
    private SetupWizardService: SetupWizardService,
    private $rootScope: ng.IRootScopeService,
  ) {
  }

  public $onChanges(changes: ng.IOnChangesObject): void {
    if (changes.subscriptionList) {
      this.subscriptionList = _.clone(changes.subscriptionList.currentValue);
      this.changeCurrentSubscription(_.first(this.subscriptionList));
      if (this.subscriptionList.length === 1) {
        this.firstStep = 1;
        this.next();
      }
    }
    if (changes.audioLicenses) {
      this.audioLicenses = _.clone(changes.audioLicenses.currentValue);
      this.audioPackage = this.getAudioPackage(this.audioLicenses);
    }
  }

  // wizard navigation logic
  public cancel(): void {
    this.dismiss();
  }

  public isNextDisabled(): boolean {
    switch (this.currentStep) {
      case 0: {
        return _.isEmpty(this.currentSubscription);
      }
      case 1: {
        return !this.isCanProceed;
      }
      case 2: {
        return !this.isCanProceed;
      }
      case 3: {
        return !this.isCanProceed;
      }
      default: {
        return true;
      }
    }
  }

  public hasNext(): boolean {
    return this.currentStep < (WebexAddSiteModalController.totalSteps - 1);
  }

  //if there is not an event associated with a step: - proceed. Otherwise - emit event and set loading
  public next(): void {
    if (this.hasNext()) {
      const event = this.events[this.currentStep];
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

  private advanceStep() {
    this.currentStep = this.currentStep + 1;
    if (this.currentStep !== 1) {
      this.isCanProceed = false;
    }
  }

  public getCurrentStep(): number {
    return this.currentStep - this.firstStep + 1;
  }

  public getTotalSteps(): number {
    return WebexAddSiteModalController.totalSteps - this.firstStep;
  }


  // callbacks from components
  public changeCurrentSubscription(subscription) {
    this.currentSubscription = subscription;
    const confServicesInActingSubscription = this.getConferenceServicesInActingSubscription();
    this.audioPackage = this.getAudioPackage(this.audioLicenses);
    this.sitesArray = this.transformExistingSites(confServicesInActingSubscription);
    this.existingWebexSites = this.getExistingWebexSites(confServicesInActingSubscription);
    this.meetingLicenses = this.getMeetingLicensesGroupedByOfferName(confServicesInActingSubscription);
  }

  public addTransferredSites(sites, isValid) {
    this.sitesArray = _.concat(this.sitesArray, sites);
    this.isLoading = false;
    if (isValid) {
      this.advanceStep();
    }
  }

  public addNewSites(sites, isValid) {
    this.sitesArray = _.concat(this.sitesArray, sites);
    this.isLoading = false;
    if (isValid) {
      this.advanceStep();
    }
  }

  public updateSitesWithNewDistribution(sites, isValid) {
    if (isValid) {
      this.distributedLicensesArray = sites;
      this.isCanProceed = true;
    } else {
      this.distributedLicensesArray = [];
      this.isCanProceed = false;
    }
  }

  public onValidationStatusChange(isValid) {
    this.isCanProceed = isValid;
  }

  // data massaging
  private getConferenceServicesInActingSubscription() {
    const actingSubscriptionLicenses = _.chain(this.conferenceServices)
      .map('license')
      .filter({ billingServiceId: this.currentSubscription })
      .value();
    const existingConferenceServicesInActingSubscripton = _.filter(actingSubscriptionLicenses,
      (license: IConferenceLicense) => _.includes([this.Config.offerCodes.EE, this.Config.offerCodes.MC, this.Config.offerCodes.EC, this.Config.offerCodes.TC, this.Config.offerCodes.SC], license.offerName));
    return existingConferenceServicesInActingSubscripton;
  }

  private getAudioPackage(audioLicenses): string | undefined {
    const license = _.filter(audioLicenses, { billingServiceId: this.currentSubscription });
    return _.get(license, '[0].offerName');
  }

  private transformExistingSites(confServicesInActingSubscription): IWebExSite[] {
    return _.chain(confServicesInActingSubscription).map('siteUrl').uniq().map(siteUrl => {
      return {
        siteUrl: _.replace(siteUrl.toString(), this.Config.siteDomainUrl.webexUrl, ''),
        quantity: 0,
        centerType: '',
      };
    }).value();
  }

  private getExistingWebexSites(confServicesInActingSubscription): IWebExSite[] {
    return _.map(confServicesInActingSubscription, (license: IConferenceLicense) => {
      return {
        siteUrl: _.replace(_.get<string>(license, 'siteUrl'), this.Config.siteDomainUrl.webexUrl, ''),
        quantity: license.volume,
        centerType: license.offerName,
      };
    });
  }

  private getMeetingLicensesGroupedByOfferName(confServicesInActingSubscription): { offerName, volume }[] {
    const meetingLicensesGrouped = _.groupBy(confServicesInActingSubscription, 'offerName');
    return _.map(meetingLicensesGrouped, function (value, key) {
      return {
        offerName: key,
        volume: _.reduce(value, function (total, o) {
          return total + _.get(o, 'volume', 0);
        }, 0),
      };
    });
  }

  private saveData() {
    this.constructWebexLicensesPayload();
  }

  private constructWebexLicensesPayload(): IWebexLicencesPayload {
    const webexSiteDetailsList: WebExSite[] = [];
    const webexLicensesPayload: IWebexLicencesPayload = {
      provisionOrder: true,
      sendCustomerEmail: false,
      serviceOrderUUID: this.SetupWizardService.getActingSubscriptionServiceOrderUUID(),
    };

    const distributedLicenses = _.flatten(this.distributedLicensesArray);
    _.forEach(distributedLicenses, (site: WebExSite) => {
      if (_.get(site, 'quantity', 0) > 0) {
        const siteUrl = site.siteUrl + this.Config.siteDomainUrl.webexUrl;
        const webexSiteDetail = new WebExSite({
          centerType: site.centerType,
          quantity: _.get<number>(site, 'quantity', 0),
          siteUrl: siteUrl,
          timezone: _.get<string>(site, 'timezone.timeZoneId'),
          setupType: site.setupType,
        });
        webexSiteDetailsList.push(webexSiteDetail);
      }
    });
    _.set(webexLicensesPayload, 'webexProvisioningParams', {
      webexSiteDetailsList: webexSiteDetailsList,
      audioPartnerName: this.audioPartnerName,
    });

    // algendel 9/22 I am leaving those in since the US is not finalized and we are likely to need those soon.
    /* if (!_.isEmpty(this.ccasp.subscriptionId)) {
       _.set(webexLicensesPayload, 'webexProvisioningParams.ccaspSubscriptionId', this.ccasp.subscriptionId);
     }

     if (!_.isEmpty(this.transferSiteCode)) {
       _.set(webexLicensesPayload, 'webexProvisioningParams.transferCode', this.transferSiteCode);
     }*/
    return webexLicensesPayload;
  }
}

export class WebexAddSiteModalComponent implements ng.IComponentOptions {
  public controller = WebexAddSiteModalController;
  public template = require('modules/core/siteList/webex-site/webex-add-site-modal.html');
  public bindings = {
    subscriptionList: '<',
    conferenceServices: '<',
    audioLicenses: '<',
    dismiss: '&',
  };
}

