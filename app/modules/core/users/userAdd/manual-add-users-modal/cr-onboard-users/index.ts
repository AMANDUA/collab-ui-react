import dirSyncServiceModuleName from 'modules/core/featureToggle';
import onboardModuleName from 'modules/core/users/shared/onboard';
import * as userlistModuleName from 'modules/core/scripts/services/userlist.service';
import usersSharedAutoAssignTemplateModuleName from 'modules/core/users/shared/auto-assign-template';
import { CrOnboardUsersComponent } from './cr-onboard-users.component';

export default angular.module('core.users.userAdd.users-add-modal.cr-onboard-users', [
  require('angular-translate'),
  require('@collabui/collab-ui-ng').default,
  dirSyncServiceModuleName,
  onboardModuleName,
  userlistModuleName,
  usersSharedAutoAssignTemplateModuleName,
])
  .component('crOnboardUsers', new CrOnboardUsersComponent())
  .name;