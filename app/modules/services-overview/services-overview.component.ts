import { CardType, ServicesOverviewCard } from './shared/services-overview-card';
import { ServicesOverviewMessageCard } from './cloud/message-card';
import { ServicesOverviewMeetingCard } from './cloud/meeting-card';
import { ServicesOverviewCallCard } from './cloud/cloud-call-card';
import { ServicesOverviewCareCard } from './cloud/care-card';
import { ServicesOverviewCmcCard } from './cloud/cmc-card';
import { ServicesOverviewHybridServicesCard } from './hybrid/hybrid-services-card';
import { ServicesOverviewHybridAndGoogleCalendarCard } from './hybrid/hybrid-and-google-calendar-card';
import { ServicesOverviewHybridCalendarCard } from './hybrid/hybrid-calendar-card';
import { ServicesOverviewHybridCallCard } from './hybrid/hybrid-call-card';
import { ServicesOverviewImpCard } from './hybrid/imp-card';
import { ServicesOverviewHybridMediaCard } from './hybrid/hybrid-media-card';
import { ServicesOverviewHybridDataSecurityCard } from './hybrid/hybrid-data-security-card';
import { ServicesOverviewHybridContextCard } from './hybrid/hybrid-context-card';
import { ServicesOverviewPrivateTrunkCard } from './hybrid/private-trunk-card';

import { CloudConnectorService } from 'modules/hercules/services/calendar-cloud-connector.service';
import { EnterprisePrivateTrunkService } from 'modules/hercules/services/enterprise-private-trunk-service';
import { HybridServicesClusterService, IServiceStatusWithSetup } from 'modules/hercules/services/hybrid-services-cluster.service';
import { ICluster } from 'modules/hercules/hybrid-services.types';
import { IPrivateTrunkResource } from 'modules/hercules/private-trunk/private-trunk-services/private-trunk';
import { IToolkitModalService } from 'modules/core/modal';
import { Notification } from 'modules/core/notifications';
import { PrivateTrunkPrereqService } from 'modules/hercules/private-trunk/private-trunk-prereq';
import { ProPackService }  from 'modules/core/proPack/proPack.service';

export class ServicesOverviewController implements ng.IComponentController {

  private cards: ServicesOverviewCard[];

  /* @ngInject */
  constructor(
    private $state: ng.IQService,
    private $q: ng.IQService,
    private $modal: IToolkitModalService,
    private Analytics,
    private Auth,
    private Authinfo,
    private CloudConnectorService: CloudConnectorService,
    private Config,
    private EnterprisePrivateTrunkService: EnterprisePrivateTrunkService,
    private FeatureToggleService,
    private HybridServicesClusterService: HybridServicesClusterService,
    private PrivateTrunkPrereqService: PrivateTrunkPrereqService,
    private ProPackService: ProPackService,
    private HDSService,
    private Notification: Notification,
  ) {}

  public $onInit() {
    this.cards = [
      new ServicesOverviewMessageCard(this.Authinfo),
      new ServicesOverviewMeetingCard(this.Authinfo),
      new ServicesOverviewCallCard(this.Authinfo, this.Config),
      new ServicesOverviewCareCard(this.Authinfo),
      new ServicesOverviewHybridServicesCard(this.Authinfo),
      new ServicesOverviewCmcCard(this.Authinfo),
      new ServicesOverviewHybridAndGoogleCalendarCard(this.$state, this.$q, this.$modal, this.Authinfo, this.CloudConnectorService, this.Notification),
      new ServicesOverviewHybridCalendarCard(this.Authinfo),
      new ServicesOverviewHybridCallCard(this.Authinfo),
      new ServicesOverviewHybridMediaCard(this.Authinfo, this.Config),
      new ServicesOverviewHybridDataSecurityCard(this.$state, this.Authinfo, this.Config, this.HDSService, this.Notification),
      new ServicesOverviewHybridContextCard(this.Authinfo),
      new ServicesOverviewPrivateTrunkCard( this.PrivateTrunkPrereqService),
      new ServicesOverviewImpCard(this.Authinfo),
    ];

    this.loadWebexSiteList();

    this.loadHybridServicesStatuses();

    this.FeatureToggleService.supports(this.FeatureToggleService.features.atlasPMRonM2)
      .then(supports => {
        if (supports) {
          this.getPMRStatus();
        }
      });

    this.FeatureToggleService.supports(this.FeatureToggleService.features.csdmPstn)
      .then(supports => {
        this.forwardEvent('csdmPstnFeatureToggleEventHandler', supports);
      });

    this.FeatureToggleService.supports(this.FeatureToggleService.features.atlasHybridDataSecurity)
      .then(supports => {
        this.forwardEvent('hybridDataSecurityFeatureToggleEventHandler', supports);
      });

    const PropackPromises = {
      hasProPackEnabled: this.ProPackService.hasProPackEnabled(),
      hasProPackPurchased: this.ProPackService.hasProPackPurchased(),
    };
    this.$q.all(PropackPromises).then(result => {
      this.forwardEvent('proPackEventHandler', result);
    });

    this.FeatureToggleService.supports(this.FeatureToggleService.features.atlasHybridImp)
      .then(supports => {
        this.forwardEvent('atlasHybridImpFeatureToggleEventHandler', supports);
      });

    this.FeatureToggleService.supports(this.FeatureToggleService.features.huronEnterprisePrivateTrunking)
      .then(supports => {
        this.forwardEvent('privateTrunkFeatureToggleEventHandler', supports);
        if (supports) {
          this.PrivateTrunkPrereqService.getVerifiedDomains().then(response => {
            this.forwardEvent('privateTrunkDomainEventHandler', response.length);
          });
        }
      });

    this.FeatureToggleService.supports(this.FeatureToggleService.features.hI802)
      .then(supports => {
        this.forwardEvent('sparkCallCdrReportingFeatureToggleEventhandler', supports);
      });

    this.FeatureToggleService.supports(this.FeatureToggleService.features.hI1484)
    .then(supports => {
      this.forwardEvent('hI1484FeatureToggleEventhandler', supports);
    });
  }

  public getHybridCards() {
    return _.filter(this.cards, {
      cardType: CardType.hybrid,
    });
  }

  public getCmcCards() {
    return _.filter(this.cards, {
      cardType: CardType.cmc,
    });
  }

  public hasActiveHybridCards() {
    return !!_.find(this.cards, card => card.display && card.getCardType() === CardType.hybrid);
  }

  public hasOneOrMoreHybridEntitlements() {
    return this.Authinfo.isFusion() || this.Authinfo.isFusionMedia() || this.Authinfo.isFusionUC() || this.Authinfo.isFusionCal() || this.Authinfo.isFusionHDS();
  }

  public getCloudCards() {
    return _.filter(this.cards, {
      cardType: CardType.cloud,
    });
  }

  private forwardEvent(handlerName, ...eventArgs: any[]) {
    _.each(this.cards, function (card) {
      if (_.isFunction(card[handlerName])) {
        card[handlerName].apply(card, eventArgs);
      }
    });
  }

  private loadHybridServicesStatuses() {
    this.HybridServicesClusterService.getAll()
      .then((clusterList) => {
        const servicesStatuses: IServiceStatusWithSetup[] = [
          this.HybridServicesClusterService.getStatusForService('squared-fusion-mgmt', clusterList),
          this.HybridServicesClusterService.getStatusForService('squared-fusion-cal', clusterList),
          this.HybridServicesClusterService.getStatusForService('squared-fusion-uc', clusterList),
          this.HybridServicesClusterService.getStatusForService('spark-hybrid-impinterop', clusterList),
          this.HybridServicesClusterService.getStatusForService('squared-fusion-media', clusterList),
          this.HybridServicesClusterService.getStatusForService('spark-hybrid-datasecurity', clusterList),
          this.HybridServicesClusterService.getStatusForService('contact-center-context', clusterList),
        ];
        this.forwardEvent('hybridStatusEventHandler', servicesStatuses);
        this.forwardEvent('hybridClustersEventHandler', clusterList);
        this.Analytics.trackEvent(this.Analytics.sections.HS_NAVIGATION.eventNames.VISIT_SERVICES_OVERVIEW, {
          'All Clusters is clickable': clusterList.length > 0,
          'Management is setup': servicesStatuses[0].setup,
          'Management status': servicesStatuses[0].status,
          'Calendar is setup': servicesStatuses[1].setup,
          'Calendar status': servicesStatuses[1].status,
          'Call is setup': servicesStatuses[2].setup,
          'Call status': servicesStatuses[2].status,
          'Media is setup': servicesStatuses[3].setup,
          'Media status': servicesStatuses[3].status,
          'Data Security is setup': servicesStatuses[4].setup,
          'Data Security status': servicesStatuses[4].status,
          'Context is setup': servicesStatuses[5].setup,
          'Context status': servicesStatuses[5].status,
        });
        return clusterList;
      })
      .then(this.loadSipDestinations);
  }

  private loadSipDestinations = (clusterList: ICluster[]) => {
    this.FeatureToggleService.supports(this.FeatureToggleService.features.huronEnterprisePrivateTrunking)
      .then((supported: boolean) => {
        if (supported) {
          this.EnterprisePrivateTrunkService.fetch()
            .then((sipTrunkResources: IPrivateTrunkResource[]) => {
              this.forwardEvent('sipDestinationsEventHandler', sipTrunkResources, clusterList);
            });
        }
      });
  }

  private loadWebexSiteList() {
    let siteList = this.Authinfo.getConferenceServicesWithoutSiteUrl() || [];
    siteList = siteList.concat(this.Authinfo.getConferenceServicesWithLinkedSiteUrl() || []);
    this.forwardEvent('updateWebexSiteList', siteList);
  }

  private getPMRStatus() {
    const customerAccount = this.Auth.getCustomerAccount(this.Authinfo.getOrgId());
    this.forwardEvent('updatePMRStatus', customerAccount);
  }
}

export class ServicesOverviewComponent implements ng.IComponentOptions {
  public controller = ServicesOverviewController;
  public templateUrl = 'modules/services-overview/services-overview.component.html';
}
