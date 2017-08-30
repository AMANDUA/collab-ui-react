import { CsvDownloadService, CsvDownloadTypes } from './csvDownload.service';
import { CsvDownloadComponent } from './csvDownload.component';
import { ExtractTarService } from './extractTar.service';
import notificationsModule from 'modules/core/notifications';
import featureToggleModule from 'modules/core/featureToggle';
import csvSimpleExportModule from './csvSimpleExport';

const analyticsModule = require('modules/core/analytics');
const userListServiceModule = require('modules/core/scripts/services/userlist.service');
const config = require('modules/core/config/config').default;

import './_csv-download.scss';

export { CsvDownloadService, CsvDownloadTypes, ExtractTarService };

export default angular
  .module('core.csvDownload', [
    'ngResource',
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    analyticsModule,
    config,
    featureToggleModule,
    notificationsModule,
    userListServiceModule,
    csvSimpleExportModule,
    'core.users.userCsv', // WARNING: This is creating a circular dependency!!
  ])
  .service('CsvDownloadTypes', CsvDownloadTypes)
  .service('CsvDownloadService', CsvDownloadService)
  .component('csvDownload', new CsvDownloadComponent())
  .service('ExtractTarService', ExtractTarService)
  .name;
