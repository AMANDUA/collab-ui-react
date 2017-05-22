import callFeatureNameModule from './index';

describe('Component: CallFeatureName', () => {
  const NAME_INPUT = 'input';
  const HINT_TEXT = 'p.input-description';

  beforeEach(function () {
    this.initModules(callFeatureNameModule);
    this.injectDependencies(
      '$scope',
    );
    this.$scope.onChangeFn = jasmine.createSpy('onChangeFn');
    this.$scope.onKeyPressFn = jasmine.createSpy('onKeyPressFn');
    this.$scope.onNameChange = jasmine.createSpy('onNameChange');
    this.$scope.name = '';
  });

  function initComponent() {
    this.compileComponent('ucCallFeatureName', {
      placeholderKey: 'callPark.namePlaceholder',
      nameHintKey: 'callPark.nameHint',
      name: 'name',
      isNew: 'true',
      onChangeFn: 'onChangeFn(value)',
      onKeyPressFn: 'onKeyPressFn(keyCode)',
    });
  }

  describe('Call Feature Name setup assistant mode', () => {
    beforeEach(initComponent);

    it('should have an input', function() {
      expect(this.view).toContainElement(NAME_INPUT);
    });

    it('should have placeholder text', function() {
      expect(this.view.find(NAME_INPUT)).toHaveAttr('placeholder');
      expect(this.view.find(NAME_INPUT).attr('placeholder')).toEqual('callPark.namePlaceholder');
    });

    it('should have hint text', function() {
      expect(this.view).toContainElement(HINT_TEXT);
      expect(this.view.find(HINT_TEXT).get(0).innerHTML).toEqual('callPark.nameHint');
    });

    // TODO (jlowery): figure out why this doesn't trigger onChangeFn in UT.
    xit('should call onChangeFn when name field is changed', function() {
      this.view.find(NAME_INPUT).val('you done messed up a-a-ron').change();
      expect(this.$scope.onChangeFn).toHaveBeenCalledWith('you done messed up a-a-ron');
    });

  });
});
