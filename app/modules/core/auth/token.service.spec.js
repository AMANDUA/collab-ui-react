'use strict';

describe('TokenService', function () {
  beforeEach(angular.mock.module('core.token'));

  var SessionStorage, TokenService, $window;
  var windowMock = {
    open: sinon.stub(),
    sessionStorage: {},
    localStorage: {
      setItem: function () {},
      removeItem: function () {}
    }
  };

  afterEach(function () {
    SessionStorage = TokenService = $window = undefined;
  });

  afterAll(function () {
    windowMock = undefined;
  });

  beforeEach(inject(function (_SessionStorage_, _TokenService_) {
    SessionStorage = _SessionStorage_;
    TokenService = _TokenService_;
    $window = windowMock;

    spyOn($window.localStorage, 'setItem');
    spyOn($window.localStorage, 'removeItem');
    spyOn(SessionStorage, 'get').and.returnValue('test');
    spyOn(SessionStorage, 'put');
  }));

  it('should call the SessionStorage service to set the accessToken', function () {
    TokenService.setAccessToken('test');
    expect(SessionStorage.put).toHaveBeenCalledWith('accessToken', 'test');
  });

  it('should call the SessionStorage service to set the refreshToken', function () {
    TokenService.setRefreshToken('test');
    expect(SessionStorage.put).toHaveBeenCalledWith('refreshToken', 'test');
  });

  describe('clientSessionId', function () {
    beforeEach(function () {
      TokenService.setClientSessionId();
    });

    it('should get existing or generate a new id', function () {
      expect(TokenService.getClientSessionId()).toBeFalsy();

      var clientSessionId = TokenService.getOrGenerateClientSessionId();
      expect(clientSessionId).toBeTruthy();

      var clientSessionIdAgain = TokenService.getOrGenerateClientSessionId();
      expect(clientSessionId).toEqual(clientSessionIdAgain);
    });
  });
});
