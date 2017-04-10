(function () {
  'use strict';

  var tabs = [{
    tab: 'overviewTab',
    icon: 'icon-home',
    title: 'tabs.overviewTab',
    state: 'overview',
    link: '/overview',
  }, {
    tab: 'overviewTab',
    icon: 'icon-home',
    title: 'tabs.overviewTab',
    state: 'partneroverview',
    link: '/partner/overview',
  }, {
    tab: 'gssTab',
    icon: 'icon-bell',
    title: 'tabs.gssTab',
    desc: 'tabs.gssTabDesc',
    state: 'gss',
    link: '/gss',
  }, {
    tab: 'customerTab',
    icon: 'icon-user',
    title: 'tabs.customerTab',
    state: 'partnercustomers',
    link: '/partner/customers',
  }, {
    tab: 'gemservicesTab',
    icon: 'icon-cloud',
    title: 'tabs.servicesTab',
    state: 'gemOverview',
    feature: 'gem-services-tab',
    link: '/partner/services/overview',
  }, {
    tab: 'userTab',
    icon: 'icon-user',
    title: 'tabs.userTab',
    state: 'users',
    link: '/users',
  }, {
    tab: 'placeTab',
    icon: 'icon-location',
    title: 'tabs.placeTab',
    state: 'places',
    link: '/places',
  }, {
    tab: 'servicesTab',
    icon: 'icon-cloud',
    title: 'tabs.servicesTab',
    state: 'services-overview',
    link: 'services',
  }, {
    tab: 'deviceTab',
    icon: 'icon-devices',
    title: 'tabs.deviceTab',
    state: 'devices',
    link: '/devices',
  }, {
    tab: 'reportTab',
    icon: 'icon-bars',
    title: 'tabs.reportTab',
    state: 'reports',
    link: '/reports',
  }, {
    tab: 'reportTab',
    icon: 'icon-bars',
    title: 'tabs.reportTab',
    state: 'partnerreports',
    link: '/partner/reports',
  }, {
    tab: 'supportTab',
    icon: 'icon-support',
    title: 'tabs.supportTab',
    link: '/support/status',
    state: 'support.status',
  }, {
    tab: 'settingsTab',
    icon: 'icon-sliders',
    title: 'tabs.settingsTab',
    state: 'settings',
    link: '/settings',
  }, {
    tab: 'organizationTab',
    icon: 'icon-admin',
    title: 'tabs.organizationTab',
    state: 'organizations',
    link: '/organizations',
  }, {
    // DEPRECATED - REPLACE WITH FEATURE TOGGLES - DO NOT ADD MORE PAGES UNDER developmentTab
    tab: 'developmentTab',
    icon: 'icon-tools',
    title: 'tabs.developmentTab',
    hideProd: true,
    subPages: [
      {
        title: 'tabs.metricsDetailsTab',
        //desc: 'tabs.metricsDetailsTabDesc',
        state: 'media-service-v2',
        link: '#mediaserviceV2',
      }, {
        title: 'tabs.editFeatureToggles',
        state: 'edit-featuretoggles',
        link: '#editfeaturetoggles',
      }],
  }];

  module.exports = angular
    .module('core.tabconfig', [])
    .value('tabConfig', tabs)
    .name;

}());
