import './_call-park.scss';

import { CallParkComponent } from './callPark.component';
import callParkNumber from './callParkNumber';
import callParkMember from './callParkMember';
import callParkReversion from './callParkReversion';
import callParkReversionTimer from './callParkReversionTimer';
import callParkService from './services';
import callFeatureName from 'modules/huron/features/components/callFeatureName';
import huronSiteService from 'modules/huron/sites';
import notifications from 'modules/core/notifications';

export default angular
  .module('huron.call-park', [
    require('scripts/app.templates'),
    'collab.ui',
    'pascalprecht.translate',
    callFeatureName,
    callParkNumber,
    callParkMember,
    callParkReversion,
    callParkReversionTimer,
    callParkService,
    huronSiteService,
    notifications,
    require('angular-resource'),
    require('modules/huron/telephony/cmiServices'),
    require('modules/huron/telephony/telephonyConfig'),
    require('modules/core/scripts/services/authinfo'),
  ])
  .component('ucCallPark', new CallParkComponent())
  .name;
