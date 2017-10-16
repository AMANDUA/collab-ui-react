import ControlHubModule from './index';

describe('ControlHubService', () => {
  beforeEach(function () {
    this.initModules(ControlHubModule);
    this.injectDependencies(
      '$rootScope',
      '$q',
      'ControlHubService',
    );
    installPromiseMatchers();
  });

  it('it should return control hub image', function () {
    expect(this.ControlHubService.getImage()).toBe('/images/control-hub-logo.svg');
  });

  it('it should return control hub tabs', function () {
    expect(this.ControlHubService.getTabs().length).toBe(16);
  });

  describe('getCollapsed()', () => {
    it('it should return control hub collapsed false by default', function () {
      expect(this.ControlHubService.getCollapsed().value).toBeFalsy();
      expect(this.ControlHubService.getCollapsed().image).toBe('/images/spark-logo.svg');
    });

    it('it should return control hub collapsed true after being set to true', function () {
      const collapsed = this.ControlHubService.getCollapsed();
      expect(this.ControlHubService.getCollapsed().value).toBeFalsy();
      collapsed.value = true;
      expect(this.ControlHubService.getCollapsed().value).toBeTruthy();
    });
  });

});
