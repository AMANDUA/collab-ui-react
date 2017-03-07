'use strict';

var featureToggle = require('../utils/featureToggle.utils');

/* global LONG_TIMEOUT */

describe('Partner flow', function () {
  var appWindow;

  describe('Login as partner admin user', function () {

    it('should login', function () {
      login.login('partner-admin', '#/partner/overview');
    });

    it('should display correct navigation colors', function () {
      utils.waitClass(navigation.body, 'inverse');
    });

    it('should display correct tabs for user based on role', function () {
      utils.expectIsDisplayed(navigation.homeTab);
      utils.expectIsDisplayed(navigation.customersTab);
      utils.expectIsDisplayed(navigation.reportsTab);
    });

    it('should display trials list', function () {
      utils.expectIsDisplayed(partner.trialsPanel);
      utils.expectIsDisplayed(partner.viewAllLink);
    });

    it('should display partner support page', function () {
      utils.click(navigation.userInfoButton);
      utils.click(navigation.supportLink).then(navigation.launchSupportPage);
    });
  });

  describe('Partner landing page reports', function () {
    it('should show the reports', function () {
      utils.expectIsDisplayed(partner.entitlementsChart);
      utils.expectIsDisplayed(partner.entitlementsCount);
    });
  });

  describe('Add Partner Trial', function () {

    it('should view all trials', function () {
      navigation.clickCustomers();
    });

    it('should add a new trial', function () {
      //utils.click(partner.trialFilter);
      utils.click(partner.addButton);

      if (featureToggle.features.atlasStartTrialForPaid) {
        utils.expectIsDisplayed(partner.editTrialForm);
      } else {
        // TODO: remove when feature toggle is removed
        utils.expectIsDisplayed(partner.addTrialForm);
      }
      utils.expectIsDisabled(partner.startTrialButton);

      utils.expectCheckbox(partner.squaredUCTrialCheckbox, true);
      utils.expectCheckbox(partner.roomSystemsTrialCheckbox, true);
      utils.click(partner.squaredUCTrialCheckbox); // no PSTN on this trial
      utils.click(partner.roomSystemsTrialCheckbox); // no room systems on this trial
      utils.click(partner.sparkBoardTrialCheckbox); // no spark board system on this trial
      utils.click(partner.careTrialCheckbox); // no care on this trial
      utils.click(partner.validLocationCheckbox); // valid location checked
      utils.expectCheckbox(partner.squaredUCTrialCheckbox, false);
      utils.expectCheckbox(partner.roomSystemsTrialCheckbox, false);
      utils.expectCheckbox(partner.sparkBoardTrialCheckbox, false);
      utils.setCheckboxIfDisplayed(partner.webexTrialCheckbox, false, 100);

      utils.sendKeys(partner.customerNameInput, partner.newTrial.customerName);
      utils.sendKeys(partner.customerEmailInput, partner.newTrial.customerEmail);

      utils.click(partner.startTrialButton);
      notifications.assertSuccess(partner.newTrial.customerName, 'A trial was successfully started');
      utils.clickEscape();
    });

    it('should find new trial', function (done) {
      //utils.click(partner.trialFilter);
      utils.search(partner.newTrial.customerName, -1);
      utils.expectIsDisplayed(partner.newTrialRow);

      partner.retrieveOrgId(partner.newTrialRow).then(function () {
        done();
      });
    }, LONG_TIMEOUT);

    xit('should edit an exisiting trial', function () {
      utils.click(partner.newTrialRow);

      utils.expectIsDisplayed(partner.previewPanel);
      utils.click(partner.termsActionButton);
      utils.click(partner.editTermsButton);
      utils.click(partner.validLocationCheckbox); //valid location

      utils.waitForModal().then(function () {
        utils.expectIsDisplayed(partner.editTrialForm);
        utils.waitClass(partner.messageTrialCheckbox, 'disabled');

        utils.expectIsDisabled(partner.saveUpdateButton);
        utils.clear(partner.licenseCountInput);
        utils.sendKeys(partner.licenseCountInput, partner.editTrial.licenseCount);
        utils.click(partner.saveUpdateButton);
        notifications.assertSuccess(partner.newTrial.customerName, 'You have successfully edited a trial for');
        //utils.click(partner.trialFilter);
        utils.expectIsDisplayed(partner.newTrialRow);
      });
    }, LONG_TIMEOUT);

  });

  describe('Partner launches customer portal', function () {

    it('Launch customer portal via preview panel and display first time wizard', function () {
      appWindow = browser.getWindowHandle();

      utils.click(partner.newTrialRow);
      utils.expectIsDisplayed(partner.previewPanel);
      utils.expectIsEnabled(partner.launchCustomerPanelButton);
      utils.click(partner.launchCustomerPanelButton);
      utils.switchToNewWindow().then(function () {

        // backend services are slow to check userauthinfo/accounts
        utils.wait(wizard.wizard, LONG_TIMEOUT);
        utils.expectIsDisplayed(wizard.leftNav);
        utils.expectIsDisplayed(wizard.mainView);
      });
    }, LONG_TIMEOUT);

    it('should navigate first time wizard', function () {
      utils.expectTextToBeSet(wizard.mainviewTitle, 'Plan Review');
      utils.click(wizard.beginBtn);
      utils.click(wizard.saveBtn);

      utils.expectTextToBeSet(wizard.mainviewTitle, 'Enterprise Settings');
      if (featureToggle.features.atlasFTSWRemoveUsersSSO) {
        // click "Save" instead of "Next" because there are no SSO steps
        // goes to last tab because there is no Add Users
        utils.click(wizard.saveBtn);
      } else {
        // TODO: remove when feature toggle is removed
        utils.click(wizard.nextBtn);
        utils.click(wizard.nextBtn);

        utils.expectTextToBeSet(wizard.mainviewTitle, 'Add Users');
        utils.expectIsDisplayed(wizard.skipBtn);
        utils.click(wizard.nextBtn);
        utils.click(wizard.saveBtn);
      }
      notifications.clearNotifications();

      utils.expectTextToBeSet(wizard.mainviewTitle, 'Get Started');
      utils.click(wizard.finishBtn);

      navigation.expectDriverCurrentUrl('overview');
      utils.expectIsDisplayed(navigation.tabs);

      browser.close();
      browser.switchTo().window(appWindow);
    }, LONG_TIMEOUT);

    it('Launch customer portal via dropdown and display partner managing org in partner filter', function () {
      appWindow = browser.getWindowHandle();

      utils.click(partner.exitPreviewButton);
      utils.click(partner.newTrialRow);
      utils.click(partner.launchCustomerPanelButton);
      utils.switchToNewWindow().then(function () {

        // backend services are slow to check userauthinfo/accounts
        utils.wait(navigation.tabs, LONG_TIMEOUT);
        utils.expectIsDisplayed(navigation.tabs);
      });
    });

    it('Should close customer portal', function () {
      browser.close();
      browser.switchTo().window(appWindow);
    });

  }, LONG_TIMEOUT);

  describe('Partner launches its orgs portal', function () {

    it('should launch partners org view', function () {
      appWindow = browser.getWindowHandle();

      utils.search('', -1); // clear search
      //utils.click(partner.allFilter);
      utils.click(partner.myOrganization);
      utils.click(partner.launchButton);

      utils.switchToNewWindow().then(function () {

        navigation.expectDriverCurrentUrl('overview');
        // backend services are slow to check userauthinfo/accounts
        utils.wait(navigation.tabs, LONG_TIMEOUT);
        utils.expectIsDisplayed(navigation.tabs);

        browser.close();
        browser.switchTo().window(appWindow);
        utils.click(partner.exitPreviewButton);
      });
    }, LONG_TIMEOUT);
  });

  describe("Delete the test customer", function () {
    it('should login navigate to the test customer', function () {
      //utils.click(partner.trialFilter);
      utils.search(partner.newTrial.customerName, -1);
      utils.click(partner.newTrialRow);
      utils.expectIsDisplayed(partner.previewPanel);
    });

    it('should click the Delete Customer button', function () {
      utils.scrollIntoView(partner.deleteCustomerButton);
      utils.click(partner.deleteCustomerButton);
      utils.waitForModal().then(function () {
        utils.click(partner.deleteCustomerOrgConfirm).then(function () {
          notifications.assertSuccess(partner.newTrial.customerName, 'successfully deleted');
        });
      });
    });
  });
});
