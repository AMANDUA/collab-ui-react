import { UserCallOverviewComponent } from './userCallOverview.component';
import serviceModule from 'modules/huron/lines/services';
import dialingModule from 'modules/huron/dialing';
import voicemailModule from 'modules/huron/voicemail';
import huronUserService from 'modules/huron/users';
import FeatureToggleService from 'modules/core/featureToggle';

export default angular
  .module('huron', [
    'atlas.templates',
    'collab.ui',
    'pascalprecht.translate',
    serviceModule,
    dialingModule,
    voicemailModule,
    huronUserService,
    FeatureToggleService,
  ])
  .component('userCallOverview', new UserCallOverviewComponent())
  .name;
