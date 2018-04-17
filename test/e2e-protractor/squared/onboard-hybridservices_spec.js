'use strict';

describe('Onboard users with Hybrid Services', function () {
  var token;
  var testUser = utils.randomTestGmailWithSalt('hybridservices');

  function expectHybridServices(calendar, callAware, callConnectBoolean) {
    utils.waitForText(users.hybridServices_sidePanel_Calendar, calendar);
    utils.waitForText(users.hybridServices_sidePanel_UC, callAware);

    var isCallServiceAwareEnabled = callAware !== 'Off';
    // Get into the call service settings, make sure EC is off!
    utils.click(users.callServiceAware_link);
    utils.expectSwitchState(users.callServiceAwareToggle, isCallServiceAwareEnabled);
    if (isCallServiceAwareEnabled) {
      // connect toggle only shown if call aware is enabled
      utils.expectSwitchState(users.callServiceConnectToggle, callConnectBoolean);
    } else {
      utils.expectIsNotDisplayed(users.callServiceConnectToggle);
    }

    utils.click(users.closeSidePanel);
  }

  it('should login as an account admin', function () {
    login.login('account-admin', '#/users')
      .then(function (bearerToken) {
        token = bearerToken;
      });
  });

  xit('should ensure services enabled', function () {
    navigation.ensureHybridService(navigation.calendarServicePage);
    navigation.ensureHybridService(navigation.callServicePage);
    navigation.ensureCallServiceAware();
  });

  describe('Onboard user with no hybrid services', function () {
    it('should add user', function () {
      navigation.clickUsers();
      users.createUser(testUser);
      utils.click(users.onboardButton);
      utils.expectIsDisplayed(users.finishButton);
      utils.click(users.finishButton);
      utils.expectIsNotDisplayed(users.manageDialog);
    });

    it('should confirm user added and entitled', function () {
      utils.searchAndClick(testUser);
      utils.expectIsDisplayed(users.servicesPanel);

      utils.expectIsDisplayed(users.messageServiceFree);
      utils.expectIsDisplayed(users.meetingServiceFree);
      utils.expectIsNotDisplayed(users.hybridServices_sidePanel_Calendar);
      utils.expectIsNotDisplayed(users.hybridServices_sidePanel_UC);

      utils.click(users.closeSidePanel);
    });

    afterAll(function () {
      deleteUtils.deleteUser(testUser, token);
    });
  });

  describe('Onboard and test HS additive case', function () {
    it('should add a user (Meeting On, Calendar On)', function () {
      users.createUser(testUser);

      utils.click(users.paidMtgCheckbox);
      utils.click(users.hybridServices_Cal);

      utils.click(users.onboardButton);
      utils.expectIsDisplayed(users.finishButton);
      utils.click(users.finishButton);
      utils.expectIsNotDisplayed(users.manageDialog);

      activate.setup(null, testUser);
    });

    xit('should re-onboard with more entitlements to confirm the additive case', function () {
      users.createUser(testUser);

      // Select hybrid services
      utils.click(users.hybridServices_UC);

      utils.click(users.onboardButton);
      utils.expectIsDisplayed(users.finishButton);
      utils.click(users.finishButton);
      utils.expectIsNotDisplayed(users.manageDialog);

      utils.searchAndClick(testUser);
      utils.expectIsDisplayed(users.servicesPanel);

      utils.expectIsDisplayed(users.messageServiceFree);
      utils.expectIsDisplayed(users.meetingServicePaid);
      expectHybridServices('Status not found', 'Status not found', false);
    });

    afterAll(function () {
      deleteUtils.deleteUser(testUser, token);
    });
  });

  describe('Onboard user with Call Service Aware', function () {
    xit('should add user (Message On, Aware on)', function () {
      users.createUser(testUser);

      utils.click(users.paidMsgCheckbox);
      utils.click(users.hybridServices_UC);

      utils.click(users.onboardButton);
      utils.expectIsDisplayed(users.finishButton);
      utils.click(users.finishButton);
      utils.expectIsNotDisplayed(users.manageDialog);

      activate.setup(null, testUser);
    });

    xit('should confirm user added and entitled', function () {
      utils.searchAndClick(testUser);
      utils.expectIsDisplayed(users.servicesPanel);

      utils.expectIsDisplayed(users.messageServicePaid);
      utils.expectIsDisplayed(users.meetingServiceFree);
      expectHybridServices('Off', 'Status not found', false);
    });

    afterAll(function () {
      deleteUtils.deleteUser(testUser, token);
    });
  });

  describe('Onboard user with Call Service Connect', function () {
    xit('should add user (Calendar, Aware, and Connect all on)', function () {
      users.createUser(testUser);

      utils.click(users.paidMsgCheckbox);
      utils.click(users.hybridServices_Cal);
      utils.click(users.hybridServices_UC);
      utils.click(users.hybridServices_EC);

      utils.click(users.onboardButton);
      utils.expectIsDisplayed(users.finishButton);
      utils.click(users.finishButton);
      utils.expectIsNotDisplayed(users.manageDialog);

      activate.setup(null, testUser);
    });

    xit('should confirm user added and entitled', function () {
      utils.searchAndClick(testUser);
      utils.expectIsDisplayed(users.servicesPanel);

      utils.expectIsDisplayed(users.messageServicePaid);
      utils.expectIsDisplayed(users.meetingServiceFree);
      expectHybridServices('Status not found', 'Status not found', true);
    });

    afterAll(function () {
      deleteUtils.deleteUser(testUser, token);
    });
  });
});
