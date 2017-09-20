import { UserOverviewService } from './userOverview.service';
const UserOverviewCtrl = require('./userOverviewCtrl');

import messagingPreviewModule from './messaging-preview';
import featureToggleServiceModule from 'modules/core/featureToggle';
import notifictionModule from 'modules/core/notifications';
import sunlightServiceModule from 'modules/sunlight/services';
import webExUtilsModule from 'modules/webex/utils';

const coreAuthModule = require('modules/core/auth/auth');
const ngResourceModule = require('angular-resource');
const onboardModule = require('modules/core/users/userAdd/onboard.module');

import './_user-overview.scss';
export * from './userOverview.service';
export default angular
  .module('core.users.userOverview', [
    require('collab-ui-ng').default,
    messagingPreviewModule,
    sunlightServiceModule,
    ngResourceModule,
    notifictionModule,
    coreAuthModule,
    featureToggleServiceModule,
    webExUtilsModule,
    onboardModule,
  ])
  .service('UserOverviewService', UserOverviewService)
  .controller('UserOverviewCtrl', UserOverviewCtrl)
  .name;
