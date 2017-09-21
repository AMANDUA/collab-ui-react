import './inlineEditText.scss';
import focusModuleName from 'modules/core/focus';
import csInputModuleName from 'collab-ui-ng/dist/directives/input';
import proPackModuleName from 'modules/core/proPack';
import { InlineEditTextComponent } from './inlineEditText.component';


export default angular
  .module('core.inline-edit-text', [
    require('collab-ui-ng').default,
    csInputModuleName,
    focusModuleName,
    proPackModuleName,
  ])
  .component('crInlineEditText', new InlineEditTextComponent())
  .name;
