import { ITask } from './user-task-manager.component';
import { TaskStatus } from './user-task-manager.constants';
import { IErrorItem } from './csv-upload-results.component';

export interface IPaging {
  count: number;
  limit: number;
  offset: number;
  pages: number;
  prev: any[];
  next: any[];
}

export interface IGetTasksResponse {
  items: ITask[];
  paging: IPaging;
}

export interface IGetFileUrlResponse {
  tempUrl: string;
  uniqueFileName: string;
}

export interface IGetTaskErrorsResponse {
  items: IErrorItem[];
  paging: IPaging;
}

export interface IGetUserResponse {
  displayName: string;
  userName: string;
}

interface IntervalTypeOf<T> {
  detail: T;
  list: T;
  running: T;
}

type IntervalType = keyof IntervalTypeOf<any>;

enum IntervalDelay {
  SHORT = 5000,   // 5 sec
  MEDIUM = 30000, // 30 sec
  LONG = 120000,  // 2 min
}

export class UserTaskManagerService {
  public IntervalDelay = IntervalDelay;

  private interval: IntervalTypeOf<ng.IPromise<ITask> | undefined> = {
    detail: undefined,
    list: undefined,
    running: undefined,
  };

  private intervalCallbacks: IntervalTypeOf<Function[]> = {
    detail: [],
    list: [],
    running: [],
  };

  private intervalInProgress: IntervalTypeOf<boolean> = {
    detail: false,
    list: false,
    running: false,
  };

  private intervalDelay: IntervalTypeOf<number> = {
    detail: IntervalDelay.SHORT,
    list: IntervalDelay.MEDIUM,
    running: IntervalDelay.LONG,
  };

  private intervalFunction: IntervalTypeOf<(() => ng.IPromise<any>) | undefined> = {
    detail: undefined,
    list: undefined,
    running: undefined,
  };

  /* @ngInject */
  constructor(
    private $http: ng.IHttpService,
    private $interval: ng.IIntervalService,
    private Authinfo,
    private UrlConfig,
  ) {}

  public getTasks(): ng.IPromise<ITask[]> {
    return this.$http<IGetTasksResponse>({
      method: 'GET',
      url: this.USER_ONBOARD_URL,
    }).then(response => response.data.items);
  }

  public getInProcessTasks(): ng.IPromise<ITask[]> {
    return this.$http<IGetTasksResponse>({
      method: 'GET',
      url: this.USER_ONBOARD_URL,
      params: {
        status: 'CREATED,STARTING,STARTED,STOPPING',
      },
    }).then(response => response.data.items);
  }

  public getTask(jobInstanceId: string): ng.IPromise<ITask> {
    return this.$http<ITask>({
      method: 'GET',
      url: this.getJobSpecificUrl(jobInstanceId),
    }).then(response => response.data);
  }

  public submitCsvImportTask(fileName: string, fileData: string, exactMatchCsv: boolean): ng.IPromise<ITask> {
    // submit a CSV file import task procedure:
    // 1. get Swift file location
    // 2. upload CSV file to Swift
    // 3. create and start the Kafka job
    return this.getFileUrl(fileName)
      .then(fileUploadObject => {
        return this.uploadToFileStorage(fileUploadObject, fileData)
          .then(() => this.submitCsvImportJob(fileUploadObject, exactMatchCsv));
      });
  }

  public getUserDisplayAndEmail(userId: string): ng.IPromise<string> {
    const scimUrl = `${this.UrlConfig.getScimUrl(this.Authinfo.getOrgId())}/${userId}`;
    return this.$http.get<IGetUserResponse>(scimUrl)
      .then(response => `${response.data.displayName} (${response.data.userName})`);
  }

  public getDateAndTime(isoDate: string) {
    const date = moment(isoDate);
    const isDateValid = date.isValid();
    return {
      date: isDateValid ? date.format('ll') : '',
      time: isDateValid ? date.format('LT') : '',
    };
  }

  public isTaskPending(status: string): boolean {
    return status === TaskStatus.CREATED ||
           status === TaskStatus.STARTED ||
           status === TaskStatus.STARTING ||
           status === TaskStatus.STOPPING;
  }

  public isTaskInProcess(status: string): boolean {
    return status === TaskStatus.STARTED ||
           status === TaskStatus.STARTING ||
           status === TaskStatus.STOPPING;
  }

  public isTaskError(status: string): boolean {
    return status === TaskStatus.COMPLETED_WITH_ERRORS ||
           status === TaskStatus.FAILED;
  }

  public isTaskCanceled(status: string): boolean {
    return status === TaskStatus.ABANDONED;
  }

  public cancelTask(jobInstanceId: string): ng.IPromise<ng.IHttpResponse<{}>> {
    const postReq: ng.IRequestConfig = {
      method: 'POST',
      url: this.getJobSpecificUrl(jobInstanceId, '/actions/abandon/invoke'),
    };
    return this.$http(postReq);
  }

  public pauseTask(jobInstanceId: string): ng.IPromise<ng.IHttpResponse<{}>> {
    const postReq: ng.IRequestConfig = {
      method: 'POST',
      url: this.getJobSpecificUrl(jobInstanceId, '/actions/pause/invoke'),
    };
    return this.$http(postReq);
  }

  public resumeTask(jobInstanceId: string): ng.IPromise<ng.IHttpResponse<{}>> {
    const postReq: ng.IRequestConfig = {
      method: 'POST',
      url: this.getJobSpecificUrl(jobInstanceId, '/actions/resume/invoke'),
    };
    return this.$http(postReq);
  }

  private getFileUrl(fileName: string): ng.IPromise<IGetFileUrlResponse> {
    return this.$http<IGetFileUrlResponse>({
      method: 'GET',
      url: `${this.UrlConfig.getAdminServiceUrl()}csv/organizations/${this.Authinfo.getOrgId()}/uploadurl`,
      params: {
        filename: fileName,
      },
    }).then(response => response.data);
  }

  private uploadToFileStorage(fileUploadObject: IGetFileUrlResponse, fileData: string): ng.IPromise<ng.IHttpResponse<{}>> {
    const uploadReq: ng.IRequestConfig = {
      method: 'PUT',
      url: fileUploadObject.tempUrl,
      headers: {
        'Content-Type': 'text/csv',
      },
      data: fileData,
    };
    return this.$http(uploadReq);
  }

  private submitCsvImportJob(fileUploadObject: IGetFileUrlResponse, exactMatchCsv: boolean): ng.IPromise<ITask> {
    const taskReq: ng.IRequestConfig = {
      method: 'POST',
      url: this.USER_ONBOARD_URL,
      data: {
        exactMatchCsv: exactMatchCsv,
        csvFile: fileUploadObject.uniqueFileName,
        useLocalFile: false,
      },
    };
    return this.$http<ITask>(taskReq)
      .then(response => response.data);
  }

  public getTaskErrors(jobInstanceId: string, cancelPromise: ng.IPromise<void>): ng.IPromise<IErrorItem[]> {
    return this.$http<IGetTaskErrorsResponse>({
      method: 'GET',
      url: this.getJobSpecificUrl(jobInstanceId, '/errors'),
      timeout: cancelPromise,
    }).then(response => response.data.items);
  }

  public initTaskDetailPolling(jobInstanceId: string, callback: Function, scope: ng.IScope) {
    return this.initTaskPolling('detail', () => this.getTask(jobInstanceId), callback, scope);
  }

  public initRunningTaskListPolling(callback: Function, scope: ng.IScope) {
    return this.initTaskPolling('running', () => this.getInProcessTasks(), callback, scope);
  }

  public initAllTaskListPolling(callback: Function, scope: ng.IScope) {
    return this.initTaskPolling('list', () => this.getTasks(), callback, scope);
  }

  public changeRunningTaskListPolling(newDelay: number) {
    return this.changeTaskPollingDelay('running', newDelay);
  }

  public changeAllTaskListPolling(newDelay: number) {
    return this.changeTaskPollingDelay('list', newDelay);
  }

  public cleanupTaskDetailPolling(callback: Function) {
    return this.cleanupTaskPolling('detail', callback);
  }

  public cleanupRunningTaskListPolling(callback: Function) {
    return this.cleanupTaskPolling('running', callback);
  }

  public cleanupAllTaskListPolling(callback: Function) {
    return this.cleanupTaskPolling('list', callback);
  }

  private changeTaskPollingDelay(intervalType: IntervalType, newDelay: number) {
    const interval = this.interval[intervalType];
    const intervalFunction = this.intervalFunction[intervalType];
    const oldDelay = this.intervalDelay[intervalType];
    if (newDelay === oldDelay || !interval || !intervalFunction) {
      return;
    }

    this.$interval.cancel(interval);
    this.interval[intervalType] = undefined;
    this.intervalDelay[intervalType] = newDelay;
    this.initInterval(intervalType);
  }

  private initTaskPolling(intervalType: IntervalType, intervalFunction: () => ng.IPromise<any>, callback: Function, scope: ng.IScope) {
    const interval = this.interval[intervalType];
    const intervalCallbacks = this.intervalCallbacks[intervalType];
    this.intervalFunction[intervalType] = intervalFunction;

    if (!_.includes(intervalCallbacks, callback)) {
      intervalCallbacks.push(callback);
    }

    scope.$on('$destroy', () => this.cleanupTaskPolling(intervalType, callback));

    if (interval) {
      return;
    }

    this.doIntervalFunction(intervalType);
    this.initInterval(intervalType);
  }

  private initInterval(intervalType: IntervalType) {
    this.interval[intervalType] = this.$interval(() => {
      if (this.intervalInProgress[intervalType]) {
        return;
      }
      this.doIntervalFunction(intervalType);
    }, this.intervalDelay[intervalType]);
  }

  private doIntervalFunction(intervalType: IntervalType) {
    const intervalFunction = this.intervalFunction[intervalType];
    if (!_.isFunction(intervalFunction)) {
      return;
    }

    this.intervalInProgress[intervalType] = true;
    intervalFunction()
      .then((...args) => _.forEach(this.intervalCallbacks[intervalType], intervalCallback => intervalCallback(...args)))
      .finally(() => this.intervalInProgress[intervalType] = false);
  }

  private cleanupTaskPolling(intervalType: IntervalType, callback: Function) {
    const interval = this.interval[intervalType];
    const intervalCallbacks = this.intervalCallbacks[intervalType];
    _.pull(intervalCallbacks, callback);

    if (intervalCallbacks.length === 0 && interval) {
      this.$interval.cancel(interval);
      this.interval[intervalType] = undefined;
    }
  }

  private get USER_ONBOARD_URL() {
    return `${this.UrlConfig.getAdminBatchServiceUrl()}/customers/${this.Authinfo.getOrgId()}/jobs/general/useronboard`;
  }

  private getJobSpecificUrl(jobInstanceId: string, additionalPath: string = '') {
    return `${this.USER_ONBOARD_URL}/${encodeURIComponent(jobInstanceId)}${additionalPath}`;
  }
}
