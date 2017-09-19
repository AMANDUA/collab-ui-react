import * as provisioner from '../../../provisioner/provisioner';
import { huronCustomer } from '../../../provisioner/huron/huron-customer-config';
import { CallUserPage } from '../../pages/callUser.page';
import { CallUserPlacePage } from '../../pages/callUserPlace.page';
import { CallSettingsPage } from '../../pages/callSettings.page';

const callUserPage = new CallUserPage();
const callUserPlacePage = new CallUserPlacePage();
const callSettingsPage = new CallSettingsPage();

/* globals navigation, users, telephony */
describe('Huron Functional: user-line-settings', () => {
  const customer = huronCustomer({
    test: 'user-line-settings',
    users: 2,
  });

  const USERS = customer.users;

  const DESTINATION_E164 = '4695550000';
  const DESTINATION_URI = 'callforward@uri.com';
  const DESTINATION_CUSTOM = '890';
  const DESTINATION_TYPE_EXTERNAL = 'External';
  const DESTINATION_TYPE_URI = 'URI Address';
  const CUSTOM = 'Custom';
  const BLOCKED = 'Blocked Outbound Caller ID';

  /* ---------------------------------------------------------------
     Similar Line Configuration test cases are also in Places.
     Good to keep both in sync if changes are being made here.
     Places do not support voicemail.
  ----------------------------------------------------------------*/
  beforeAll(done => {
    provisioner.provisionCustomerAndLogin(customer)
      .then(done);
  });
  afterAll(done => {
    provisioner.tearDownAtlasCustomer(customer.partner, customer.name).then(done);
  });

  it('should be on overview page of customer portal', () => {
    navigation.expectDriverCurrentUrl('overview');
    utils.expectIsDisplayed(navigation.tabs);
  });

  it('should enable voicemail for customer', () => {
    utils.click(navigation.callSettings);
    navigation.expectDriverCurrentUrl('call-settings');
    utils.click(callSettingsPage.voicemailSwitch);
    utils.expectSwitchState(callSettingsPage.voicemailSwitch, true);
    utils.click(callSettingsPage.saveButton);
    utils.waitForModal().then(() => {
      notifications.assertSuccess();
      utils.expectIsDisplayed(callSettingsPage.voicemailWarningModalTitle);
    });
    utils.click(callSettingsPage.voicemailModalDoneButton);
  });

  it('should navigate to Users overview page', () => {
    utils.click(navigation.usersTab);
    navigation.expectDriverCurrentUrl('users');
  });

  it('Enter the user details on the search bar and Navigate to user details view', () => {
    utils.click(callUserPage.usersList.searchFilter);
    utils.sendKeys(callUserPage.usersList.searchFilter, USERS[0].email + protractor.Key.ENTER);
    utils.click(callUserPage.usersList.userFirstName);
    utils.expectIsDisplayed(users.servicesPanel);
    utils.expectIsDisplayed(users.communicationsService);
  });
  it('should navigate to call details view', () => {
    utils.click(users.communicationsService);
    utils.expectIsDisplayed(callUserPage.callOverview.features.title);
    utils.expectIsDisplayed(callUserPage.callOverview.features.singleNumberReach);
  });

  describe('Line Settings', () => {
    it('should navigate to Line Settings details view', () => {
      utils.click(callUserPage.callOverview.directoryNumbers.number);
      utils.expectIsDisplayed(callUserPage.lineConfiguration.title);
    });

    describe('Directory Numbers', () => {
      it('should display the Directory Numbers section', () => {
        utils.expectIsDisplayed(callUserPlacePage.directoryNumber.title);
      });
      it('should display the extension', () => {
        utils.expectIsDisplayed(callUserPlacePage.directoryNumber.extension);
      });
      it('should display the Phone Number', () => {
        utils.expectIsDisplayed(callUserPlacePage.directoryNumber.phoneNumber);
      });

      //Edit Directory Number
      it('should be able to edit the extension and save', () => {
        browser.driver.sleep(1000);
        utils.selectDropdown('.csSelect-container[name="internalNumber"]', '315');
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
    });

    describe('Call Forwarding', () => {
      it('should display the Call Forwarding section', () => {
        utils.expectIsDisplayed(callUserPlacePage.callForwarding.title);
      });
      it('should display Option Call Forward None', () => {
        utils.expectIsDisplayed(callUserPlacePage.callForwarding.radioNone);
      });
      it('should display Option Call Forward All', () => {
        utils.expectIsDisplayed(callUserPlacePage.callForwarding.radioAll);
      });
      it('should display Option Call Forward Busy or Away', () => {
        utils.expectIsDisplayed(callUserPlacePage.callForwarding.radioBusyOrAway);
      });
    });

    describe('Call Forwarding All', () => {
      //Forward All
      it('should be able to add Call Forward All Custom Destination Number', () => {
        utils.click(callUserPlacePage.callForwarding.radioAll);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', CUSTOM);
        utils.sendKeys(callUserPlacePage.callForwarding.destinationInputCustom, DESTINATION_CUSTOM);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to add Call Forward All External Destination Number', () => {
        utils.click(callUserPlacePage.callForwarding.radioAll);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', DESTINATION_TYPE_EXTERNAL);
        utils.sendKeys(callUserPlacePage.callForwarding.destinationInputPhone, DESTINATION_E164);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to add Call Forward All Destination URI Address', () => {
        utils.click(callUserPlacePage.callForwarding.radioAll);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', DESTINATION_TYPE_URI);
        utils.clear(callUserPlacePage.callForwarding.destinationInputUri);
        utils.sendKeys(callUserPlacePage.callForwarding.destinationInputUri, DESTINATION_URI);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to set Call Forward All to voicemail', () => {
        utils.click(callUserPlacePage.callForwarding.radioAll);
        utils.setCheckboxIfDisplayed(callUserPlacePage.callForwarding.forwardAllVoicemail, true, 100);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
    });

    describe('Call Forwarding Forward Busy or Away', () => {
      //Forward Busy No Answer with same interna/external destinations
      it('should select Option Call Forward Busy or Away', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
      });

      it('should be able to reset Call Forward Busy or Away to voicemail', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.click(callUserPlacePage.callForwarding.forwardInternalVoicemail);
        utils.setCheckboxIfDisplayed(callUserPlacePage.callForwarding.forwardInternalVoicemail, false, 100);
      });
      it('should be able to add Call Forward Busy or Away Custom Destination Number', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', CUSTOM);
        utils.sendKeys(callUserPlacePage.callForwarding.busyInternalInputCustom, DESTINATION_CUSTOM);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to add Call Forward Busy or Away External Destination Number', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', DESTINATION_TYPE_EXTERNAL);
        utils.sendKeys(callUserPlacePage.callForwarding.busyinternalInputPhone, DESTINATION_E164);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to add Call Forward Busy or Away Destination URI Address', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', DESTINATION_TYPE_URI);
        utils.clear(callUserPlacePage.callForwarding.busyInternalInputUri);
        utils.sendKeys(callUserPlacePage.callForwarding.busyInternalInputUri, DESTINATION_URI);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to set Call Forward Busy or Away to voicemail', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.setCheckboxIfDisplayed(callUserPlacePage.callForwarding.forwardInternalVoicemail, true, 100);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });

      //Forward Busy No Answer External call destinations  Differently
      it('should be able to select call forward Busy or Away with different External destination', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.setCheckboxIfDisplayed(callUserPlacePage.callForwarding.forwardBusyExternal, true, 100);
      });
      it('should be able to set Call Forward Busy or Away with different External to voicemail', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.setCheckboxIfDisplayed(callUserPlacePage.callForwarding.forwardExternalVoicemail, false, 100);
      });
      it('should be able to add Call Forward Busy or Away with different External Custom Destination Number', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', CUSTOM);
        utils.sendKeys(callUserPlacePage.callForwarding.busyExternalInputCustom, DESTINATION_CUSTOM);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to add Call Forward Busy or Away with different External Destination Number', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', DESTINATION_TYPE_EXTERNAL);
        utils.sendKeys(callUserPlacePage.callForwarding.busyExternalInputPhone, DESTINATION_E164);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to add Call Forward Busy or Away with different External URI Address', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.selectDropdown('.csSelect-container[name="CallDestTypeSelect"]', DESTINATION_TYPE_URI);
        utils.clear(callUserPlacePage.callForwarding.busyExternalInputUri);
        utils.sendKeys(callUserPlacePage.callForwarding.busyExternalInputUri, DESTINATION_URI);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to set Call Forward Busy or Away with different External to voicemail', () => {
        utils.click(callUserPlacePage.callForwarding.radioBusyOrAway);
        utils.click(callUserPlacePage.callForwarding.forwardExternalVoicemail);
        utils.setCheckboxIfDisplayed(callUserPlacePage.callForwarding.forwardExternalVoicemail, true, 100);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
    });

    describe('Simultaneous Calls', () => {
      it('should display the Simultaneous Calls section', () => {
        utils.expectIsDisplayed(callUserPlacePage.simultaneousCalling.title);
      });
      it('should be able to select the option for 8 Simultaneous Calls ', () => {
        utils.click(callUserPlacePage.simultaneousCalling.radio8);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to select the option for 2 Simultaneous Calls ', () => {
        utils.click(callUserPlacePage.simultaneousCalling.radio2);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
    });

    describe('Caller ID', () => {
      it('should display the Caller ID section', () => {
        utils.expectIsDisplayed(callUserPlacePage.callerId.title);
      });
      it('should be able to set custom Caller ID', () => {
        utils.selectDropdown('.csSelect-container[name="callerIdSelection"]', CUSTOM);
        utils.sendKeys(callUserPlacePage.callerId.customName, 'USER NAME');
        utils.sendKeys(callUserPlacePage.callerId.customNumber, DESTINATION_E164);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('should be able to Block custom Caller ID', () => {
        utils.selectDropdown('.csSelect-container[name="callerIdSelection"]', BLOCKED);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
    });

    describe('Auto Answer', () => {
      it('should display the Auto Answer section', () => {
        utils.expectIsDisplayed(callUserPlacePage.autoAnswer.title);
      });
    });

    describe('Shared Line', () => {
      it('should display the Shared Line section', () => {
        utils.expectIsDisplayed(callUserPlacePage.sharedLine.title);
      });

      it('Add a member', () => {
        utils.sendKeys(callUserPlacePage.sharedLine.inputMember, USERS[1].email);
        browser.driver.sleep(1000);
        utils.sendKeys(callUserPlacePage.sharedLine.inputMember, protractor.Key.ENTER);
        browser.driver.sleep(1000);
        utils.expectIsDisplayed(callUserPlacePage.sharedLine.accordionMember);
        utils.expectText(callUserPlacePage.sharedLine.accordionMember, USERS[1].name.givenName + ' ' + USERS[1].name.familyName);
        utils.click(callUserPlacePage.saveButton).then(() => {
          notifications.assertSuccess();
        });
      });
      it('Remove a member', () => {
        utils.expectIsDisplayed(callUserPlacePage.sharedLine.accordionMember);
        utils.expectText(callUserPlacePage.sharedLine.accordionMember, USERS[1].name.givenName + ' ' + USERS[1].name.familyName);
        utils.click(callUserPlacePage.sharedLine.sharedMember);
        utils.click(callUserPlacePage.sharedLine.removeMember);
        utils.click(callUserPlacePage.sharedLine.removeMemberBtn).then(() => {
          notifications.assertSuccess();
        });
      });
    });

    it('should navigate back to call details view', () => {
      utils.click(callUserPage.callSubMenu);
      utils.expectIsDisplayed(callUserPage.callOverview.directoryNumbers.title);
      utils.expectIsDisplayed(callUserPage.callOverview.features.title);
    });
  });

  describe('Add a new line', () => {
    it('should display add a new line link', () => {
      utils.expectIsDisplayed(callUserPage.callOverview.addNewLine);
    });

    it('should be on add line page', () => {
      utils.click(callUserPage.callOverview.addNewLine);
    });

    it('should display Directory Numbers section', () => {
      utils.expectIsDisplayed(callUserPlacePage.directoryNumber.title);
    });

    it('should display Call Forwarding section', () => {
      utils.expectIsDisplayed(callUserPlacePage.callForwarding.title);
    });

    it('should display Simultaneous Calls section', () => {
      utils.expectIsDisplayed(callUserPlacePage.simultaneousCalling.title);
    });

    it('should display Caller ID section', () => {
      utils.expectIsDisplayed(callUserPlacePage.callerId.title);
    });

    it('should display Auto Answer section', () => {
      utils.expectIsDisplayed(callUserPlacePage.autoAnswer.title);
    });

    it('should display Shared Line section', () => {
      utils.expectIsDisplayed(callUserPlacePage.sharedLine.title);
    });

    it('should display save button and clickable', () => {
      utils.expectIsDisplayed(callUserPlacePage.saveButton);
      utils.expectIsEnabled(callUserPlacePage.saveButton);
    });

    it('should create a new line and display success', () => {
      utils.click(callUserPlacePage.saveButton).then(() => {
        notifications.assertSuccess();
      });
    });
  });
});
