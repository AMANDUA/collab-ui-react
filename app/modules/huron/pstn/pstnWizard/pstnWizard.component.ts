import { Notification } from 'modules/core/notifications/notification.service';
import { NumberModel, INumbersModel } from './number.model';
import { PstnWizardService, IOrder } from './pstnWizard.service';
import { TokenMethods } from '../pstnSwivelNumbers/pstnSwivelNumbers.component';
import { IEmergencyAddress } from 'modules/squared/devices/emergencyServices/index';
import { TOKEN_FIELD_ID } from '../index';
import { PstnSetupService } from '../pstn.service';

export class PstnWizardComponent implements ng.IComponentOptions {
  public controller = PstnWizardCtrl;
  public templateUrl = 'modules/huron/pstn/pstnWizard/pstnWizard.html';
  public bindings = {
    dismiss: '&',
    close: '&',
    customerId: '<',
    customerName: '<',
    customerEmail: '<',
    customerCommunicationLicenseIsTrial: '<',
    customerRoomSystemsLicenseIsTrial: '<',
  };
}

export class PstnWizardCtrl implements ng.IComponentController {
  public tollFreeTitle: string;
  public emergencyAcknowledge: boolean = false;
  public swivelNumbers: Array<string> = [];
  public showCarriers: boolean;
  public placeOrderLoad: boolean;
  public totalPortNumbers: number;
  public totalNewAdvancedOrder: number;
  public newOrders: Array<IOrder>;
  public advancedOrders: Array<IOrder>;
  public swivelOrders: Array<IOrder>;
  public newTollFreeOrders: Array<IOrder>;
  public portOrders: Array<IOrder>;
  public PORTING_NUMBERS: string;
  public invalidCount: number = 0;
  public invalidSwivelCount: number = 0;
  public validCount: number = 0;
  public step: number = 1;
  public showButtons: boolean = false;
  public contact: {firstName, lastName, emailAddress, companyName};
  public address: IEmergencyAddress;
  public countryCode: string;
  public loading: boolean;
  public isValid = false;
  public isTrial: boolean;
  public orderCart: Array<IOrder> = [];
  public model: INumbersModel = {
    pstn: new NumberModel(),
    tollFree: new NumberModel(),
  };
  public tokenfieldId: string = TOKEN_FIELD_ID;
  public showPortNumbers: boolean = false;
  public showTollFreeNumbers: boolean = false;
  public enableCarriers: boolean;
  public close: Function;
  public get provider() {
    return this.PstnSetup.getProvider();
  }
  public tokenmethods: TokenMethods;
  public titles: {};

  /* @ngInject */
  constructor(private PstnSetup,
              private PstnServiceAddressService,
              private Notification: Notification,
              private $state: ng.ui.IStateService,
              private $window: ng.IWindowService,
              private $timeout: ng.ITimeoutService,
              private PstnSetupService: PstnSetupService,
              private DidService,
              private $translate: ng.translate.ITranslateService,
              private PstnWizardService: PstnWizardService,
              private TelephoneNumberService,
              ) {
    this.contact = this.PstnWizardService.getContact();
    this.address = _.cloneDeep(PstnSetup.getServiceAddress());
    this.countryCode = PstnSetup.getCountryCode();
    this.isTrial = PstnSetup.getIsTrial();
    this.isTrial = false;
    this.showPortNumbers = !this.isTrial;
    this.PORTING_NUMBERS = this.$translate.instant('pstnSetup.portNumbersLabel');
    this.tokenmethods = new TokenMethods(this.createToken.bind(this), this.createdToken.bind(this), this.editToken.bind(this), this.removeToken.bind(this));
    this.titles = this.PstnWizardService.STEP_TITLE;

    if ($state['modal'] && $state['modal'].result) {
      $state['modal'].result.finally(PstnSetup.clear);
    }
  }

  public $onInit(): void {
    this.PstnWizardService.init().then(() => this.enableCarriers = true);
  }

  public getCapabilities(): void {
    if (!this.isTrial) {
      this.PstnWizardService.hasTollFreeCapability().then(result => {
        this.showTollFreeNumbers = result;
        this.getTollFreeInventory();
      })
      .catch(response => this.Notification.errorResponse(response, 'pstnSetup.errors.capabilities'));
    }
  }

  public getTollFreeInventory(): void {
    this.PstnSetupService.getCarrierTollFreeInventory(this.PstnSetup.getProviderId())
      .then(response => {
        this.model.tollFree.areaCodeOptions = response.areaCodes;
        let areaCodes = response.areaCodes.join(', ') + '.';
        this.tollFreeTitle = this.$translate.instant('pstnSetup.tollFreeTitle', { areaCodes: areaCodes });
        this.model.tollFree.areaCode = null;
      })
      .catch(response => this.Notification.errorResponse(response, 'pstnSetup.errors.tollfree.areacodes'));
  }

  public createToken(e): void {
    let tokenNumber = e.attrs.label;
    e.attrs.value = this.TelephoneNumberService.getDIDValue(tokenNumber);
    e.attrs.label = this.TelephoneNumberService.getDIDLabel(tokenNumber);
  }

  public createdToken(e): void {
    if (this.isTokenInvalid(e.attrs.value)) {
      angular.element(e.relatedTarget).addClass('invalid');
      e.attrs.invalid = true;
    } else {
      this.validCount++;
    }
    // add to service after validation/duplicate checks
    this.DidService.addDid(e.attrs.value);

    this.invalidCount = this.getInvalidTokens().length;
  }

  public isTokenInvalid(value): boolean {
    return !this.TelephoneNumberService.validateDID(value) ||
      _.includes(this.DidService.getDidList(), value);
  }

  public removeToken(e): void {
    this.DidService.removeDid(e.attrs.value);
    this.$timeout(this.initTokens);
  }

  public editToken(e): void {
    this.DidService.removeDid(e.attrs.value);
    if (!angular.element(e.relatedTarget).hasClass('invalid')) {
      this.validCount--;
    }
  }

  public goToOrderNumbers(): void {
    if (!this.PstnSetup.isCustomerExists()) {
      this.step = 2;
    } else if (!this.PstnSetup.isSiteExists()) {
      this.step = 3;
    } else {
      this.step = 4;
    }
  }

  public goToSwivelNumbers(): void {
    this.step = 5;
  }

  public isSwivel(): boolean {
    return this.PstnWizardService.isSwivel();
  }

  public goToNumbers(): void {
    if (this.isSwivel()) {
      this.goToSwivelNumbers();
    } else {
      this.goToOrderNumbers();
    }
    this.showButtons = true;
  }

  public onProviderReady(): void {
    this.PstnWizardService.initSites().then(() => {
      //If new PSTN setup show all the carriers even if there only one
      if (this.PstnSetup.isCarrierExists() && this.PstnSetup.isCustomerExists()) {
        // Only 1 carrier should exist for a customer
        if (this.PstnSetup.getCarriers().length === 1) {
          this.PstnSetup.setSingleCarrierReseller(true);
          this.PstnSetup.setProvider(this.PstnSetup.getCarriers()[0]);
          this.goToNumbers();
          this.getCapabilities();
        }
      }
      this.showCarriers = true;
    });
  }

  public onProviderChange(): void {
    this.goToNumbers();
  }

  public previousStep(): void {
    // pre check
    if (this.isSwivel() && this.step === 5) {
      this.step = 1;
    } else if (!this.isSwivel() && this.step === 6) {
      this.step -= 1;
    }
    this.step -= 1;

    //post check
    if (this.step === 1) {
      this.showButtons = false;
    }
  }

  public nextStep(): void {
    switch (this.step) {
      case 2:
        this.PstnWizardService.setContact(this.contact);
        break;
      case 4:
        if (this.getOrderNumbersTotal() === 0) {
          this.Notification.error('pstnSetup.orderNumbersPrompt');
          return;
        } else {
          this.PstnSetup.setOrders(this.orderCart);
          this.step += 1;
          let orders = this.PstnWizardService.initOrders();
          this.totalPortNumbers = orders.totalPortNumbers;
          this.totalNewAdvancedOrder = orders.totalNewAdvancedOrder;
        }
        break;
      case 5:
        if (this.invalidSwivelCount) {
          this.Notification.error('pstnSetup.invalidNumberPrompt');
          return;
        } else if (this.swivelNumbers.length === 0) {
          this.Notification.error('pstnSetup.orderNumbersPrompt');
          return;
        } else {
          //set numbers for if they go back
          this.PstnSetup.setNumbers(this.swivelNumbers);
          let swivelOrder = this.PstnWizardService.setSwivelOrder(this.swivelNumbers);
          this.PstnSetup.setOrders(swivelOrder);
        }
        break;
      case 6:
        this.placeOrderLoad = true;
        this.PstnWizardService.placeOrder().then(() => {
          this.step = 7;
          this.placeOrderLoad = false;
        });
        return;
      case 7:
        this.close();
        return;
    }
    this.step += 1;
  }

  public nextDisabled(): boolean {
    switch (this.step) {
      case 2:
        return this[`wizardForm${this.step}`].$invalid;
      case 3:
        return this.isValid === false;
      case 5:
        return !this.emergencyAcknowledge;
    }
    return false;
  }

  public hideBackBtn(): boolean {
    switch (this.step) {
      case 2:
        return this.PstnSetup.getCarriers().length === 1;
      case 4:
      case 5:
        return this.PstnSetup.isCustomerExists();
      case 7:
        return true;
    }
    return false;
  }

  public validateAddress(): void {
    this.loading = true;
    this.PstnServiceAddressService.lookupAddressV2(this.address, this.PstnSetup.getProviderId())
      .then(address => {
        if (address) {
          this.address = address;
          this.PstnSetup.setServiceAddress(address);
          this.isValid = true;
        } else {
          this.Notification.error('pstnSetup.serviceAddressNotFound');
        }
      })
      .catch(response => this.Notification.errorResponse(response))
      .finally(() => this.loading = false);
  }

  public resetAddress(): void {
    this.address = {};
    this.PstnSetup.setServiceAddress(this.address);
    this.isValid = false;
  }

  public launchCustomerPortal(): void {
    this.$window.open(this.$state.href('login_swap', {
      customerOrgId: this.PstnSetup.getCustomerId(),
      customerOrgName: this.PstnSetup.getCustomerName(),
    }));
  }

  public searchCarrierInventory(areaCode: string, block: boolean, quantity: number, consecutive: boolean): void {
    this.loading = true;
    this.PstnWizardService.searchCarrierInventory(areaCode, block, quantity, consecutive, this.model, this.isTrial).then(() => this.loading = false);
  }

  public searchCarrierTollFreeInventory(areaCode: string, block: boolean, quantity: number, consecutive: boolean): void {
    this.loading = true;
    this.PstnWizardService.searchCarrierTollFreeInventory(areaCode, block, quantity, consecutive, this.model).then(() => this.loading = false);
  }

  public addToCart(orderType: string, numberType: string, quantity: number, searchResultsModel: {}): void {
    this.model.pstn.addLoading = true;
    this.model.tollFree.addLoading = true;
    this.PstnWizardService.addToCart(orderType, numberType, quantity, searchResultsModel, this.orderCart, this.model).then(orderCart => {
      this.orderCart = orderCart;
      this.model.pstn.addLoading = false;
      this.model.tollFree.addLoading = false;
      this.model.pstn.addDisabled = true;
      this.model.tollFree.addDisabled = true;
      this.initTokens([]);
    });
  }

  public initTokens(didList): void {
    let tmpDids = didList || this.DidService.getDidList();
    // reset valid and list before setTokens
    this.validCount = 0;
    this.invalidCount = 0;
    this.DidService.clearDidList();
    angular.element('#' + this.tokenfieldId).tokenfield('setTokens', tmpDids);
  }

  public getInvalidTokens(): JQuery {
    return angular.element('#' + this.tokenfieldId).parent().find('.token.invalid');
  }

  public formatTelephoneNumber(telephoneNumber: IOrder): string {
    return this.PstnWizardService.formatTelephoneNumber(telephoneNumber);
  }

  public removeOrderFromCart(order: IOrder): void {
    _.pull(this.orderCart, order);
  }

  public removeOrder(order: IOrder): void {
    this.PstnWizardService.removeOrder(order)
        .then(_.partial(this.removeOrderFromCart.bind(this), order));
  }

  public showOrderQuantity(order: IOrder): boolean {
    return this.PstnWizardService.showOrderQuantity(order);
  }

  public getOrderQuantity(order: IOrder): number | undefined {
    return this.PstnWizardService.getOrderQuantity(order);
  }

  public getOrderNumbersTotal(): number {
    return _.size(_.flatten(this.orderCart));
  }

  public onSwivelChange(numbers: Array<string>, invalidCount: number): void {
    this.swivelNumbers = numbers;
    this.invalidSwivelCount = invalidCount;
  }

  public onAcknowledge(value: boolean): void {
    this.emergencyAcknowledge = value;
  }
}
