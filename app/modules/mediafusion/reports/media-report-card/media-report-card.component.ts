export class MediaReportCard implements ng.IComponentOptions {
  public templateUrl = 'modules/mediafusion/reports/media-report-card/media-report-card.html';
  public bindings = < { [binding: string]: string } > {
    parentcntrl: '=',
    headername: '=',
    value: '<',
    headercolor: '<',
    tooltipOptions: '<',
    footerOptions: '<',
    chartOptions: '<',
    cardClass: '=',
  };
}
angular.module('Mediafusion').component('ucMediaReportCard', new MediaReportCard());
