import { DirectoryNumberComponent  } from './directoryNumber.component';
import { DirectoryNumberOptionsService } from './directoryNumberOptions.service';
import { LocationsService } from 'modules/call/locations/shared';
import featureToggleServiceModule from 'modules/core/featureToggle';

export * from './directoryNumberOptions.service';

export default angular
  .module('huron.directory-number', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    'ngResource',
    require('modules/core/scripts/services/authinfo'),
    require('modules/huron/telephony/telephonyConfig'),
    featureToggleServiceModule,
  ])
  .component('ucDirectoryNumber', new DirectoryNumberComponent())
  .service('DirectoryNumberOptionsService', DirectoryNumberOptionsService)
  .service('LocationsService', LocationsService)
  .name;
