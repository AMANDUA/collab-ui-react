(function () {
  'use strict';

  /* @ngInject */
  function HelpdeskSearchHistoryService(LocalStorage) {
    var self = this;
    self.limit = 10;
    self.searchHistoryStorageKey = 'helpdesk.search-history';
    self.searchHistory = LocalStorage.getObject(self.searchHistoryStorageKey) || [];

    function removeSearch(search) {
      _.remove(self.searchHistory, function (s) {
        return search.searchString.toLowerCase() === s.searchString.toLowerCase();
      });
    }

    function saveSearch(s) {
      var search = _.cloneDeep(s);
      if (_.size(search.userSearchResults) > 0 || _.size(search.orgSearchResults) > 0 || _.size(search.deviceSearchResults) > 0) {
        removeSearch(search);
        if (self.searchHistory.length === self.limit) {
          self.searchHistory.pop();
        }
        self.searchHistory.splice(0, 0, search);
        LocalStorage.putObject(self.searchHistoryStorageKey, self.searchHistory);
      }
    }

    function getAllSearches() {
      return self.searchHistory;
    }

    function clearSearchHistory() {
      self.searchHistory = [];
      LocalStorage.remove(self.searchHistoryStorageKey);
    }

    return {
      saveSearch: saveSearch,
      getAllSearches: getAllSearches,
      clearSearchHistory: clearSearchHistory,
    };
  }

  angular.module('Squared')
    .service('HelpdeskSearchHistoryService', HelpdeskSearchHistoryService);

}());
