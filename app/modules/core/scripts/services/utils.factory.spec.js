'use strict';

describe('Utils', function () {
  beforeEach(angular.mock.module('Core'));

  var Utils;
  var certificateTestData = _.cloneDeep(getJSONFixture('core/json/sso/test-certificates.json'));

  beforeEach(inject(function (_Utils_) {
    Utils = _Utils_;
  }));

  // v1 and v4 are gauranteed by the REF Spec to be unique, while other versions... not so much
  describe('testing utils.isUUID: should pass with a ', function () {
    var uuid = '';
    afterEach(function () {
      expect(Utils.isUUID(uuid)).toBeTruthy();
    });

    it('v1 uuid', function () {
      uuid = 'df358550-0258-11e6-8d22-5e5517507c66';
    });

    it('v4 uuid', function () {
      uuid = '2765f959-0ede-4c0b-b5b4-697c0bf5d3d3';
    });
  });

  describe('testing utils.isUUID: should fail with a', function () {
    var uuid = '';
    afterEach(function () {
      expect(Utils.isUUID(uuid)).toBeFalsy();
    });

    it('random string', function () {
      var rand = Math.random();
      uuid += rand;
    });

    it('nearly valid UUID', function () {
      // xxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
      uuid = 'df358550-0258-71e6-8d22-5e5517507c66';
    });
  });

  describe('function utils.filterKeyInXml', function () {
    it('should pass with a valid Metadata XML', function () {
      var idpMetadataXml = certificateTestData.idpMetadataXml;
      var ssoServices = Utils.filterKeyInXml(idpMetadataXml, 'SingleSignOnService');
      expect(_.size(ssoServices)).toBe(2);
      expect(ssoServices[0]['_Binding']).toBe('urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect');
    });
  });
});
