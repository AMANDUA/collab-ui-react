import { Member } from 'modules/huron/members';
import { IMember, IPickupGroup, IMemberNumber, ICallPickupNumbers } from 'modules/huron/features/callPickup/services';
import { Notification } from 'modules/core/notifications';
import { CallPickupGroupService } from 'modules/huron/features/callPickup/services/callPickupGroup.service';
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
      .then(
        (members: Member[]) => {
          this.memberList = _.reject(members, mem => _.some(this.selectedMembers, member =>
          member.member.uuid === mem.uuid ));
          this.errorMemberInput = (this.memberList && this.memberList.length === 0);
          const scope = this;
          _.forEach(members, function(member) {
            scope.CallPickupGroupService.areAllLinesInPickupGroup(member)
            .then(
              (disabled: boolean) => {
                member['disabled'] = disabled;
              });
          });
          return this.memberList;
        });
    }
  }

  public selectMember(member: Member): void {
    const scope = this;
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
      this.CallPickupGroupService.getMemberNumbers(member.uuid)
      .then((memberNumbers: IMemberNumber[]) => {
        this.CallPickupGroupService.createCheckboxes(memberData, memberNumbers)
        .then(() => {
          scope.selectedMembers.push(memberData);
          if (!scope.isNew) {
            scope.updateExistingCallPickup('select');
          }
          scope.onUpdate({
            member: scope.selectedMembers,
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
      templateUrl: 'modules/huron/features/callPickup/callPickupMembers/callPickupLinesTaken.html',
      type: 'dialog',
      scope: modalScope,
    });
  }

  private updateExistingCallPickup(action: string) {
    const scope = this;
    let newSaveNumbers: any[];
    if (action === 'remove') {
      newSaveNumbers = [];
      _.forEach(scope.selectedMembers, function(member) {
        newSaveNumbers.push(_.map(member.saveNumbers, 'uuid'));
      });
      newSaveNumbers = _.flatten(newSaveNumbers);
      scope.savedCallPickup.numbers = newSaveNumbers;
    } else if (action === 'select') {
      newSaveNumbers = [];
      _.forEach(scope.selectedMembers, function(member) {
        _.forEach(member.saveNumbers, function(number){
          if (_.indexOf(scope.savedCallPickup.numbers, number.uuid) === -1) {
            scope.savedCallPickup.numbers.push(number.uuid);
          }
        });
      });
    }
    this.onEditUpdate({
      savedCallPickup: this.savedCallPickup,
    });
  }

  public updateNumbers(member: IMember): void {
    const scope = this;
    _.forEach( member.checkboxes, function(checkbox){
      const internalNumber = checkbox.label.split('&')[0].trim();
      if (checkbox.value === false) {
        _.remove( member.saveNumbers, function(number) {
          return number.internalNumber === internalNumber;
        });
        if (!scope.isNew) {
          scope.updateExistingCallPickup('remove');
        }
      } else if (!_.findKey(member.saveNumbers, { internalNumber: internalNumber.trim() })) {
        const saveNumber: ICallPickupNumbers = {
          uuid: checkbox.numberUuid,
          internalNumber: checkbox.label.split('&')[0].trim(),
        };
        member.saveNumbers.push(saveNumber);
        if (!scope.isNew) {
          scope.updateExistingCallPickup('select');
        }
      }
    });
    if (!this.CallPickupGroupService.verifyLineSelected(this.selectedMembers)) {
      scope.Notification.error('callPickup.minMemberWarning');
    }
    scope.onUpdate({
      member: scope.selectedMembers,
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
  public templateUrl = 'modules/huron/features/callPickup/callPickupMembers/callPickupMembers.html';
  public bindings = {
    onUpdate: '&',
    selectedMembers: '<',
    isNew: '<',
    savedCallPickup: '<',
    onEditUpdate: '&',
  };
}
