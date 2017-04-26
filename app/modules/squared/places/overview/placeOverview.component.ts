import { IFeature } from '../../../core/components/featureList/featureList.component';
import { IActionItem } from '../../../core/components/sectionTitle/sectionTitle.component';
import IPlace = csdm.IPlace;
import ICsdmDataModelService = csdm.ICsdmDataModelService;

interface IDevice {
}

class PlaceOverview implements ng.IComponentController {

  public services: IFeature[] = [];
  public actionList: IActionItem[] = [];
  public showPstn: boolean = false;
  public showATA: boolean = false;
  public csdmHybridCallFeature: boolean = false;
  private csdmHybridCalendarFeature = false;
  private hybridCalendarEnabledOnOrg = false;
  private hybridCallEnabledOnOrg = false;
  private atlasHerculesGoogleCalendarFeatureToggle = false;
  public generateCodeIsDisabled = true;

  private currentPlace: IPlace = <IPlace>{ devices: {} };
  private csdmHuronUserDeviceService;
  private adminUserDetails;
  private showDeviceSettings = false;

  /* @ngInject */
  constructor(private $q: ng.IQService,
              private $state: ng.ui.IStateService,
              private $stateParams,
              private $translate: ng.translate.ITranslateService,
              private Authinfo,
              private CsdmHuronUserDeviceService,
              private CsdmDataModelService: ICsdmDataModelService,
              private FeatureToggleService,
              private ServiceDescriptor,
              private Notification,
              private Userservice,
              private WizardFactory,
              private CsdmUpgradeChannelService) {
    this.csdmHuronUserDeviceService = this.CsdmHuronUserDeviceService.create(this.$stateParams.currentPlace.cisUuid);
    CsdmDataModelService.reloadItem(this.$stateParams.currentPlace).then((updatedPlace) => this.displayPlace(updatedPlace));
  }

  public $onInit(): void {
    this.displayPlace(this.$stateParams.currentPlace);
    this.fetchAsyncSettings();
  }

  private displayPlace(newPlace: IPlace) {
    this.currentPlace = newPlace;
    this.currentPlace.id = this.currentPlace.cisUuid;
    this.loadServices();
    this.loadActions();
  }

  private loadServices(): void {
    let service: IFeature;
    if (this.hasEntitlement('ciscouc')) {
      service = {
        name: this.$translate.instant('onboardModal.call'),
        icon: 'icon-circle-call',
        state: 'communication',
        detail: this.$translate.instant('placesPage.sparkCall'),
        actionAvailable: true,
      };
    } else if (this.hasEntitlement('squared-fusion-uc')) {
      //dont add call services, it will be handled by hercules-cloud-extensions
      this.services = [];
      return;
    } else {
      service = {
        name: this.$translate.instant('onboardModal.call'),
        icon: 'icon-circle-call',
        state: 'communication',
        detail: this.$translate.instant('placesPage.sparkOnly'),
        actionAvailable: true,
      };
    }
    this.services = [];
    this.services.push(service);
  }

  private fetchAsyncSettings() {
    let ataPromise = this.FeatureToggleService.csdmATAGetStatus().then(feature => {
      this.showATA = feature;
    });
    let hybridPromise = this.FeatureToggleService.csdmHybridCallGetStatus().then(feature => {
      this.csdmHybridCallFeature = feature;
    });
    let placeCalendarPromise = this.FeatureToggleService.csdmPlaceCalendarGetStatus().then(feature => {
      this.csdmHybridCalendarFeature = feature;
    });
    let gcalFeaturePromise = this.FeatureToggleService.atlasHerculesGoogleCalendarGetStatus().then(feature => {
      this.atlasHerculesGoogleCalendarFeatureToggle = feature;
    });
    let anyCalendarEnabledPromise = this.ServiceDescriptor.getServices().then(services => {
      this.hybridCalendarEnabledOnOrg = _.chain(this.ServiceDescriptor.filterEnabledServices(services)).filter(service => {
        return service.id === 'squared-fusion-gcal' || service.id === 'squared-fusion-cal';
      }).some().value();
      this.hybridCallEnabledOnOrg = _.chain(this.ServiceDescriptor.filterEnabledServices(services)).filter(service => {
        return service.id === 'squared-fusion-uc';
      }).some().value();
    });

    this.$q.all([ataPromise, hybridPromise, placeCalendarPromise, gcalFeaturePromise, anyCalendarEnabledPromise, this.fetchDetailsForLoggedInUser()]).finally(() => {
      this.generateCodeIsDisabled = false;
    });

    this.FeatureToggleService.csdmPlaceUpgradeChannelGetStatus().then(feature => {
      if (feature) {
        this.CsdmUpgradeChannelService.getUpgradeChannelsPromise().then(channels => {
          this.showDeviceSettings = channels.length > 1 && this.currentPlace.type === 'cloudberry';
        });
      }
    });
  }

  private fetchDetailsForLoggedInUser() {
    let userDetailsDeferred = this.$q.defer();
    this.Userservice.getUser('me', (data) => {
      if (data.success) {
        this.adminUserDetails = {
          firstName: data.name && data.name.givenName,
          lastName: data.name && data.name.familyName,
          displayName: data.displayName,
          userName: data.userName,
          cisUuid: data.id,
          organizationId: data.meta.organizationID,
        };
      }
      userDetailsDeferred.resolve();
    });
    return userDetailsDeferred.promise;
  }

  private loadActions(): void {
    this.actionList = [];
    if (this.currentPlace.type === 'cloudberry') {
      this.showPstn = this.Authinfo.isSquaredUC();
      this.actionList = [{
        actionKey: 'usersPreview.editServices',
        actionFunction: () => {
          this.editCloudberryServices();
        },
      }];
    }
  }

  public getCurrentPlace = (): IPlace => {
    return this.currentPlace;
  }

  private startStateMap = {
    'squared-fusion-uc': 'addDeviceFlow.callConnectOptions',
    'squared-fusion-cal': 'addDeviceFlow.editCalendarService',
    'squared-fusion-gcal': 'addDeviceFlow.editCalendarService',
  };

  public editCloudberryServices = (startAtService?): void => {

    let startState = startAtService && this.startStateMap[startAtService] || 'addDeviceFlow.editServices';
    let wizardState = {
      data: {
        function: 'editServices',
        title: 'usersPreview.editServices',
        csdmHybridCallFeature: this.csdmHybridCallFeature,
        csdmHybridCalendarFeature: this.csdmHybridCalendarFeature,
        hybridCalendarEnabledOnOrg: this.hybridCalendarEnabledOnOrg,
        hybridCallEnabledOnOrg: this.hybridCallEnabledOnOrg,
        atlasHerculesGoogleCalendarFeatureToggle: this.atlasHerculesGoogleCalendarFeatureToggle,
        account: {
          deviceType: this.currentPlace.type,
          type: 'shared',
          name: this.currentPlace.displayName,
          cisUuid: this.currentPlace.cisUuid,
          entitlements: this.currentPlace.entitlements,
          externalLinkedAccounts: this.currentPlace.externalLinkedAccounts,
        },
      },
      history: [],
      currentStateName: startState,
      wizardState: {
        'addDeviceFlow.editServices': {
          nextOptions: {
            sparkCall: 'addDeviceFlow.addLines',
            sparkCallConnect: 'addDeviceFlow.callConnectOptions',
            sparkOnlyAndCalendar: 'addDeviceFlow.editCalendarService',
          },
        },
        'addDeviceFlow.addLines': {
          nextOptions: {
            calendar: 'addDeviceFlow.editCalendarService',
          },
        },
        'addDeviceFlow.callConnectOptions': {
          nextOptions: {
            calendar: 'addDeviceFlow.editCalendarService',
          },
        },
        'addDeviceFlow.editCalendarService': {
          nextOptions: {
            calendar: 'addDeviceFlow.editCalendarService',
          },
        },
      },
    };
    let wizard = this.WizardFactory.create(wizardState);
    this.$state.go(wizardState.currentStateName, {
      wizard: wizard,
    });
  }

  public save(newName: string) {
    return this.CsdmDataModelService
      .updateItemName(this.currentPlace, newName)
      .then((updatedPlace) => this.displayPlace(updatedPlace))
      .catch((error) => {
        this.Notification.errorResponse(error, 'placesPage.failedToSaveChanges');
        return this.$q.reject(error);
      });
  }

  public showDeviceDetails(device: IDevice): void {
    this.$state.go('place-overview.csdmDevice', {
      currentDevice: device,
      huronDeviceService: this.csdmHuronUserDeviceService,
    });
  }

  private hasEntitlement(entitlement: string): boolean {
    let hasEntitlement = false;
    if (this.currentPlace.entitlements) {
      this.currentPlace.entitlements.forEach(element => {
        if (element === entitlement) {
          hasEntitlement = true;
        }
      });
    }
    return hasEntitlement;
  }

  public clickService(feature: IFeature): void {
    this.$state.go('place-overview.' + feature.state);
  }

  public onGenerateOtpFn(): void {
    let wizardState = {
      data: {
        function: 'showCode',
        showATA: this.showATA,
        csdmHybridCallFeature: this.csdmHybridCallFeature,
        csdmHybridCalendarFeature: this.csdmHybridCalendarFeature,
        hybridCalendarEnabledOnOrg: this.hybridCalendarEnabledOnOrg,
        hybridCallEnabledOnOrg: this.hybridCallEnabledOnOrg,
        atlasHerculesGoogleCalendarFeatureToggle: this.atlasHerculesGoogleCalendarFeatureToggle,
        admin: this.adminUserDetails,
        account: {
          type: 'shared',
          deviceType: this.currentPlace.type,
          cisUuid: this.currentPlace.cisUuid,
          name: this.currentPlace.displayName,
          organizationId: this.Authinfo.getOrgId(),
        },
        recipient: {
          cisUuid: this.Authinfo.getUserId(),
          email: this.Authinfo.getPrimaryEmail(),
          displayName: this.adminUserDetails.displayName,
          organizationId: this.adminUserDetails.organizationId,
        },
        title: 'addDeviceWizard.newCode',
      },
      history: [],
      currentStateName: 'addDeviceFlow.showActivationCode',
      wizardState: {
        'addDeviceFlow.showActivationCode': {},
      },
    };
    let wizard = this.WizardFactory.create(wizardState);
    this.$state.go('addDeviceFlow.showActivationCode', {
      wizard: wizard,
    });
  }
}

export class PlaceOverviewComponent implements ng.IComponentOptions {
  public controller = PlaceOverview;
  public templateUrl = 'modules/squared/places/overview/placeOverview.html';
}
