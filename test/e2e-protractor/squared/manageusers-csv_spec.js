'use strict';

/* global manageUsersPage */

// NOTE: Be sure to re-enable the afterAll at line 151 when re-enabling this test!
describe('Manage Users - CSV File -', function () {
  var token;
  var CSV_FILE_NAME = 'DELETE_DO_NOT_CHECKIN_onboard_csv_test_file.csv';
  var CSV_FILE_PATH = utils.resolvePath('./../data/' + CSV_FILE_NAME);
  var userList;
  var originalLogVerbose;

  beforeAll(function (done) {
    originalLogVerbose = log.verbose;
    // TODO: remove verbose logging after monitoring sauce runs through CI job
    log.verbose = true;

    users.createCsvAndReturnUsers(CSV_FILE_PATH).then(function (_userList) {
      userList = _userList;
    }).catch(function () {
      fail('failed to create csv file');
    }).finally(done);
  });

  afterAll(function () {
    log.verbose = originalLogVerbose;
    originalLogVerbose = undefined;
  });

  // Given an email alias, find user and confirm entitlements set
  function confirmUserOnboarded(email) {

    utils.searchAndClick(email);
    utils.expectIsDisplayed(users.servicesPanel);

    utils.expectIsDisplayed(users.messageServiceFree);
    utils.expectIsDisplayed(users.meetingServicePaid);
    // utils.expectIsDisplayed(users.hybridServices_sidePanel_Calendar);
    // utils.expectIsDisplayed(users.hybridServices_sidePanel_UC);

    utils.click(users.closeSidePanel);
  }

  it('should login as an account admin', function () {
    login.login('account-admin', '#/users')
      .then(function (_token) {
        token = _token;
      });
  });

  it('should select bulk upload/modify users', function () {
    utils.click(navigation.usersTab);
    utils.click(manageUsersPage.buttons.manageUsers);
    utils.expectTextToBeSet(manageUsersPage.select.title, 'Add or Modify Users');
    utils.click(manageUsersPage.select.radio.orgBulk);
    utils.click(manageUsersPage.buttons.next);
    utils.expectTextToBeSet(manageUsersPage.bulk.title, 'Bulk Add or Modify Users');
  });

  // todo - this is failing in SauceLabs due to Chrome requesting a location to download the files
  xdescribe('Export CSV', function () {

    it('should download CSV Template', function () {

      utils.expectIsDisplayed(manageUsersPage.bulk.export.downloadTemplateButton);
      utils.click(manageUsersPage.bulk.export.downloadTemplateButton);
      utils.expectIsDisplayed(manageUsersPage.bulk.export.exportSpinner);
      utils.expectIsDisplayed(manageUsersPage.bulk.export.cancelExportButton);
      utils.waitForModal().then(function () {
        notifications.assertSuccess('Your template list has been compiled and your download has started.');
      });

    });

    it('should NOT export Users to CSV file when export canceled', function () {

      utils.expectIsDisplayed(manageUsersPage.bulk.export.exportCsvButton);
      utils.click(manageUsersPage.bulk.export.exportCsvButton);

      utils.waitForModal().then(function () {
        utils.expectTextToBeSet(manageUsersPage.modalDialog.title, 'Export User Attributes');
        utils.click(manageUsersPage.modalDialog.cancelButton);

        utils.expectIsNotDisplayed(manageUsersPage.bulk.export.exportSpinner);
        utils.expectIsNotDisplayed(manageUsersPage.bulk.export.cancelExportButton);
      });
    });

    it('should export Users to CSV file when export selected', function () {

      utils.expectIsDisplayed(manageUsersPage.bulk.export.exportCsvButton);
      utils.click(manageUsersPage.bulk.export.exportCsvButton);

      function handleExporting() {
        utils.expectIsDisplayed(manageUsersPage.bulk.export.exportSpinner);
        utils.expectIsDisplayed(manageUsersPage.bulk.export.cancelExportButton);

        utils.waitForModal().then(function () {
          notifications.assertSuccess('Your user list has been compiled and your download has started.');
        });
      }

      utils.waitForModal().then(function () {
        utils.expectTextToBeSet(manageUsersPage.modalDialog.title, 'Export User Attributes');
        utils.click(manageUsersPage.modalDialog.exportButton);

        // note: we MAY get another warning dialog about over 10000 users. If so,
        // we need to press Export on that one as well
        utils.waitUntilElemIsPresent(manageUsersPage.bulk.export.confirmExportCsvButton, 2000)
          .then(function () {
            // click the confirm export button if it is there
            utils.click(manageUsersPage.bulk.export.confirmExportCsvButton);
          })
          .finally(function () {
            // test the exporting
            handleExporting();
          });
      });
    }, 60000 * 4);

  });

  describe('Import CSV', function () {

    it('should cancel file to upload', function () {

      utils.fileSendKeys(manageUsersPage.bulk.import.uploadInput, CSV_FILE_PATH);

      utils.expectTextToBeSet(manageUsersPage.bulk.import.importFileName, CSV_FILE_NAME);
      utils.expectIsDisplayed(manageUsersPage.bulk.import.removeFileButton);
      utils.expectIsDisplayed(manageUsersPage.bulk.import.addServicesOnlyRadio);
      utils.expectIsDisplayed(manageUsersPage.bulk.import.addAdnRemoveServicesRadio);

      utils.click(manageUsersPage.bulk.import.removeFileButton);
      utils.expectIsNotDisplayed(manageUsersPage.bulk.import.removeFileButton);
      utils.expectIsNotDisplayed(manageUsersPage.bulk.import.addServicesOnlyRadio);
      utils.expectIsNotDisplayed(manageUsersPage.bulk.import.addAdnRemoveServicesRadio);

    });

    it('should set file to upload and import CSV', function () {

      utils.fileSendKeys(manageUsersPage.bulk.import.uploadInput, CSV_FILE_PATH);

      utils.expectTextToBeSet(manageUsersPage.bulk.import.importFileName, CSV_FILE_NAME);
      utils.expectIsDisplayed(manageUsersPage.bulk.import.removeFileButton);
      utils.expectIsDisplayed(manageUsersPage.bulk.import.addServicesOnlyRadio);
      utils.expectIsDisplayed(manageUsersPage.bulk.import.addAdnRemoveServicesRadio);

      utils.click(manageUsersPage.bulk.import.addServicesOnlyRadio);

      utils.click(manageUsersPage.buttons.submit);

      // status screen should now be displayed
      utils.expectIsDisplayed(manageUsersPage.importStatus.statusDisplay);
      utils.expectTextToBeSet(manageUsersPage.importStatus.progressFileName, CSV_FILE_NAME);

      // import complete.  check our results
      utils.expectTextToBeSet(manageUsersPage.importStatus.uploadComplete, 'Completed ' + CSV_FILE_NAME + ' at');

      utils.expectTextToBeSet(manageUsersPage.importStatus.newUsers, '' + userList.length);
      utils.expectTextToBeSet(manageUsersPage.importStatus.updatedUsers, '0');
      utils.expectTextToBeSet(manageUsersPage.importStatus.errorUsers, '0');

      utils.click(manageUsersPage.buttons.done);
    });

    it('should confirm first user onboarded', function () {
      confirmUserOnboarded(userList[0]);
    });

    it('should confirm middle user onboarded', function () {
      confirmUserOnboarded(userList[(userList.length > 2) ? Math.round(userList.length / 2) : 1]);
    });

    it('should confirm last user onboarded', function () {
      confirmUserOnboarded(userList[userList.length - 1]);
    });

    afterAll(function () {
      utils.deleteFile(CSV_FILE_PATH);
      _.each(userList, function (user) {
        deleteUtils.deleteUser(user, token);
      });
    }, 60000 * 4);
  });

});

