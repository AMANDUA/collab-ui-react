import { BucketData, SearchResult } from './searchResult';
import { List } from 'lodash';
import { SearchElement } from './queryParser';

export interface ISuggestion {
  searchString: string;
  field: string;
  text: string;
  count?: number;
}

export interface ISuggestionDropdown {
  suggestions: ISuggestion[];
  uiSuggestions: ISuggestion[];

  showEmpty(): void;

  updateBasedOnInput(searchInput: string): void;

  setActiveSuggestion(suggestionId: number): void;

  getActiveSuggestion(): ISuggestion | null;

  resetActive(): void;

  isSuggestionActive(index: number): boolean;

  nextSuggestion(): void;

  previousSuggestion(): void;

  getSuggestionById(suggestionId: number): ISuggestion | null;

  updateSuggestionsBasedOnSearchResult(docCountFunc: (searchResult: SearchResult | undefined, aggregation: string, bucketName: string) => number,
                                       searchResult: SearchResult | undefined,
                                       searchInput: string): void;
  onSearchChanged(searchElements: SearchElement[]);
}

export class SuggestionDropdown implements ISuggestionDropdown {
  public suggestions: ISuggestion[] = SuggestionsHelper.emptySuggestions;
  public uiSuggestions: ISuggestion[] = this.suggestions;

  public activeSuggestion?: string;
  private activeSuggestionIndex: number | undefined;
  private searchInput: string = '';
  private currentBullets: SearchElement[] = [];

  constructor(private $translate: ng.translate.ITranslateService) {
  }

  public showEmpty(): void {
    this.suggestions = SuggestionsHelper.emptySuggestions;
    this.uiSuggestions = this.suggestions;
    this.resetActive();
  }

  public updateBasedOnInput(searchInput: string): void {
    // this.suggestions = [
    //   {
    //     searchString: '"' + searchInput + '"',
    //     field: 'All devices',
    //     text: 'containing "' + searchInput + '"',
    //   },
    //   {
    //     searchString: 'connectionStatus:"' + searchInput + '"',
    //     field: 'Status',
    //     text: 'containing "' + searchInput + '"',
    //   },
    //   {
    //     searchString: 'product:"' + searchInput + '"',
    //     field: 'Type',
    //     text: 'containing "' + searchInput + '"',
    //   },
    // ];
    this.searchInput = searchInput;
    this.updateUiSuggestions();
  }

  public onSearchChanged(searchElements: SearchElement[]) {
    this.currentBullets = searchElements;
    this.updateUiSuggestions();
  }

  public setActiveSuggestion = (suggestionId: number): void => {
    this.activeSuggestion = this.uiSuggestions[suggestionId].searchString;
    this.activeSuggestionIndex = suggestionId;
  }

  public resetActive = () => {
    this.activeSuggestion = undefined;
    this.activeSuggestionIndex = undefined;
  }

  public isSuggestionActive(suggestionId: number): boolean {
    return this.activeSuggestionIndex === suggestionId;
  }

  public getActiveSuggestionIndex(): number {
    if (this.activeSuggestionIndex || this.activeSuggestionIndex === 0) {
      return this.activeSuggestionIndex;
    }
    return -1;
  }

  public getActiveSuggestion(): ISuggestion | null {
    if (this.activeSuggestionIndex
      && (this.activeSuggestionIndex < this.uiSuggestions.length)
      && this.activeSuggestionIndex >= 0) {
      return this.uiSuggestions[this.activeSuggestionIndex];
    }
    return null;
  }

  public nextSuggestion() {
    let active = this.getActiveSuggestionIndex();
    active++;
    if (active >= this.uiSuggestions.length) {
      active = this.uiSuggestions.length - 1;
    }
    this.setActiveSuggestion(active);
  }

  public previousSuggestion() {
    let active = this.getActiveSuggestionIndex();
    active--;
    if (active < 0) {
      active = 0;
    }
    this.setActiveSuggestion(active);
  }

  public getSuggestionById(suggestionId: number): ISuggestion | null {
    if (suggestionId >= 0 && suggestionId < this.uiSuggestions.length) {
      return this.uiSuggestions[suggestionId];
    }
    return null;
  }

  public updateSuggestionsBasedOnSearchResult(getDocCount: (searchResult: SearchResult | undefined, aggregation: string, bucketName: string) => number,
                                              searchResult: SearchResult,
                                              searchInput: string): void {
    this.suggestions = [
      {
        count: searchResult && searchResult.hits.total || 0,
        searchString: '"' + searchInput + '"',
        field: 'All devices',
        text: 'containing "' + searchInput + '"',
      },
      {
        count: getDocCount(searchResult, 'connectionStatus', 'connected_with_issues'),
        searchString: 'connectionStatus=CONNECTED_WITH_ISSUES',
        field: this.$translate.instant('spacesPage.statusHeader'),
        text: this.$translate.instant('CsdmStatus.OnlineWithIssues'),
      },
      {
        count: getDocCount(searchResult, 'connectionStatus', 'offline')
        + getDocCount(searchResult, 'connectionStatus', 'disconnected'),
        searchString: 'connectionStatus=DISCONNECTED',
        field: this.$translate.instant('spacesPage.statusHeader'),
        text: this.$translate.instant('CsdmStatus.Offline'),
      },
      {
        count: getDocCount(searchResult, 'connectionStatus', 'offline_expired'),
        searchString: 'connectionStatus=OFFLINE_EXPIRED',
        field: this.$translate.instant('spacesPage.statusHeader'),
        text: this.$translate.instant('CsdmStatus.OfflineExpired'),
      },
      {
        count: getDocCount(searchResult, 'connectionStatus', 'connected'),
        searchString: 'connectionStatus="CONNECTED"',
        field: this.$translate.instant('spacesPage.statusHeader'),
        text: this.$translate.instant('CsdmStatus.Online'),
      },
    ];
    const productSuggestions = this.generateProductSuggestions(searchResult);
    _.forEach(productSuggestions, (s) => this.suggestions.push(s));
    _.forEach(this.generateErrorCodeSuggestions(searchResult), s => this.suggestions.push(s));
    this.updateUiSuggestions();
  }

  private generateProductSuggestions(searchResult: SearchResult): ISuggestion[] {
    const buckets: List<BucketData> = _.get(searchResult, `aggregations['product'].buckets`);
    return _.map(buckets, (bucket) => {
      return {
        searchString: `product="${bucket.key}"`,
        field: this.$translate.instant('spacesPage.typeHeader'),
        text: bucket.key,
        count: bucket.docCount,
      };
    });
  }

  private generateErrorCodeSuggestions(searchResult: SearchResult) {
    const buckets: List<BucketData> = _.get(searchResult, `aggregations['errorCodes'].buckets`);
    return _.map(buckets, (bucket) => {
      return {
        searchString: `errorCodes=${bucket.key}`,
        field: this.$translate.instant('deviceOverviewPage.issues'),
        text: this.$translate.instant(`CsdmStatus.errorCodes.${bucket.key}.type`),
        count: bucket.docCount,
      };
    });
  }

  private updateUiSuggestions() {
    this.uiSuggestions =
      SuggestionDropdown.removeExistingQueries(
        SuggestionDropdown.filterSuggestion(this.suggestions, this.searchInput), this.currentBullets);
  }

  public static removeExistingQueries = (suggestions: ISuggestion[], currentSearchBullets: SearchElement[]): ISuggestion[] => {
    if (!currentSearchBullets || currentSearchBullets.length === 0) {
      return suggestions;
    }
    return _.filter(suggestions, su => {
      return !_.some(currentSearchBullets,
        currentSearch => (currentSearch && currentSearch.toQuery() || '').replace(/ /g, '') === su.searchString.toLowerCase().replace(/ /g, ''));
    });
  }

  public static filterSuggestion = (suggestions: ISuggestion[], searchInput: string): ISuggestion[] => {
    if (!searchInput) {
      return suggestions;
    }
    searchInput = searchInput.toLowerCase();
    return _.filter(suggestions, (su) => {
      return su.text.toLowerCase().indexOf(searchInput) > -1 || su.field.toLowerCase().indexOf(searchInput) > -1;
    });
  }
}


export class SuggestionsHelper {
  public static emptySuggestions: ISuggestion[] = [
    {
      searchString: 'connectionStatus:"connected_with_issues"',
      field: 'Status',
      text: 'Online, With Issues',
    },
    {
      searchString: 'product:"Cisco Spark Board 55"',
      field: 'Type',
      text: 'Cisco Spark Board 55',
    },
  ];
}
