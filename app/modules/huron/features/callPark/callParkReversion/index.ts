import './_cp-reversion.scss';

import { CallParkReversionComponent } from './callParkReversion.component';
import { callParkReversionDirectoryNumberFilter } from './callParkReversionDirectoryNumber.filter';
import memberService from 'modules/huron/members';
import numberService from 'modules/huron/numbers';
import callParkService from 'modules/huron/features/callPark/services';

export default angular
  .module('huron.call-park-reversion', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    'huron.telephoneNumber',
    'huron.telephoneNumberService',
    require('modules/huron/telephony/cmiServices'),
    require('modules/core/scripts/services/authinfo'),
    memberService,
    numberService,
    callParkService,
  ])
  .component('ucCallParkReversion', new CallParkReversionComponent())
  .filter('callParkReversionDirectoryNumberFilter', callParkReversionDirectoryNumberFilter)
  .name;
