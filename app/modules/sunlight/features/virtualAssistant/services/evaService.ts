
export interface IConfigurationResource extends ng.resource.IResourceClass<any> {
  update(any): any;
}

export class EvaService {

  // Service Card definition. describes how to render the top-level virtual assistant 'card' for care.
  public evaServiceCard = {
    id: 'expertVirtualAssistant',
    type: 'expertVirtualAssistant',
    mediaType: 'virtualAssistant', // for filter
    code: this.getMessageKey('featureText.code'),
    label: this.getMessageKey('featureText.type'),
    description: this.getMessageKey('featureText.selectDesc'),
    icons: ['icon-bot-two'],
    color: 'feature-va-color',
    disabled: false,
    disabledTooltip:  this.getMessageKey('featureText.disabledTooltip'),
    goToService: this.goToService.bind(this),
  };

  // Feature List definition. describes how to fetch and render list of existing expert virtual assistants as
  // 'cards' for care.
  public featureList = {
    name: this.evaServiceCard.id,
    getFeature: this.listExpertAssistants.bind(this),
    formatter: this.formatExpertAssistants.bind(this),
    i18n: 'careChatTpl.chatTemplate',
    isEmpty: false,
    color: 'cta',
    icons: this.evaServiceCard.icons,
    data: [],
  };
  // Feature List Filter definition. describes how to filter this feature
  public featureFilter = {
    name: this.getText('featureText.mediaType'),
    filterValue: this.evaServiceCard.mediaType,
  };


  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private $resource: ng.resource.IResourceService,
    private Authinfo,
    private UrlConfig,
    private $q: ng.IQService,
  ) {
  }


  /**
   * Function to obtain translated string off virtual-assistant's area for strings
   * @param textIdExtension
   * @returns {string}
   */
  public getText(textIdExtension: string): string {
    const featureName = this.$translate.instant('careChatTpl.virtualAssistant.eva.featureText.name');
    return this.$translate.instant('careChatTpl.virtualAssistant.eva.' + textIdExtension, { featureName });
  }

  /**
   * Function to obtain literal key for later lookup/translation.
   * @param textIdExtension
   * @returns {string}
   */
  public getMessageKey(textIdExtension: string): string {
    return 'careChatTpl.virtualAssistant.eva.' + textIdExtension;
  }

  /** Functions used by service object **/
  /**
   * go to this Service's state
   * @param $state  current state object from controller.
   * @param params optional added parameters to pass
   * @returns {String} id of Service
   */
  private goToService($state: ng.ui.IStateService, params?: object): string {
    $state.go('care.expertVirtualAssistant', _.assign({
      type: params,
    }, params));
    return this.evaServiceCard.id;
  }

  /**
   * obtain resource for Expert Virtual Assistant API Rest calls.
   * @param orgId
   * @param expertAssistantId
   * @returns {IConfigurationResource}
   */
  private getExpertAssistantResource(orgId: string, expertAssistantId?: string): IConfigurationResource {
    const  baseUrl = this.UrlConfig.getEvaServiceUrl();
    return <IConfigurationResource>this.$resource(baseUrl + 'config/organization/:orgId/expert-assistant/:expertAssistantId', {
      orgId: orgId,
      expertAssistantId: expertAssistantId,
    }, {
      update: {
        method: 'PUT',
      },
    });
  }

  /**
   * list all Expert Virtual Assistants for orgId
   * @param orgId
   * returns {ng.IPromise<any>} promise resolving to JSON array of configurations or empty array on error
   */
  public listExpertAssistants(orgId: string): ng.IPromise<any> {
    return this.getExpertAssistantResource(orgId || this.Authinfo.getOrgId())
      .get().$promise;
  }

  /**
   * get a single identified expert virtual assistant for orgId
   * @param expertAssistantId
   * @param orgId
   * returns {ng.IPromise<any>} promise
   */
  public getExpertAssistant(expertAssistantId: string, orgId: string): ng.IPromise<any> {
    return this.getExpertAssistantResource(orgId || this.Authinfo.getOrgId(), expertAssistantId)
      .get().$promise;
  }

  /**
   * delete a single identified expert virtual assistant for orgId
   * @param expertAssistantId
   * @param orgId
   * returns {ng.IPromise<any>} promise
   */
  public deleteExpertAssistant(expertAssistantId: string, orgId: string): ng.IPromise<void>  {
    return this.getExpertAssistantResource(orgId || this.Authinfo.getOrgId(), expertAssistantId)
      .delete().$promise;
  }

  /**
   * add a new expert virtual assistant
   * @param name
   * @param orgId
   * @param email
   * @param iconUrl URL to avatar icon file
   * returns {ng.IPromise<any>} promise
   */
  public addExpertAssistant(name: string, orgId: string, email: string, iconUrl?: string): ng.IPromise<any> {
    return this.getExpertAssistantResource(orgId || this.Authinfo.getOrgId())
      .save({
        name: name,
        icon: iconUrl,
        email: email,
        queueId: orgId,
      }, function (data, headers) {
        data.expertAssistantId = headers('location').split('/').pop();
        return data;
      }).$promise;
  }

  /**
   * update an identified expert virtual assistant
   * @param expertAssistantId
   * @param name
   * @param orgId
   * @param email
   * @param iconUrl URL to avatar icon file
   * returns {ng.IPromise<any>} promise
   */
  public updateExpertAssistant(expertAssistantId: string, name: string, orgId: string, email: string, iconUrl?: string): ng.IPromise<void> {
    return this.getExpertAssistantResource(orgId || this.Authinfo.getOrgId(), expertAssistantId)
      .update({
        name: name,
        email: email,
        queueId: orgId,
        icon: iconUrl,
      }).$promise;
  }

  /**
   * Return formatted list to render as cards on CareFeatures page
   * @param list
   * @param feature
   * @returns {any[]}
     */
  private formatExpertAssistants(list: any, feature: any): any[] {
    const service = this;
    const formattedList = _.map(list.items, function (item: any) {
      item.templateId = item.id;
      if (!item.name) {
        item.name = item.templateId;
      }
      item.mediaType = service.evaServiceCard.mediaType;
      // CA-115: indicates that item.status should not be visible until UX defines the value to be set when "In use"
      // item.status = 'Not in use';
      item.featureType = feature.name;
      item.color = feature.color;
      item.icons = feature.icons;
      return item;
    });
    return _.sortBy(formattedList, function (item: any) {
      //converting cardName to lower case as _.sortBy by default does a case sensitive sorting
      return item.name.toLowerCase();
    });
  }

  /**
   * Get the data url from file object
   * @param fileObject
   * @returns {Promise<String>} promise resolving to the data url on success; otherwise promise rejected
   */
  public getFileDataUrl(fileObject: any): ng.IPromise<String> {
    return this.$q((resolve, reject) => {
      if (!fileObject) {
        return reject('');
      }
      const fileReader = new FileReader();
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = () => {
        reject('');
      };
      fileReader.readAsDataURL(fileObject);
    });
  }
}
export default angular
  .module('Sunlight')
  .service('EvaService', EvaService)
  .name;
