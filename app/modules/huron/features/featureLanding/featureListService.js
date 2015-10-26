(function () {
  'use strict';

  angular
    .module('Huron')
    .service('HuronFeaturesListService', HuronFeaturesListService);

  /* @ngInject */
  function HuronFeaturesListService($q) {
    var service = {
      autoAttendants: autoAttendants,
      callParks: callParks,
      huntGroups: huntGroups
    };

    var formattedCard = {
      // 'cardName': '',
      // 'numbers': [],
      // 'featureName': '',
      // 'filterValue': ''
    };

    return service;

    ////////////////

    function autoAttendants(data) {
      var formattedList = [];
      _.forEach(data, function (aa) {
        formattedCard.cardName = aa.name;
        formattedCard.numbers = _.pluck(aa.resources, 'number');
        formattedCard.id = aa.ceUrl.substr(aa.ceUrl.lastIndexOf('/') + 1);
        formattedCard.featureName = 'huronFeatureDetails.aa';
        formattedCard.filterValue = 'AA';
        formattedList.push(formattedCard);
        formattedCard = {};
      });
      return formattedList;
    }

    function callParks() {
      // TODO: Add callpark formatting service
    }

    function huntGroups() {
      // TODO: Add hunt groups formatting service
    }

  }
})();