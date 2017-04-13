import { PgSetupAssistantComponent } from './pgSetupAssistant.component';

import pagingGroupService from '../../pagingGroup';
import featureToggleService from 'modules/core/featureToggle';
import pgName from './pgName';
import pgNumber from './pgNumber';
import pgMember from './pgMember';
import pgInitiator from './pgInitiator';

export default angular
  .module('huron.paging-group.setup-assistant', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    pgName,
    pgNumber,
    pgMember,
    pgInitiator,
    pagingGroupService,
    featureToggleService,
  ])
  .component('pgSetupAssistant', new PgSetupAssistantComponent())
  .name;
