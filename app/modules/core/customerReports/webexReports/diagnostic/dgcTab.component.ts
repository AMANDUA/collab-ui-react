import './_dgc-meeting.scss';
import { SearchService } from './searchService';

class DgcTab implements ng.IComponentController {

  public tabs;
  public data: Object;
  public details: Object;
  public overview: Object;
  public featAndconn: Object;
  public loading: boolean = true;
  public backState: string = 'reports.webex-metrics.diagnostics';

  private timeZone: any;
  private conferenceID: string;

  /* @ngInject */
  public constructor(
    private SearchService: SearchService,
    private $stateParams: ng.ui.IStateParamsService,
    private $translate: ng.translate.ITranslateService,
  ) {
    this.conferenceID = _.get(this.$stateParams, 'cid');
    this.timeZone = this.SearchService.getStorage('timeZone');
  }

  public $onInit() {
    this.tabs = [
      {
        state: `dgc.tab.meetingdetail({cid: '${this.conferenceID}'})`,
        title: this.$translate.instant(`webexReports.meetingDetails`),
      },
      {
        state: `dgc.tab.participants({cid: '${this.conferenceID}'})`,
        title: this.$translate.instant(`webexReports.participants`),
      },
    ];
    this.getMeetingDetail();
  }

  private getMeetingDetail() {
    this.SearchService.getMeetingDetail(this.conferenceID)
    .then((res: any) => {
      const mbi = res.meetingBasicInfo;
      const details = _.assign({}, mbi, {
        status_: this.SearchService.getStatus(mbi.status),
        startTime_: this.timestampToDate(mbi.startTime, 'hh:mm'),
        duration_: moment.duration(mbi.duration * 1000).humanize(),
        startDate: this.timestampToDate(mbi.startTime, 'MMMM Do, YYYY'),
        endTime_: mbi.endTime ? this.timestampToDate(mbi.endTime, 'hh:mm') : '',
        endDate: mbi.endTime ? this.timestampToDate(mbi.endTime, 'MMMM Do, YYYY') : '',
      });
      const overview = _.assignIn({}, mbi, {
        duration_: moment.duration(mbi.duration * 1000).humanize(),
        endTime_: this.SearchService.utcDateByTimezone(mbi.endTime),
        startTime_: this.SearchService.utcDateByTimezone(mbi.startTime),
        createTime_: this.SearchService.utcDateByTimezone(mbi.createdTime),
      });
      const features = _.map(res.features, (val: string, key: string) => {
        const val_ = val ? 'yes' : 'no';
        return { key: this.$translate.instant('webexReports.meetingFeatures.' + key), val: this.$translate.instant('common.' + val_), class: val_ === 'yes' };
      });
      const connection = _.map(res.connection, (val: string, key: string) => {
        return { key: this.$translate.instant('webexReports.connectionFields.' + key), val: this.$translate.instant('common.' + val), class: val === 'yes' };
      });
      const featAndconn = _.assignIn(features, connection);
      this.data = _.assignIn({}, { overview: overview, featAndconn: featAndconn, startTime: mbi.startTime, endTime: mbi.endTime });
      this.SearchService.setStorage('webexOneMeeting', this.data);
      this.details = details;
      this.loading = false;
    });
  }

  private timestampToDate(timestamp, format): string {
    const offset = this.SearchService.getOffset(this.timeZone);
    return moment(timestamp).utc().utcOffset(offset).format(format);
  }
}

export class DgcTabComponent implements ng.IComponentOptions {
  public controller = DgcTab;
  public template = require('modules/core/customerReports/webexReports/diagnostic/dgcTab.html');
}
