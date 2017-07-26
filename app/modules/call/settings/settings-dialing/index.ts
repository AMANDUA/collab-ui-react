import { DialingSetupComponent } from './settings-dialing.component';
import { DialingAreaCodeValidator } from './settings-dialing-validate-area-code.directive';
import phoneNumberModule from 'modules/huron/phoneNumber';

export default angular
  .module('call.settings.dialing', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    phoneNumberModule,
  ])
  .component('ucDialingSetup', new DialingSetupComponent())
  .directive('validateDialingAreaCode', DialingAreaCodeValidator.factory)
  .name;
