import testModule from './index';

describe('Component: linkedSiteGrid', () => {

  beforeEach(function () {
    this.initModules(testModule);

    this.injectDependencies(
      '$componentController',
      '$state',
      '$translate',
      '$log',
    );
  });

  describe('at startup', () => {

    beforeEach(function () {
      this.controller = this.$componentController('linkedSitesGrid', {
        $log: this.$log,
        $state: this.$state,
        $translate: this.$translate,
        uiGridConstants: {},
      }, {});
    });
    it('defines a grid', function() {
      this.controller.$onInit();
      expect(this.controller.gridConfig).toExist();
    });

  });

});