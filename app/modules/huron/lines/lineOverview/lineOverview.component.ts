import { CallForward } from '../../callForward';
import { LineService, LineConsumerType, LINE_CHANGE, Line } from '../services';
import { LineOverviewService, LineOverviewData } from './index';
import { DirectoryNumberOptionsService, Availability, ExternalNumberType, Pattern } from '../../directoryNumber';
import { IActionItem } from '../../../core/components/sectionTitle/sectionTitle.component';
import { Member, MemberService } from '../../members';
import { SharedLine, SharedLineService } from '../../sharedLine';
import { Notification } from 'modules/core/notifications';

class LineOverview implements ng.IComponentController {
  private ownerType: string;
  private ownerId: string;
  private ownerName: string;
  private ownerPlaceType: string;
  private numberId: string;
  private consumerType: LineConsumerType;
  public form: ng.IFormController;
  public saveInProcess: boolean = false;
  public actionList: Array<IActionItem>;
  public showActions: boolean = false;
  public deleteConfirmation: string;
  public deleteSharedLineMessage: string;

  // Directory Number properties
  public esnPrefix: string;
  public internalNumbers: Array<string>;
  public externalNumbers: Array<string>;
  public showExtensions: boolean;

  //SharedLine Properties
  public newSharedLineMembers: Array<Member> = [];

  // Data from services
  public lineOverviewData: LineOverviewData;

  /* @ngInject */
  constructor(
    private LineOverviewService: LineOverviewService,
    private LineService: LineService,
    private DirectoryNumberOptionsService: DirectoryNumberOptionsService,
    private $translate: ng.translate.ITranslateService,
    private $scope: ng.IScope,
    private $state,
    private $modal,
    private MemberService: MemberService,
    private Notification: Notification,
    private SharedLineService: SharedLineService,
    private CsdmDataModelService,
  ) { }

  public $onInit(): void {
    this.initActions();
    this.initConsumerType();
    this.initLineOverviewData();
  }

  private initActions(): void {
    this.actionList = [{
      actionKey: 'directoryNumberPanel.deleteLineTitle',
      actionFunction: () => {
        this.deleteLine();
      },
    }];
  }

  private initLineOverviewData(): void {
    this.showExtensions = true;
    this.DirectoryNumberOptionsService.getInternalNumberOptions()
      .then(numbers => {
        this.internalNumbers = numbers;
        this.LineOverviewService.get(this.consumerType, this.ownerId, this.numberId)
          .then(lineOverviewData => {
            this.lineOverviewData = lineOverviewData;
            this.showActions = this.setShowActionsFlag(this.lineOverviewData.line);
            if (!this.lineOverviewData.line.uuid) { // new line, grab first available internal number
              this.lineOverviewData.line.internal = this.internalNumbers[0];
              this.form.$setDirty();
            }
          });
      });

    this.LineOverviewService.getEsnPrefix().then(esnPrefix => this.esnPrefix = esnPrefix);
    this.DirectoryNumberOptionsService.getExternalNumberOptions(
      Pattern.SKIP_MATCHING,    // Don't search for a specific number
      Availability.UNASSIGNED,  // Only get unassigned numbers
      ExternalNumberType.DID,   // Only get standard PSTN numbers. No toll free.
      ).then(numbers => this.externalNumbers = numbers);
  }

  public setDirectoryNumbers(internalNumber: string, externalNumber: string): void {
    this.lineOverviewData.line.internal = internalNumber;
    this.lineOverviewData.line.external = externalNumber;
    this.checkForChanges();
  }

  public refreshInternalNumbers(filter: string): void {
    this.DirectoryNumberOptionsService.getInternalNumberOptions(filter)
      .then(numbers => this.internalNumbers = numbers);
  }

  public refreshExternalNumbers(filter: string): void {
    this.DirectoryNumberOptionsService.getExternalNumberOptions(filter)
      .then(numbers => this.externalNumbers = numbers);
  }

  public setCallForward(callForward: CallForward): void {
    this.lineOverviewData.callForward = callForward;
    this.checkForChanges();
  }

  public setSimultaneousCalls(incomingCallMaximum: number): void {
    this.lineOverviewData.line.incomingCallMaximum = incomingCallMaximum;
    if (this.LineOverviewService.matchesOriginalConfig(this.lineOverviewData)) {
      this.resetForm();
    }
  }

  public setCallerId(callerIdSelected, callerIdName, callerIdNumber, companyNumber): void {
    _.set(this.lineOverviewData, 'callerId.customCallerIdName', callerIdName);
    _.set(this.lineOverviewData, 'callerId.customCallerIdNumber', callerIdNumber);
    _.set(this.lineOverviewData, 'callerId.externalCallerIdType', _.get(callerIdSelected, 'value'));
    _.set(this.lineOverviewData, 'callerId.companyNumber', companyNumber);
    this.checkForChanges();
  }

  public setNewSharedLineMembers(members): void {
    this.newSharedLineMembers = members;
  }

  public setSharedLines(sharedLines): void {
    this.lineOverviewData.sharedLines = sharedLines;
    if (this.LineOverviewService.matchesOriginalConfig(this.lineOverviewData)) {
      this.resetForm();
    } else {
      this.form.$setDirty();
    }
  }

  public deleteSharedLineMember(sharedLine: SharedLine): void {
    this.deleteSharedLineMessage = this.$translate.instant('sharedLinePanel.disassociateUser');
    this.$modal.open({
      templateUrl: 'modules/huron/sharedLine/removeSharedLineMember.html',
      scope: this.$scope,
      type: 'dialog',
    }).result.then( () => {
      let redirect: boolean = _.isEqual(this.ownerId, _.get(sharedLine, 'place.uuid')) || _.isEqual(this.ownerId, _.get(sharedLine, 'user.uuid'));
      return this.SharedLineService.deleteSharedLine(this.consumerType, this.ownerId, this.lineOverviewData.line.uuid, sharedLine.uuid)
      .then( () => {
        this.$scope.$emit(LINE_CHANGE);
        this.Notification.success('directoryNumberPanel.disassociationSuccess');
        if (redirect) {
          this.$state.go(this.$state.$current.parent.name);
        } else {
          this.initLineOverviewData();
        }
      })
      .catch( (response) => this.Notification.errorResponse(response, 'directoryNumberPanel.error'));
    });
  }

  public onCancel(): void {
    if (!this.lineOverviewData.line.uuid) {
      this.$state.go(this.$state.$current.parent.name);
    } else {
      this.lineOverviewData = this.LineOverviewService.getOriginalConfig();
      this.newSharedLineMembers = [];
      this.resetForm();
    }
  }

  public getUserList(name: string): ng.IPromise<Member[]> {
    return this.MemberService.getMemberList(name)
      .then(memberList => {
        return _.reject(memberList, member => {
          return _.get(member, 'uuid') === this.ownerId ||
            _.find(this.newSharedLineMembers, { uuid: _.get(member, 'uuid') }) ||
            _.find(this.lineOverviewData.sharedLines, { uuid: _.get(member, 'uuid') });
        });
      });
  }

  public saveLine() {
    this.saveInProcess = true;
    this.LineOverviewService.save(this.consumerType, this.ownerId, this.lineOverviewData.line.uuid, this.lineOverviewData, this.newSharedLineMembers)
      .then( (lineOverviewData) => {
        this.$scope.$emit(LINE_CHANGE);
        this.lineOverviewData = lineOverviewData;
        this.newSharedLineMembers = [];
        this.showActions = this.setShowActionsFlag(lineOverviewData.line);
        if (this.isCloudberryPlace()) {
          this.CsdmDataModelService.notifyDevicesInPlace(this.ownerId, {
            command: 'pstnChanged',
            eventType: 'room.pstnChanged',
          });
        }
        this.Notification.success('directoryNumberPanel.success');
      })
      .finally( () => {
        this.saveInProcess = false;
        this.resetForm();
      });
  }

  public deleteLine() {
    this.deleteConfirmation = this.$translate.instant('directoryNumberPanel.deleteConfirmation', {
        line: this.lineOverviewData.line.internal,
        user: this.ownerName,
      });
    this.$modal.open({
      templateUrl: 'modules/huron/lines/lineOverview/lineDelete.html',
      scope: this.$scope,
      type: 'dialog',
    }).result.then( () => {
      if (!this.lineOverviewData.line.primary) {
        return this.LineService.deleteLine(this.consumerType, this.ownerId, this.lineOverviewData.line.uuid)
          .then( () => {
            this.$scope.$emit(LINE_CHANGE);
            this.Notification.success('directoryNumberPanel.disassociationSuccess');
            this.$state.go(this.$state.$current.parent.name);
          })
          .catch( (response) => this.Notification.errorResponse(response, 'directoryNumberPanel.error'));
      }
    });
  }

  public isCloudberryPlace(): boolean {
    return this.ownerPlaceType === 'cloudberry';
  }

  private checkForChanges(): void {
    if (this.LineOverviewService.matchesOriginalConfig(this.lineOverviewData)) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.form.$setPristine();
    this.form.$setUntouched();
  }

  private setShowActionsFlag(line: Line): boolean {
    return (!!line.uuid && !line.primary);
  }

  private initConsumerType(): void {
    switch (this.ownerType) {
      case 'place': {
        this.consumerType = LineConsumerType.PLACES;
        break;
      }
      default: {
        this.consumerType = LineConsumerType.USERS;
      }
    }
  }
}

export class LineOverviewComponent implements ng.IComponentOptions {
  public controller = LineOverview;
  public templateUrl = 'modules/huron/lines/lineOverview/lineOverview.html';
  public bindings = {
    ownerType: '@',
    ownerId: '<',
    ownerName: '<',
    ownerPlaceType: '<',
    numberId: '<',
    voicemailEnabled: '<',
  };
}
