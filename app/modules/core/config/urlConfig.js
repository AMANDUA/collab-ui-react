(function () {
  'use strict';

  var serviceUrlMapping = {
    AdminServiceUrl: {
      dev: 'https://atlas-intb.ciscospark.com/admin/api/v1/',
      cfe: 'https://atlas-loada.ciscospark.com/admin/api/v1/',
      integration: 'https://atlas-intb.ciscospark.com/admin/api/v1/',
      prod: 'https://atlas-a.wbx2.com/admin/api/v1/',
    },
    LocusServiceUrl: {
      dev: 'https://admin-portal-test-public.wbx2.com/locus',
      cfe: 'https://admin-portal-test-public.wbx2.com/locus',
      integration: 'https://admin-portal-test-public.wbx2.com/locus',
      prod: 'https://admin-portal-test-public.wbx2.com/locus',
    },
    FeatureToggleUrl: {
      dev: 'https://locus-a.wbx2.com',
      cfe: 'https://locus-loada.ciscospark.com',
      integration: 'https://locus-a.wbx2.com',
      prod: 'https://locus-a.wbx2.com',
    },
    AthenaServiceUrl: {
      dev: 'https://athena-intb.ciscospark.com/athena/api/v1',
      cfe: 'https://athena-loada.ciscospark.com/athena/api/v1',
      integration: 'https://athena-intb.ciscospark.com/athena/api/v1',
      prod: 'https://athena-a.wbx2.com/athena/api/v1',
    },
    CsdmServiceUrl: {
      dev: 'https://csdm-intb.ciscospark.com/csdm/api/v1',
      cfe: 'https://csdm-loada.ciscospark.com/csdm/api/v1',
      integration: 'https://csdm-intb.ciscospark.com/csdm/api/v1',
      prod: 'https://csdm-a.wbx2.com/csdm/api/v1',
    },
    MessengerServiceUrl: {
      dev: 'https://msgr-admin.webexconnect.com:443/admin-service/messenger/admin/api/v1',
      cfe: 'https://msgr-admin-bts.webexconnect.com:443/admin-service/messenger/admin/api/v1',
      integration: 'https://msgr-admin.webexconnect.com:443/admin-service/messenger/admin/api/v1',
      prod: 'https://msgr-admin.webexconnect.com:443/admin-service/messenger/admin/api/v1',
    },
    UtilizationServiceUrl: {
      dev: 'http://mf-meeting-service.mb-lab.huron.uno/admin/api/v1',
      cfe: 'https://mf-meeting-service.mb-lab.huron.uno/admin/api/v1',
      integration: 'https://mf-meeting-service.mb-lab.huron.uno/admin/api/v1',
      prod: 'https://mf-meeting-service.mb-lab.huron.uno/admin/api/v1',
    },
    ScimUrl: {
      dev: 'https://identity.webex.com/identity/scim/%s/v1/Users',
      cfe: 'https://identitybts.webex.com/identity/scim/%s/v1/Users',
      integration: 'https://identity.webex.com/identity/scim/%s/v1/Users',
      prod: 'https://identity.webex.com/identity/scim/%s/v1/Users',
    },
    UserReportsUrl: {
      dev: 'https://identity.webex.com/identity/config/%s/v1/UserReports',
      cfe: 'https://identitybts.webex.com/identity/config/%s/v1/UserReports',
      integration: 'https://identity.webex.com/identity/config/%s/v1/UserReports',
      prod: 'https://identity.webex.com/identity/config/%s/v1/UserReports',
    },
    ScomUrl: {
      dev: 'https://identity.webex.com/organization/scim/v1/Orgs',
      cfe: 'https://identitybts.webex.com/organization/scim/v1/Orgs',
      integration: 'https://identity.webex.com/organization/scim/v1/Orgs',
      prod: 'https://identity.webex.com/organization/scim/v1/Orgs',
    },
    DomainManagementUrl: {
      dev: 'https://identity.webex.com/organization/%s/v1/',
      cfe: 'https://identitybts.webex.com/organization/%s/v1/',
      integration: 'https://identity.webex.com/organization/%s/v1/',
      prod: 'https://identity.webex.com/organization/%s/v1/',
    },
    SparkDomainManagementUrl: {
      dev: 'https://atlas-intb.ciscospark.com/admin/api/v1/',
      cfe: 'https://atlas-loada.ciscospark.com/admin/api/v1/',
      integration: 'https://atlas-intb.ciscospark.com/admin/api/v1/',
      prod: 'https://atlas-a.wbx2.com/admin/api/v1/',
    },
    SparkDomainCheckUrl: {
      dev: '.wbx2.com',
      cfe: '.wbx2.com',
      integration: '.wbx2.com',
      prod: '.ciscospark.com',
    },
    HealthCheckServiceUrl: {
      dev: 'https://ciscospark.statuspage.io/index.json',
      cfe: 'https://ciscospark.statuspage.io/index.json',
      integration: 'https://ciscospark.statuspage.io/index.json',
      prod: 'https://ciscospark.statuspage.io/index.json',
    },
    HerculesUrl: {
      dev: 'https://hercules-intb.ciscospark.com/v1',
      cfe: 'https://hercules-loada.ciscospark.com/v1',
      integration: 'https://hercules-intb.ciscospark.com/v1',
      prod: 'https://hercules-a.wbx2.com/v1',
    },
    HerculesUrlV2: {
      dev: 'https://hercules-intb.ciscospark.com/hercules/api/v2',
      cfe: 'https://hercules-loada.ciscospark.com/hercules/api/v2',
      integration: 'https://hercules-intb.ciscospark.com/hercules/api/v2',
      prod: 'https://hercules-a.wbx2.com/hercules/api/v2',
    },
    FlagServiceUrl: {
      dev: 'https://hercules-intb.ciscospark.com/fls/api/v1',
      cfe: 'https://hercules-loada.ciscospark.com/fls/api/v1',
      integration: 'https://hercules-intb.ciscospark.com/fls/api/v1',
      prod: 'https://hercules-a.wbx2.com/fls/api/v1',
    },
    UssUrl: {
      dev: 'https://uss-intb.ciscospark.com/',
      cfe: 'https://uss-loada.ciscospark.com/',
      integration: 'https://uss-intb.ciscospark.com/',
      prod: 'https://uss-a.wbx2.com/',
    },
    CertsUrl: {
      dev: 'https://certs-intb.ciscospark.com/',
      cfe: 'https://certs-loada.ciscospark.com/',
      integration: 'https://certs-intb.ciscospark.com/',
      prod: 'https://certs-a.wbx2.com/',
    },
    FeatureUrl: {
      dev: 'https://feature-a.wbx2.com/feature/api/v1',
      cfe: 'https://feature-loada.ciscospark.com/feature/api/v1',
      integration: 'https://feature-a.wbx2.com/feature/api/v1',
      prod: 'https://feature-a.wbx2.com/feature/api/v1',
    },
    SunlightConfigServiceUrl: {
      dev: 'https://config.devus1.ciscoccservice.com/config/v1',
      cfe: 'https://config.appstaging.ciscoccservice.com/config/v1',
      integration: 'https://config.appstaging.ciscoccservice.com/config/v1',
      prod: 'https://config.produs1.ciscoccservice.com/config/v1',
    },
    SunlightBubbleUrl: {
      dev: 'https://bubble.devus1.ciscoccservice.com',
      cfe: 'https://bubble.appstaging.ciscoccservice.com',
      integration: 'https://bubble.appstaging.ciscoccservice.com',
      prod: 'https://bubble.produs1.ciscoccservice.com',
    },
    SunlightReportServiceUrl: {
      dev: 'https://reporting.devus1.ciscoccservice.com/reporting/v1',
      cfe: 'https://reporting.appstaging.ciscoccservice.com/reporting/v1',
      integration: 'https://reporting.appstaging.ciscoccservice.com/reporting/v1',
      prod: 'https://reporting.produs1.ciscoccservice.com/reporting/v1',
    },
    SunlightPickNotificationUrl: {
      dev: 'https://notifs.devus1.ciscoccservice.com/notifs/v1/publish',
      cfe: 'https://notifs.appstaging.ciscoccservice.com/notifs/v1/publish',
      integration: 'https://notifs.appstaging.ciscoccservice.com/notifs/v1/publish',
      prod: 'https://notifs.produs1.ciscoccservice.com/notifs/v1/publish',
    },
    SunlightPushNotificationUrl: {
      dev: 'https://ar.devus1.ciscoccservice.com/ar/v1/publish/taskState',
      cfe: 'https://ar.appstaging.ciscoccservice.com/ar/v1/publish/taskState',
      integration: 'https://ar.appstaging.ciscoccservice.com/ar/v1/publish/taskState',
      prod: 'https://ar.produs1.ciscoccservice.com/ar/v1/publish/taskState',
    },
    CcfsUrl: {
      dev: 'https://ccfs.produs1.ciscoccservice.com/v1/authorize?delegation=true&appType=sunlightdev&callbackUrl=',
      cfe: 'https://ccfs.produs1.ciscoccservice.com/v1/authorize?delegation=true&appType=sunlightstaging&callbackUrl=',
      integration: 'https://ccfs.produs1.ciscoccservice.com/v1/authorize?delegation=true&appType=sunlightstaging&callbackUrl=',
      prod: 'https://ccfs.produs1.ciscoccservice.com/v1/authorize?delegation=true&appType=sunlight&callbackUrl=',
    },
    CalliopeUrl: {
      dev: 'https://calliope-intb.ciscospark.com/calliope/api/authorization/v1',
      cfe: 'https://calliope-loada.ciscospark.com/calliope/api/authorization/v1',
      integration: 'https://calliope-intb.ciscospark.com/calliope/api/authorization/v1',
      prod: 'https://calliope-a.wbx2.com/calliope/api/authorization/v1',
    },
    CdrUrl: {
      dev: 'https://hades.huron-int.com/api/v1/elasticsearch/',
      cfe: 'https://hades.huron-dev.com/api/v1/elasticsearch/',
      integration: 'https://hades.huron-int.com/api/v1/elasticsearch/',
      prod: 'https://hades.huron-dev.com/api/v1/elasticsearch/',
    },
    GeminiUrl: {
      dev: 'https://hfccap2.qa.webex.com/pcs/api/v2/',
      cfe: 'https://hfccap2.qa.webex.com/pcs/api/v2/',
      integration: 'https://ccaportalbts.webex.com/ccaportal/api/v2/',
      prod: 'https://ccaportal.webex.com/ccaportal/api/v2/',
    },
    GssUrl: {
      dev: 'https://statusbts.webex.com/status',
      cfe: 'https://statusbts.webex.com/status',
      integration: 'https://statusbts.webex.com/status',
      prod: 'https://healthstatus.webex.com/status',
    },
    UccUrl: {
      dev: 'https://ucc-intb.ciscospark.com/ucm-service/api/v1',
      cfe: 'https://ucc-loada.ciscospark.com/ucm-service/api/v1',
      integration: 'https://ucc-intb.ciscospark.com/ucm-service/api/v1',
      prod: 'https://ucc-a.wbx2.com/ucm-service/api/v1',
    },
    HybridVoicemailUrl: {
      dev: 'https://ucc-intb.ciscospark.com/voicemail/api/v1',
      cfe: 'https://ucc-loada.ciscospark.com/voicemail/api/v1',
      integration: 'https://ucc-intb.ciscospark.com/voicemail/api/v1',
      prod: 'https://ucc-a.wbx2.com/voicemail/api/v1',
    },
    CccUrl: {
      dev: 'https://calendar-cloud-connector-intb.ciscospark.com/api/v1',
      cfe: 'https://calendar-cloud-connector-loada.ciscospark.com/api/v1',
      integration: 'https://calendar-cloud-connector-intb.ciscospark.com/api/v1',
      prod: 'https://calendar-cloud-connector-a.wbx2.com/api/v1',
    },
    ContextDiscoveryServiceUrl: {
      dev: 'https://discovery.appstaging.ciscoccservice.com/discovery/apps/v1',
      cfe: 'https://discovery.appstaging.ciscoccservice.com/discovery/apps/v1',
      integration: 'https://discovery.appstaging.ciscoccservice.com/discovery/apps/v1',
      prod: 'https://discovery.produs1.ciscoccservice.com/discovery/apps/v1',
    },
    HybridEncryptionServiceUrl: {
      dev: 'https://encryption-intb.ciscospark.com/encryption/api/v1',
      cfe: 'https://encryption-loada.ciscospark.com/encryption/api/v1',
      integration: 'https://encryption-intb.ciscospark.com/encryption/api/v1',
      prod: 'https://encryption-a.wbx2.com/encryption/api/v1',
    },
    L2sipUrl: {
      dev: 'https://l2sip-cfa-web.wbx2.com/l2sip/api/v1',
      cfe: 'https://l2sip-loada.ciscospark.com/api/v1',
      integration: 'https://l2sip-cfa-web.wbx2.com/l2sip/api/v1', // Tool is not working in integration, we need to point to prod for now.
      prod: 'https://l2sip-cfa-web.wbx2.com/l2sip/api/v1',
    },
    ArgonautReportUrl: {
      dev: 'https://argonaut-intb.ciscospark.com/argonaut/api/v1/compliance/report',
      cfe: 'https://argonaut-loada.ciscospark.com/argonaut/api/v1/compliance/report',
      integration: 'https://argonaut-intb.ciscospark.com/argonaut/api/v1/compliance/report',
      prod: 'https://argonaut-a.wbx2.com/argonaut/api/v1/compliance/report',
    },
    LyraServiceUrl: {
      dev: 'https://lyra-intb.ciscospark.com/lyra/api/v1',
      cfe: 'https://lyra-loada.ciscospark.com/lyra/api/v1',
      integration: 'https://lyra-intb.ciscospark.com/lyra/api/v1',
      prod: 'https://lyra-a.wbx2.com/lyra/api/v1',
    },
    WebExReportQBSforBaseUrl: {
      dev: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_webex_v1',
      cfe: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_webex_v1',
      integration: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_webex_v1',
      prod: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_webex_v1',
    },
    SparkReportQBSforBaseUrl: {
      dev: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_spark_v1',
      cfe: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_spark_v1',
      integration: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_spark_v1',
      prod: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/basic_spark_v1',
    },
    WebExReportQBSforPremiumUrl: {
      dev: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_webex_v1',
      cfe: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_webex_v1',
      integration: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_webex_v1',
      prod: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_webex_v1',
    },
    SparkReportQBSforPremiumUrl: {
      dev: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_spark_v1',
      cfe: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_spark_v1',
      integration: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_spark_v1',
      prod: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/premium_spark_v1',
    },
    SparkReportQBSforPartnerUrl: {
      dev: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/partner_spark_v1',
      cfe: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/partner_spark_v1',
      integration: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/partner_spark_v1',
      prod: 'https://qlickbts.webex.com/qlik-gtwy-server-1.0-SNAPSHOT/qlik-gtwy/api/v1/report/session/partner_spark_v1',
    },
    WebExReportAppforBaseUrl: {
      dev: 'https://QRP/custportal/extensions/webex-report-basic/webex-report-basic.html',
      cfe: 'https://QRP/custportal/extensions/webex-report-basic/webex-report-basic.html',
      integration: 'https://QRP/custportal/extensions/webex-report-basic/webex-report-basic.html',
      prod: 'https://QRP/custportal/extensions/webex-report-basic/webex-report-basic.html',
    },
    SparkReportAppforBaseUrl: {
      dev: 'https://QRP/custportal/extensions/spark-report-basic/spark-report-basic.html',
      cfe: 'https://QRP/custportal/extensions/spark-report-basic/spark-report-basic.html',
      integration: 'https://QRP/custportal/extensions/spark-report-basic/spark-report-basic.html',
      prod: 'https://QRP/custportal/extensions/spark-report-basic/spark-report-basic.html',
    },
    WebExReportAppforPremiumUrl: {
      dev: 'https://QRP/custportal/extensions/webex-report-premium/webex-report-premium.html',
      cfe: 'https://QRP/custportal/extensions/webex-report-premium/webex-report-premium.html',
      integration: 'https://QRP/custportal/extensions/webex-report-premium/webex-report-premium.html',
      prod: 'https://QRP/custportal/extensions/webex-report-premium/webex-report-premium.html',
    },
    SparkReportAppforPremiumUrl: {
      dev: 'https://QRP/custportal/extensions/spark-report-premium/spark-report-premium.html',
      cfe: 'https://QRP/custportal/extensions/spark-report-premium/spark-report-premium.html',
      integration: 'https://QRP/custportal/extensions/spark-report-premium/spark-report-premium.html',
      prod: 'https://QRP/custportal/extensions/spark-report-premium/spark-report-premium.html',
    },
    SparkReportAppforPartnerUrl: {
      dev: 'https://QRP/custportal/extensions/spark-report-partner/spark-report-partner.html',
      cfe: 'https://QRP/custportal/extensions/spark-report-partner/spark-report-partner.html',
      integration: 'https://QRP/custportal/extensions/spark-report-partner/spark-report-partner.html',
      prod: 'https://QRP/custportal/extensions/spark-report-partner/spark-report-partner.html',
    },
    // urls same for all environments

    ProdAdminServiceUrl: 'https://atlas-a.wbx2.com/admin/api/v1/',
    WebexAdvancedEditUrl: 'https://%s/dispatcher/AtlasIntegration.do?cmd=GoToSiteAdminEditUserPage',
    WebexAdvancedHomeUrl: 'https://%s/dispatcher/AtlasIntegration.do?cmd=GoToSiteAdminHomePage',
    WebexMaxConcurrentMeetings: 'https://%s/meetingsapi/v1/reports/MonthlyMaxConcurrentMeetings',
    WebexConcurrentMeetings: 'https://%s/meetingsapi/v1/reports/ConcurrentMeetingsDetailByMonth',
    WebClientUrl: 'https://web.ciscospark.com/',
    AndroidStoreUrl: 'http://cs.co/sqandroid',
    ItunesStoreUrl: 'http://cs.co/sqios',
    SquaredAppUrl: 'squared://',
    StatusPageUrl: 'http://status.ciscospark.com/',
    CallflowServiceUrl: 'https://admin-portal-test-public.wbx2.com/atlas-server/admin/api/v1/',
    LogMetricsUrl: 'https://metrics-a.wbx2.com/metrics/api/v1/metrics',
    SSOTestUrl: 'https://idbroker.webex.com/idb/saml2/jsp/spSSOInit.jsp',
    SSOSetupUrl: 'https://idbroker.webex.com/idb/idbconfig/',
  };

  module.exports = angular
    .module('core.urlconfig', [
      require('modules/core/config/config'),
      require('modules/core/scripts/services/utils'),
    ])
    .factory('UrlConfig', UrlConfig)
    .name;

  function UrlConfig(Config, Utils) {
    return _.reduce(serviceUrlMapping, function (service, urlMapping, key) {
      service['get' + key] = function () {
        var env = Config.getEnv();
        var args = _.toArray(arguments);
        var resolvedUrl = _.isString(urlMapping) ? urlMapping : urlMapping[env];
        return Utils.sprintf(resolvedUrl, args);
      };
      return service;
    }, {});
  }

}());
