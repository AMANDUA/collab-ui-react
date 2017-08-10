import * as HttpStatus from 'http-status-codes';

interface IRetryHttpConfig extends ng.IRequestConfig {
  retryConfig: RetryConfig;
}

class RetryConfig {
  public baseMultiplier = 1;
  public isLastRetry = false;
}

export class RateLimitService {
  private readonly MIN_DELAY = 100; // 100ms
  private readonly MAX_DELAY = 15000; // 15s
  private readonly FACTOR = 2;
  private readonly HAS_JITTER = true;

  private readonly RETRY_AFTER_HEADER = 'Retry-After';

  private readonly THROTTLED_STATUS_CODES = [
    HttpStatus.TOO_MANY_REQUESTS,
    HttpStatus.SERVICE_UNAVAILABLE,
  ];

  /* @ngInject */
  constructor(
    private $http: ng.IHttpService,
    private $q: ng.IQService,
    private $timeout: ng.ITimeoutService,
  ) {}

  public hasBeenThrottled(response): boolean {
    return _.includes(this.THROTTLED_STATUS_CODES, _.get(response, 'status'));
  }

  public retryThrottledResponse(response: ng.IHttpPromiseCallbackArg<any>) {
    const config = _.get<IRetryHttpConfig>(response, 'config');
    if (!config) {
      return this.$q.reject(response);
    }
    if (!config.retryConfig) {
      config.retryConfig = new RetryConfig();
    }
    if (config.retryConfig.isLastRetry) {
      return this.$q.reject(response);
    }
    const retryAfterValue = _.isFunction(response.headers) && response.headers(this.RETRY_AFTER_HEADER);
    return this.retryExponentialBackoff(config, _.toNumber(retryAfterValue));
  }

  private retryExponentialBackoff(config: IRetryHttpConfig, retryAfterInSeconds: number) {
    const retryAfterInMillis = _.isNaN(retryAfterInSeconds) ? 0 : retryAfterInSeconds * 1000;
    const delayInMillis = this.calculateBackoffDelay(config, retryAfterInMillis);
    config.retryConfig.isLastRetry = delayInMillis >= this.MAX_DELAY;
    return this.delayHttpRequest(config, delayInMillis);
  }

  private calculateBackoffDelay(config: IRetryHttpConfig, retryAfterInMillis: number) {
    // jitter background: https://www.awsarchitectureblog.com/2015/03/backoff.html
    const randomMultiplier = this.HAS_JITTER ? Math.random() + 1 : 1;
    const calculatedBackoff = Math.round(this.MIN_DELAY * randomMultiplier * config.retryConfig.baseMultiplier);
    config.retryConfig.baseMultiplier *= this.FACTOR;
    if (calculatedBackoff > retryAfterInMillis) {
      return Math.min(this.MAX_DELAY, calculatedBackoff);
    } else {
      return this.calculateBackoffDelay(config, retryAfterInMillis);
    }
  }

  private delayHttpRequest(config: ng.IRequestConfig, delayInMillis: number) {
    return this.$timeout(() => this.$http(config), delayInMillis);
  }

}
