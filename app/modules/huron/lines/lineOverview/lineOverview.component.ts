import { CallForward } from 'modules/huron/callForward';
import { LineService, LineConsumerType, LINE_CHANGE, Line } from 'modules/huron/lines/services';
import { LineOverviewService, LineOverviewData } from './index';
import { DirectoryNumberOptionsService, Availability, ExternalNumberType, Pattern } from 'modules/huron/directoryNumber';
import { MediaOnHoldService } from 'modules/huron/media-on-hold';
import { IActionItem } from 'modules/core/components/sectionTitle/sectionTitle.component';
import { Member, MemberService } from 'modules/huron/members';
import { SharedLine, SharedLineService } from 'modules/huron/sharedLine';
import { Notification } from 'modules/core/notifications';
import { AutoAnswerService } from 'modules/huron/autoAnswer';
import { IOption } from 'modules/huron/dialing';

class LineOverview implements ng.IComponentController {
  private ownerType: string;
  private ownerId: string;
  private ownerName: string;
  private ownerPlaceType: string;
  private numberId: string;
  private consumerType: LineConsumerType;
  public form: ng.IFormController;
  public saveInProcess: boolean = false;
  public actionList: IActionItem[];
  public showActions: boolean = false;
  public deleteConfirmation: string;
  public deleteSharedLineMessage: string;
  public wide: boolean = true;

  // Directory Number properties
  public esnPrefix: string;
  public internalNumbers: string[];
  public externalNumbers: string[];
  public showExtensions: boolean;

  //SharedLine Properties
  public newSharedLineMembers: Member[] = [];

  // Data from services
  public lineOverviewData: LineOverviewData;
  public lineMediaOptions: IOption[] = [];
  private userVoicemailEnabled: boolean = false;
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
    private MediaOnHoldService: MediaOnHoldService,
    private Notification: Notification,
    private SharedLineService: SharedLineService,
    private CsdmDataModelService,
    private AutoAnswerService: AutoAnswerService,
    private $q,
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
    if (!this.numberId) {
      this.DirectoryNumberOptionsService.getInternalNumberOptions()
        .then(numbers => {
          this.internalNumbers = numbers;
          this.getLineOverviewData();
        }).catch(error => this.Notification.errorResponse(error, 'directoryNumberPanel.internalNumberPoolError'));
    } else {
      this.getLineOverviewData();
      this.DirectoryNumberOptionsService.getInternalNumberOptions()
        .then(numbers => {
          this.internalNumbers = numbers;
        }).catch(error => this.Notification.errorResponse(error, 'directoryNumberPanel.internalNumberPoolError'));
    }

    this.LineOverviewService.getEsnPrefix().then(esnPrefix => this.esnPrefix = esnPrefix);
    this.DirectoryNumberOptionsService.getExternalNumberOptions(
      Pattern.SKIP_MATCHING,    // Don't search for a specific number
      Availability.UNASSIGNED,  // Only get unassigned numbers
      ExternalNumberType.DID,   // Only get standard PSTN numbers. No toll free.
      ).then(numbers => this.externalNumbers = numbers);
  }

  public getLineOverviewData(): void {
    this.initLineOptions();
    this.LineOverviewService.get(this.consumerType, this.ownerId, this.numberId, this.wide)
    .then(lineOverviewData => {
      this.lineOverviewData = lineOverviewData;
      this.userVoicemailEnabled = lineOverviewData.voicemailEnabled;
      this.showActions = this.setShowActionsFlag(this.lineOverviewData.line);
      if (!this.lineOverviewData.line.uuid) { // new line, grab first available internal number
        this.lineOverviewData.line.internal = this.internalNumbers[0];
        this.form.$setDirty();
      }
    });
  }

  public initLineOptions(): void {
    this.MediaOnHoldService.getCompanyMohOptions()
    .then(mediaList => {
      this.lineMediaOptions = mediaList;
    });
  }

  public setDirectoryNumbers(internalNumber: string, externalNumber: string): void {
    this.lineOverviewData.line.internal = internalNumber;
    this.lineOverviewData.line.external = externalNumber;
    this.checkForChanges();
  }

  public refreshInternalNumbers(filter: string): void {
    this.DirectoryNumberOptionsService.getInternalNumberOptions(filter)
      .then(numbers => this.internalNumbers = numbers)
      .catch(error => this.Notification.errorResponse(error, 'directoryNumberPanel.internalNumberPoolError'));
  }

  public refreshExternalNumbers(filter: string): void {
    this.DirectoryNumberOptionsService.getExternalNumberOptions(filter)
      .then(numbers => this.externalNumbers = numbers)
      .catch(error => this.Notification.errorResponse(error, 'directoryNumberPanel.externalNumberPoolError'));
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

  public setAutoAnswer(phoneId, enabled, mode): void {
    this.AutoAnswerService.setAutoAnswer(this.lineOverviewData.autoAnswer.phones, phoneId, enabled, mode);
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

  public setLineMedia(LineMediaId: string): void {
    this.lineOverviewData.lineMoh = LineMediaId;
    if (this.LineOverviewService.matchesOriginalConfig(this.lineOverviewData)) {
      this.resetForm();
    }
  }

  public deleteSharedLineMember(sharedLine: SharedLine): void {
    this.deleteSharedLineMessage = this.$translate.instant('sharedLinePanel.disassociateUser');
    this.$modal.open({
      templateUrl: 'modules/huron/sharedLine/removeSharedLineMember.html',
      scope: this.$scope,
      type: 'dialog',
    }).result.then( () => {
      const redirect: boolean = _.isEqual(this.ownerId, _.get(sharedLine, 'place.uuid')) || _.isEqual(this.ownerId, _.get(sharedLine, 'user.uuid'));
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
    const uuid = _.get(this, 'lineOverviewData.line.uuid');
    if (!uuid) {
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
    }).result.then(() => {
      if (!this.lineOverviewData.line.primary) {
        return this.deleteSharedLines().then(() => {
          return this.LineService.deleteLine(this.consumerType, this.ownerId, this.lineOverviewData.line.uuid)
          .then(() => {
            this.$scope.$emit(LINE_CHANGE);
            this.Notification.success('directoryNumberPanel.disassociationSuccess');
            this.$state.go(this.$state.$current.parent.name);
          })
          .catch((response) => this.Notification.errorResponse(response, 'directoryNumberPanel.error'));
        })
        .catch((response) => this.Notification.errorResponse(response, 'directoryNumberPanel.error'));
      }
    });
  }

  public deleteSharedLines() {
    const promises: ng.IPromise<any>[] = [];
    const lines: SharedLine[] = _.reject(this.lineOverviewData.sharedLines, (member) => {
      return _.get(member, 'primary') || _.get(member, 'uuid') === this.ownerId;
    });
    _.forEach(lines, (member) => {
      promises.push(this.SharedLineService.deleteSharedLine(this.consumerType, this.ownerId, this.lineOverviewData.line.uuid, member.uuid));
    });
    return this.$q.all(promises);
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
    userVoicemailEnabled: '<',
  };
}
