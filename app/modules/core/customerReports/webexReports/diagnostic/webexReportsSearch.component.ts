import * as moment from 'moment';
import { FeatureToggleService } from 'modules/core/featureToggle';
import { Notification } from 'modules/core/notifications';
import { KeyCodes } from 'modules/core/accessibility';
import { ProPackService } from 'modules/core/proPack/proPack.service';
import { SearchService, TrackingEventName } from './searchService';
import './_search.scss';

export interface IGridApiScope extends ng.IScope {
  gridApi?: uiGrid.IGridApi;
}

enum LimitDays {
  OneWeek = 7,
  OneMonth = 30,
}

class WebexReportsSearch implements ng.IComponentController {
  public gridData;
  public data: any;
  public gridOptions: {};
  public endDate: string;
  public timeZone: string;
  public startDate: string;
  public searchStr: any;
  public errMsg: any = {};
  public dateRange: any = {};
  public storeData: any = {};
  public isLoadingShow = false;
  public isDatePickerShow: boolean = false;

  private flag: boolean = true;
  private today: string;
  private email: string;
  private meetingNumber: string;

  /* @ngInject */
  public constructor(
    private Analytics,
    private $scope: IGridApiScope,
    private Notification: Notification,
    private $state: ng.ui.IStateService,
    private SearchService: SearchService,
    private $translate: ng.translate.ITranslateService,
    private ProPackService: ProPackService,
    private FeatureToggleService: FeatureToggleService,
  ) {
    this.gridData = [];
    this.timeZone = this.SearchService.getGuess('');
    this.errMsg = { search: '', datePicker: '' };
    this.searchStr = this.SearchService.getStorage('searchStr');
  }

  public $onInit(): void {
    this.ProPackService.hasProPackEnabled().then((isProPackEnabled: boolean): void => {
      if (isProPackEnabled) {
        this.FeatureToggleService.supports(this.FeatureToggleService.features.diagnosticF8234QueryRange)
          .then((isSupport: boolean) => {
            this.initDateRange(isSupport);
          });
        this.setGridOptions();
        this.Analytics.trackEvent(this.SearchService.featureName, {});
        if (this.searchStr) {
          this.startSearch();
        }
      } else {
        this.$state.go('login');
      }
    });
  }

  public showDetail(item) {
    this.SearchService.setStorage('webexMeeting', item);
    this.SearchService.setStorage('searchStr', this.searchStr);
    this.$state.go('dgc.tab.meetingdetail', { cid: item.conferenceID });
  }

  public onKeySearch($event: KeyboardEvent) {
    if ($event.which === KeyCodes.ENTER) {
      this.searchStr = _.trim(($event.target as HTMLInputElement).value);
      this.startSearch();
    }
  }

  public onBlur($event: KeyboardEvent) {
    this.searchStr = _.trim(($event.target as HTMLInputElement).value);
    if (this.searchStr === this.storeData.searchStr) {
      return ;
    }
    this.startSearch();
  }

  public onChangeDate() {
    this.dateRange.end = {
      lastEnableDate: this.endDate,
      firstEnableDate: this.startDate,
    };
    if (this.startDate === this.storeData.startDate && this.endDate === this.storeData.endDate) {
      return ;
    }
    this.errMsg.datePickerAriaLabel = '';
    this.errMsg.datePicker = '';
    this.storeData.endDate = this.endDate;
    this.storeData.startDate = this.startDate;
    if (moment(this.startDate).unix() > moment(this.endDate).unix()) {
      this.errMsg.datePickerAriaLabel = this.$translate.instant('webexReports.end-date-tooltip');
      this.errMsg.datePicker = `<i class="icon icon-warning"></i> ${this.errMsg.datePickerAriaLabel}`;
    }
    this.startSearch();
  }

  public onChangeTz(tz: string): void {
    this.timeZone = tz;
    this.SearchService.setStorage('timeZone', this.timeZone);
    _.forEach(this.gridData, (item) => {
      item.endTime_ = this.SearchService.utcDateByTimezone(item.endTime);
      item.startTime_ = this.SearchService.utcDateByTimezone(item.startTime);
    });
  }

  private initDateRange(isSupportQueryRange: boolean) {
    const calendarLimitDays = isSupportQueryRange ? LimitDays.OneMonth : LimitDays.OneWeek;
    this.today = moment().format('YYYY-MM-DD');
    this.startDate = moment().subtract(calendarLimitDays - 1, 'days').format('YYYY-MM-DD');

    this.endDate = this.today;
    this.storeData.endDate = this.endDate;
    this.storeData.startDate = this.startDate;
    this.dateRange.start = {
      lastEnableDate: this.endDate,
      firstEnableDate: this.startDate,
    };
    this.dateRange.end = this.dateRange.start;
  }

  private startSearch(): void {
    const digitaReg = /^([\d]{8,10}|([\d]{1,4}[\s]?){3})$/;
    const emailReg = /^[\w\d]([\w\d.-])+@([\w\d-])+\.([\w\d-]){2,}/;

    this.flag = false;
    this.gridData = [];
    this.errMsg.ariaLabel = '';
    this.errMsg.search = '';
    this.storeData.searchStr = this.searchStr;

    this.Analytics.trackEvent(TrackingEventName.MEETING_SEARCH);

    if ((!emailReg.test(this.searchStr) && !digitaReg.test(this.searchStr)) || this.searchStr === '') {
      this.errMsg.ariaLabel = this.$translate.instant('webexReports.searchError');
      this.errMsg.search = `<i class="icon icon-warning"></i> ${this.errMsg.ariaLabel}`;
      return ;
    }

    if (moment(this.startDate).unix() > moment(this.endDate).unix()) {
      return ;
    }

    this.flag = true;
    if (emailReg.test(this.searchStr)) {
      this.email = this.searchStr;
      this.meetingNumber = '';
    }

    if (digitaReg.test(this.searchStr) ) {
      this.email = '';
      this.meetingNumber = this.searchStr;
    }
    this.setGridData();
  }

  private setGridData(): void {
    const endDate = this.isDatePickerShow ? moment(this.endDate + ' ' + moment().format('HH:mm:ss')).utc().format('YYYY-MM-DD') : this.today;
    const startDate = this.isDatePickerShow ? moment(this.startDate + ' ' + moment().format('HH:mm:ss')).utc().format('YYYY-MM-DD') : this.startDate;
    const data = {
      endDate : endDate,
      email: this.email,
      startDate: startDate,
      meetingNumber: this.meetingNumber.replace(/\s/g, ''),
    };
    this.gridData = [];
    this.isLoadingShow = true;

    this.SearchService.getMeetings(data)
      .then((res) => {
        _.forEach(res, (item) => {
          item.status_ = this.SearchService.getStatus(item.status);
          item.Duration = this.SearchService.getDuration(item.duration);
          item.endTime_ = this.SearchService.utcDateByTimezone(item.endTime) ;
          item.startTime_ = this.SearchService.utcDateByTimezone(item.startTime);
        });
        this.isLoadingShow = false;
        this.gridData = this.flag ? res : [];
      })
      .catch((err) => {
        this.Notification.errorResponse(err, 'errors.statusError', { status: err.status });
        this.isLoadingShow = false;
      });
  }

  private setGridOptions(): void {
    const columnDefs = [{
      width: '13%',
      cellTooltip: true,
      field: 'conferenceID',
      displayName: this.$translate.instant('webexReports.searchGridHeader.conferenceID'),
    }, {
      width: '14%',
      field: 'meetingNumber',
      displayName: this.$translate.instant('webexReports.meetingNumber'),
    }, {
      cellTooltip: true,
      field: 'meetingName',
      displayName: this.$translate.instant('webexReports.searchGridHeader.meetingName'),
    }, {
      width: '16%',
      sortable: true,
      cellTooltip: true,
      field: 'startTime_',
      displayName: this.$translate.instant('webexReports.searchGridHeader.startTime'),
    }, {
      width: '9%',
      field: 'Duration',
      cellClass: 'text-right',
      displayName: this.$translate.instant('webexReports.duration'),
    }, {
      width: '12%',
      field: 'hostName',
      displayName: this.$translate.instant('webexReports.hostName'),
    }, {
      width: '8%',
      cellClass: 'text-center',
      field: 'numberOfParticipants',
      headerCellTemplate: `<div class="aaaaa" ng-class="{ \'sortable\': sortable }">
      <div class="ui-grid-cell-contents" col-index="renderIndex">
      <span>Number of <br>Participants</span>
      <span ui-grid-visible="col.sort.direction">
      <i ng-class="{ \'ui-grid-icon-up-dir\': col.sort.direction === asc, \'ui-grid-icon-down-dir\': col.sort.direction == desc, \'ui-grid-icon-blank\': !col.sort.direction }"></i>
      </span></div></div>`,
    }, {
      width: '7%',
      sortable: true,
      field: 'status_',
      displayName: this.$translate.instant('webexReports.searchGridHeader.status'),
      cellTemplate: require('modules/core/customerReports/webexReports/diagnostic/webexMeetingStatus.html'),
    }];

    this.gridOptions = {
      rowHeight: 45,
      data: '$ctrl.gridData',
      multiSelect: false,
      columnDefs: columnDefs,
      enableRowSelection: true,
      enableColumnMenus: false,
      enableColumnResizing: true,
      enableRowHeaderSelection: false,
      enableVerticalScrollbar: 0,
      enableHorizontalScrollbar: 0,
      onRegisterApi: (gridApi) => {
        gridApi.selection.on.rowSelectionChanged(this.$scope, (row) => {
          this.showDetail(row.entity);
        });
      },
    };
  }
}

export class DgcWebexReportsSearchComponent implements ng.IComponentOptions {
  public controller = WebexReportsSearch;
  public template = require('modules/core/customerReports/webexReports/diagnostic/webexReportsSearch.html');
}