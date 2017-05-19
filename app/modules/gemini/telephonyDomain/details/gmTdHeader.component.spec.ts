import testModule from '../index';

describe('Component: gmTdHeader', () => {
  beforeEach(function () {
    this.initModules(testModule);
    this.injectDependencies('$q', '$scope', '$window', 'Notification', 'gemService', 'TelephonyDomainService');
    this.mockData = {
      content: {
        data: [{
          description: '8a607bdb5b1280d3015b1353f92800cd',
          createTime: new Date(),
          ticketUrl: '',
        }],
      },
    };
    initSpies.apply(this);
  });

  function initSpies() {
    spyOn(this.Notification, 'errorResponse');
    spyOn(this.$window, 'open');
    spyOn(this.gemService, 'getRemedyTicket').and.returnValue(this.$q.resolve());
  }

  function initComponent(viaHttp: boolean = false, httpError: boolean = false) {
    if (viaHttp) {
      this.gemService.getRemedyTicket.and.returnValue(this.$q.resolve( this.mockData ));

      if (httpError) {
        this.gemService.getRemedyTicket.and.returnValue(this.$q.reject({ status: 404 }));
      }
    } else {
      this.gemService.setStorage('remedyTicket', { status: 'Canceled', ticketUrl: '' });
    }

    this.compileComponent('gmTdHeader',  { showRemedyTicket: true,
      tdBaseInfo: `{ customerId: 'ff808081527ccb3f0153116a3531041e', ccaDomainId: '8a607bdb5b1280d3015b1353f92800cd' }`,
    });
    this.$scope.$apply();
  }

  it('get remedy ticket from storage successfully', function () {
    initComponent.apply(this);
    expect(this.controller.remedyTicket).toBeTruthy();
  });

  it('get remedy ticket via http request successfully', function () {
    initComponent.apply(this, [true]);
    expect(this.controller.remedyTicket).toBeTruthy();
  });

  it('failed to get remedy ticket', function () {
    initComponent.apply(this, [true, true]);
    expect(this.Notification.errorResponse).toHaveBeenCalled();
  });

  it('can open remedy ticket link', function () {
    initComponent.apply(this);
    this.controller.onOpenRemedyTicket();
    expect(this.$window.open).toHaveBeenCalled();
  });
});
