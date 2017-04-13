import { DialingComponent } from './dialing.component';
import { DialingService } from './dialing.service';
import featureToggleModule from 'modules/core/featureToggle';

export * from './dialing.service';

export default angular
  .module('huron.dialing', [
    require('scripts/app.templates'),
    'collab.ui',
    'pascalprecht.translate',
    require('angular-resource'),
    require('modules/core/scripts/services/authinfo'),
    require('modules/huron/telephony/telephonyConfig'),
    featureToggleModule,
  ])
  .component('ucDialing', new DialingComponent())
  .service('DialingService', DialingService)
  .name;
