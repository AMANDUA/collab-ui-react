
import { ExternalCommunicationSettingComponent } from './externalCommunicationSetting.component';

import notificationModule from 'modules/core/notifications';
import ProPack from 'modules/core/proPack';

export default angular.module('core.settings.externalCommunication', [
  require('angular-cache'),
  require('scripts/app.templates'),
  require('collab-ui-ng').default,
  //require('modules/core/scripts/services/externalCommunication.service'),
  require('modules/core/scripts/services/accountorgservice'),
  require('modules/core/scripts/services/authinfo'),
  ProPack,
  notificationModule,
])
  .component('externalCommunicationSetting', new ExternalCommunicationSettingComponent())
  .name;
