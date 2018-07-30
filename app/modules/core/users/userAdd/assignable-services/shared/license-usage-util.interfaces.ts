import { OfferName } from 'modules/core/shared/offer-name';
import { ICrCheckboxItemState } from 'modules/core/shared/cr-checkbox-item/cr-checkbox-item.component';

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  DISABLED = 'DISABLED',
}

export interface ILicenseUsage {
  billingServiceId: string;
  isCIUnifiedSite: boolean;
  licenseId: string;
  offerName: OfferName;
  siteUrl: string;
  status: LicenseStatus;
  usage: number;
  volume: number;
}

export interface ILicenseUsageMap {
  [key: string]: ILicenseUsage;
}

export interface ISubscription {
  subscriptionId: string;
  licenses: ILicenseUsage[];
}

// TODO (mipark2): relocate these types to a more appropriate location (e.g. 'assignable-services.interfaces.ts'?)
export enum AssignableServicesItemCategory {
  LICENSE = 'LICENSE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  USER_ENTITLEMENT = 'USER_ENTITLEMENT',
}

export interface IAssignableLicenseCheckboxState extends ICrCheckboxItemState {
  license: ILicenseUsage;
}

export interface IAssignableItemChange {
  itemId: string;
  itemCategory: AssignableServicesItemCategory;
  item: IAssignableLicenseCheckboxState;
}

export interface IOnUpdateParam {
  $event: IAssignableItemChange;
}
