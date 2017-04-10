import { LineService } from './line.service';

export * from './line.service';
export * from './line';

export default angular
  .module('huron.line-services', [
    require('angular-resource'),
    require('modules/core/scripts/services/authinfo'),
    require('modules/huron/telephony/telephonyConfig'),
  ])
  .service('LineService', LineService)
  .name;
