(function () {
  'use strict';

  angular
    .module('Core')
    .factory('OverviewCardFactory', OverviewCardFactory);

  /* @ngInject */
  function OverviewCardFactory(OverviewBroadsoftCard, OverviewCallCard, OverviewMeetingCard, OverviewRoomSystemsCard, OverviewMessageCard, OverviewHybridServicesCard, OverviewUsersCard, OverviewCareCard) {
    return {
      createMessageCard: OverviewMessageCard.createCard,
      createMeetingCard: OverviewMeetingCard.createCard,
      createBroadsoftCard: OverviewBroadsoftCard.createCard,
      createCallCard: OverviewCallCard.createCard,
      createCareCard: OverviewCareCard.createCard,
      createRoomSystemsCard: OverviewRoomSystemsCard.createCard,
      createHybridServicesCard: OverviewHybridServicesCard.createCard,
      createUsersCard: OverviewUsersCard.createCard,
    };
  }
})();
