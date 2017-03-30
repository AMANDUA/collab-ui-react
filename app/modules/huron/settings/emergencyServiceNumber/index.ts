import { EmergencyServiceNumberComponent } from './emergencyServiceNumber.component';

export default angular
  .module('huron.settings.emergency-service-number', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    'pascalprecht.translate',
  ])
  .component('ucEmergencyServiceNumber', new EmergencyServiceNumberComponent())
  .name;
