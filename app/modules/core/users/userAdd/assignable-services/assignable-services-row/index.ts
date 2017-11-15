import './assignable-services-row.scss';

import { AssignableServicesRowComponent } from './assignable-services-row.component';
import assignableServiceItemCheckboxModuleName from './assignable-service-item-checkbox';

export default angular.module('core.users.userAdd.assignable-services.assignable-services-row', [
  require('angular-translate'),
  require('collab-ui-ng').default,
  assignableServiceItemCheckboxModuleName,
])
  .component('assignableServicesRow', new AssignableServicesRowComponent())
  .name;
