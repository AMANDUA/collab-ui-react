export interface ISubscription {
  changeplanOverride?: any;
  internalSubscriptionId?: string;
  isTrial: boolean;
  isOnline: boolean;
  licenses: IOfferData[];
  name?: string;
  numSubscriptions: number;
  productInstanceId?: string;
  proPack?: IOfferData;
  quantity?: number;
  subscriptionId?: string;
  upgradeTrialUrl?: string;
  endDate: string;
  badge: string;
}

export interface ISubscriptionCategory {
  label?: string;
  offers: IOfferData[];
  offerWrapper: IOfferWrapper[];
}

export interface IOfferWrapper {
  offers: IOfferData[];
  siteUrl?: string;
  type?: string;
}

export interface IOfferData {
  class?: string;
  id: string;
  isCI?: any;
  licenseId: string;
  licenseType: string;
  licenseModel: string;
  offerName: string;
  siteUrl?: string;
  tooltip?: string;
  totalUsage?: number;
  usage?: number;
  volume: number;
}
