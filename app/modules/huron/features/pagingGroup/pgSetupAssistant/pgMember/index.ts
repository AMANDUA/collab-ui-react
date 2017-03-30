import { PgMemberComponent } from './pgMember.component';
import notifications from 'modules/core/notifications';
import featureMemberService from 'modules/huron/features';

export default angular
  .module('huron.paging-group.member', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    'pascalprecht.translate',
    require('modules/core/config/urlConfig'),
    featureMemberService,
    notifications,
  ])
  .component('pgMember',  new PgMemberComponent())
  .name;
