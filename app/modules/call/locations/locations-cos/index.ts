import './locations-cos.component.scss';

import { LocationClassOfServiceComponent } from './locations-cos.component';

export { LocationClassOfServiceComponent };

export default angular
  .module('call.locations.class-of-service', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
  ])
  .component('ucLocationCos', new LocationClassOfServiceComponent())
  .name;
