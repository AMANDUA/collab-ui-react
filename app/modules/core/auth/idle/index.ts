import { IdleTimeoutService } from './idleTimeout.service';
import windowModule from 'modules/core/window';
import FeatureToggleService from 'modules/core/featureToggle';

export default angular
  .module('core.auth.idleTimeout', [
    require('modules/core/config/config'),
    require('modules/core/scripts/services/log'),
    require('modules/core/auth/auth'),
    FeatureToggleService,
    windowModule,
  ])
   .service('IdleTimeoutService', IdleTimeoutService)
  .name;
