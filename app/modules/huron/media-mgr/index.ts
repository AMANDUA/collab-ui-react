import { MediaMgrComponent } from './media-mgr.component';
import { MediaMgrService } from './media-mgr.service';
import notifications from 'modules/core/notifications';

import './media-mgr.scss';

export * from './media-mgr.service';

export default angular
  .module('huron.media-mgr', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    require('ng-file-upload'),
    require('modules/ediscovery/bytes_filter'),
    require('modules/core/scripts/services/authinfo'),
    require('modules/huron/telephony/telephonyConfig'),
    notifications,
  ])
  .component('mediaMgr', new MediaMgrComponent())
  .service('MediaMgrService', MediaMgrService)
  .name;
