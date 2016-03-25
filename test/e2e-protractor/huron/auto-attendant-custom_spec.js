'use strict';
/*eslint-disable */

describe('Huron Auto Attendant', function () {
  var waitTime = 12000;
  beforeAll(function () {
    login.login('huron-int1');
  }, 120000);

  describe('Create and Delete AA', function () {

    // TEST CASES
    it('should navigate to AA landing page', function () {

      // First ensure the test AA is deleted (in case last test run failed for example)
      var flow = protractor.promise.controlFlow();
      var result = flow.execute(deleteUtils.findAndDeleteTestAA);

      // and navigate to the landing page
      navigation.clickAutoAttendant();

    }, 120000);

    it('should create a new auto attendant named "' + deleteUtils.testAAName + '"', function () {

      // click new feature
      utils.click(autoattendant.newFeatureButton);

      // select AA
      utils.wait(autoattendant.featureTypeAA, waitTime);
      utils.click(autoattendant.featureTypeAA);

      utils.wait(autoattendant.customAA, waitTime);
      utils.click(autoattendant.customAA);

      // enter AA name
      utils.sendKeys(autoattendant.newAAname, deleteUtils.testAAName);
      utils.sendKeys(autoattendant.newAAname, protractor.Key.ENTER);

      // assert we see the create successful message
      autoattendant.assertCreateSuccess();

    }, 60000);

    it('should add a single phone number to the new auto attendant named "' + deleteUtils.testAAName + '"', function () {
      utils.wait(autoattendant.addAANumbers, waitTime);
      utils.click(autoattendant.numberDropDownArrow);

      // we are going to arbitrarily select the last one
      utils.click(autoattendant.numberDropDownOptions.last());

      // save and assert we see successful save message and save is disabled
      utils.click(autoattendant.saveButton);
      autoattendant.assertUpdateSuccess();
      utils.expectIsDisabled(autoattendant.saveButton);

    }, 60000);

    it('should delete a phone number from the new auto attendant named "' + deleteUtils.testAAName + '"', function () {

      utils.click(autoattendant.numberIconClose);

      // save and assert we see successful save message and save is disabled
      utils.click(autoattendant.saveButton);
      autoattendant.assertUpdateSuccess();
      utils.expectIsDisabled(autoattendant.saveButton);

    }, 60000);

    it('should add a second phone number to the new auto attendant named "' + deleteUtils.testAAName + '"', function () {

      utils.click(autoattendant.numberDropDownArrow);

      // we are going to arbitrarily select the last one
      utils.click(autoattendant.numberDropDownOptions.last());

      // save and assert we see successful save message and save is disabled
      utils.click(autoattendant.saveButton);
      autoattendant.assertUpdateSuccess();
      utils.expectIsDisabled(autoattendant.saveButton);

    }, 60000);
    
    it('should add a Schedule to AA', function () {
      utils.click(autoattendant.schedule);
      utils.wait(autoattendant.addschedule, waitTime);
      utils.click(autoattendant.toggleHoliday);
      utils.click(autoattendant.addholiday);
      utils.sendKeys(autoattendant.holidayName, 'Thanksgiving');
      utils.expectIsDisabled(autoattendant.modalsave);
      utils.sendKeys(autoattendant.date, new Date());
      utils.click(autoattendant.selectdate);
      utils.expectIsEnabled(autoattendant.modalsave);
      utils.click(autoattendant.modalsave);
      utils.click(autoattendant.closeEditButton);
    }, 60000);
    
    it('should create a new auto attendant named "' + deleteUtils.testAAImportName + '"', function () {

      // click new feature
      utils.click(autoattendant.newFeatureButton);

      // select AA
      utils.wait(autoattendant.featureTypeAA, waitTime);
      utils.click(autoattendant.featureTypeAA);

      utils.wait(autoattendant.customAA, waitTime);
      utils.click(autoattendant.customAA);

      // enter AA name
      utils.sendKeys(autoattendant.newAAname, deleteUtils.testAAImportName);
      utils.sendKeys(autoattendant.newAAname, protractor.Key.ENTER);

      // assert we see the create successful message
      autoattendant.assertCreateSuccess();

    }, 60000);
    
    it('should add a Schedule to AA', function () {
      utils.click(autoattendant.schedule);
      utils.wait(autoattendant.addschedule, waitTime);
      utils.click(autoattendant.importSchedule);
      utils.wait(autoattendant.importScheduleTitle, waitTime);
      //utils.expectIsEnabled(autoattendant.modalsave);
    }, 60000);

  });
  
  it('should delete new AA named "' + deleteUtils.testAAName + '" on the landing page', function () {

      // click delete X on the AA card for e2e test AA
      utils.click(autoattendant.testCardDelete);

      // confirm dialog with e2e AA test name in it is there, then agree to delete
      utils.expectText(autoattendant.deleteModalConfirmText, 'Are you sure you want to delete the ' + deleteUtils.testAAName + ' Auto Attendant?').then(function () {
        utils.click(autoattendant.deleteModalConfirmButton);
      });

    });

});
