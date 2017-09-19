import { Member } from 'modules/huron/members';
import { IMember, IPickupGroup, IMemberNumber, ICallPickupNumbers, CallPickupGroupService } from 'modules/call/features/call-pickup/shared';
import { Notification } from 'modules/core/notifications';
import { IToolkitModalService } from 'modules/core/modal';

class CallPickupMembersCtrl implements ng.IComponentController {
  public memberList: Member[] = [];
  public selectedMembers: IMember[];
  private onUpdate: Function;
  private onEditUpdate: Function;
  public errorMemberInput: boolean = false;
  public memberName: string;
  private maxMembersAllowed: number = parseInt(this.$translate.instant('callPickup.maxMembersAllowed'), 10) || 30;
  private readonly suggestionLimit = 3;
  public readonly removeText = this.$translate.instant('callPickup.removeMember');
  public isNew: boolean;
  public savedCallPickup: IPickupGroup;
  /* @ngInject */
  constructor(
    private Notification: Notification,
    private FeatureMemberService,
    private $translate: ng.translate.ITranslateService,
    private CallPickupGroupService: CallPickupGroupService,
    private $modal: IToolkitModalService,
    private $scope,
    private $element,
  ) { }

  public fetchMembers(memberName: String): void {
    if (memberName) {
      return this.FeatureMemberService.getMemberSuggestionsByLimit(memberName, this.suggestionLimit)
      .then((members: Member[]) => {
        this.memberList = _.reject(members, mem => _.some(this.selectedMembers, member =>
        member.member.uuid === mem.uuid ));
        this.errorMemberInput = (this.memberList && this.memberList.length === 0);
        _.forEach(members, (member) => {
          this.CallPickupGroupService.areAllLinesInPickupGroup(member).then((disabled: boolean) => {
            member['disabled'] = disabled;
          });
        });
        return this.memberList;
      });
    }
  }

  public selectMember(member: Member): void {
    const isValid = this.CallPickupGroupService.verifyLineSelected(this.selectedMembers);
    this.memberName = '';
    if (this.selectedMembers.length < this.maxMembersAllowed) {
      const memberData: IMember = {
        member: member,
        picturePath: '',
        checkboxes: [],
        saveNumbers: [],
      };

      this.FeatureMemberService.getMemberPicture(member.uuid).then(
        avatar => memberData.picturePath = avatar.thumbnailSrc,
      );
      this.CallPickupGroupService.getMemberNumbers(member.uuid).then((memberNumbers: IMemberNumber[]) => {
        this.CallPickupGroupService.createCheckboxes(memberData, memberNumbers).then(() => {
          this.selectedMembers.push(memberData);
          if (!this.isNew) {
            this.updateExistingCallPickup('select');
          }
          this.onUpdate({
            member: this.selectedMembers,
            isValidMember: isValid,
          });
        });
      });
    } else {
      this.Notification.error('callPickup.memberLimitExceeded');
    }
    this.memberList = [];
  }

  private getActiveMember(): any {
    const scope = this.$element.find('li.active').scope();
    return scope['match']['model'];
  }

  public isActiveMemberDisabled(): boolean {
    const model = this.getActiveMember();
    const disabled = model['disabled'];
    return disabled;
  }

  public displayModalLinesTaken(evt): void {
    if (!this.isActiveMemberDisabled()) {
      return;
    }

    const modalScope = this.$scope.$new();
    const member = this.getActiveMember();

    evt.stopPropagation();

    modalScope.member = this.getDisplayName(member);
    modalScope.lines = [];
    modalScope.names = [];
    this.CallPickupGroupService.getMemberNumbers(member.uuid)
      .then((numbers: IMemberNumber[]) => {
        _.forEach(numbers, num => {
          this.CallPickupGroupService.isLineInPickupGroup(num.internal)
          .then((name: string) => {
            modalScope.lines.push(num.internal);
            modalScope.names.push(name);
          });
        });
      });
    this.$modal.open({
      templateUrl: 'modules/call/features/call-pickup/call-pickup-members/call-pickup-lines-taken-modal.html',
      type: 'dialog',
      scope: modalScope,
    });
  }

  private updateExistingCallPickup(action: string) {
    let newSaveNumbers: any[];
    if (action === 'remove') {
      newSaveNumbers = [];
      _.forEach(this.selectedMembers, (member) => {
        newSaveNumbers.push(_.map(member.saveNumbers, 'uuid'));
      });
      newSaveNumbers = _.flatten(newSaveNumbers);
      this.savedCallPickup.numbers = newSaveNumbers;
    } else if (action === 'select') {
      newSaveNumbers = [];
      _.forEach(this.selectedMembers, (member) => {
        _.forEach(member.saveNumbers, (number) => {
          if (_.indexOf(this.savedCallPickup.numbers, number.uuid) === -1) {
            this.savedCallPickup.numbers.push(number.uuid);
          }
        });
      });
    }
    this.onEditUpdate({
      savedCallPickup: this.savedCallPickup,
    });
  }

  public updateNumbers(member: IMember): void {
    _.forEach(member.checkboxes, (checkbox) => {
      const internalNumber = checkbox.numberUuid;
      if (checkbox.value === false) {
        _.remove(member.saveNumbers, (number) => {
          return number.uuid === internalNumber;
        });
        if (!this.isNew) {
          this.updateExistingCallPickup('remove');
        }
      } else if (!_.findKey(member.saveNumbers, { internalNumber: internalNumber.trim() })) {
        const saveNumber: ICallPickupNumbers = {
          uuid: checkbox.numberUuid,
          internalNumber: checkbox.label.split('&')[0].trim(),
        };
        member.saveNumbers.push(saveNumber);
        if (!this.isNew) {
          this.updateExistingCallPickup('select');
        }
      }
    });
    if (!this.CallPickupGroupService.verifyLineSelected(this.selectedMembers)) {
      this.Notification.error('callPickup.minMemberWarning');
    }
    this.onUpdate({
      member: this.selectedMembers,
      isValidMember: this.CallPickupGroupService.verifyLineSelected(this.selectedMembers),
    });
  }

  public getMemberType(member: Member): string {
    return this.FeatureMemberService.getMemberType(member);
  }

  public getMembersPictures(member): string {
    const index = _.findIndex(this.selectedMembers, mem => mem.member.uuid === member.uuid);
    if (index !== -1) {
      return this.selectedMembers[index].picturePath;
    } else {
      return '';
    }
  }

  public removeMember(member: IMember): void {
    if (member) {
      this.selectedMembers = _.reject(this.selectedMembers, member);
      this.onUpdate({
        member: this.selectedMembers,
        isValidMember: this.CallPickupGroupService.verifyLineSelected(this.selectedMembers),
      });
      if (!this.isNew) {
        this.updateExistingCallPickup('remove');
      }
    }
  }

  public getUserName(member: Member) {
    return this.FeatureMemberService.getUserName(member);
  }

  public getDisplayName(member: Member) {
    return this.FeatureMemberService.getFullNameFromMember(member);
  }

  public getDisplayNameOnCard(member: Member) {
    return this.FeatureMemberService.getDisplayNameFromMember(member);
  }
}

export class CallPickupMembersComponent implements ng.IComponentOptions {
  public controller = CallPickupMembersCtrl;
  public templateUrl = 'modules/call/features/call-pickup/call-pickup-members/call-pickup-members.component.html';
  public bindings = {
    onUpdate: '&',
    selectedMembers: '<',
    isNew: '<',
    savedCallPickup: '<',
    onEditUpdate: '&',
  };
}
