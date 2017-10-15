import { DevicesCtrl } from './devices.controller';
import { DeviceSearchComponent } from './deviceSearch.component';
import { DeviceListComponent } from './deviceList.component';
import { ChartComponent } from './chart.component';
import { highlightFilter, highlightSearchFilter } from './highlightFilter';

export default angular
  .module('Csdm.devices', [
    'Csdm.services',
    require('angular-resource'),
  ])
  .component('deviceSearch', new DeviceSearchComponent())
  .component('deviceList', new DeviceListComponent())
  .component('deviceChart', new ChartComponent())
  .controller('DevicesReduxCtrl', DevicesCtrl)
  .filter('highlightSearch', highlightSearchFilter())
  .filter('highlight', highlightFilter)
  .name;
