export class NumberOfParticipant implements ng.IComponentOptions {
  public templateUrl = 'modules/mediafusion/reports/resources-reports/number-of-participant/number-of-participant.html';
  public bindings = {
    parentcntrl: '=',
  };
}
angular.module('Mediafusion').component('ucNumberOfParticipant', new NumberOfParticipant());
