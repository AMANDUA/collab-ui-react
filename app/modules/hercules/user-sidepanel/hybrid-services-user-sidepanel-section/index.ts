import { HybridServicesUserSidepanelSectionComponent } from './hybrid-services-user-sidepanel-section.component';

import * as AuthinfoModuleName from 'modules/core/scripts/services/authinfo';
import CalendarCloudConnectorModuleName from 'modules/hercules/services/calendar-cloud-connector.service';
import FeatureToggleServiceModuleName from 'modules/core/featureToggle';
import HybridServicesUtilsServiceModuleName from 'modules/hercules/services/hybrid-services-utils.service';
import NotificationModuleName from 'modules/core/notifications';
import ServiceDescriptorModuleName from 'modules/hercules/services/service-descriptor.service';
import USSServiceModuleName from 'modules/hercules/services/uss.service';

export default angular
  .module('hercules.user-sidepanel-section', [
    AuthinfoModuleName,
    CalendarCloudConnectorModuleName,
    FeatureToggleServiceModuleName,
    HybridServicesUtilsServiceModuleName,
    NotificationModuleName,
    ServiceDescriptorModuleName,
    USSServiceModuleName,
  ])
  .component('hybridServicesUserSidepanelSection', new HybridServicesUserSidepanelSectionComponent())
  .name;
