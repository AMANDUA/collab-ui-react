'use strict';

/* global inviteusers manageUsersPage */
/* global LONG_TIMEOUT */

describe('Onboard users through Manual Invite', function () {
  var token;
  var userList = [utils.randomTestGmailwithSalt('manual'), utils.randomTestGmailwithSalt('manual')];

  it('should login as an account admin', function () {
    login.login('account-admin', '#/users')
      .then(function (_token) {
        token = _token;
        expect(token).toBeTruthy();
      });
  });

  it('should select manually add/modify users', function () {
    utils.click(navigation.usersTab);
    utils.click(manageUsersPage.buttons.manageUsers);
    utils.expectTextToBeSet(manageUsersPage.select.title, 'Add or Modify Users');
    utils.click(manageUsersPage.select.radio.orgManual);
    utils.click(manageUsersPage.buttons.next);
    utils.expectTextToBeSet(manageUsersPage.select.title, 'Manually Add or Modify Users');
  });

  it('should Manually Invite multiple users by email address (Message On).', function () {

    // Enter test email into edit box
    utils.click(manageUsersPage.manual.radio.emailAddress);
    utils.sendKeys(manageUsersPage.manual.emailAddress.addUsersField, userList[0] + ', ' + userList[1]);
    utils.sendKeys(manageUsersPage.manual.emailAddress.addUsersField, protractor.Key.ENTER);
    utils.click(manageUsersPage.buttons.next);

    // Need a license for valid HS services
    utils.click(manageUsersPage.manual.paidMsgCheckbox);
    utils.expectIsDisplayed(manageUsersPage.buttons.save);
    utils.click(manageUsersPage.buttons.save);
    utils.click(manageUsersPage.buttons.finish);

    _.each(userList, function (alias) {
      activate.setup(null, alias);
    });
  });

  it('should confirm invited users exist and have licenses/entitlements set.', function () {
    _.each(userList, function (alias) {
      utils.searchAndClick(alias);
      utils.expectIsDisplayed(users.servicesPanel);

      utils.expectIsDisplayed(users.messageService);
      utils.expectIsDisplayed(users.meetingService);
      utils.click(users.closeSidePanel);
    });
  });

  afterAll(function () {
    _.each(userList, function (user) {
      deleteUtils.deleteUser(user, token);
    });
  });
});
