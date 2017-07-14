import ICsdmDataModelService = csdm.ICsdmDataModelService;
import IExternalLinkedAccount = csdm.IExternalLinkedAccount;
import { ServiceDescriptorService } from 'modules/hercules/services/service-descriptor.service';
import { ResourceGroupService } from 'modules/hercules/services/resource-group.service';
import { Notification } from 'modules/core/notifications';
import IWizardData = csdm.IWizardData;
import { ExternalLinkedAccountHelperService } from '../../devices/services/external-acct-helper.service';

class EditCalendarService implements ng.IComponentController {
  private dismiss: Function;
  public emailOfMailbox: string;
  private initialMailBox: string;
  private wizardData: IWizardData;
  private static fusionCal = 'squared-fusion-cal';
  private static fusionGCal = 'squared-fusion-gcal';
  public calService = '';
  private initialCalService: string;
  private isLoading: boolean;
  public externalCalendarIdentifier: string;
  private isFirstStep: boolean = false;
  public title: string;
  public resourceGroup: {
    selected?: { label: string, value: string },
    current?: { label: string, value: string },
    options: { label: string, value: string }[],
    shouldWarn: boolean,
    show: boolean,
    init: () => void,
  } = {
    init: () => {
      this.resourceGroup.options = [{
        label: this.$translate.instant('hercules.resourceGroups.noGroupSelectedOnPlace'),
        value: '',
      }];
      this.resourceGroup.selected = this.resourceGroup.current = this.resourceGroup.options[0];
      this.resourceGroup.shouldWarn = false;
    },
    options: [],
    shouldWarn: false,
    show: false,
  };
  private showGCalService = false;
  private showExchangeService = false;

  public $onInit(): void {
    const state = this.$stateParams.wizard.state();
    this.wizardData = state.data;
    this.resourceGroup.init();
    this.title = this.wizardData.title;
    this.initialCalService = this.getCalService(this.wizardData.account.entitlements);
    this.fetchResourceGroups();
    this.isFirstStep = _.get(state, 'history.length') === 0;
  }

  /* @ngInject */
  constructor(private CsdmDataModelService: ICsdmDataModelService,
              private $stateParams: ng.ui.IStateParamsService,
              private $translate: ng.translate.ITranslateService,
              ServiceDescriptorService: ServiceDescriptorService,
              private ResourceGroupService: ResourceGroupService,
              private USSService,
              private Notification: Notification,
              private ExtLinkHelperService: ExternalLinkedAccountHelperService) {
    ServiceDescriptorService.getServices()
      .then((services) => {
        const enabledServices = ServiceDescriptorService.filterEnabledServices(services);
        const calendarExchange = _.head(_.filter(enabledServices, x => x.id === EditCalendarService.fusionCal));
        const googleCal = _.head(_.filter(enabledServices, x => x.id === EditCalendarService.fusionGCal));
        this.showGCalService = !!googleCal;
        this.showExchangeService = !!calendarExchange;

        const existingCalLinks: IExternalLinkedAccount = _.head(_.filter(this.wizardData.account.externalLinkedAccounts || [], (linkedAccount) => {
          return linkedAccount && (linkedAccount.providerID === EditCalendarService.fusionCal || linkedAccount.providerID === EditCalendarService.fusionGCal);
        }));

        if (calendarExchange && this.showGCalService) {
          this.calService = '';
        } else {
          this.calService = this.showGCalService ? EditCalendarService.fusionGCal : EditCalendarService.fusionCal;
          this.showGCalService = false;
          this.showExchangeService = false;
        }
        if (existingCalLinks) {
          this.calService = existingCalLinks.providerID;
          this.initialMailBox = existingCalLinks.accountGUID;
          this.emailOfMailbox = existingCalLinks.accountGUID;
        }
      });
  }

  private getUpdatedEntitlements() {
    let entitlements = (this.wizardData.account.entitlements || ['webex-squared', 'spark']);
    entitlements = _.difference(entitlements, [EditCalendarService.fusionCal, EditCalendarService.fusionGCal]);
    if (this.calService === EditCalendarService.fusionCal) {
      entitlements.push(EditCalendarService.fusionCal);
    } else if (this.calService === EditCalendarService.fusionGCal) {
      entitlements.push(EditCalendarService.fusionGCal);
    }
    return entitlements;
  }

  public getShowGCalService() {
    return this.showGCalService;
  }

  public getResourceGroupShow() {
    return this.resourceGroup && this.resourceGroup.show;
  }

  public getShowCalService() {
    return this.showExchangeService;
  }

  public getShowServiceOptions() {
    return this.showExchangeService || this.showGCalService;
  }

  private fetchResourceGroups() {
    this.ResourceGroupService.getAllAsOptions().then((options) => {
      if (options.length > 0) {
        this.resourceGroup.options = this.resourceGroup.options.concat(options);
        if (this.wizardData.account.cisUuid && this.initialCalService) {
          this.USSService.getUserProps(this.wizardData.account.cisUuid).then((props) => {
            if (props.resourceGroups && props.resourceGroups[this.initialCalService]) {
              const selectedGroup = _.find(this.resourceGroup.options, (group) => {
                return group.value === props.resourceGroups[this.initialCalService];
              });
              if (selectedGroup) {
                this.resourceGroup.selected = selectedGroup;
                this.resourceGroup.current = selectedGroup;
              }
            }
          });
        }
        this.resourceGroup.show = true;
      }
    });
  }

  private getCalService(entitlements) {
    return _.head(_.intersection(entitlements || [], [EditCalendarService.fusionCal, EditCalendarService.fusionGCal]));
  }

  public next() {
    this.$stateParams.wizard.next({
      account: {
        entitlements: this.getUpdatedEntitlements(),
        externalCalendarIdentifier: this.getCalendarExtLinkedAccount(),
        ussProps: this.getUssProps(),
      },
    });
  }

  public isNextDisabled() {
    return !(
      this.calService
      && this.emailOfMailbox
      && (this.resourceGroup.selected || !this.resourceGroup.options || this.resourceGroup.options.length === 0)
    );
  }

  public isSaveDisabled() {
    return this.isNextDisabled();
  }

  public close() {
    this.dismiss();
  }

  public hasNextStep() {
    return this.wizardData.function !== 'editServices';
  }

  public hasBackStep() {
    return !this.isFirstStep;
  }

  public back() {
    this.$stateParams.wizard.back();
  }

  private getCalendarExtLinkedAccount(): IExternalLinkedAccount[] {
    const newExtLink = {
      providerID: this.calService,
      accountGUID: this.emailOfMailbox,
      status: 'unconfirmed-email',
    };
    return [newExtLink];
  }

  public save() {
    this.isLoading = true;
    const directoryNumber = this.wizardData.account.directoryNumber || undefined;
    const externalNumber = this.wizardData.account.externalNumber || undefined;

    this.CsdmDataModelService.reloadPlace(this.wizardData.account.cisUuid).then((place) => {
      if (place) {
        const updatedEntitlements = this.getUpdatedEntitlements();
        this.CsdmDataModelService.updateCloudberryPlace(
          place,
          {
            entitlements: updatedEntitlements,
            directoryNumber: directoryNumber,
            externalNumber: externalNumber,
            externalLinkedAccounts: this.ExtLinkHelperService.getExternalLinkedAccountForSave(
              this.wizardData.account.externalLinkedAccounts,
              _.concat(this.getCalendarExtLinkedAccount(), this.wizardData.account.externalHybridCallIdentifier || []),
              updatedEntitlements),
          },
        )
          .then(() => {
            const props = this.getUssProps();
            if (props) {
              this.USSService.updateUserProps(props).then(() => {
                this.dismiss();
                this.Notification.success('addDeviceWizard.editServices.servicesSaved');
              }, (error) => {
                this.isLoading = false;
                this.Notification.errorResponse(error, 'hercules.addResourceDialog.CouldNotSaveResourceGroup');
              });
            } else {
              this.dismiss();
              this.Notification.success('addDeviceWizard.editServices.servicesSaved');
            }
          }, (error) => {
            this.isLoading = false;
            this.Notification.errorResponse(error, 'addDeviceWizard.assignPhoneNumber.placeEditError');
          });
      } else {
        this.isLoading = false;
        this.Notification.warning('addDeviceWizard.assignPhoneNumber.placeNotFound');
      }
    }, (error) => {
      this.Notification.errorResponse(error, 'addDeviceWizard.assignPhoneNumber.placeEditError');
    });

  }

  private getUssProps(): {} | null {
    const props = this.wizardData.account.ussProps || null;
    if (this.resourceGroup.selected) {
      const resourceGroups = (props && props.resourceGroups) || {};
      const isExistingPlaceOrNonEmptyRGroup = this.wizardData.account.cisUuid || this.resourceGroup.selected.value;
      if (isExistingPlaceOrNonEmptyRGroup) {
        _.merge(resourceGroups, { 'squared-fusion-cal': this.resourceGroup.selected.value });
      }
      return {
        userId: this.wizardData.account.cisUuid,
        resourceGroups: resourceGroups,
      };
    }
    return props;
  }
}

export class EditCalendarServiceOverviewComponent implements ng.IComponentOptions {
  public controller = EditCalendarService;
  public controllerAs = 'editCalendarService';
  public templateUrl = 'modules/squared/places/editCalendarService/editCalendarService.tpl.html';
  public bindings = {
    dismiss: '&',
  };
}
