'use strict';

describe('SiteListService: csv status tests', function () {
  beforeEach(module('Core'));
  beforeEach(module('Huron'));
  beforeEach(module('WebExApp'));

  var $q;
  var $rootScope;

  var deferredCsvStatusReq;

  var SiteListService;
  var WebExRestApiFact;
  var WebExApiGatewayService;

  var fakeSiteRow = null;

  beforeEach(inject(function (
    _$q_,
    _$rootScope_,
    _WebExRestApiFact_,
    _WebExApiGatewayService_,
    _SiteListService_
  ) {

    $q = _$q_;
    $rootScope = _$rootScope_;

    WebExRestApiFact = _WebExRestApiFact_;
    WebExApiGatewayService = _WebExApiGatewayService_;
    SiteListService = _SiteListService_;

    deferredCsvStatusReq = $q.defer();

    fakeSiteRow = {
      license: {
        siteUrl: "fake.webex.com"
      },

      showCSVInfo: false,

      checkCsvStatusStart: false,
      checkCsvStatusEnd: false,
      checkCsvStatusIndex: false,

      csvStatusObj: null,

      showExportLink: false,
      showExportInProgressLink: false,
      grayedExportLink: false,
      showExportResultsLink: false,
      exportFinishedWithErrors: false,

      showImportLink: false,
      showImportInProgressLink: false,
      grayedImportLink: false,
      showImportResultsLink: false,
      importFinishedWithErrors: false,
    };

    WebExApiGatewayService.csvStatusTypes = [
      'none',
      'exportInProgress',
      'exportCompletedNoErr',
      'exportCompletedWithErr',
      'importInProgress',
      'importCompletedNoErr',
      'importCompletedWithErr'
    ];

    spyOn(WebExRestApiFact, 'csvStatusReq').and.returnValue(deferredCsvStatusReq.promise);
    /*
    spyOn(WebExApiGatewayService, 'csvStatusTypes').and.returnValue([
      'none',
      'exportInProgress',
      'exportCompletedNoErr',
      'exportCompletedWithErr',
      'importInProgress',
      'importCompletedNoErr',
      'importCompletedWithErr'
    ]);
    */
  })); // beforeEach(inject())

  it('can process csvStatus="none"', function () {
    fakeSiteRow.checkCsvStatusStart = 0;
    fakeSiteRow.checkCsvStatusEnd = 0;
    fakeSiteRow.checkCsvStatusIndex = 0;

    SiteListService.updateCSVColumnInRow(
      fakeSiteRow,
      true
    );

    deferredCsvStatusReq.resolve({});
    $rootScope.$apply();

    expect(fakeSiteRow.csvStatusObj.isTestResult).toEqual(true);
    expect(fakeSiteRow.csvStatusObj.status).toEqual("none");
    expect(fakeSiteRow.csvStatusObj.completionDetails).toEqual(null);

    expect(fakeSiteRow.showExportLink).toEqual(true);
    expect(fakeSiteRow.showExportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedExportLink).toEqual(false);
    expect(fakeSiteRow.showExportResultsLink).toEqual(false);
    expect(fakeSiteRow.exportFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showImportLink).toEqual(true);
    expect(fakeSiteRow.showImportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedImportLink).toEqual(false);
    expect(fakeSiteRow.showImportResultsLink).toEqual(false);
    expect(fakeSiteRow.importFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showCSVInfo).toEqual(true);
  });

  it('can process csvStatus="exportInProgress"', function () {
    fakeSiteRow.checkCsvStatusStart = 1;
    fakeSiteRow.checkCsvStatusEnd = 1;
    fakeSiteRow.checkCsvStatusIndex = 1;

    SiteListService.updateCSVColumnInRow(
      fakeSiteRow,
      true
    );

    deferredCsvStatusReq.resolve({});
    $rootScope.$apply();

    expect(fakeSiteRow.csvStatusObj.isTestResult).toEqual(true);
    expect(fakeSiteRow.csvStatusObj.status).toEqual("exportInProgress");
    expect(fakeSiteRow.csvStatusObj.completionDetails).toEqual(null);

    expect(fakeSiteRow.showExportLink).toEqual(false);
    expect(fakeSiteRow.showExportInProgressLink).toEqual(true);
    expect(fakeSiteRow.grayedExportLink).toEqual(false);
    expect(fakeSiteRow.showExportResultsLink).toEqual(false);
    expect(fakeSiteRow.exportFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showImportLink).toEqual(false);
    expect(fakeSiteRow.showImportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedImportLink).toEqual(true);
    expect(fakeSiteRow.showImportResultsLink).toEqual(false);
    expect(fakeSiteRow.importFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showCSVInfo).toEqual(true);
  });

  it('can process csvStatus="exportCompletedNoErr"', function () {
    fakeSiteRow.checkCsvStatusStart = 2;
    fakeSiteRow.checkCsvStatusEnd = 2;
    fakeSiteRow.checkCsvStatusIndex = 2;

    SiteListService.updateCSVColumnInRow(
      fakeSiteRow,
      true
    );

    deferredCsvStatusReq.resolve({});
    $rootScope.$apply();

    expect(fakeSiteRow.csvStatusObj.isTestResult).toEqual(true);
    expect(fakeSiteRow.csvStatusObj.status).toEqual("exportCompletedNoErr");
    expect(fakeSiteRow.csvStatusObj.completionDetails).not.toEqual(null);

    expect(fakeSiteRow.showExportLink).toEqual(true);
    expect(fakeSiteRow.showExportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedExportLink).toEqual(false);
    expect(fakeSiteRow.showExportResultsLink).toEqual(true);
    expect(fakeSiteRow.exportFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showImportLink).toEqual(true);
    expect(fakeSiteRow.showImportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedImportLink).toEqual(false);
    expect(fakeSiteRow.showImportResultsLink).toEqual(false);
    expect(fakeSiteRow.importFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showCSVInfo).toEqual(true);
  });

  it('can process csvStatus="exportCompletedWithErr"', function () {
    fakeSiteRow.checkCsvStatusStart = 3;
    fakeSiteRow.checkCsvStatusEnd = 3;
    fakeSiteRow.checkCsvStatusIndex = 3;

    SiteListService.updateCSVColumnInRow(
      fakeSiteRow,
      true
    );

    deferredCsvStatusReq.resolve({});
    $rootScope.$apply();

    expect(fakeSiteRow.csvStatusObj.isTestResult).toEqual(true);
    expect(fakeSiteRow.csvStatusObj.status).toEqual("exportCompletedWithErr");
    expect(fakeSiteRow.csvStatusObj.completionDetails).not.toEqual(null);

    expect(fakeSiteRow.showExportLink).toEqual(true);
    expect(fakeSiteRow.showExportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedExportLink).toEqual(false);
    expect(fakeSiteRow.showExportResultsLink).toEqual(true);
    expect(fakeSiteRow.exportFinishedWithErrors).toEqual(true);

    expect(fakeSiteRow.showImportLink).toEqual(true);
    expect(fakeSiteRow.showImportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedImportLink).toEqual(false);
    expect(fakeSiteRow.showImportResultsLink).toEqual(false);
    expect(fakeSiteRow.importFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showCSVInfo).toEqual(true);
  });

  it('can process csvStatus="importInProgress"', function () {
    fakeSiteRow.checkCsvStatusStart = 4;
    fakeSiteRow.checkCsvStatusEnd = 4;
    fakeSiteRow.checkCsvStatusIndex = 4;

    SiteListService.updateCSVColumnInRow(
      fakeSiteRow,
      true
    );

    deferredCsvStatusReq.resolve({});
    $rootScope.$apply();

    expect(fakeSiteRow.csvStatusObj.isTestResult).toEqual(true);
    expect(fakeSiteRow.csvStatusObj.status).toEqual("importInProgress");
    expect(fakeSiteRow.csvStatusObj.completionDetails).toEqual(null);

    expect(fakeSiteRow.showExportLink).toEqual(false);
    expect(fakeSiteRow.showExportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedExportLink).toEqual(true);
    expect(fakeSiteRow.showExportResultsLink).toEqual(false);
    expect(fakeSiteRow.exportFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showImportLink).toEqual(false);
    expect(fakeSiteRow.showImportInProgressLink).toEqual(true);
    expect(fakeSiteRow.grayedImportLink).toEqual(false);
    expect(fakeSiteRow.showImportResultsLink).toEqual(false);
    expect(fakeSiteRow.importFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showCSVInfo).toEqual(true);
  });

  it('can process csvStatus="importCompletedNoErr"', function () {
    fakeSiteRow.checkCsvStatusStart = 5;
    fakeSiteRow.checkCsvStatusEnd = 5;
    fakeSiteRow.checkCsvStatusIndex = 5;

    SiteListService.updateCSVColumnInRow(
      fakeSiteRow,
      true
    );

    deferredCsvStatusReq.resolve({});
    $rootScope.$apply();

    expect(fakeSiteRow.csvStatusObj.isTestResult).toEqual(true);
    expect(fakeSiteRow.csvStatusObj.status).toEqual("importCompletedNoErr");
    expect(fakeSiteRow.csvStatusObj.completionDetails).not.toEqual(null);

    expect(fakeSiteRow.showExportLink).toEqual(true);
    expect(fakeSiteRow.showExportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedExportLink).toEqual(false);
    expect(fakeSiteRow.showExportResultsLink).toEqual(false);
    expect(fakeSiteRow.exportFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showImportLink).toEqual(true);
    expect(fakeSiteRow.showImportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedImportLink).toEqual(false);
    expect(fakeSiteRow.showImportResultsLink).toEqual(true);
    expect(fakeSiteRow.importFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showCSVInfo).toEqual(true);
  });

  it('can process csvStatus="importCompletedWithErr"', function () {
    fakeSiteRow.checkCsvStatusStart = 6;
    fakeSiteRow.checkCsvStatusEnd = 6;
    fakeSiteRow.checkCsvStatusIndex = 6;

    SiteListService.updateCSVColumnInRow(
      fakeSiteRow,
      true
    );

    deferredCsvStatusReq.resolve({});
    $rootScope.$apply();

    expect(fakeSiteRow.csvStatusObj.isTestResult).toEqual(true);
    expect(fakeSiteRow.csvStatusObj.status).toEqual("importCompletedWithErr");
    expect(fakeSiteRow.csvStatusObj.completionDetails).not.toEqual(null);

    expect(fakeSiteRow.showExportLink).toEqual(true);
    expect(fakeSiteRow.showExportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedExportLink).toEqual(false);
    expect(fakeSiteRow.showExportResultsLink).toEqual(false);
    expect(fakeSiteRow.exportFinishedWithErrors).toEqual(false);

    expect(fakeSiteRow.showImportLink).toEqual(true);
    expect(fakeSiteRow.showImportInProgressLink).toEqual(false);
    expect(fakeSiteRow.grayedImportLink).toEqual(false);
    expect(fakeSiteRow.showImportResultsLink).toEqual(true);
    expect(fakeSiteRow.importFinishedWithErrors).toEqual(true);

    expect(fakeSiteRow.showCSVInfo).toEqual(true);
  });
}); // describe()

describe('SiteListService: license types tests', function () {
  //Load the required dependent modules
  beforeEach(module('Core'));
  beforeEach(module('Huron'));
  beforeEach(module('WebExApp'));

  //Declare the variables
  var $q, $rootScope, SiteListService, WebExApiGatewayService, WebExUtilsFact, fake_gridData, fake_allSitesLicenseInfo;
  var deferred_licenseInfo;

  //Inject the required dependent services/factories/data/etc
  beforeEach(inject(function (
    _$q_,
    _$rootScope_,
    _SiteListService_,
    _WebExApiGatewayService_,
    _WebExUtilsFact_
  ) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    SiteListService = _SiteListService_;
    WebExApiGatewayService = _WebExApiGatewayService_;
    WebExUtilsFact = _WebExUtilsFact_;

    deferred_licenseInfo = $q.defer();

    //Define the fake data
    fake_gridData = [{
      "label": "Meeting Center 200",
      "value": 1,
      "name": "confRadio",
      "license": {
        "licenseId": "MC_5b2fe3b2-fff2-4711-9d6e-4e45fe61ce52_200_sjsite14.webex.com",
        "offerName": "MC",
        "licenseType": "CONFERENCING",
        "billingServiceId": "SubCt30test201582703",
        "features": ["webex-squared", "squared-call-initiation", "squared-syncup", "cloudmeetings"],
        "volume": 25,
        "isTrial": false,
        "status": "ACTIVE",
        "capacity": 200,
        "siteUrl": "sjsite14.webex.com"
      },
      "isCustomerPartner": false
    }, {
      "label": "Meeting Center 25",
      "value": 1,
      "name": "confRadio",
      "license": {
        "licenseId": "MC_5f078901-2e59-4129-bba4-b2126d356b61_25_sjsite04.webex.com",
        "offerName": "MC",
        "licenseType": "CONFERENCING",
        "billingServiceId": "SubCt30test201592302",
        "features": ["webex-squared", "squared-call-initiation", "squared-syncup", "cloudmeetings"],
        "volume": 25,
        "isTrial": false,
        "status": "PENDING",
        "capacity": 25,
        "siteUrl": "sjsite04.webex.com"
      },
      "isCustomerPartner": false
    }, {
      "label": "Meeting Center 200",
      "value": 1,
      "name": "confRadio",
      "license": {
        "licenseId": "MC_3ada1218-1763-428b-bb7f-d03f8ea91fa1_200_t30citestprov9.webex.com",
        "offerName": "MC",
        "licenseType": "CONFERENCING",
        "billingServiceId": "SubCt30test1443208805",
        "features": ["webex-squared", "squared-call-initiation", "squared-syncup", "cloudmeetings"],
        "volume": 25,
        "isTrial": false,
        "status": "PENDING",
        "capacity": 200,
        "siteUrl": "t30citestprov9.webex.com"
      },
      "isCustomerPartner": false
    }, {
      "label": "Meeting Center 200",
      "value": 1,
      "name": "confRadio",
      "license": {
        "licenseId": "MC_3ada1218-1763-428b-bb7f-d03f8da91fa1_200_cisjsite031.webex.com",
        "offerName": "MC",
        "licenseType": "CONFERENCING",
        "billingServiceId": "SubCt30test1443208885",
        "features": ["webex-squared", "squared-call-initiation", "squared-syncup", "cloudmeetings"],
        "volume": 25,
        "isTrial": false,
        "status": "PENDING",
        "capacity": 200,
        "siteUrl": "cisjsite031.webex.com"
      },
      "isCustomerPartner": false
    }];

    fake_allSitesLicenseInfo = [{
      "webexSite": "sjsite14.webex.com",
      "siteHasMCLicense": true,
      "offerCode": "MC",
      "capacity": "200"
    }, {
      "webexSite": "t30citestprov9.webex.com",
      "siteHasMCLicense": true,
      "offerCode": "MC",
      "capacity": "200"
    }, {
      "webexSite": "sjsite04.webex.com",
      "siteHasMCLicense": true,
      "offerCode": "MC",
      "capacity": "200"
    }, {
      "webexSite": "sjsite14.webex.com",
      "siteHasCMRLicense": true,
      "offerCode": "CMR",
      "capacity": "100"
    }, {
      "webexSite": "cisjsite031.webex.com",
      "siteHasMCLicense": true,
      "offerCode": "MC",
      "capacity": "200"
    }, {
      "webexSite": "sjsite04.webex.com",
      "siteHasMCLicense": true,
      "offerCode": "MC",
      "capacity": "25"
    }];

    //Create spies
    spyOn(WebExUtilsFact, "getAllSitesWebexLicenseInfo").and.returnValue(deferred_licenseInfo.promise);

  }));

  //1. Check service exists
  it(': should exist as a service', function () {
    expect(SiteListService).toBeDefined();
  });

  //2. Check mock data exists
  it(': fake_allSitesLicenseInfo should exist', function () {
    expect(fake_allSitesLicenseInfo).not.toBe(null);
  });

  //3. Test for license type column data
  it(': fake_allSitesLicenseInfo should exist', function () {
    SiteListService.updateLicenseTypesColumn(fake_gridData);
    deferred_licenseInfo.resolve(fake_allSitesLicenseInfo);
    $rootScope.$apply();

    expect(fake_gridData).not.toBe(null);
    expect(fake_gridData.length).toBe(4);

    //3.1 sjsite14.webex.com has multiple licenses: MC & CMR
    expect(fake_gridData[0].MCLicensed).toBe(true);
    expect(fake_gridData[0].CMRLicensed).toBe(true);
    expect(fake_gridData[0].multipleWebexServicesLicensed).toBe(true);
    expect(fake_gridData[0].licenseTypeContentDisplay).toBe("siteList.multipleLicenses");
    expect(fake_gridData[0].licenseTooltipDisplay).toBe("helpdesk.licenseDisplayNames.MC<br>helpdesk.licenseDisplayNames.CMR");

    //3.2 t30citestprov9.webex.com has a single license: MC
    expect(fake_gridData[2].MCLicensed).toBe(true);
    expect(fake_gridData[2].multipleWebexServicesLicensed).toBe(false);
    expect(fake_gridData[2].licenseTypeContentDisplay).toBe("helpdesk.licenseDisplayNames.MC");
    expect(fake_gridData[2].licenseTooltipDisplay).toBe(null);

  });
}); //END describe
