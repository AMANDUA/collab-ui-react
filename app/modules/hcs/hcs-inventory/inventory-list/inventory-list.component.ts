interface IInventoryObject {
  id: string;
  name?: string;
  status: string;
  type: string;
}
interface IFilterObject {
  value?: any;
  label: string | undefined;
  menu?: any;
  isSelected?: boolean;
}
interface IFilterComponent {
  selected: IFilterObject[];
  placeholder: string;
  singular: string;
  plural: string;
  options: IFilterObject[];
}

export class InventoryListComponent implements ng.IComponentOptions {
  public controller = InventoryListCtrl;
  public template = require('./inventory-list.component.html');
}

export class InventoryListCtrl implements ng.IComponentController {
  private timer;
  private timeoutVal: number;
  private tempFilterOptions: (string| undefined)[];

  public inventoryList: IInventoryObject[] = [];
  public inventoryListData: IInventoryObject[] = [];
  public currentSearchString: string = '';

  public filter: IFilterComponent = {
    selected: [],
    placeholder: this.$translate.instant('customerPage.filters.placeholder'),
    singular: this.$translate.instant('customerPage.filters.filter'),
    plural: this.$translate.instant('customerPage.filters.filters'),
    options: [],
  };

  /* @ngInject */
  constructor(
    private $translate: ng.translate.ITranslateService,
    private $timeout: ng.ITimeoutService,
    private $state: ng.ui.IStateService,
  ) {
    this.timer = 0;
    this.timeoutVal = 1000;
  }

  public $onInit(): void {
    this.inventoryList.push({
      id: 'ax1234b',
      type: 'unassigned',
      status: 'Needs Assigned',
    }, {
      id: '910fe34f-2bc8-42e8-8db2-22ae6e3ec54d',
      name: 'Shravan_Test_1',
      type: 'custGroup',
      status: 'Software update needed',
    }, {
      id: '7eab0dd8-5fe2-4206-8702-5f9de3584ba2',
      name: 'Jeff\'s Testing Company',
      type: 'custGroup',
      status: 'Operational',
    }, {
      id: 'ax12345',
      name: 'Mary\'s Bar',
      type: 'custGroup',
      status: 'Operational',
    }, {
      id: 'ax1236r',
      name: 'Roger\'s Burgers',
      type: 'custGroup',
      status: 'Agent Offline',
    }, {
      id: 'ax1235m',
      name: 'Jays BBQ',
      type: 'custGroup',
      status: 'Operational',
    }, {
      id: 'ax1239x',
      name: 'Wally World',
      type: 'custGroup',
      status: 'Operational',
    }, {
      id: 'ax1249y',
      name: 'Target',
      type: 'custGroup',
      status: 'Nodes need Accepted',
    });
    this.inventoryListData = this.inventoryList;
    this.tempFilterOptions = _.uniq(this.inventoryList.map(item => _.get(item, 'status')));
    this.tempFilterOptions.map(filterOption => {
      this.filter.options.push({
        value: filterOption,
        label: filterOption,
      });
    });
  }

  public searchInventoryFunction(str): void {
    if (this.timer) {
      this.$timeout.cancel(this.timer);
      this.timer = 0;
    }

    this.timer = this.$timeout(() => {
      if (str) {
        this.currentSearchString = str;
      } else {
        this.currentSearchString = '';
      }
      this.searchFilterFunction();
    }, this.timeoutVal);
  }

  public searchFilterFunction(): void {
    //to start search either filter should be added or search string should be greater than 2.
    if (this.filter.selected.length >= 1 || this.currentSearchString.length > 1) {
      this.inventoryListData = this.inventoryList.filter(inventory => {
        let present: boolean = false;
        // if only filter and no search
        if (this.filter.selected.length >= 1 && this.currentSearchString.length === 0) {
          if (_.find(this.filter.selected, (selected) => selected.value === inventory.status)) {
            present = true;
          }
        } else if (this.filter.selected.length === 0 && this.currentSearchString.length > 1) {
          // if only search and no filter
          const inventoryName = _.get(inventory, 'name', 'Unassigned');
          present = _.includes(inventoryName.toLowerCase(), this.currentSearchString.toLowerCase());
        } else {
          // if both search and filter
          const inventoryName = _.get(inventory, 'name', 'Unassigned');
          if (_.find(this.filter.selected, (selected) => selected.value === inventory.status && _.includes(inventoryName.toLowerCase(), this.currentSearchString.toLowerCase()))) {
            present = true;
          }
        }
        return present;
      });
    } else {
      //else return entire dataset
      this.inventoryListData = this.inventoryList;
    }
  }

  public onClickSettings(inventoryId): void {
    const selectedInventory = this.inventoryListData.filter(inventory => inventory.id === inventoryId);
    if (selectedInventory[0].type === 'custGroup' || selectedInventory[0].type === 'unassigned') {
      this.$state.go('hcs.clusterList', { groupId: inventoryId,  groupType: selectedInventory[0].type });
    }
  }
}
