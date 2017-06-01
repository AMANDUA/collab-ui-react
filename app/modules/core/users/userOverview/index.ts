import { UserOverviewService } from './userOverview.service';
let UserOverviewCtrl = require('./userOverviewCtrl');

import featureToggleServiceModule from 'modules/core/featureToggle';
import notifictionModule from 'modules/core/notifications';
import sunlightServiceModule from 'modules/sunlight/services';
import webExUtilsModule from 'modules/webex/utils';

let coreAuthModule = require('modules/core/auth/auth');
let ngResourceModule = require('angular-resource');
let onboardModule = require('modules/core/users/userAdd/onboard.module');

import './_user-overview.scss';

export default angular
  .module('core.users.userOverview', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
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
