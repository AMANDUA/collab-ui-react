import { HuronSettingsService } from './settings.service';
import { HuronSettingsOptionsService } from './settings-options.service';
import { ExtensionLengthService } from './extension-length.service';

export * from './settings.service';
export * from './settings-options.service';
export * from './extension-length.service';
export const E911_ADDRESS_PENDING: string = 'PENDING';

import siteServiceModule from 'modules/huron/sites';
import customerServiceModule from 'modules/huron/customer';
import serviceSetupModule from 'modules/huron/serviceSetup';
import avrilServiceModule from 'modules/huron/avril';
import terminusServiceName from 'modules/huron/pstn/terminus.service';
import mediaOnHoldModule from 'modules/huron/media-on-hold';

export default angular
  .module('huron.settings.services', [
    require('modules/huron/lineSettings/callerIdService'),
    require('modules/call/settings/shared/voicemail-message-action.service'),
    siteServiceModule,
    customerServiceModule,
    serviceSetupModule,
    avrilServiceModule,
    terminusServiceName,
    mediaOnHoldModule,
  ])
  .service('HuronSettingsService', HuronSettingsService)
  .service('HuronSettingsOptionsService', HuronSettingsOptionsService)
  .service('ExtensionLengthService', ExtensionLengthService)
  .name;