'use strict';

var scopes = [
  'webexsquare:admin',
  'webexsquare:billing',
  'ciscouc:admin',
  'Identity:SCIM',
  'Identity:Config',
  'Identity:Organization',
  'Identity:OAuthToken',
  'cloudMeetings:login',
  'webex-messenger:get_webextoken',
  'cloud-contact-center:admin',
  'spark-compliance:rooms_read',
  'compliance:spark_conversations_read',
  'contact-center-context:pod_read',
  'contact-center-context:pod_write',
  'spark-admin:people_read',
  'spark-admin:people_write',
  'spark-admin:customers_read',
  'spark-admin:customers_write',
  'spark-admin:organizations_read',
  'spark-admin:licenses_read',
  'spark-admin:logs_read',
  'spark:kms',
  // to onboard bot account
  'spark:applications_write',
  'spark:applications_read',
  // for Care Virtual Assistant
  'spark:messages_read',
  'spark:memberships_read',
  'spark:memberships_write',
  'spark:rooms_read',
];
var oauth2Scope = scopes.join(' ');

exports.oauth2Scope = oauth2Scope;

exports.oauthClientRegistration = {
  id: 'C80fb9c7096bd8474627317ee1d7a817eff372ca9c9cee3ce43c3ea3e8d1511ec',
  secret: 'c10c371b4641010a750073b3c8e65a7fff0567400d316055828d3c74925b0857',
  scope: encodeURIComponent(oauth2Scope),
};

exports.oauth2Url = 'https://idbroker.webex.com/idb/oauth2/v1/';

exports.adminServiceUrl = {
  dev: 'http://localhost:8080/atlas-server/admin/api/v1/',
  integration: 'https://atlas-intb.ciscospark.com/admin/api/v1/',
  prod: 'https://atlas-a.wbx2.com/admin/api/v1/',
};

exports.getAdminServiceUrl = function () {
  if (isProductionBackend) {
    return this.adminServiceUrl.prod;
  } else {
    return this.adminServiceUrl.integration;
  }
}

exports.getScimUrl = function () {
  return 'https://identity.webex.com/identity/scim/v1/Users/';
}

exports.getFeatureServiceUrl = function () {
  return 'https://feature-a.wbx2.com/feature/api/v1/';
}

exports.cmiServiceUrl = {
  dev: 'https://cmi.huron-int.com/api/v1/',
  integration: 'https://cmi.huron-int.com/api/v1/',
  prod: 'https://cmi.huron-dev.com/api/v1/',
};

exports.getCmiServiceUrl = function () {
  if (isProductionBackend) {
    return this.cmiServiceUrl.prod;
  } else {
    return this.cmiServiceUrl.integration;
  }
};

exports.cmiV2ServiceUrl = {
  dev: 'https://cmi.huron-int.com/api/v2/',
  integration: 'https://cmi.huron-int.com/api/v2/',
  prod: 'https://cmi.huron-dev.com/api/v2/',
};

exports.getCmiV2ServiceUrl = function () {
  if (isProductionBackend) {
    return this.cmiV2ServiceUrl.prod;
  } else {
    return this.cmiV2ServiceUrl.integration;
  }
};

exports.terminusServiceUrl = {
  dev: 'https://terminus.huron-int.com/api/',
  integration: 'https://terminus.huron-int.com/api/',
  prod: 'https://terminus.huron-dev.com/api/',
};

exports.getTerminusServiceUrl = function () {
  if (isProductionBackend) {
    return this.terminusServiceUrl.prod;
  } else {
    return this.terminusServiceUrl.integration;
  }
};

exports.csdmServiceUrl = {
  dev: 'https://csdm-intb.ciscospark.com/csdm/api/v1/',
  integration: 'https://csdm-intb.ciscospark.com/csdm/api/v1/',
  prod: 'https://csdm-a.wbx2.com/csdm/api/v1/',
};

exports.getCsdmServiceUrl = function () {
  if (isProductionBackend) {
    return this.csdmServiceUrl.prod;
  } else {
    return this.csdmServiceUrl.integration;
  }
}

exports.pagingServiceUrl = {
  dev: 'https://paging.huron-int.com/api/v1/',
  integration: 'https://paging.huron-int.com/api/v1/',
  prod: 'https://paging.huron-dev.com/api/v1/',
}

exports.getPagingServiceUrl = function () {
  if (isProductionBackend) {
    return this.pagingServiceUrl.prod;
  } else {
    return this.pagingServiceUrl.integration;
  }
}

exports.deviceUserAgent = {
  android: 'wx2-android/1 (Android 4.4.2; LGE Hammerhead / Google Nexus 5; )[preload=false;locale=en_US;clientidbase=android-google]',
  iPhone: 'wx2_iOS',
  iPad: 'Mozilla/5.0 (iPad; CPU OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53',
  iPod: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 7_0_3 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11B511 Safari/9537.53',
};

exports.orgId = {
  pbrOrg: '4214d345-7caf-4e32-b015-34de878d1158',
};

exports.webClientURL = 'https://web.ciscospark.com/';

exports.cesUrl = {
  integration: 'https://ces.huron-int.com/api/v1/',
};

/* We drive the AutoAttendant testing via the AA name, so to delete the test
 AA CES we need to fetch all of the AA CES for the customer so we can find
 the one (if any) with a matching name.
 Also note that we have only plumbed an integration URL value into
 test.confg.js, when we go live on production we'll need to add that and
 provide for both sorts of test environments.
 current revision yields this URL:
 https://ces.huron-int.com/api/v1/customers/7e88d491-d6ca-4786-82ed-cbe9efb02ad2/callExperiences
 */
exports.getAutoAttendantsUrl = function (customerUuid) {
  return this.cesUrl.integration + 'customers/' + customerUuid + '/callExperiences';
};


// queue URL
exports.getAutoAttendantQueueUrl = function (customerUuid) {
  return this.cesUrl.integration + 'customers/' + customerUuid + '/queues/420f-b49a-ee9db0c7b61c';
};


/* We drive the AA  testing via the AA name, so to delete the test
schedules created with AA name. we need to fetch all of the schedules for the customer so we can find
the one (if any) with a matching name.
Also note that we have only plumbed an integration URL value into
test.confg.js, when we go live on production we'll need to add that and
provide for both sorts of test environments.
current revision yields this URL:
https://ces.huron-int.com/api/v1/customers/7e88d491-d6ca-4786-82ed-cbe9efb02ad2/schedules/<scheduleid>
*/
exports.getAutoAttendantsSchedulesUrl = function (customerUuid, scheduleId) {
  return this.cesUrl.integration + 'customers/' + customerUuid + '/schedules/' + scheduleId;
};
