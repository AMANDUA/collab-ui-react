import testModule from '../index';

describe('Component: gmTdNotes', () => {
  beforeAll(function () {
    this.preData = getJSONFixture('gemini/common.json');
  });

  beforeEach(function () {
    this.initModules(testModule);
    this.injectDependencies('$scope', 'UrlConfig', '$httpBackend', '$state', '$stateParams', '$q', 'Notification', 'TelephonyDomainService', 'PreviousState');
    initSpies.apply(this);
    initComponent.apply(this);
  });

  function initSpies() {
    spyOn(this.PreviousState, 'go');
    spyOn(this.Notification, 'error');
    spyOn(this.Notification, 'notify');
    spyOn(this.TelephonyDomainService, 'postNotes').and.returnValue(this.$q.resolve());
  }

  function initComponent() {
    this.$stateParams.obj = {
      customerId: 'ff808081527ccb3f0153116a3531041e',
      ccaDomainId: '8a607bdb59baadf5015a650a2003157e',
      notes: [
        {
          objectName: 'note1',
        },
      ],
    };

    this.$state.current = {
      data: {
        displayName: '',
      },
    };

    const getCountriesUrl = this.UrlConfig.getGeminiUrl() + 'countries';
    this.$httpBackend.expectGET(getCountriesUrl).respond(200, this.preData.getCountries);
    this.$httpBackend.flush();

    this.compileComponent('gmTdNotes', {});
    this.$scope.$apply();
  }

  it('$onInit', function () {
    expect(this.controller.loading).toBeFalsy();
    expect(this.controller.isShowAll).toBeFalsy();
    expect(this.controller.notes.length).toBe(1);
  });

  it('onCancel', function () {
    this.controller.onCancel();
    expect(this.PreviousState.go).toHaveBeenCalled();
  });

  it('onShowAll', function () {
    this.controller.onShowAll();
    expect(this.controller.isShowAll).toBeFalsy();
    expect(this.controller.notes.length).toBe(1);
  });

  it('onSave but with note exceed max length', function () {
    this.controller.newNote = 'new_note';
    this.controller.noteMaxByte = 2;
    this.controller.onSave();
    expect(this.Notification.error).toHaveBeenCalled();
  });

  it('onSave but with note exceed max length', function () {
    this.controller.newNote = '测';
    this.controller.noteMaxByte = 2;
    this.controller.onSave();
    expect(this.Notification.error).toHaveBeenCalled();
  });

  it('should notify in message for non 0 error returnCode', function() {
    const mockData = this.preData.common;
    mockData.content.data.body = [
      {
        objectName: 'new_note',
      },
    ];
    mockData.content.data.returnCode = 400;

    this.TelephonyDomainService.postNotes.and.returnValue(this.$q.resolve(mockData));
    this.controller.newNote = 'new_note';
    this.controller.onSave();
    this.$scope.$digest();

    expect(this.Notification.notify).toHaveBeenCalled();
  });

  it('should save new note successfully', function() {
    const mockData = this.preData.common;
    mockData.content.data.body = [
      {
        objectName: 'new_note',
      },
    ];
    mockData.content.data.returnCode = 0;

    this.TelephonyDomainService.postNotes.and.returnValue(this.$q.resolve(mockData));
    this.controller.newNote = 'new_note';
    this.controller.onSave();
    this.$scope.$apply();

    expect(this.controller.allNotes.length).toBe(2);
  });

  it('should show the error when save note and response body is null', function () {
    const mockData = this.preData.common;
    mockData.content.data.body = null;
    mockData.content.data.returnCode = 0;
    this.TelephonyDomainService.postNotes.and.returnValue(this.$q.resolve(mockData));
    this.controller.newNote = 'new_note';
    this.controller.onSave();
    this.$scope.$apply();

    expect(this.Notification.error).toHaveBeenCalled();
  });
});
