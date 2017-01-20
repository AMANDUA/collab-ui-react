import { ReportConstants } from './commonReportServices/reportConstants.service';
import {
  IActiveUserData,
  ICallMetricsData,
  IEndpointData,
  IMediaQualityData,
  IPopulationData,
  IReportsCustomer,
  ITimespan,
} from './partnerReportInterfaces';

export class DummyReportService {
  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private ReportConstants: ReportConstants,
    private chartColors,
  ) {}

  private getTimeAndOffset(filter: ITimespan, index) {
    let offset = this.ReportConstants.DAYS - index;
    let date: string = moment().subtract(index + 1, this.ReportConstants.DAY).format(this.ReportConstants.DAY_FORMAT);
    if (filter.value === this.ReportConstants.MONTH_FILTER.value) {
      offset = this.ReportConstants.WEEKS - index;
      date = moment().startOf(this.ReportConstants.WEEK).subtract(1 + (index * 7), this.ReportConstants.DAY).format(this.ReportConstants.DAY_FORMAT);
    } else if (filter.value === this.ReportConstants.THREE_MONTH_FILTER.value) {
      offset = this.ReportConstants.MONTHS - index;
      date = moment().subtract(index, this.ReportConstants.MONTH).format(this.ReportConstants.MONTH_FORMAT);
    }

    return {
      date: date,
      offset: offset,
    };
  }

  public dummyActiveUserData (filter: ITimespan): Array<IActiveUserData> {
    let dummyGraph: Array<IActiveUserData> = [];

    if (filter.value === this.ReportConstants.WEEK_FILTER.value) {
      for (let i = this.ReportConstants.DAYS; i >= 0; i--) {
        dummyGraph.push(this.getActiveUserDatapoint(filter, i));
      }
    } else if (filter.value === this.ReportConstants.MONTH_FILTER.value) {
      for (let x = this.ReportConstants.WEEKS; x >= 0; x--) {
        dummyGraph.push(this.getActiveUserDatapoint(filter, x));
      }
    } else {
      for (let y = this.ReportConstants.MONTHS; y >= 0; y--) {
        dummyGraph.push(this.getActiveUserDatapoint(filter, y));
      }
    }

    return dummyGraph;
  }

  private getActiveUserDatapoint(filter: ITimespan, index): IActiveUserData {
    let timeAndOffset = this.getTimeAndOffset(filter, index);
    let totalRegisteredUsers = 25 + (25 * timeAndOffset.offset);
    let activeUsers = 25 * timeAndOffset.offset;

    return {
      date: timeAndOffset.date,
      totalRegisteredUsers: totalRegisteredUsers,
      activeUsers: activeUsers,
      percentage: Math.round((activeUsers / totalRegisteredUsers) * 100),
      balloon: false,
    };
  }

  public dummyActivePopulationData(customers: Array<IReportsCustomer>): Array<IPopulationData> {
    let loadingCustomer = this.$translate.instant('activeUserPopulation.loadingCustomer');

    if (customers && customers.length > 0) {
      let returnArray: Array<IPopulationData> = [];
      for (let index = 0; index < customers.length; index ++) {
        returnArray.push(this.getActivePopulationDatapoint(loadingCustomer, index));
      }
      return returnArray;
    } else {
      return [this.getActivePopulationDatapoint(loadingCustomer, 0)];
    }
  }

  private getActivePopulationDatapoint(name: string, index): IPopulationData {
    return {
      customerName: name,
      percentage: 85 - (index * 10),
      overallPopulation: 50,
      color: this.chartColors.grayLightFour,
      balloon: false,
      labelColorField: this.chartColors.grayLightTwo,
    };
  }

  public dummyMediaQualityData(filter: ITimespan): Array<IMediaQualityData> {
    let dummyGraph: Array<IMediaQualityData> = [];

    if (filter.value === this.ReportConstants.WEEK_FILTER.value) {
      for (let i = this.ReportConstants.DAYS; i >= 0; i--) {
        dummyGraph.push(this.getMediaDatapoint(filter, i));
      }
    } else if (filter.value === this.ReportConstants.MONTH_FILTER.value) {
      for (let x = this.ReportConstants.WEEKS; x >= 0; x--) {
        dummyGraph.push(this.getMediaDatapoint(filter, x));
      }
    } else {
      for (let y = this.ReportConstants.MONTHS; y >= 0; y--) {
        dummyGraph.push(this.getMediaDatapoint(filter, y));
      }
    }

    return dummyGraph;
  }

  private getMediaDatapoint(filter: ITimespan, index): IMediaQualityData {
    let timeAndOffset = this.getTimeAndOffset(filter, index);
    let goodQualityDurationSum = 25 + (15 * timeAndOffset.offset);
    let fairQualityDurationSum = 15 + (10 * timeAndOffset.offset);
    let poorQualityDurationSum = 5 + (5 * timeAndOffset.offset);

    return {
      date: timeAndOffset.date,
      totalDurationSum: goodQualityDurationSum + fairQualityDurationSum + poorQualityDurationSum,
      partialSum: fairQualityDurationSum + poorQualityDurationSum,
      goodQualityDurationSum: goodQualityDurationSum,
      fairQualityDurationSum: fairQualityDurationSum,
      poorQualityDurationSum: poorQualityDurationSum,
      balloon: false,
    };
  }

  public dummyCallMetricsData(): ICallMetricsData {
    return {
      dataProvider: [{
        label: this.$translate.instant('callMetrics.callConditionFail'),
        value: 200,
        color: this.chartColors.grayLightThree,
      }, {
        label: this.$translate.instant('callMetrics.callConditionSuccessful'),
        value: 800,
        color: this.chartColors.grayLightFour,
      }],
      labelData: {
        numTotalCalls: 1000,
        numTotalMinutes: 1800,
      },
      dummy: true,
    };
  }

  public dummyEndpointData(): Array<Array<IEndpointData>> {
    return [[{
      class: 'vertical-center customer-data',
      output: [this.$translate.instant('activeUserPopulation.loadingCustomer')],
      splitClasses: undefined,
    }, {
      class: 'table-data',
      output: ['0', '0'],
      splitClasses: 'table-half vertical-center horizontal-center',
    }, {
      class: 'vertical-center horizontal-center',
      output: ['0'],
      splitClasses: undefined,
    }, {
      class: 'vertical-center horizontal-center',
      output: ['0'],
      splitClasses: undefined,
    }]];
  }
}

angular.module('Core')
  .service('DummyReportService', DummyReportService);
