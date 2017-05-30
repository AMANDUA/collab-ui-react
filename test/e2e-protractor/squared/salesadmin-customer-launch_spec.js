'use strict';

describe('Launch customer as a sales admin', function () {
  it('should login as a partner sales account admin', function () {
    login.loginThroughGui(helper.auth['partner-reports-sales-admin'].user, helper.auth['partner-reports-sales-admin'].pass, '#/partner/customers');
  });

  describe('Launch customer ', function () {
    it('should launch customer', function () {
      customers.clickViewCustomer('Atlas_Test_Sales_Admin_Org_Create');
      utils.click(customers.viewCustomer);
      utils.switchToNewWindow().then(function () {
        utils.expectIsDisplayed(landing.overviewPage);
      });
    });
  });
});
