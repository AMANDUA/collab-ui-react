import { DigitalRiverService } from 'modules/online/digitalRiver/digitalRiver.service';
import { Notification } from 'modules/core/notifications';
import { OnlineUpgradeService, IBmmpAttr, IProdInst } from 'modules/online/upgrade/upgrade.service';
import { IOfferData, IOfferWrapper, ISubscription, ISubscriptionCategory } from './subscriptionsInterfaces';
import * as moment from 'moment';
import { HybridServicesUtilsService } from 'modules/hercules/services/hybrid-services-utils.service';
import { ServiceDescriptorService } from 'modules/hercules/services/service-descriptor.service';
import { ProPackService } from 'modules/core/proPack/proPack.service';

export class MySubscriptionCtrl {
  public hybridServices: string[] = [];
  public licenseCategory: ISubscriptionCategory[] = [];
  public subscriptionDetails: ISubscription[] = [];
  public visibleSubscriptions: boolean = false;
  public hasEnterpriseTrial: boolean = false;
  public trialUrlFailed: boolean = false;
  public productInstanceFailed: boolean = false;
  public loading: boolean = false;
  public digitalRiverSubscriptionsUrl: string;
  public bmmpAttr: IBmmpAttr;
  public licenseSummary: string;
  public oneOnlineSub: boolean = false;
  public showSingleSub: boolean = false;
  public isSharedMeetingsLicense: boolean = false;
  public isProPackPurchased: boolean = false;
  public isProPackEnabled: boolean = false;
  public overage: boolean = false;

  public proPackData: IOfferData;
  public proPackList: string[] = ['subscriptions.hybridDataSecurity', 'subscriptions.advancedReporting', 'subscriptions.complianceFunctionality'];
  public premiumTooltip: string = this.$translate.instant('subscriptions.premiumTooltip');

  private readonly BASE_CATEGORY: ISubscriptionCategory = {
    offers: [],
    offerWrapper: [],
  };

  // icon classes
  private readonly MESSAGE_CLASS: string = 'icon-message';
  private readonly MEETING_CLASS: string = 'icon-meeting-room';
  private readonly WEBEX_CLASS: string = 'icon-webex';
  private readonly CALL_CLASS: string = 'icon-calls';
  private readonly CARE_CLASS: string = 'icon-headset';

  private readonly CARE: string = 'CARE';
  private readonly SUBSCRIPTION_TYPES = {
    message: 0,
    meeting: 1,
    call: 2,
    room: 3,
    care: 4,
  };
  private readonly EXPIRATION_BADGES = {
    default: 'default',
    warning: 'warning',
    alert: 'alert',
  };
  private readonly EXPIRATION_DAYS = {
    warning: 30,
    alert: 5,
    expired: 0,
  };

  /* @ngInject */
  constructor(
    private $q: ng.IQService,
    private $rootScope: ng.IRootScopeService,
    private $translate: ng.translate.ITranslateService,
    private Authinfo,
    private Config,
    private DigitalRiverService: DigitalRiverService,
    private HybridServicesUtilsService: HybridServicesUtilsService,
    private Notification: Notification,
    private OnlineUpgradeService: OnlineUpgradeService,
    private Orgservice,
    private ProPackService: ProPackService,
    private ServiceDescriptorService: ServiceDescriptorService,
    private WebExUtilsFact,
  ) {
    this.$q.all({
      isProPackEnabled: this.ProPackService.hasProPackEnabled(),
      isProPackPurchased: this.ProPackService.hasProPackPurchased(),
    }).then((toggles: any): void => {
      this.isProPackPurchased = toggles.isProPackPurchased;
      this.isProPackEnabled = toggles.isProPackEnabled;
    });

    _.forEach(this.SUBSCRIPTION_TYPES, (_value, key: string): void => {
      const category: ISubscriptionCategory = _.cloneDeep(this.BASE_CATEGORY);
      category.label = $translate.instant('subscriptions.' + key);

      this.licenseCategory.push(category);
    });

    this.hybridServicesRetrieval();
    this.subscriptionRetrieval();
  }

  public showCategory(category: ISubscriptionCategory): boolean {
    return category.offers.length > 0 || category.offerWrapper.length > 0;
  }

  public wrapsOffers(category: ISubscriptionCategory): boolean {
    return category.offerWrapper.length > 0;
  }

  public isUsageDefined(usage?: number): boolean {
    return _.isNumber(usage);
  }

  private getChangeSubURL(env: string): ng.IPromise<string> {
    return this.DigitalRiverService.getSubscriptionsUrl(env).then((subscriptionsUrl: string): string => {
      return subscriptionsUrl;
    }).catch((error: any): string => {
      this.loading = false;
      this.Notification.errorWithTrackingId(error, 'subscriptions.loadError');
      return '';
    });
  }

  private broadcastSingleSubscription(subscription: ISubscription, trialUrl?: string)  {
    this.$rootScope.$broadcast('SUBSCRIPTION::upgradeData', {
      isTrial: subscription.isTrial,
      subId: subscription.internalSubscriptionId,
      productInstanceId: subscription.productInstanceId,
      changeplanOverride: subscription.changeplanOverride,
      numSubscriptions: subscription.numSubscriptions,
      upgradeTrialUrl: trialUrl,
    });
  }

  // generating the subscription view tooltips
  private generateTooltip(offer: IOfferData, usage?: number, volume?: number): string | undefined {
    if (_.isNumber(volume)) {
      let tooltip = this.$translate.instant('subscriptions.licenseTypes.' + offer.offerName) + '<br>';
      if (this.useTotal(offer) || !_.isNumber(usage)) {
        tooltip += this.$translate.instant('subscriptions.licenses') + volume;
      } else if (usage > volume) {
        tooltip += this.$translate.instant('subscriptions.usage') + `<span class="warning">${usage}/${volume}</span>`;
      } else {
        tooltip += this.$translate.instant('subscriptions.usage') + `${usage}/${volume}`;
      }
      return tooltip;
    } else {
      return;
    }
  }

  // combines licenses for the license view
  private addSubscription(index: number, item: IOfferData, siteIndex?: number): void {
    let offers: IOfferData[];
    let exists: boolean = false;

    if (_.isNumber(siteIndex)) {
      offers = _.get(this.licenseCategory, `[${index}].offerWrapper[${siteIndex}].offers`, []);
    } else {
      offers = _.get(this.licenseCategory, `[${index}].offers`, []);
    }

    _.forEach(offers, (offer: IOfferData): void => {
      if (!exists && offer.offerName === item.offerName) {
        if (offer.usage && item.usage) {
          offer.usage += item.usage;
        }
        offer.volume += item.volume;
        exists = true;
      }
      this.setOverage(offer);
    });

    if (!exists) {
      offers.push(item);
      this.setOverage(item);
    }
  }

  private setOverage(offer: IOfferData) {
    if (!this.overage) {
      if (offer.usage) {
        this.overage = offer.usage > offer.volume;
      } else if (offer.totalUsage) {
        this.overage = offer.totalUsage > offer.volume;
      }
    }
  }

  private sortSubscription(index: number, siteIndex: number): void {
    const offers: IOfferData[] = _.get(this.licenseCategory, `[${index}].offerWrapper[${siteIndex}].offers`, []);
    this.licenseCategory[index].offerWrapper[siteIndex].offers = _.sortBy(offers, (element: IOfferData): number => {
      const rank = {
        CDC: 1,
        CVC: 2,
      };
      return rank[element.offerName];
    });
  }

  private subscriptionRetrieval(): void {
    this.Orgservice.getLicensesUsage(false).then((subscriptions: any[]): void => {
      _.forEach(subscriptions, (subscription: any, subIndex: number): void => {
        const newSubscription: ISubscription = {
          licenses: [],
          isTrial: false,
          isOnline: false,
          numSubscriptions: subscriptions.length,
          endDate: '',
          badge: '',
        };
        if (subscription.subscriptionId && (subscription.subscriptionId !== 'unknown')) {
          newSubscription.subscriptionId = subscription.subscriptionId;
        }
        if (subscription.internalSubscriptionId && (subscription.internalSubscriptionId !== 'unknown')) {
          newSubscription.internalSubscriptionId = subscription.internalSubscriptionId;
          if (subscription.internalSubscriptionId !== 'Trial') {
            newSubscription.isOnline = true;
          }
        }
        if (subscription.endDate) {
          const currentDate = new Date();
          const subscriptionEndDate = new Date(subscription.endDate);
          const timeDiff = subscriptionEndDate.getTime() - currentDate.getTime();
          const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

          newSubscription.endDate = this.$translate.instant('subscriptions.expires', { date: moment(subscriptionEndDate).format('MMM DD, YYYY') });
          if (diffDays > this.EXPIRATION_DAYS.warning) {
            newSubscription.badge = this.EXPIRATION_BADGES.default;
          } else if (diffDays > this.EXPIRATION_DAYS.alert) {
            newSubscription.badge = this.EXPIRATION_BADGES.warning;
          } else if (diffDays > this.EXPIRATION_DAYS.expired) {
            newSubscription.badge = this.EXPIRATION_BADGES.alert;
          } else {
            newSubscription.endDate = this.$translate.instant('subscriptions.expired');
            newSubscription.badge = this.EXPIRATION_BADGES.alert;
          }
        }

        _.forEach(subscription.licenses, (license: any, licenseIndex: number): void => {
          if (license.offerName in this.Config.offerCodes && !this.isOfferType(license, 'MGMTPRO')) {
            const offer: IOfferData = this.generateOffer(license, subIndex, licenseIndex);

            if (this.isOfferType(offer, 'MS')) {
              offer.class = this.MESSAGE_CLASS;
              this.addSubscription(this.SUBSCRIPTION_TYPES.message, _.cloneDeep(offer));
            } else if (this.isOfferType(offer, 'CO')) {
              offer.class = this.CALL_CLASS;
              this.addSubscription(this.SUBSCRIPTION_TYPES.call, _.cloneDeep(offer));
            } else if (this.useTotal(offer)) {
              offer.class = this.MEETING_CLASS;
              this.addSubscription(this.SUBSCRIPTION_TYPES.room, _.cloneDeep(offer));
            } else if (this.isOfferType(offer, 'CDC') || this.isOfferType(offer, 'CVC')) {
              offer.class = this.CARE_CLASS;
              const existingIndex = _.findIndex(this.licenseCategory[this.SUBSCRIPTION_TYPES.care].offerWrapper, (sub: IOfferWrapper): boolean => {
                return sub.type === this.CARE;
              });

              if (existingIndex >= 0) {
                this.addSubscription(this.SUBSCRIPTION_TYPES.care, _.cloneDeep(offer), existingIndex);
                this.sortSubscription(this.SUBSCRIPTION_TYPES.care, existingIndex);
              } else {
                this.licenseCategory[this.SUBSCRIPTION_TYPES.care].offerWrapper.unshift({
                  offers: [_.cloneDeep(offer)],
                  type: this.CARE,
                });
              }
            } else {
              if (this.isOfferType(offer, 'CF')) {
                offer.class = this.MEETING_CLASS;
              } else {
                offer.class = this.WEBEX_CLASS;
              }

              const existingSite: number = _.findIndex(this.licenseCategory[this.SUBSCRIPTION_TYPES.meeting].offerWrapper, (sub: IOfferWrapper): boolean => {
                return sub.siteUrl === offer.siteUrl;
              });

              if (existingSite >= 0) {
                this.addSubscription(this.SUBSCRIPTION_TYPES.meeting, _.cloneDeep(offer), existingSite);
              } else if (offer.siteUrl) {
                this.licenseCategory[this.SUBSCRIPTION_TYPES.meeting].offerWrapper.push({
                  siteUrl: offer.siteUrl,
                  offers: [_.cloneDeep(offer)],
                });
              } else { // Meeting licenses not attached to a siteUrl should be grouped together at the front of the list
                this.licenseCategory[this.SUBSCRIPTION_TYPES.meeting].offerWrapper.unshift({ offers: [_.cloneDeep(offer)] });
              }
            }

            this.visibleSubscriptions = true;
            newSubscription.licenses.push(offer);
          } else if (this.isOfferType(license, 'MGMTPRO')) {
            const offer: IOfferData = this.generateOffer(license, subIndex, licenseIndex);

            newSubscription.proPack = offer;
            if (this.proPackData && this.proPackData.usage && offer.usage) {
              this.proPackData.usage += offer.usage;
              this.proPackData.volume += offer.volume;
            } else if (this.proPackData && offer.usage) {
              this.proPackData.usage = offer.usage;
              this.proPackData.volume += offer.volume;
            } else {
              this.proPackData = _.cloneDeep(offer);
            }
          }
        });

        // if the subscription is a trial, all licenses will have isTrial set to true
        newSubscription.isTrial = _.get(subscription, 'licenses[0].isTrial', false);

        if (newSubscription.licenses.length > 0) {
          if (newSubscription.isOnline) {
            newSubscription.quantity = newSubscription.licenses[0].volume;
          }
          // sort licenses into display order/order for determining subscription name
          const licenseTypes: any[] = _.toArray(this.Config.offerCodes);
          newSubscription.licenses.sort((a, b): number => {
            return licenseTypes.indexOf(a.offerName) - licenseTypes.indexOf(b.offerName);
          });
          if (newSubscription.isOnline) {
            this.subscriptionDetails.unshift(newSubscription);
          } else {
            this.subscriptionDetails.push(newSubscription);
          }
        }
      });

      if (this.subscriptionDetails.length === 1 && this.subscriptionDetails[0].isOnline) {
        this.oneOnlineSub = true;
      }

      if (_.find(this.subscriptionDetails, 'isOnline')) {
        // create cookie for Digital River
        this.DigitalRiverService.getDigitalRiverToken();
      }

      let enterpriseSubs = 1;
      let enterpriseTrials = 1;
      this.OnlineUpgradeService.getProductInstances(this.Authinfo.getUserId()).then((instances) => {
        _.forEach(this.subscriptionDetails, (subscription: ISubscription, index: number): void => {
          if (!subscription.isOnline) {
            if (subscription.isTrial) {
              this.subscriptionDetails[index].name = this.$translate.instant('subscriptions.enterpriseTrial', { number: enterpriseTrials++ });
              this.hasEnterpriseTrial = true;
            } else {
              let id = _.get(subscription, 'subscriptionId');
              if (_.isString(id) && id.length >= 4) {
                id = id.substr(id.length - 4);
                this.subscriptionDetails[index].name = this.$translate.instant('subscriptions.subscriptionNum', { number: id });
              } else {
                this.subscriptionDetails[index].name = this.$translate.instant('subscriptions.numberedName', { number: enterpriseSubs++ });
              }
            }
          } else {
            const prodResponse: IProdInst = _.find(instances, ['subscriptionId', subscription.internalSubscriptionId]);
            if (prodResponse) {
              if (prodResponse.autoBilling) {
                this.subscriptionDetails[index].endDate = '';
              }
              if (subscription.isTrial) {
                this.setBMMPTrial(subscription, prodResponse);
              } else {
                this.setBMMP(subscription, prodResponse);
              }
              if (this.subscriptionDetails.length === 1) {
                this.licenseSummary = this.$translate.instant('subscriptions.licenseSummaryOnline', { name: prodResponse.name });
              }
            }
          }
        });
        if (this.subscriptionDetails.length === 1 && (!this.subscriptionDetails[0].isTrial ||
            this.subscriptionDetails[0].isOnline) && this.subscriptionDetails[0].subscriptionId) {
          this.showSingleSub = true;
        }
      });
    });
  }

  private setBMMP(subscription: ISubscription, prodResponse: IProdInst): void {
    subscription.productInstanceId = prodResponse.productInstanceId;
    subscription.name = prodResponse.name;
    const env: string = _.includes(prodResponse.name, 'Spark') ? 'spark' : 'webex';
    // TODO Remove the changeplanOverride attribute in production once the
    // e-commerce team is ready.
    this.getChangeSubURL(env).then((urlResponse) => {
      subscription.changeplanOverride = '';
      if (this.Config.isProd() && urlResponse) {
        subscription.changeplanOverride = urlResponse;
      }

      if (subscription.internalSubscriptionId && subscription.productInstanceId) {
        this.bmmpAttr = {
          subscriptionId: subscription.internalSubscriptionId,
          productInstanceId: subscription.productInstanceId,
          changeplanOverride: subscription.changeplanOverride,
        };
      }
      this.broadcastSingleSubscription(subscription, undefined);
    });
  }

  private setBMMPTrial(subscription: ISubscription, prodResponse: IProdInst): void {
    const subId = _.get<string>(subscription, 'internalSubscriptionId', undefined);
    if (subId) {
      this.DigitalRiverService.getDigitalRiverUpgradeTrialUrl(subId).then((response): void => {
        if (response.data) {
          this.utilizeDigitalRiverResponse(subscription, prodResponse, response.data);
        } else {
          this.trialUrlFailed = true;
          this.utilizeDigitalRiverResponse(subscription, prodResponse);
        }
      }).catch((error: any): any => {
        this.Notification.errorWithTrackingId(error, 'subscriptions.onlineTrialUpgradeUrlError', {
          trialId: subId,
        });
        this.trialUrlFailed = true;
        this.utilizeDigitalRiverResponse(subscription, prodResponse);
      });
    }
  }

  private utilizeDigitalRiverResponse(subscription: ISubscription, prodResponse: IProdInst, response?: any): void {
    if (response) {
      subscription.productInstanceId = prodResponse.productInstanceId;
      subscription.name = prodResponse.name;

      if (subscription.internalSubscriptionId && subscription.productInstanceId) {
        this.bmmpAttr = {
          subscriptionId: subscription.internalSubscriptionId,
          productInstanceId: subscription.productInstanceId,
          changeplanOverride: '',
        };
      }
      this.broadcastSingleSubscription(subscription, response);
    }
    subscription.upgradeTrialUrl = response;
  }

  private hybridServicesRetrieval() {
    this.ServiceDescriptorService.getServices().then((services) => {
      return this.ServiceDescriptorService.filterEnabledServices(services);
    }).then((enabledServices) => {
      enabledServices.sort((s1, s2) => this.HybridServicesUtilsService.hybridServicesComparator(s1.id, s2.id));
      return _.map(enabledServices, (service: any) => {
        if (service.id === 'squared-fusion-uc' || service.id === 'squared-fusion-ec') {
          return `hercules.serviceNames.${service.id}.full`;
        } else if (service.id === 'spark-hybrid-datasecurity') {
          return `hercules.hybridServiceNames.${service.id}`;
        } else {
          return `hercules.serviceNames.${service.id}`;
        }
      });
    }).then((humanReadableServices) => {
      this.hybridServices = humanReadableServices;
    });
  }

  private useTotal(offer: IOfferData): boolean {
    return this.isOfferType(offer, 'SD') || this.isOfferType(offer, 'SB');
  }

  private isOfferType(offer: IOfferData, offerName: string): boolean {
    return offer.offerName === this.Config.offerCodes[offerName];
  }

  private generateOffer(license: any, subIndex: number, licenseIndex: number) {
    const offer: IOfferData = {
      licenseId: license.licenseId,
      licenseType: license.licenseType,
      licenseModel: _.get(license, 'licenseModel', ''),
      offerName: license.offerName,
      volume: license.volume,
      id: 'donutId' + subIndex + licenseIndex,
      tooltip: this.generateTooltip(license, license.usage, license.volume),
    };

    if (this.useTotal(offer)) {
      offer.totalUsage = license.usage || 0;
    } else {
      offer.usage = license.usage || 0;
    }

    if (!this.isSharedMeetingsLicense) {
      this.isSharedMeetingsLicense = _.toLower(_.get(offer, 'licenseModel', '')) === this.Config.licenseModel.cloudSharedMeeting;
    }

    if (license.siteUrl) {
      offer.siteUrl = license.siteUrl;
      offer.isCI = this.WebExUtilsFact.isCIEnabledSite(license.siteUrl);
    }

    return offer;
  }
}
