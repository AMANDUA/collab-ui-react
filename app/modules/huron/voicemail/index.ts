import { VoicemailComponent } from './voicemail.component';
import { HuronVoicemailService } from './voicemail.service';
import customerServiceModule from 'modules/huron/customer';
import userServiceModule from 'modules/huron/users';
import huronUserServiceModule from 'modules/huron/users';
import featureToggleModule from 'modules/core/featureToggle';
import notifications from 'modules/core/notifications';
export * from './voicemail.service';
export default angular
  .module('huron.voicemail', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    customerServiceModule,
    userServiceModule,
    notifications,
    featureToggleModule,
    huronUserServiceModule,
  ])
  .component('ucVoicemail', new VoicemailComponent())
  .service('HuronVoicemailService', HuronVoicemailService)
  .name;
