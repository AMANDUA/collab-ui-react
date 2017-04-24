import { FocusOn } from './focusOn.directive';
import { SelectOn } from './selectOn.directive';

export default angular
  .module('core.focus', [])
  .directive('focusOn', FocusOn.directive)
  .directive('selectOn', SelectOn.directive)
  .name;
