(function () {
  'use strict';

  angular
    .module('Core')
    .service('WebExSiteRowService', WebExSiteRowService);

  /* @ngInject */
  function WebExSiteRowService(
    $log,
    $interval,
    $translate,
    Authinfo,
    Auth,
    Userservice,
    WebExUtilsFact,
    UrlConfig,
    WebExApiGatewayService,
    WebExApiGatewayConstsService
  ) {

    this.initSiteRowsObj = function () {
      _this.siteRows = {
        gridData: [],
        gridOptions: {},
      };
    }; // initSiteRowsObj()

    this.initSiteRows = function () {
      _this.getConferenceServices();
      _this.getLinkedConferenceServices();
      _this.configureGrid();
    }; // initSiteRows()

    this.addSiteRow = function (newSiteRow) {
      _this.siteRows.gridData.push(newSiteRow);
    };

    this.getSiteRows = function () {
      return _this.siteRows.gridData;
    };

    this.getGridOptions = function () {
      return _this.siteRows.gridOptions;
    };

    this.getShowGridData = function () {
      return _this.siteRows.showGridData;
    };

    this.getSiteRow = function (siteUrl) {
      var siteRow = _.find(_this.siteRows.gridData, {
        siteUrl: siteUrl,
      });
      return siteRow;
    };

    this.stopPolling = function () {
      _this.siteRows.gridData.forEach(
        function cancelCsvPollInterval(siteRow) {
          // var funcName = "cancelCsvPollInterval()";
          // var logMsg = "";

          if (null != siteRow.csvPollIntervalObj) {
            // logMsg = funcName + "\n" +
              // "siteUrl=" + siteRow.license.siteUrl;
            // $log.log(logMsg);

            $interval.cancel(siteRow.csvPollIntervalObj);
          }
        } // cancelCsvPollInterval()
      ); // _this.siteRows.gridData.forEach()
    };

    this.configureGrid = function () {
      // var funcName = "configureGrid()";
      // var logMsg = "";
      //$log.log(logMsg);

      // Start of grid set up
      _this.siteRows.gridOptions = {
        //data: $scope.gridData,
        data: _this.siteRows.gridData,
        multiSelect: false,
        enableRowSelection: false,
        enableColumnMenus: false,
        rowHeight: 44,
        columnDefs: [],
      };

      _this.siteRows.gridOptions.columnDefs.push({
        field: 'siteUrl',
        displayName: $translate.instant('siteList.siteName'),
        sortable: false,
        width: '25%',
      });

      _this.siteRows.gridOptions.columnDefs.push({
        field: 'siteConfLicenses',
        displayName: $translate.instant('siteList.licenseTypes'),
        cellTemplate: 'modules/core/siteList/siteLicenseTypesColumn.tpl.html',
        sortable: false,
        width: '17%',
      });

      _this.siteRows.gridOptions.columnDefs.push({
        field: 'siteActions',
        displayName: $translate.instant('siteList.siteActions'),
        cellTemplate: 'modules/core/siteList/siteActionsColumn.tpl.html',
        sortable: false,
      });

      //$log.log(JSON.stringify(funcName + "\n" +
      //JSON.stringify(siteRows.gridOptions)));

      _this.updateConferenceServices();
    }; //configureGrid

    this.getConferenceServices = function () {
      var funcName = "getConferenceServices()";
      var logMsg = "";

      var conferenceServices = Authinfo.getConferenceServicesWithoutSiteUrl();

      // logMsg = funcName + "\n" +
      //   "conferenceServices=\n" + JSON.stringify(conferenceServices);
      // $log.log(logMsg);
      if (conferenceServices) {
        conferenceServices.forEach(function (conferenceService) {

          var newSiteUrl = conferenceService.license.siteUrl;

          var findCriteria = {
            siteUrl: newSiteUrl,
            isLinkedSite: false,
          };

          var siteRowExists = _.find(
            _this.siteRows.gridData,
            findCriteria
          );
          // var siteRowExists = false;

          if (siteRowExists) {
            logMsg = funcName + "\n" +
              "WARNING - duplicate siteUrl found!" + "\n" +
              "newSiteUrl=" + newSiteUrl;
            $log.log(logMsg);
          } else {
            conferenceService.showCSVInfo = false;
            conferenceService.csvStatusObj = null;
            conferenceService.csvPollIntervalObj = null;
            conferenceService.showCSVIconAndResults = true;

            conferenceService.isIframeSupported = false;
            conferenceService.isAdminReportEnabled = false;
            conferenceService.showSiteLinks = false;
            conferenceService.isError = false;
            conferenceService.isWarn = false;
            conferenceService.isCI = true;
            conferenceService.isLinkedSite = false;
            conferenceService.isCSVSupported = false;
            conferenceService.adminEmailParam = null;
            conferenceService.userEmailParam = null;
            conferenceService.advancedSettings = null;
            conferenceService.webexAdvancedUrl = null;
            conferenceService.siteUrl = newSiteUrl;
            conferenceService.siteAdminUrl = null;
            conferenceService.showLicenseTypes = false;
            conferenceService.multipleWebexServicesLicensed = false;
            conferenceService.licenseTypeContentDisplay = null;
            conferenceService.licenseTypeId = newSiteUrl + "_";
            conferenceService.licenseTooltipDisplay = null;
            conferenceService.MCLicensed = false;
            conferenceService.ECLicensed = false;
            conferenceService.SCLicensed = false;
            conferenceService.TCLicensed = false;
            conferenceService.EELicensed = false;
            conferenceService.CMRLicensed = false;

            conferenceService.csvMock = {
              mockStatus: false,
              mockStatusStartIndex: 0,
              mockStatusEndIndex: 0,
              mockStatusCurrentIndex: null,
              mockExport: false,
              mockImport: false,
              mockFileDownload: false,
            };

            _this.addSiteRow(conferenceService);
          }
        }); // conferenceServices.forEach()
      }
    }; // getConferenceServices()

    this.getLinkedConferenceServices = function () {
      var funcName = "getLinkedConferenceServices()";
      var logMsg = "";

      var linkedConferenceServices = Authinfo.getConferenceServicesWithLinkedSiteUrl();

      if (linkedConferenceServices) {
        linkedConferenceServices.forEach(function (conferenceService) {
          var newSiteUrl = conferenceService.license.linkedSiteUrl;

          var findCriteria = {
            siteUrl: newSiteUrl,
            isLinkedSite: true,
          };

          var siteRowExists = _.find(
            _this.siteRows.gridData,
            findCriteria
          );

          if (siteRowExists) {
            logMsg = funcName + "\n" +
              "WARNING - duplicate linkedSiteUrl found!" + "\n" +
              "newSiteUrl=" + newSiteUrl;
            $log.log(logMsg);
          } else {
            conferenceService.isLinkedSite = true;
            conferenceService.showLicenseTypes = false;
            conferenceService.siteUrl = newSiteUrl;
            conferenceService.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.linkedSite');
            conferenceService.licenseTooltipDisplay = $translate.instant('helpdesk.licenseDisplayNames.linkedSite');

            _this.addSiteRow(conferenceService);
          }
        });
      }

    }; // getLinkedConferenceServices()

    this.updateConferenceServices = function () {
      // var funcName = "updateConferenceServices()";
      // var logMsg = "";

      if (!_.isUndefined(Authinfo.getPrimaryEmail())) {
        _this.updateGridColumns();
      } else {
        Userservice.getUser('me', function (data) {
          if (
            (data.success) &&
            (data.emails)
          ) {
            Authinfo.setEmails(data.emails);
            _this.updateGridColumns();
          }
        });
      }
    }; //updateConferenceServices()

    this.updateGridColumns = function () {
      // var funcName = "updateGridColumns()";
      // var logMsg = "";

      _this.updateLicenseTypesColumn();
      _this.updateActionsColumnForAllRows();
    }; // updateGridColumns()

    this.updateLicenseTypesColumn = function () {
      // var funcName = "updateLicenseTypesColumn()";
      // var logMsg = "";

      WebExUtilsFact.getAllSitesWebexLicenseInfo().then(
        function getWebexLicenseInfoSuccess(allSitesLicenseInfo) {
          // var funcName = "updateLicenseTypesColumn().getWebexLicenseInfoSuccess()";
          // var logMsg = "";

          // logMsg = funcName + ": " + "\n" +
          //   "allSitesLicenseInfo=" + JSON.stringify(allSitesLicenseInfo);
          // $log.log(logMsg);

          _.filter(_this.siteRows.gridData, {
            isLinkedSite: false,
          }).forEach(
            function processGridForLicense(siteRow) {
              // linked site don't need to process license
              if (siteRow.isLinkedSite) {
                return false;
              }
              // var funcName = "processGridForLicense()";
              // var logMsg = "";
              var siteUrl = siteRow.license.siteUrl;
              var count = 0;
              siteRow.licenseTooltipDisplay = "";

              //Get the site's MC, EC, SC, TC, CMR license information
              //MC
              var siteMC = _.filter(allSitesLicenseInfo, {
                webexSite: siteUrl,
                offerCode: "MC",
              });

              if (
                (siteMC != null) &&
                (siteMC.length > 0)
              ) {

                siteRow.MCLicensed = true;

                siteMC.forEach(
                  function processDisplayText(mc) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + mc.offerCode, {
                      capacity: mc.capacity,
                    });

                    siteRow.licenseTypeId = siteRow.licenseTypeId + "MC" + mc.capacity + "-";

                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + mc.offerCode, {
                      capacity: mc.capacity,
                    });

                    count++;
                  }
                ); //siteMC.forEach

              } else {
                siteRow.MCLicensed = false;
              }

              //EE
              var siteEE = _.filter(allSitesLicenseInfo, {
                webexSite: siteUrl,
                offerCode: "EE",
              });

              if (
                (siteEE != null) &&
                (siteEE.length > 0)
              ) {

                siteRow.EELicensed = true;

                siteEE.forEach(
                  function processDisplayText(ee) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + ee.offerCode, {
                      capacity: ee.capacity,
                    });

                    siteRow.licenseTypeId = siteRow.licenseTypeId + "EE" + ee.capacity + "-";

                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + ee.offerCode, {
                      capacity: ee.capacity,
                    });

                    count++;
                  }
                ); //siteEE.forEach

              } else {
                siteRow.EELicensed = false;
              }

              //CMR
              var siteCMR = _.filter(allSitesLicenseInfo, {
                webexSite: siteUrl,
                offerCode: "CMR",
              });

              if (
                (siteCMR != null) &&
                (siteCMR.length > 0)
              ) {

                siteRow.CMRLicensed = true;

                siteCMR.forEach(
                  function processDisplayText(cmr) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + cmr.offerCode, {
                      capacity: cmr.capacity,
                    });

                    siteRow.licenseTypeId = siteRow.licenseTypeId + "CMR" + cmr.capacity + "-";

                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + cmr.offerCode, {
                      capacity: cmr.capacity,
                    });

                    count++;
                  }
                ); //siteCMR.forEach

              } else {
                siteRow.CMRLicensed = false;
              }

              //EC
              var siteEC = _.filter(allSitesLicenseInfo, {
                webexSite: siteUrl,
                offerCode: "EC",
              });

              if (
                (siteEC != null) &&
                (siteEC.length > 0)
              ) {

                siteRow.ECLicensed = true;

                siteEC.forEach(
                  function processDisplayText(ec) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + ec.offerCode, {
                      capacity: ec.capacity,
                    });

                    siteRow.licenseTypeId = siteRow.licenseTypeId + "EC" + ec.capacity + "-";

                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + ec.offerCode, {
                      capacity: ec.capacity,
                    });

                    count++;
                  }
                ); //siteEC.forEach

              } else {
                siteRow.ECLicensed = false;
              }

              //SC
              var siteSC = _.filter(allSitesLicenseInfo, {
                webexSite: siteUrl,
                offerCode: "SC",
              });

              if (
                (siteSC != null) &&
                (siteSC.length > 0)
              ) {

                siteRow.SCLicensed = true;

                siteSC.forEach(
                  function processDisplayText(sc) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + sc.offerCode, {
                      capacity: sc.capacity,
                    });

                    siteRow.licenseTypeId = siteRow.licenseTypeId + "SC" + sc.capacity + "-";

                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + sc.offerCode, {
                      capacity: sc.capacity,
                    });

                    count++;
                  }
                ); //siteSC.forEach

              } else {
                siteRow.SCLicensed = false;
              }

              //TC
              var siteTC = _.filter(allSitesLicenseInfo, {
                webexSite: siteUrl,
                offerCode: "TC",
              });

              if (
                (siteTC != null) &&
                (siteTC.length > 0)
              ) {

                siteRow.TCLicensed = true;

                siteTC.forEach(
                  function processDisplayText(tc) {
                    //Grid content display
                    siteRow.licenseTypeContentDisplay = $translate.instant('helpdesk.licenseDisplayNames.' + tc.offerCode, {
                      capacity: tc.capacity,
                    });

                    siteRow.licenseTypeId = siteRow.licenseTypeId + "TC" + tc.capacity + "-";

                    //Tooltip display
                    siteRow.licenseTooltipDisplay = siteRow.licenseTooltipDisplay + "<br>" + $translate.instant('helpdesk.licenseDisplayNames.' + tc.offerCode, {
                      capacity: tc.capacity,
                    });

                    count++;
                  }
                ); //siteTC.forEach

              } else {
                siteRow.TCLicensed = false;
              }

              siteRow.licenseTypeId = siteRow.licenseTypeId + "license";

              if (count > 1) {
                siteRow.multipleWebexServicesLicensed = true;
                siteRow.licenseTypeContentDisplay = $translate.instant('siteList.multipleLicenses');
                siteRow.licenseTooltipDisplay = _.replace(siteRow.licenseTooltipDisplay, "<br>", "");
              } else {
                siteRow.multipleWebexServicesLicensed = false;
                siteRow.licenseTooltipDisplay = null;
              }

              // logMsg = funcName + ": " + "\n" +
              //   "siteRow=" + JSON.stringify(siteRow);
              //$log.log(logMsg);

              siteRow.showLicenseTypes = true;
            } // processGridForLicense()
          ); // siteRows.gridData.forEach()

        }, // getWebexLicenseInfoSuccess()

        function getWebexLicenseInfoError() {
          var funcName = "updateLicenseTypesColumn().getWebexLicenseInfoError()";
          // var logMsg = "";

          $log.log(funcName);
        } // getWebexLicenseInfoError()
      ); //getWebexLicenseInfo.then()

    }; // updateLicenseTypesColumn

    this.updateActionsColumnForAllRows = function () {
      // var funcName = "updateActionsColumnForAllRows()";
      // var logMsg = "";

      _.filter(_this.siteRows.gridData, {
        isLinkedSite: false,
      }).forEach(function (siteRow) {
        _this.updateActionsColumnForOneRow(siteRow);
      }); // gridData.forEach()

    }; // updateActionsColumnForAllRows

    this.updateActionsColumnForOneRow = function (siteRow) {
      // var funcName = "updateActionsColumnForOneRow()";
      // var logMsg = "";

      siteRow.adminEmailParam = Authinfo.getPrimaryEmail();
      siteRow.userEmailParam = Authinfo.getPrimaryEmail();
      siteRow.advancedSettings = UrlConfig.getWebexAdvancedEditUrl(siteRow.siteUrl);
      siteRow.webexAdvancedUrl = UrlConfig.getWebexAdvancedHomeUrl(siteRow.siteUrl);

      var siteUrl = siteRow.siteUrl;

      var isCISite = WebExUtilsFact.isCIEnabledSite(siteUrl);

      siteRow.siteAdminUrl = WebExUtilsFact.getSiteAdminUrl(siteUrl);
      siteRow.isCI = isCISite;

      // logMsg = funcName + ": " + "\n" +
      //   "siteUrl=" + siteUrl + "\n" +
      //   "isCISite=" + isCISite;
      // $log.log(logMsg);

      WebExApiGatewayService.siteFunctions(siteUrl).then(
        function siteFunctionsSuccess(result) {
          // var funcName = "updateActionsColumnForOneRow().siteFunctionsSuccess()";

          // logMsg = funcName + ": " + "\n" +
          //   "result=" + JSON.stringify(result);
          // $log.log(logMsg);
          siteRow.isIframeSupported = result.isIframeSupported;
          siteRow.isAdminReportEnabled = result.isAdminReportEnabled;
          siteRow.isCSVSupported = result.isCSVSupported;

          siteRow.showSiteLinks = true;

          // logMsg = funcName + ": " + "\n" +
          //   "siteUrl=" + siteUrl + "\n" +
          //   "siteRow.isCSVSupported=" + siteRow.isCSVSupported + "\n" +
          //   "siteRow.isIframeSupported=" + siteRow.isIframeSupported + "\n" +
          //   "siteRow.isAdminReportEnabled=" + siteRow.isAdminReportEnabled + "\n" +
          //   "siteRow.showSiteLinks=" + siteRow.showSiteLinks;
          // $log.log(logMsg);

          if (
            (!siteRow.isCSVSupported) ||
            (!siteRow.showCSVIconAndResults)
          ) {

            // no further data to get
            siteRow.showCSVInfo = true;
            return;
          }

          _this.updateCSVStatusInRow(siteRow.siteUrl);

          // start CSV status poll
          var pollInterval = 30000; // 30sec (15000 is 15sec; 3600000 is 1hr;)
          siteRow.csvPollIntervalObj = $interval(
            function () {
              _this.updateCSVStatusInRow(siteRow.siteUrl);
            },

            pollInterval
          );
        }, // siteFunctionsSuccess()

        function siteFunctionsError(response) {

          var funcName = "updateActionsColumnForOneRow().siteFunctionsError()";
          var logMsg = "";
          siteRow.isIframeSupported = false;
          siteRow.isAdminReportEnabled = false;
          siteRow.showSiteLinks = true;
          siteRow.showCSVInfo = true;
          siteRow.isError = true;

          if (response.response.indexOf("030048") != -1) {
            siteRow.isWarn = true;
          }

          logMsg = funcName + ": " + "\n" +
            "response=" + JSON.stringify(response);
          $log.log(logMsg);
        } // siteFunctionsError()
      ); // WebExApiGatewayService.siteFunctions().then
    }; // updateActionsColumnForOneRow()

    this.updateCSVStatusInRow = function (siteUrl) {
      // var funcName = "updateCSVStatusInRow()";
      // var logMsg = "";

      var siteRow = _this.getSiteRow(siteUrl);
      // logMsg = funcName + "\n" +
      //   "siteRow=" + "\n" + JSON.stringify(siteRow);
      //$log.log(logMsg);

      //var siteUrl = siteRow.siteUrl;
      var mockCsvStatusReq = null;

      if (
        (null != siteRow.csvMock) &&
        (siteRow.csvMock.mockStatus)
      ) {

        if (null == siteRow.csvMock.mockStatusCurrentIndex) {
          siteRow.csvMock.mockStatusCurrentIndex = siteRow.csvMock.mockStatusStartIndex;
        }

        mockCsvStatusReq = WebExApiGatewayConstsService.csvStatusTypes[siteRow.csvMock.mockStatusCurrentIndex];

        // logMsg = funcName + "\n" +
        //   "mockStatusCurrentIndex=" + siteRow.csvMock.mockStatusCurrentIndex + "\n" +
        //   "mockCsvStatusReq=" + mockCsvStatusReq;
        // $log.log(logMsg);

        ++siteRow.csvMock.mockStatusCurrentIndex;

        if (
          (WebExApiGatewayConstsService.csvStatusTypes.length <= siteRow.csvMock.mockStatusCurrentIndex) ||
          (siteRow.csvMock.mockStatusEndIndex < siteRow.csvMock.mockStatusCurrentIndex)
        ) {

          siteRow.csvMock.mockStatusCurrentIndex = siteRow.csvMock.mockStatusStartIndex;
        }
      }

      WebExApiGatewayService.csvStatus(
        siteRow.siteUrl,
        siteRow.csvMock.mockStatus,
        mockCsvStatusReq
      ).then(

        function success(response) {
          // var funcName = "WebExApiGatewayService.csvStatus.success()";
          // var logMsg = "";

          // logMsg = funcName + "\n" +
          //   "siteUrl=" + siteRow.siteUrl + "\n" +
          //   "response=" + JSON.stringify(response);
          //$log.log(logMsg);

          // save the response obj into the siteRow obj... when get result (for completed job) is clicked,
          // we will need  more information from the response obj
          siteRow.csvStatusObj = response;
          siteRow.asyncErr = false;

          _this.updateDisplayControlFlagsInRow(siteRow);
        }, // csvStatusSuccess()

        function error(response) {
          // var funcName = "WebExApiGatewayService.csvStatus.error()";
          // var logMsg = "";

          // logMsg = funcName + "\n" +
          //   "siteUrl=" + siteRow.siteUrl + "\n" +
          //   "response=" + JSON.stringify(response);
          //$log.log(logMsg);

          if (response.errorId == "060502") {
            //$log.log("Redirect to login...");
            Auth.redirectToLogin();
          }

          siteRow.csvStatusObj = response;
          siteRow.asyncErr = true;

          _this.updateDisplayControlFlagsInRow(siteRow);

          siteRow.showCSVInfo = false;
        } // csvStatusError()
      ); // WebExApiGatewayService.csvStatus(siteRow.siteUrl).then()
    }; // updateCSVStatusInRow()

    this.updateDisplayControlFlagsInRow = function (siteRow) {

      // var funcName = "updateDisplayControlFlagsInRow()";
      // var logMsg = "";

      // logMsg = funcName + "\n" +
      //   "siteRow.csvStatusObj=" + "\n" + JSON.stringify(siteRow.csvStatusObj);
      // $log.log(logMsg);

      siteRow.showCSVInfo = true;
    }; //updateDisplayControlFlagsInRow()

    ////////

    var _this = this;

    this.siteRows = null;
    this.initSiteRowsObj();

  } // WebExSiteRowService
})();
