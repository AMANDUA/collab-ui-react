import './_company-voicemail.scss';

import { CompanyVoicemailComponent } from './companyVoicemail.component';
import serviceSetup from 'modules/huron/serviceSetup';

export default angular
  .module('huron.settings.company-voicemail', [
    require('scripts/app.templates'),
    'collab.ui',
    'pascalprecht.translate',
    'huron.telephoneNumber',
    'huron.telephoneNumberService',
    serviceSetup,
  ])
  .component('ucCompanyVoicemail', new CompanyVoicemailComponent())
  .name;
