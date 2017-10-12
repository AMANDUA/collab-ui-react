'use strict';

var testModule = require('./oauthConfig');

describe('OAuthConfig', function () {
  var OAuthConfig, $location;
  beforeEach(angular.mock.module(testModule));

  beforeEach(inject(function (_$location_, _OAuthConfig_) {
    OAuthConfig = _OAuthConfig_;
    $location = _$location_;
    spyOn($location, 'host');
  }));

  afterEach(function () {
    OAuthConfig = $location = undefined;
  });
  var devHost = 'localhost';
  var prodHost = 'admin.ciscospark.com';
  var cfeHost = 'cfe-admin.ciscospark.com';
  var intHost = 'int-admin.ciscospark.com';
  var scope = encodeURIComponent('webexsquare:admin webexsquare:billing ciscouc:admin Identity:SCIM Identity:Config Identity:Organization Identity:OAuthToken cloudMeetings:login webex-messenger:get_webextoken cloud-contact-center:admin spark-compliance:rooms_read compliance:spark_conversations_read contact-center-context:pod_read contact-center-context:pod_write spark-admin:people_read spark-admin:people_write spark-admin:customers_read spark-admin:customers_write spark-admin:organizations_read spark-admin:licenses_read spark-admin:logs_read spark:kms spark:applications_write spark:applications_read spark:messages_read spark:memberships_read spark:rooms_read');

  var whenCalling = function (fn, arg1, arg2) {
    var hosts = {
      dev: devHost,
      cfe: cfeHost,
      integration: intHost,
      prod: prodHost,
    };
    return {
      expectUrlToBe: function (obj) {
        _.each(obj, function (expected, env) {
          var host = hosts[env];
          if (!host) {
            throw new Error('Unknown environment ' + env);
          }

          if (!OAuthConfig[fn]) {
            throw new Error('Unknown method ' + fn);
          }
          $location.host.and.returnValue(host);
          var actual = OAuthConfig[fn](arg1, arg2);

          if (expected !== actual) {
            throw new Error('Expected ' + fn + ' in ' + env + " to be '" + expected + "' but it was '" + actual + "'");
          }
        });
      },
    };
  };

  afterAll(function () {
    devHost = prodHost = cfeHost = intHost = scope = whenCalling = undefined;
  });

  it('should return correct access code url', function () {
    whenCalling('getOauthAccessCodeUrl', 'foo').expectUrlToBe({
      dev: 'grant_type=refresh_token&refresh_token=foo',
      cfe: 'grant_type=refresh_token&refresh_token=foo',
      integration: 'grant_type=refresh_token&refresh_token=foo',
      prod: 'grant_type=refresh_token&refresh_token=foo',
    });
  });

  it('should return correct oauth login url', function () {
    whenCalling('getOauthLoginUrl', 'a@a.com', 'random-string').expectUrlToBe({
      dev: 'https://idbroker.webex.com/idb/oauth2/v1/authorize?response_type=code&client_id=C80fb9c7096bd8474627317ee1d7a817eff372ca9c9cee3ce43c3ea3e8d1511ec&scope=' + scope + '&redirect_uri=http%3A%2F%2F127.0.0.1%3A8000&state=random-string&cisService=spark&email=a%40a.com',
      cfe: 'https://idbrokerbts.webex.com/idb/oauth2/v1/authorize?response_type=code&client_id=C5469b72a6de8f8f0c5a23e50b073063ea872969fc74bb461d0ea0438feab9c03&scope=' + scope + '&redirect_uri=https%3A%2F%2Fcfe-admin.ciscospark.com&state=random-string&cisService=spark&email=a%40a.com',
      integration: 'https://idbroker.webex.com/idb/oauth2/v1/authorize?response_type=code&client_id=C80fb9c7096bd8474627317ee1d7a817eff372ca9c9cee3ce43c3ea3e8d1511ec&scope=' + scope + '&redirect_uri=https%3A%2F%2Fint-admin.ciscospark.com%2F&state=random-string&cisService=spark&email=a%40a.com',
      prod: 'https://idbroker.webex.com/idb/oauth2/v1/authorize?response_type=code&client_id=C80fb9c7096bd8474627317ee1d7a817eff372ca9c9cee3ce43c3ea3e8d1511ec&scope=' + scope + '&redirect_uri=https%3A%2F%2Fadmin.ciscospark.com%2F&state=random-string&cisService=spark&email=a%40a.com',
    });
  });

  it('should return the correct oauth credentials', function () {
    var creds = OAuthConfig.getOAuthClientRegistrationCredentials();
    expect(creds).toBe('QzgwZmI5YzcwOTZiZDg0NzQ2MjczMTdlZTFkN2E4MTdlZmYzNzJjYTljOWNlZTNjZTQzYzNlYTNlOGQxNTExZWM6YzEwYzM3MWI0NjQxMDEwYTc1MDA3M2IzYzhlNjVhN2ZmZjA1Njc0MDBkMzE2MDU1ODI4ZDNjNzQ5MjViMDg1Nw==');
  });

  it('should return correct logout url', function () {
    var url = OAuthConfig.getLogoutUrl();
    expect(url).toBe('https://idbroker.webex.com/idb/saml2/jsp/doSSO.jsp?type=logout&cisService=spark&goto=https%3A%2F%2Fadmin.ciscospark.com%2F');
  });

  it('should return correct revoke access token url', function () {
    whenCalling('getOAuthRevokeUserTokenUrl', 'random-string', 'random-string').expectUrlToBe({
      dev: 'https://idbroker.webex.com/idb/oauth2/v1/tokens?username=',
      cfe: 'https://idbrokerbts.webex.com/idb/oauth2/v1/tokens?username=',
      integration: 'https://idbroker.webex.com/idb/oauth2/v1/tokens?username=',
      prod: 'https://idbroker.webex.com/idb/oauth2/v1/tokens?username=',
    });
  });
});
