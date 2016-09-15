'use strict';

var ChatTemplateCreation = function () {
  this.randomChatTemplateName = 'e2e-careChatTemplate-' + utils.randomId();
  this.testOrgName = 'e2e-test-org-name';
  this.setUpTitle = element(by.css('.ct-title .h2'));
  this.setUpDesc = element(by.css('.h4.ct-title-desc'));
  this.summaryDesc = element(by.css('.ct-summary .description'));
  this.setUpLeftBtn = element(by.css('.btn--primary.btn--left'));
  this.setUpRightBtn = element(by.css('.btn--primary.btn--right'));
  this.typeAheadInput = element(by.css('.typeahead-large .ct-input'));
  this.nameHint = element(by.css('.typeahead-large .ct-input-hint'));
  this.profileTitle = element(by.css('.ct-title.h2'));
  this.profileTitleDesc = element(by.css('.ct-title-desc.h4'));
  this.agentProfile = element.all(by.css('.cs-input-group.cs-input-radio span')).last();
  this.orgNamePreview = element(by.css('.profile-name'));
  this.agentNamePreview = element.all(by.css('.profile-name div')).first();
  this.OrgName = element(by.css('.cs-input-group.cs-input-text input'));
  this.agentAliasRadio = element.all(by.css('.agent-name-options cs-radio')).first();
  this.agentNameRadio = element.all(by.css('.agent-name-options cs-radio')).last();
  this.agentPreviewIcon = element(by.css('.img .agent .icon-user'));
  this.previewMinimizeIcon = element(by.css('.actions .icon-minus'));
  this.previewCloseIcon = element(by.css('.actions .icon-close'));
  this.agentDisplayImage = element(by.css('.profile-image .icon-user'));
  this.customerInfoToggle = element.all(by.css('.toggle-switch')).first();
  this.overviewCard = element.all(by.css('.ct-card-overview'));
  this.customerInfoEnabledCard = element.all(by.css('.ct-card-border-enabled')).first();
  this.customerInfoDisabledCard = element.all(by.css('.ct-card-border-disabled')).first();
  this.customerInfo_Header_Welcome = element(by.css('.welcomeText'));
  this.customerInfo_Header_Org = element(by.css('.orgText'));
  this.customerInfo_attCard_default_Content = element(by.css('.ct-default-msg'));
  this.customerInfo_attCard_textField1 = element.all(by.css('.ct-attribute-field-textbox')).get(0);
  this.customerInfo_attCard_textField2 = element.all(by.css('.ct-attribute-field-textbox')).get(1);
  this.customerInfo_attCard_textField3 = element.all(by.css('.ct-attribute-field-textbox')).get(2);
  this.customerInfo_attCard_textField4 = element.all(by.css('.ct-attribute-field-textbox')).get(3);
  this.customerInfo_screen_div1 = element.all(by.css('.ct-left-row')).get(0);
  this.customerInfo_screen_field1Label = element.all(by.css('.labelText')).get(0);
  this.customerInfo_screen_div2 = element.all(by.css('.ct-left-row')).get(1);
  this.customerInfo_screen_optional1 = element(by.id('opt-field1'));
  this.customerInfo_screen_optional2 = element(by.id('opt-field2'));
  this.customerInfo_screen_optional3 = element(by.id('opt-field3'));
  this.customerInfo_attCard_redioOptional = element.all(by.css('.cs-radio')).get(1);
  this.chatSetupFinishBtn = element(by.id('chatSetupFinishBtn'));
  this.careChatSetupWizard = element(by.css('careChatSetup'));
  this.embedCodeModal = element(by.id('embedCodeModalDiv'));
  this.copyEmbedScriptBtn = element(by.id('copyEmbedCodeBtn'));
  this.closeEmbedScriptModel = element(by.css('.close'));
  this.chatTemplateName = element(by.css('.cs-card-container .cs-card-layout .small header p'));
  this.downloadEmbedCodeOnCard = element(by.css('.cs-card-container .cs-card-layout .small footer .left span'));
  this.deleteEmbedCodeBtnOnCard = element(by.css('.cs-card-container .cs-card-layout .small footer .right .icon-trash'));
  this.editChatTemplateBtnOnCard = element(by.css('.cs-card-container .cs-card-layout .small footer .right .icon-edit'));
  this.deleteChatTemplateonModal = element(by.css('.btn.btn--negative'));
  this.agentUnavailableMessageField = element(by.id('agentUnavailableMessageField'));
  this.agentUnavailableMessage = element(by.id('agentUnavailableMessage'));
  this.chatStatusMessages = element.all(by.css('.ct-attribute-field-textbox'));
  this.offHoursMessage = element(by.css('.offhours-message textarea'));
  this.days = element.all(by.css('.day-picker .day'));
  this.wednesday = element.all(by.css('.day-picker .day')).get(3);
  this.open24Hours = element(by.css('.time-and-timezone-picker [ckid=ctOpen24Hours]'));
  this.timePicker = element(by.css('.time-picker'));
  this.timezonePicker = element(by.css('.timezone-picker'));
  this.startTimeDropDown = element(by.css('.time-picker .start-time'));
  this.endTimeDropDown = element(by.css('.time-picker .end-time'));
  this.startTime = element.all(by.css('.time-picker .start-time .time li')).first();
  this.endTime = element.all(by.css('.time-picker .end-time .time li')).last();
  this.timezoneInput = element(by.css('.timezone-picker input'));
  this.selectATimezone = element(by.css('.timezone-picker [name="businessHours-timezonePicker"] .dropdown-menu li'));
};

module.exports = ChatTemplateCreation;
