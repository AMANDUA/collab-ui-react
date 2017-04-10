import { CallForward, CallForwardAll } from './callForward';
import { LineConsumerType } from '../lines/services';

interface ICallForwardResource extends ng.resource.IResourceClass<ng.resource.IResource<CallForward>> {
  update: ng.resource.IResourceMethod<ng.resource.IResource<void>>;
}

export class CallForwardService {
  private callForwardService: ICallForwardResource;

  /* @ngInject */
  constructor(
    private $resource: ng.resource.IResourceService,
    private Authinfo,
    private HuronConfig,
  ) {
    let updateAction: ng.resource.IActionDescriptor = {
      method: 'PUT',
    };

    this.callForwardService = <ICallForwardResource>this.$resource(this.HuronConfig.getCmiV2Url() + '/customers/:customerId/:type/:typeId/numbers/:numberId/features/callforwards', {},
      {
        update: updateAction,
      });
  }

  public getCallForward(type: LineConsumerType, typeId: string, numberId: string): ng.IPromise<CallForward> {
    return this.callForwardService.get({
      customerId: this.Authinfo.getOrgId(),
      type: type,
      typeId: typeId,
      numberId: numberId,
    }).$promise;
  }

  public updateCallForward(type: LineConsumerType, typeId: string, numberId: string | undefined, data: CallForward): ng.IPromise<void> {
    return this.callForwardService.update({
      customerId: this.Authinfo.getOrgId(),
      type: type,
      typeId: typeId,
      numberId: numberId,
    }, {
      callForwardAll: new CallForwardAll({
        voicemailEnabled: data.callForwardAll.voicemailEnabled,
        destination: data.callForwardAll.destination,
      }),
      callForwardBusy: {internalVoicemailEnabled: data.callForwardBusy.internalVoicemailEnabled,
        internalDestination: data.callForwardBusy.internalDestination,
        externalVoicemailEnabled: data.callForwardBusy.externalVoicemailEnabled,
        externalDestination: data.callForwardBusy.externalDestination},

      callForwardNoAnswer: {internalVoicemailEnabled: data.callForwardBusy.internalVoicemailEnabled,
        internalDestination: data.callForwardBusy.internalDestination,
        externalVoicemailEnabled: data.callForwardBusy.externalVoicemailEnabled,
        externalDestination: data.callForwardBusy.externalDestination,
        ringDurationTimer: data.callForwardBusy.ringDurationTimer},

      callForwardNotRegistered: {internalVoicemailEnabled: data.callForwardBusy.internalVoicemailEnabled,
        internalDestination: data.callForwardBusy.internalDestination,
        externalVoicemailEnabled: data.callForwardBusy.externalVoicemailEnabled,
        externalDestination: data.callForwardBusy.externalDestination},

    }).$promise;
  }

  public deleteCallForward(type: LineConsumerType, typeId: string, numberId: string): ng.IPromise<any> {
    return this.callForwardService.remove({
      customerId: this.Authinfo.getOrgId(),
      type: type,
      typeId: typeId,
      numberId: numberId,
    }).$promise;
  }

}
