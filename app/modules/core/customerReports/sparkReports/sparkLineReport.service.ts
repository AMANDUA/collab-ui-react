import { CommonReportService } from '../../partnerReports/commonReportServices/commonReport.service';
import { ReportConstants } from '../../partnerReports/commonReportServices/reportConstants.service';
import {
  IActiveTableBase,
  IActiveUserData,
  ITimespan,
  ITypeQuery,
} from '../../partnerReports/partnerReportInterfaces';

import {
  IActiveUserWrapper,
  IConversation,
  IConversationWrapper,
  IEndpointContainer,
  IEndpointData,
  IEndpointWrapper,
  IMediaData,
  IMetricsData,
} from './sparkReportInterfaces';

export class SparkLineReportService {
  private readonly SIMPLE_COUNT: string = 'simplecounts';

  // Promise Tracking
  private activeDeferred: ng.IDeferred<any>;
  private conversationsDeferred: ng.IDeferred<any>;
  private deviceDeferred: ng.IDeferred<any>;
  private mediaDeferred: ng.IDeferred<any>;
  private metricsDeferred: ng.IDeferred<any>;
  private mostActiveDeferred: ng.IDeferred<any>;

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private $q: ng.IQService,
    private CommonReportService: CommonReportService,
    private ReportConstants: ReportConstants,
    private chartColors,
  ) {}

  // Active User Data
  public getActiveUserData(filter: ITimespan): ng.IHttpPromise<IActiveUserWrapper> {
    // cancel any currently running jobs
    if (this.activeDeferred) {
      this.activeDeferred.resolve(this.ReportConstants.ABORT);
    }
    this.activeDeferred = this.$q.defer();

    let returnData: IActiveUserWrapper = {
      graphData: [],
      isActiveUsers: false,
    };

    let options: ITypeQuery = this.CommonReportService.getLineTypeOptions(filter, 'activeUsers', undefined);
    return this.CommonReportService.getCustomerActiveUserData(options, this.activeDeferred).then((response: any): IActiveUserWrapper => {
      let data = _.get(response, 'data.data');
      if (data) {
        return this.adjustActiveData(data, filter, returnData);
      } else {
        return returnData;
      }
    }).catch((error: any): IActiveUserWrapper => {
      return this.CommonReportService.returnErrorCheck(error, 'activeUsers.overallActiveUserGraphError', returnData);
    });
  }

  private adjustActiveData(activeData: any, filter: ITimespan, returnData: IActiveUserWrapper): IActiveUserWrapper {
    let emptyGraph: boolean = true;
    let graphItem: IActiveUserData = {
      date: '',
      totalRegisteredUsers: 0,
      activeUsers: 0,
      percentage: 0,
      balloon: true,
    };
    let returnGraph: Array<IActiveUserData> = this.CommonReportService.getReturnLineGraph(filter, graphItem);

    _.forEach(activeData, (item: any): void => {
      let date: string = this.CommonReportService.getModifiedLineDate(item.date);
      let details: any = _.get(item, 'details[0]');

      if (details) {
        let activeUsers: number = _.toInteger(details.combinedActiveUsers);
        let totalRegisteredUsers: number = _.toInteger(details.totalSparkEntitled);
        // totalRegisteredUsers should never be less than the number of activeUsers
        if (totalRegisteredUsers < activeUsers) {
          totalRegisteredUsers = activeUsers;
        }

        if (activeUsers > 0 || totalRegisteredUsers > 0) {
          _.forEach(returnGraph, (graphPoint) => {
            if (graphPoint.date === date) {
              graphPoint.totalRegisteredUsers = totalRegisteredUsers;
              graphPoint.activeUsers = activeUsers;
              graphPoint.percentage = this.CommonReportService.getPercentage(activeUsers, totalRegisteredUsers);
              emptyGraph = false;
            }
          });
        }
      }
    });

    if (!emptyGraph) {
      returnData.graphData = returnGraph;
      returnData.isActiveUsers = true;
    }
    return returnData;
  }

  // Most Active User Data
  public getMostActiveUserData(filter: ITimespan): ng.IPromise<Array<IActiveTableBase>> {
    // cancel any currently running jobs
    if (this.mostActiveDeferred) {
      this.mostActiveDeferred.resolve(this.ReportConstants.ABORT);
    }
    this.mostActiveDeferred = this.$q.defer();

    let deferred: ng.IDeferred<Array<IActiveTableBase>> = this.$q.defer();
    let responseArray: Array<IActiveTableBase> = [];
    let options: ITypeQuery = this.CommonReportService.getTypeOptions(filter, 'mostActive');
    this.CommonReportService.getCustomerActiveUserData(options, this.mostActiveDeferred).then((response: any): void => {
      let responseData: any = _.get(response, 'data.data');
      if (responseData) {
        _.forEach(responseData, (item: any): void => {
          let details: any = _.get(item, 'details', undefined);
          if (details) {
            responseArray.push({
              numCalls: _.toInteger(details.sparkCalls) + _.toInteger(item.details.sparkUcCalls),
              totalActivity: _.toInteger(details.totalActivity),
              sparkMessages: _.toInteger(details.sparkMessages),
              userName: details.userName,
            });
          }
        });
      }
      deferred.resolve(responseArray);
    }).catch((error: any): void => {
      deferred.reject(this.CommonReportService.returnErrorCheck(error, 'activeUsers.mostActiveError', responseArray));
    });

    return deferred.promise;
  }

  // Conversation Data
  public getConversationData(filter: ITimespan): ng.IHttpPromise<IConversationWrapper> {
    // cancel any currently running jobs
    if (this.conversationsDeferred) {
      this.conversationsDeferred.resolve(this.ReportConstants.ABORT);
    }
    this.conversationsDeferred = this.$q.defer();

    const graphItem: IConversation = {
      date: '',
      balloon: true,
      avgRooms: 0,
      contentShared: 0,
      contentShareSizes: 0,
      groupRooms: 0,
      oneToOneRooms: 0,
      totalRooms: 0,
    };

    let returnItem: IConversationWrapper = {
      array: this.CommonReportService.getReturnLineGraph(filter, graphItem),
      hasFiles: false,
      hasRooms: false,
    };

    let options: ITypeQuery = this.CommonReportService.getLineTypeOptions(filter, 'conversations', this.SIMPLE_COUNT);
    options.cache = false;
    return this.CommonReportService.getCustomerAltReportByType(options, this.activeDeferred).then((response: any): IConversationWrapper => {
      let data: Array<any> = _.get(response, 'data.data', []);

      _.forEach(data, (item: any): void => {
        let date: string = this.CommonReportService.getModifiedLineDate(item.date);
        let details: any = _.get(item, 'details');

        if (details) {
          _.forEach(returnItem.array, (graphItem: IConversation): void => {
            if (graphItem.date === date) {
              let totalRooms: number = _.toInteger(details.numRoomsCreated);
              let contentShared: number = _.toInteger(details.numSharedCount);

              if (totalRooms > 0) {
                graphItem.avgRooms = parseFloat(details.avgRoomsPerUser).toFixed(this.ReportConstants.FIXED);
                graphItem.groupRooms = _.toInteger(details.numGroupRooms);
                graphItem.oneToOneRooms = _.toInteger(details.numSingleRooms);
                graphItem.totalRooms = totalRooms;
                returnItem.hasRooms = true;
              }

              if (contentShared > 0) {
                graphItem.contentShared = contentShared;
                graphItem.contentShareSizes = parseFloat(details.sharedSize).toFixed(this.ReportConstants.FIXED);
                returnItem.hasFiles = true;
              }
            }
          });
        }
      });

      return returnItem;
    }).catch((error: any): IConversationWrapper => {
      return this.CommonReportService.returnErrorCheck(error, 'reportsPage.conversationError', returnItem);
    });
  }

  // Media Quality Data
  public getMediaQualityData(filter: ITimespan): ng.IHttpPromise<Array<IMediaData>> {
    // cancel any currently running jobs
    if (this.mediaDeferred) {
      this.mediaDeferred.resolve(this.ReportConstants.ABORT);
    }
    this.mediaDeferred = this.$q.defer();

    let options: ITypeQuery = this.CommonReportService.getLineTypeOptions(filter, 'callQuality', this.SIMPLE_COUNT);
    options.cache = false;
    return this.CommonReportService.getCustomerAltReportByType(options, this.mediaDeferred).then((response: any): Array<IMediaData> => {
      let data: any = _.get(response, 'data.data', []);
      let emptyGraph: boolean = true;
      let graphItem: IMediaData = {
        date: '',
        totalDurationSum: 0,
        goodQualityDurationSum: 0,
        fairQualityDurationSum: 0,
        poorQualityDurationSum: 0,
        partialSum: 0,
        totalAudioDurationSum: 0,
        goodAudioQualityDurationSum: 0,
        fairAudioQualityDurationSum: 0,
        poorAudioQualityDurationSum: 0,
        partialAudioSum: 0,
        totalVideoDurationSum: 0,
        goodVideoQualityDurationSum: 0,
        fairVideoQualityDurationSum: 0,
        poorVideoQualityDurationSum: 0,
        partialVideoSum: 0,
        balloon: true,
      };
      let graph: Array<IMediaData> = this.CommonReportService.getReturnLineGraph(filter, graphItem);

      _.forEach(data, (item: any): void => {
        const details: any = _.get(item, 'details');
        if (details) {
          const modifiedDate: string = this.CommonReportService.getModifiedDate(item.date, filter);
          const goodSum: number = _.toInteger(details.goodQualityDurationSum);
          const fairSum: number = _.toInteger(details.fairQualityDurationSum);
          const poorSum: number = _.toInteger(details.poorQualityDurationSum);
          if (goodSum > 0 || fairSum > 0 || poorSum > 0) {
            const goodVideoQualityDurationSum: number = _.toInteger(details.sparkGoodVideoDurationSum) + _.toInteger(details.sparkUcGoodVideoDurationSum);
            const fairVideoQualityDurationSum: number = _.toInteger(details.sparkFairVideoDurationSum) + _.toInteger(details.sparkUcFairVideoDurationSum);
            const poorVideoQualityDurationSum: number = _.toInteger(details.sparkPoorVideoDurationSum) + _.toInteger(details.sparkUcPoorVideoDurationSum);

            const goodAudioQualityDurationSum: number = goodSum - goodVideoQualityDurationSum;
            const fairAudioQualityDurationSum: number = fairSum - fairVideoQualityDurationSum;
            const poorAudioQualityDurationSum: number = poorSum - poorVideoQualityDurationSum;

            _.forEach(graph, (graphPoint): void => {
              if (graphPoint.date === modifiedDate) {
                graphPoint.totalDurationSum = goodSum + fairSum + poorSum;
                graphPoint.goodQualityDurationSum = goodSum;
                graphPoint.fairQualityDurationSum = fairSum;
                graphPoint.poorQualityDurationSum = poorSum;

                graphPoint.totalAudioDurationSum = goodAudioQualityDurationSum + fairAudioQualityDurationSum + poorAudioQualityDurationSum;
                graphPoint.goodAudioQualityDurationSum = goodAudioQualityDurationSum;
                graphPoint.fairAudioQualityDurationSum = fairAudioQualityDurationSum;
                graphPoint.poorAudioQualityDurationSum = poorAudioQualityDurationSum;

                graphPoint.totalVideoDurationSum = goodVideoQualityDurationSum + fairVideoQualityDurationSum + poorVideoQualityDurationSum;
                graphPoint.goodVideoQualityDurationSum = goodVideoQualityDurationSum;
                graphPoint.fairVideoQualityDurationSum = fairVideoQualityDurationSum;
                graphPoint.poorVideoQualityDurationSum = poorVideoQualityDurationSum;

                emptyGraph = false;
              }
            });
          }
        }
      });
      if (emptyGraph) {
        return [];
      } else {
        return graph;
      }
    }, (error): Array<IMediaData> => {
      return this.CommonReportService.returnErrorCheck(error, 'mediaQuality.customerError', []);
    });
  }

  // Call Metrics Services
  public getMetricsData(filter: ITimespan): ng.IHttpPromise<Array<IMetricsData>> {
    // cancel any currently running jobs
    if (this.metricsDeferred) {
      this.metricsDeferred.resolve(this.ReportConstants.ABORT);
    }
    this.metricsDeferred = this.$q.defer();

    let responseArray: Array<IMetricsData> = [];
    let defaultMetrics: IMetricsData = {
      dataProvider: [{
        callCondition: this.$translate.instant('callMetrics.audioCalls'),
        numCalls: 0,
        percentage: 0,
        color: this.chartColors.attentionBase,
      }, {
        callCondition: this.$translate.instant('callMetrics.videoCalls'),
        numCalls: 0,
        percentage: 0,
        color: this.chartColors.primaryBase,
      }],
      displayData: undefined,
      dummy: false,
    };

    let options: ITypeQuery = this.CommonReportService.getLineTypeOptions(filter, 'callMetrics', this.SIMPLE_COUNT);
    options.cache = false;
    return this.CommonReportService.getCustomerAltReportByType(options, this.metricsDeferred).then((response: any): Array<IMetricsData> => {
      let data: Array<any> = _.get(response, 'data.data', []);
      _.forEach(data, (dataItem: any): void => {
        let returnItem: IMetricsData = _.cloneDeep(defaultMetrics);
        let details: any = _.get(dataItem, 'details', undefined);

        if (details) {
          let totalCalls: number = _.toInteger(details.totalCalls);
          if (totalCalls > 0) {
            let audioCalls: number = _.toInteger(details.sparkUcAudioCalls);
            let successfulCalls: number = _.toInteger(details.totalSuccessfulCalls);
            let videoCalls: number = _.toInteger(details.sparkUcVideoCalls) + _.toInteger(details.sparkVideoCalls);

            returnItem.dataProvider[0].numCalls = audioCalls;
            returnItem.dataProvider[0].percentage = this.CommonReportService.getPercentage(audioCalls, successfulCalls);
            returnItem.dataProvider[1].numCalls = videoCalls;
            returnItem.dataProvider[1].percentage = this.CommonReportService.getPercentage(videoCalls, successfulCalls);

            returnItem.displayData = {
              totalCalls: totalCalls,
              totalAudioDuration: _.toInteger(details.totalAudioDuration),
              totalFailedCalls: _.toInteger(details.totalFailedCalls),
            };
          }
        }

        responseArray.unshift(returnItem);
      });

      return responseArray;
    });
  }

  // Registered Devices Data
  public getDeviceData(filter: ITimespan): ng.IHttpPromise<IEndpointContainer> {
    // cancel any currently running jobs
    if (this.deviceDeferred) {
      this.deviceDeferred.resolve(this.ReportConstants.ABORT);
    }
    this.deviceDeferred = this.$q.defer();
    let deviceArray: IEndpointContainer = {
      graphData: [{
        deviceType: this.ReportConstants.DEFAULT_ENDPOINT.label,
        graph: [],
        emptyGraph: true,
        balloon: true,
      }],
      filterArray: [this.ReportConstants.DEFAULT_ENDPOINT],
    };

    let options: ITypeQuery = this.CommonReportService.getLineTypeOptions(filter, 'devicecountsbytype', undefined);
    options.cache = false;
    return this.CommonReportService.getCustomerAltReportByType(options, this.deviceDeferred).then((response: any): IEndpointContainer => {
      return this.analyzeDeviceData(response, filter, deviceArray);
    }).catch((error: any): IEndpointContainer => {
      return this.CommonReportService.returnErrorCheck(error, 'registeredEndpoints.customerError', deviceArray);
    });
  }

  private analyzeDeviceData(response: any, filter: ITimespan, deviceArray: IEndpointContainer): IEndpointContainer {
    let data: Array<any> = _.get(response, 'data.data', []);
    let graphItem: IEndpointData = {
      date: '',
      totalRegisteredDevices: 0,
    };
    let defaultGraph: Array<IEndpointData> = this.CommonReportService.getReturnLineGraph(filter, graphItem);
    deviceArray.graphData[0].graph = _.cloneDeep(defaultGraph);

    _.forEach(data, (item: any, index: number): void => {
      deviceArray.filterArray.push({
        value: (index + 1),
        label: item.deviceType,
      });
      let tempGraph: IEndpointWrapper = {
        deviceType: item.deviceType,
        graph: _.cloneDeep(defaultGraph),
        emptyGraph: true,
        balloon: true,
      };

      _.forEach(item.details, (detail: string, date: string): void => {
        let registeredDevices: number = _.toInteger(detail);
        let modifiedDate: string = this.CommonReportService.getModifiedDate(date, filter);

        _.forEach(tempGraph.graph, (graphPoint: IEndpointData, index: number): void => {
          if (graphPoint.date === modifiedDate && (registeredDevices > 0)) {
            graphPoint.totalRegisteredDevices = registeredDevices;
            tempGraph.emptyGraph = false;

            deviceArray.graphData[0].graph[index].totalRegisteredDevices += registeredDevices;
            deviceArray.graphData[0].emptyGraph = false;
          }
        });
      });
      deviceArray.graphData.push(tempGraph);
    });
    return deviceArray;
  }
}

angular.module('Core')
  .service('SparkLineReportService', SparkLineReportService);
