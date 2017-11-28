export type MeetingOfferName = 'CF' | 'CMR' | 'EC' | 'EE' | 'MC' | 'TC';
export enum AssignableServicesItemCategory {
  LICENSE = 'LICENSE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export interface ILicenseUsage {
  billingServiceId: string;
  licenseId: string;
  offerName: MeetingOfferName;
  siteUrl: string;
}

export interface ISubscription {
  subscriptionId: string;
  licenses: ILicenseUsage[];
}
