(function () {
  'use strict';

  require('./main.dependencies');

  angular.module('Core', [
    'angular-cache',
    require('collab-ui-ng').default,
    'cisco.formly',
    require('modules/core/shared').default,
    require('modules/core/auth/tos').default,
    require('modules/core/auth/user').default,
    require('modules/core/auth/auth'),
    require('modules/core/auth/token.service'),
    require('modules/core/modal').default,
    'core.body',
    require('modules/core/accessibility').default,
    require('modules/core/controlHub').default,
    require('modules/core/l10n').default,
    'core.localize',
    'core.logmetricsservice',
    'core.meeting-settings',
    require('modules/core/setupWizard/setup-wizard.service').default,
    require('modules/core/notifications').default,
    require('modules/core/users/userAdd').default,
    require('modules/core/users/userAdd/hybrid-services-entitlements-panel').default,
    'core.pageparam',
    'core.previousstate',
    'core.trackingId',
    'core.proPack',
    'core.trial',
    'core.utils',
    'core.cache',
    'csDonut',
    'ct.ui.router.extras.previous',
    'ngAnimate',
    'ngclipboard',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngMessages',
    'ngFileUpload',
    'ngCsv',
    require('angular-translate'),
    'ui.router',
    'ui.grid',
    'ui.grid.selection',
    'ui.grid.saveState',
    'ui.grid.infiniteScroll',
    'ui.grid.pagination',
    'timer',
    'toaster',
    'rzModule',
    'dragularModule',
    require('modules/bmmp/learn-more-banner').default,
    require('modules/core/account').default,
    require('modules/core/banner').default,
    require('modules/core/csgrid').default,
    require('modules/core/users/userOverview').default,
    require('modules/core/analytics'),
    require('modules/core/featureToggle').default,
    require('modules/core/focus').default,
    require('modules/core/inlineEditText').default,
    require('modules/core/learnMore').default,
    require('modules/core/scrollIndicator').default,
    require('modules/core/gridSpinner').default,
    require('modules/core/scripts/services/org.service'),
    require('modules/core/scripts/services/userlist.service'),
    require('modules/core/scripts/services/brand.service'),
    require('modules/core/scripts/services/sparkDomainManagement.service'),
    require('modules/core/users/userCsv/userCsv.service'),
    require('modules/core/scripts/services/retention.service'),
    require('modules/core/myCompany/mySubscriptions').default,
    require('modules/core/cards').default,
    require('modules/core/customerReports/sparkReports').default,
    require('modules/core/customerReports/webexReports/diagnostic').default,
    require('modules/core/partnerReports/commonReportServices').default,
    require('modules/core/partnerReports/reportCard').default,
    require('modules/core/partnerReports/reportFilter').default,
    require('modules/core/partnerReports/reportSlider').default,
    require('modules/core/partnerProfile/branding').default,
    require('modules/core/window').default,
    require('modules/online/digitalRiver').default, // TODO make core.myCompany independent module
    require('modules/online/upgrade').default,
    require('modules/core/trials/regionalSettings').default,
    require('modules/core/trials/emergencyServices').default,
    require('modules/core/settings').default,
    require('modules/huron/countries').default,
    require('modules/call/settings').default,
    require('modules/call/locations').default,
    require('modules/huron/dialPlans').default,
    require('modules/core/domainManagement').default,
    require('modules/huron/features/featureLanding/hoverDelay.directive').default,
    require('modules/core/validation').default,
    require('modules/core/customerReports').default,
    require('modules/core/partnerReports').default,
    require('modules/gemini/reports').default,
    require('modules/account-linking/banner').default,
    require('modules/core/siteList/webex-site').default,
  ])
    .constant('CryptoJS', require('crypto-js'))
    .constant('addressparser', require('emailjs-addressparser'));

  // TODO fix circular dependencies between modules
  angular.module('Squared', [
    'Core',
    'Hercules',
    'Huron',
    'Sunlight',
    require('modules/squared/devices/services/CsdmCacheUpdater'),
    require('modules/squared/devices/services/CsdmPoller'),
    require('modules/squared/helpdesk').default,
    require('modules/squared/partner-management').default,
    require('modules/squared/provisioning-console').default,
  ]);

  angular.module('DigitalRiver', ['Core']);

  angular.module('Huron', [
    'Core',
    'uc.device',
    'uc.didadd',
    'uc.overview',
    'uc.hurondetails',
    'uc.cdrlogsupport',
    'uc.autoattendant',
    'ngIcal',
    'huron.TerminusServices',
    'huron.externalNumberService',
    'huron.place-overview',
    require('modules/call/settings/settings-bulk-enable-vm').default,
    require('modules/huron/lineSettings/callerIdService'),
    require('modules/huron/telephony/telephonyConfig'),
    require('modules/huron/telephony/cmiServices'),
    require('modules/huron/autoAnswer').default,
    require('modules/huron/pstn').default,
    require('modules/huron/overview').default,
    require('modules/huron/lines/deleteExternalNumber').default,
    require('modules/huron/media-mgr').default,
    require('modules/call/features').default,
    require('modules/call/features/paging-group/shared').default,
    require('modules/call/features/call-pickup/shared').default,
    require('modules/huron/lineSettings/directoryNumberService'),
  ])
    .constant('ASTParser', require('acorn'))
    .constant('ASTWalker', require('acorn/dist/walk'));

  angular.module('Hercules', [
    'Core',
    'Squared',
    'ngTagsInput',
    require('modules/core/overview/notifications/allHybridCalendars.factory').default,
    require('modules/core/overview/notifications/hybridMessaging.factory').default,
    require('modules/core/users/userAdd').default,
    require('modules/hercules/cluster-card').default,
    require('modules/hercules/connector-upgrade-modal/connector-upgrade-modal.controller').default,
    require('modules/hercules/google-calendar-settings/google-calendar-config-section/google-calendar-second-time-setup').default,
    require('modules/hercules/hybrid-media-cluster-settings').default,
    require('modules/hercules/hybrid-services-cluster-list-with-cards').default,
    require('modules/hercules/hybrid-services-nodes-page').default,
    require('modules/hercules/private-trunk/private-trunk-overview-settings').default,
    require('modules/hercules/private-trunk/private-trunk-setup').default,
    require('modules/hercules/user-sidepanel/hybrid-services-user-homed-cluster-and-hostname').default,
    require('modules/hercules/user-sidepanel/hybrid-services-user-sidepanel-section').default,
    require('modules/hercules/resource-group-card').default,
    require('modules/hercules/service-settings/calendar-service-setup').default,
    require('modules/hercules/service-settings/call-service-settings-page').default,
    require('modules/hercules/service-settings/sip-destination-settings-section').default,
    require('modules/hercules/service-specific-pages/components/cluster-list/hybrid-service-cluster-list.component').default,
    require('modules/hercules/services/calendar-cloud-connector.service').default,
    require('modules/hercules/services/cluster-service').default,
    require('modules/hercules/services/enterprise-private-trunk-service').default,
    require('modules/hercules/services/excel-service').default,
    require('modules/hercules/services/fms-org-settings.service').default,
    require('modules/hercules/services/hs-flag-service').default,
    require('modules/hercules/services/hybrid-services-cluster-states.service').default,
    require('modules/hercules/services/hybrid-services-cluster.service').default,
    require('modules/hercules/services/hybrid-services-extras.service').default,
    require('modules/hercules/services/hybrid-services-i18n.service').default,
    require('modules/hercules/services/hybrid-services-utils.service').default,
    require('modules/hercules/services/l2sip-service').default,
    require('modules/hercules/services/resource-group.service').default,
    require('modules/hercules/services/service-descriptor.service').default,
    require('modules/hercules/services/ucc-service').default,
    require('modules/hercules/services/uss.service').default,
  ]);

  angular.module('HDS', [
    'Core',
    'Hercules',
    require('modules/hds/services/hds.service'),
  ]);

  angular.module('Mediafusion', ['Core', 'Hercules', 'Squared']);

  angular.module('WebExApp', [
    'Core',
    require('modules/webex/utils').default,
    require('modules/webex/xmlApi').default,
    require('modules/webex/webexClientVersions/webexClientVersion.svc'),
  ]);

  angular.module('Messenger', [
    'Core',
    require('modules/core/scripts/services/accountorgservice'),
    require('modules/shared').default,
  ]);

  angular.module('Sunlight', [
    'Core',
    'CareDetails',
    'Sunlight.pagination',
    require('modules/sunlight/services').default,
  ]);

  angular.module('Context', ['Core']);

  angular.module('GSS', ['Core']);

  angular.module('Gemini', ['Core']);

  angular.module('ServicesOverview', [
    require('modules/services-overview').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/basic-expressway-prerequisites').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/call-service-aware-prerequisites').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/call-service-connect-prerequisites').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/google-calendar-prerequisites').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/hybrid-calendar-prerequisites/hybrid-calendar-prerequisites.controller').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/hybrid-call-prerequisites-modal/hybrid-call-prerequisites.controller').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/hybrid-media-prerequisites/hybrid-media-prerequisites.controller').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/hybrid-services-prerequisites-helper.service').default,
    require('modules/services-overview/new-hybrid/prerequisites-modals/on-premises-exchange-prerequisites').default,
  ]);

  angular.module('AccountLinking', [
    'Core',
    require('modules/account-linking').default,
  ]);

  module.exports = angular.module('Main', [
    'Core',
    'Squared',
    'DigitalRiver',
    'Huron',
    'Hercules',
    require('modules/ediscovery/ediscovery.module'),
    'Mediafusion',
    'HDS',
    'WebExApp',
    'Messenger',
    'Sunlight',
    'Context',
    'GSS',
    'oc.lazyLoad',
    'Gemini',
    'Csdm',
    'ServicesOverview',
    'AccountLinking',
  ]).config(require('./main.config'))
    .run(require('./main.run'))
    .name;

  // require all modules first
  requireAll(require.context('modules/', true, /\.module\.(js|ts)$/));
  // require all other app files - ignore bootstrap.js, preload.js, newrelic
  requireAll(require.context('../', true, /\.\/(?!.*(\.spec|bootstrap.js$|scripts\/preload.js$|\/newrelic\/.*.js$)).*\.(js|ts)$/));
  // require all other assets
  requireAll(require.context('../', true, /\.(jpg|png|svg|ico|csv|pdf)$/));

  function requireAll(requireContext) {
    return requireContext.keys().map(requireContext);
  }
}());
