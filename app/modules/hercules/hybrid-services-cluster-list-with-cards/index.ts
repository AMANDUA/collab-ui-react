import { HybridServicesClusterListWithCardsComponent } from './hybrid-services-cluster-list-with-cards.component';
import { SetDefaultReleaseChannelController } from './set-default-release-channel.controller';
import { AddResourceGroupController } from './add-resource-group.controller';

export default angular
  .module('hercules.hybrid-services-cluster-list-with-cards', [
    'Squared', // because of WizardFactory and CsdmCacheUpdater (from EnterprisePrivateTrunkService)
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
    require('modules/core/analytics'),
    require('modules/core/config/config'),
    require('modules/core/notifications').default,
    require('modules/core/scripts/services/authinfo'),
    require('modules/hercules/services/enterprise-private-trunk-service').default,
    require('modules/hercules/services/fms-org-settings.service').default,
    require('modules/hercules/services/hybrid-services-cluster-states.service').default,
    require('modules/hercules/services/hybrid-services-cluster.service').default,
    require('modules/hercules/services/resource-group.service').default,
  ])
  .component('hybridServicesClusterListWithCards', new HybridServicesClusterListWithCardsComponent())
  .controller('SetDefaultReleaseChannelController', SetDefaultReleaseChannelController)
  .controller('AddResourceGroupController', AddResourceGroupController)
  .name;
