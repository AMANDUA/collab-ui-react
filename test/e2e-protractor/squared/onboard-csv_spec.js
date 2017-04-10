'use strict';

/* global inviteusers xdescribe xafterAll manageUsersPage*/
/* global LONG_TIMEOUT */

// NOTE: This test is superceeded by manageusers-csv_spec.js

xdescribe('Onboard Users using CSV File', function () {

  var CSV_FILE_PATH = utils.resolvePath('./../data/DELETE_DO_NOT_CHECKIN_onboard_csv_test_file.csv');
  var token;

  beforeAll(function () {
    this.userList = users.createCsvAndReturnUsers(CSV_FILE_PATH);
  });

  // Given an email alias, activate the user and confirm entitlements set
  function confirmUserOnboarded(email) {
    activate.setup(null, email);

    utils.searchAndClick(email);
    utils.expectIsDisplayed(users.servicesPanel);

    utils.expectIsNotDisplayed(users.messageService);
    utils.expectIsDisplayed(users.meetingService);
    utils.expectTextToBeSet(users.hybridServices_sidePanel_Calendar, 'Off');
    utils.expectTextToBeSet(users.hybridServices_sidePanel_UC, 'On');

    utils.click(users.closeSidePanel);
  }

  it('should login as an account admin', function () {
    login.login('account-admin', '#/users')
      .then(function (_token) {
        token = _token;
        expect(token).toBeTruthy();
      });
  });

  it('should open add users tab', function () {
    utils.click(navigation.usersTab);
    utils.click(manageUsersPage.buttons.manageUsers);
    utils.expectTextToBeSet(manageUsersPage.select.title, 'Add or Modify Users');
    utils.click(manageUsersPage.select.radio.orgBulk);
    utils.click(manageUsersPage.buttons.next);
    utils.expectTextToBeSet(manageUsersPage.select.title, 'Bulk Add or Modify Users');
    utils.click(inviteusers.bulkUpload);
    utils.click(inviteusers.nextButton);
  });

  it('should land to the download template section', function () {
    utils.expectTextToBeSet(wizard.mainviewTitle, 'Add Users');
    utils.click(inviteusers.nextButton);
  });

  it('should land to the upload csv section', function () {
    utils.expectTextToBeSet(wizard.mainviewTitle, 'Add Users');
    utils.fileSendKeys(inviteusers.fileElem, CSV_FILE_PATH);
    utils.expectTextToBeSet(inviteusers.progress, '100%');
    utils.click(inviteusers.nextButton);
  });

  it('should land to upload processing page', function () {
    utils.expectTextToBeSet(wizard.mainviewTitle, 'Add Users');
  });

  it('should land to upload result page', function () {
    utils.expectTextToBeSet(wizard.mainviewTitle, 'Add Users');
    utils.click(inviteusers.finishButton);
  }, LONG_TIMEOUT);

  it('should confirm first user onboarded', function () {
    confirmUserOnboarded(this.userList[0]);
  });

  it('should confirm middle user onboarded', function () {
    confirmUserOnboarded(this.userList[(this.userList.length > 2) ? Math.round(this.userList.length / 2) : 1]);
  });

  it('should confirm last user onboarded', function () {
    confirmUserOnboarded(this.userList[this.userList.length - 1]);
  });

  afterAll(function () {
    utils.deleteFile(CSV_FILE_PATH);

    //   _.each(userList, function (user, ind) {
    //     deleteUtils.deleteUser(user, token).then(function () {
    //       console.log('Deleting user #' + ind + ' (' + user + ')');
    //       if (ind == (userList.length - 1)) {
    //         console.log('All users deleted.');
    //       }
    //     });
    //   });
  }, 60000 * 4);
});
