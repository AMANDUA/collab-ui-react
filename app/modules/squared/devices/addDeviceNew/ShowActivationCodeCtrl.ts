import IAccountData = csdm.IAccountData;
import IRecipientUser = csdm.IRecipientUser;
import { WizardCtrl } from './WizardCtrl';
import * as jstz from 'jstimezonedetect';
import IDeferred = angular.IDeferred;
import ICsdmDataModelService = csdm.ICsdmDataModelService;
import IExternalLinkedAccount = csdm.IExternalLinkedAccount;

class ShowActivationCodeCtrl extends WizardCtrl {
  private account: IAccountData;
  private showATA: boolean;
  private showPersonal: boolean;
  private failure: boolean;
  private showEmail: boolean;
  private hideBackButton: boolean;
  private selectedUser: IRecipientUser;
  private qrCode: string | undefined;
  private timeLeft: string;
  private showPersonalText: boolean;
  private showCloudberryText: boolean;
  private showHuronWithATAText: boolean;
  private showHuronWithoutATAText: boolean;
  private friendlyActivationCode: string;
  private isLoading: boolean;
  private activationCode: string;
  private expiryTime: any;
  private timezone: string;
  private foundUser: string;


  /* @ngInject */
  constructor($q: angular.IQService,
              private UserListService,
              private OtpService,
              private CsdmDataModelService: ICsdmDataModelService,
              private CsdmHuronPlaceService,
              $stateParams,
              private ActivationCodeEmailService,
              private $translate,
              private Notification,
              private CsdmEmailService,
              private USSService) {
    super($q, $stateParams);

    this.showATA = this.wizardData.showATA;
    this.showPersonal = this.wizardData.showPersonal;
    this.failure = false;
    this.account = {
      name: this.wizardData.account.name,
      type: this.wizardData.account.type,
      orgId: this.wizardData.account.orgId,
      deviceType: this.wizardData.account.deviceType,
      cisUuid: this.wizardData.account.cisUuid,
      isEntitledToHuron: this.wizardData.account.isEntitledToHuron,
      ussProps: this.wizardData.account.ussProps,
    };

    this.hideBackButton = this.wizardData.function === 'showCode';
    this.showEmail = false;
    this.selectedUser = {
      nameWithEmail: '' + this.wizardData.recipient.displayName + ' (' + this.wizardData.recipient.email + ')',
      email: this.wizardData.recipient.email,
      cisUuid: this.wizardData.recipient.cisUuid,
      firstName: this.wizardData.recipient.firstName,
      orgId: <string> this.wizardData.recipient.organizationId,
    };
    this.qrCode = undefined;
    this.timeLeft = '';
    if (this.account.type === 'personal') {
      if (this.showPersonal) {
        if (this.account.isEntitledToHuron) {
          this.showPersonalText = true;
        } else {
          this.showCloudberryText = true;
        }
      } else {
        if (this.showATA) {
          this.showHuronWithATAText = true;
        } else {
          this.showHuronWithoutATAText = true;
        }
      }
    } else {
      if (this.account.deviceType === 'huron') {
        if (this.showATA) {
          this.showHuronWithATAText = true;
        } else {
          this.showHuronWithoutATAText = true;
        }
      } else {
        this.showCloudberryText = true;
      }
    }

    this.init();

    this.friendlyActivationCode = this.formatActivationCode(this.activationCode);

    this.timezone = jstz.determine().name();
    if (this.timezone === null || _.isUndefined(this.timezone)) {
      this.timezone = 'UTC';
    }
  }
  public createActivationCode() {
    this.isLoading = true;
    this.failure = false;
    if (this.account.deviceType === 'huron') {
      if (this.account.type === 'shared') {
        if (this.account.cisUuid) { // Existing place
          this.createCodeForHuronPlace(this.account.cisUuid)
            .then(
              (code) => { this.onCodeCreated(code); },
              (err) => { this.onCodeCreationFailure(err); });
        } else { // New place
          this.createHuronPlace(this.account.name, this.wizardData.account.entitlements, this.wizardData.account.directoryNumber, this.wizardData.account.externalNumber)
            .then((place) => {
              this.account.cisUuid = place.cisUuid;
              this.createCodeForHuronPlace(this.account.cisUuid)
                .then(
                  (code) => { this.onCodeCreated(code); },
                  (err) => { this.onCodeCreationFailure(err); });
            }, err => { this.onCodeCreationFailure(err); });
        }
      } else { // Personal (never create new)
        this.createCodeForHuronUser(this.wizardData.account.username);
      }
    } else { // Cloudberry
      if (this.account.type === 'shared') {
        if (this.account.cisUuid) { // Existing place
          this.createCodeForCloudberryAccount(this.account.cisUuid)
            .then(
              (code) => { this.onCodeCreated(code); },
              (err) => { this.onCodeCreationFailure(err); });
        } else { // New place
          this.createCloudberryPlace(this.account.name, this.wizardData.account.entitlements, this.wizardData.account.directoryNumber,
            this.wizardData.account.externalNumber, this.getExternalLinkedAccounts())
            .then((place) => {
              this.account.cisUuid = place.cisUuid;
              this.$q.all({
                createCode: this.createCodeForCloudberryAccount(this.account.cisUuid),
                saveRGroup: this.updateResourceGroup(this.account.cisUuid, this.account.ussProps),
              }).then((s) => {
                if (s && s.createCode) {
                  this.onCodeCreated(s.createCode);
                } else {
                  this.onCodeCreationFailure(s);
                }
              }, (e) => {
                this.onCodeCreationFailure(e);
              });

            }, (err) => { this.onCodeCreationFailure(err); });
        }
      } else { // Personal (never create new)
        this.createCodeForCloudberryAccount(this.account.cisUuid)
          .then(
            (code) => { this.onCodeCreated(code); },
            (err) => { this.onCodeCreationFailure(err); });
      }
    }
  }

  public init() {
    this.createActivationCode();
  }

  public onCopySuccess() {
    this.Notification.success(
      'generateActivationCodeModal.clipboardSuccess',
      undefined,
      'generateActivationCodeModal.clipboardSuccessTitle',
    );
  }

  public onCopyError() {
    this.Notification.error(
      'generateActivationCodeModal.clipboardError',
      undefined,
      'generateActivationCodeModal.clipboardErrorTitle',
    );
  }

  public generateQRCode() {
    let qrImage = require('qr-image');
    this.qrCode = qrImage.imageSync(this.activationCode, {
      ec_level: 'L',
      size: 14,
      margin: 5,
    }).toString('base64');
    this.isLoading = false;
  }

  public getExternalLinkedAccounts() {
    let extLinkedAcc: IExternalLinkedAccount[] = [];
    if (this.wizardData.account.externalCalendarIdentifier) {
      _.forEach(this.wizardData.account.externalCalendarIdentifier, (acc) => {
        extLinkedAcc.push(acc);
      });
    }
    if (this.wizardData.account.externalHybridCallIdentifier) {
      _.forEach(this.wizardData.account.externalHybridCallIdentifier, (acc) => {
        extLinkedAcc.push(acc);
      });
    }
    if (extLinkedAcc.length === 0) {
      return null;
    }
    return _.sortBy(extLinkedAcc, ['operation']);
  }

  public createHuronPlace(name, entitlements, directoryNumber, externalNumber) {
    return this.CsdmDataModelService.createCmiPlace(name, entitlements, directoryNumber, externalNumber);
  }

  public createCodeForHuronPlace(cisUuid) {
    return this.CsdmHuronPlaceService.createOtp(cisUuid);
  }

  public createCodeForHuronUser(username) {
    this.OtpService.generateOtp(username)
      .then((code) => {
        this.activationCode = code.code;
        this.friendlyActivationCode = this.formatActivationCode(this.activationCode);
        this.expiryTime = code.friendlyExpiresOn;
        this.generateQRCode();
      }, err => {
        this.onCodeCreationFailure(err);
      });
  }

  public createCloudberryPlace(name, entitlements, directoryNumber, externalNumber, externalLinkedAccounts) {
    return this.CsdmDataModelService.createCsdmPlace(name, entitlements, directoryNumber, externalNumber, externalLinkedAccounts);
  }

  public createCodeForCloudberryAccount(cisUuid) {
    return this.CsdmDataModelService.createCodeForExisting(cisUuid);
  }

  public updateResourceGroup(cisUuid, ussProps): IPromise<{}> {
    if (!ussProps) {
      return this.$q.resolve({});
    }
    ussProps.userId = cisUuid;
    return this.USSService.updateUserProps(ussProps).then( (s) => {
      return s;
    }, (e) => {
      this.Notification.errorResponse(e, 'addDeviceWizard.showActivationCode.failedResourceGroup');
      return e;
    });
  }

  private onCodeCreated(code) {
    if (code) {
      this.activationCode = code.activationCode;
      this.friendlyActivationCode = this.formatActivationCode(code.activationCode);
      this.expiryTime = code.expiryTime;
      this.generateQRCode();
    }
  }

  private onCodeCreationFailure(err) {
    this.Notification.errorResponse(err, 'addDeviceWizard.showActivationCode.failedToGenerateActivationCode');
    this.isLoading = false;
    this.failure = true;
  }

  private formatActivationCode(activationCode) {
    return activationCode ? activationCode.match(/.{4}/g).join('-') : '';
  }


  public activateEmail() {
    this.showEmail = true;
  }

  public getExpiresOn() {
    return moment(this.expiryTime || undefined).local().tz(this.timezone).format('LLL (z)');
  }

  public onTextClick($event) {
    $event.target.select();
  }

  public searchUser(searchString) {
    if (searchString.length >= 3) {
      let deferredCustomerOrg: IDeferred<IRecipientUser[]> = this.$q.defer();
      let deferredAdmin: IDeferred<IRecipientUser[]> = this.$q.defer();
      let transformResults = (deferred) => {
        return (data) => {
          let userList: IRecipientUser[] = data.Resources.map((r) => {
            let firstName = r.name && r.name.givenName;
            let lastName = r.name && r.name.familyName;
            return this.extractUserObject(firstName, lastName, r.displayName, r.userName, r.id, r.meta.organizationID);
          });
          deferred.resolve(userList);
        };
      };
      let searchMatchesAdmin = () => {
        return _.startsWith(this.wizardData.admin.userName, searchString) ||
          _.startsWith(this.wizardData.admin.firstName, searchString) ||
          _.startsWith(this.wizardData.admin.lastName, searchString) ||
          _.startsWith(this.wizardData.admin.displayName, searchString);
      };
      this.UserListService.listUsers(0, 6, null, null, transformResults(deferredCustomerOrg), searchString, false);
      if (this.wizardData.admin.organizationId !== this.wizardData.account.organizationId && searchMatchesAdmin()) {
        deferredAdmin.resolve([this.extractUserObject(this.wizardData.admin.firstName,
          this.wizardData.admin.lastName,
          this.wizardData.admin.displayName,
          this.wizardData.admin.userName,
          this.wizardData.admin.cisUuid,
          this.wizardData.admin.organizationId)]);
      } else {
        deferredAdmin.resolve([]);
      }
      return deferredAdmin.promise.then((ownOrgResults) => {
        return deferredCustomerOrg.promise.then((customerOrgResults) => {
          return _.sortBy(ownOrgResults.concat(customerOrgResults), ['extractedName', 'userName']);
        });
      });
    } else {
      return this.$q.resolve([]);
    }
  }

  private extractUserObject(firstName, lastName: string, displayName, userName, cisUuid, orgId): IRecipientUser {
    let name: string|null = null;
    let returnFirstName = firstName;
    if (!_.isEmpty(firstName)) {
      name = firstName;
      if (!_.isEmpty(lastName)) {
        name += ' ' + lastName;
      }
    }

    if (_.isEmpty(name)) {
      name = displayName;
    }
    if (_.isEmpty(name)) {
      name = lastName;
    }
    if (_.isEmpty(name)) {
      name = userName;
    }
    if (_.isEmpty(returnFirstName)) {
      returnFirstName = displayName;
    }
    if (_.isEmpty(returnFirstName)) {
      returnFirstName = userName;
    }
    return {
      extractedName: <string> name,
      firstName: returnFirstName,
      userName: userName,
      displayName: displayName,
      cisUuid: cisUuid,
      orgId: orgId,
    };
  }

  public selectUser($item) {
    this.selectedUser = {
      nameWithEmail: '' + $item.extractedName + ' (' + $item.userName + ')',
      email: $item.userName,
      cisUuid: $item.cisUuid,
      firstName: $item.firstName,
      orgId: $item.orgId,
    };
    this.foundUser = '';
  }

  public sendActivationCodeEmail() {
    let onEmailSent =  () => {
      this.Notification.notify(
        [this.$translate.instant('generateActivationCodeModal.emailSuccess', {
          address: this.selectedUser.email,
        })],
        'success',
        this.$translate.instant('generateActivationCodeModal.emailSuccessTitle'),
      );
    };
    let onEmailSendFailure = (error) => {
      this.Notification.errorResponse(error,
        'generateActivationCodeModal.emailError',
        {
          address: this.selectedUser.email,
        });
    };

    if (this.account.deviceType === 'huron' && this.account.type === 'personal') {
      let emailInfo = {
        email: this.selectedUser.email,
        firstName: this.selectedUser.firstName,
        oneTimePassword: this.activationCode,
        expiresOn: this.getExpiresOn(),
        userId: this.selectedUser.cisUuid,
        customerId: this.selectedUser.orgId,
      };
      this.ActivationCodeEmailService.save({}, emailInfo, onEmailSent, onEmailSendFailure);
    } else {
      let cbEmailInfo = {
        toCustomerId: this.selectedUser.orgId,
        toUserId: this.selectedUser.cisUuid,
        subjectCustomerId: this.wizardData.account.organizationId,
        subjectAccountId: this.account.cisUuid,
        activationCode: this.activationCode,
        expiryTime: this.getExpiresOn(),
      };
      let mailFunction;
      if (this.account.type === 'personal') {
        if (this.account.isEntitledToHuron) {
          mailFunction = this.CsdmEmailService.sendPersonalEmail;
        } else {
          mailFunction = this.CsdmEmailService.sendPersonalCloudberryEmail;
        }
      } else {
        if (this.account.deviceType === 'cloudberry') {
          mailFunction = this.CsdmEmailService.sendCloudberryEmail;
        } else {
          mailFunction = this.CsdmEmailService.sendHuronEmail;
        }
      }

      mailFunction(cbEmailInfo).then(onEmailSent, onEmailSendFailure);
    }
  }

  public back() {
    this.$stateParams.wizard.back();
  }
}

angular.module('Core')
  .controller('ShowActivationCodeCtrl', ShowActivationCodeCtrl);