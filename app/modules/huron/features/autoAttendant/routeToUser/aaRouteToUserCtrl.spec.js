'use strict';

describe('Controller: AARouteToUserCtrl', function () {
  var $controller;
  var AAUiModelService, AutoAttendantCeInfoModelService, AutoAttendantCeMenuModelService, AAModelService, $httpBackend, HuronConfig, aaCommonService;

  var $rootScope, $scope, UrlConfig;

  var aaModel = {

  };

  var aaUiModel = {
    openHours: {},
    ceInfo: {
      name: 'AA2',
    },
  };

  var authinfo;

  var completeUserCisResponse = {
    userName: 'dudette@gmail.com',
    name: {
      givenName: 'Super',
      familyName: 'Admin',
    },
    userStatus: 'active',
    id: '47026507-4F83-0B5B-9C1D-8DBA89F2E01C',
    displayName: 'Super Admin',
    success: true,
  };

  var notSoCompleteUserCisResponse = {
    userName: 'dude@gmail.com',
    name: {
      givenName: 'inferior',
      familyName: 'user',
    },
    userStatus: 'active',
    id: '5FCF9B4A-4A44-943B-4A4A-A397974E97D4',
    displayName: '',
    success: true,
  };

  var cmiCompleteUserGet;
  var cmiNotSoCompleteUserGet;
  var cmiExtensionInfoGet;

  var directoryCmiResponse = {
    firstName: 'firstName',
    middleName: 'middleName',
    lastName: 'lastName',
    nickName: 'nickName',
    userId: 'dudette@gmail.com',
    userName: 'dudette@gmail.com',
    mailId: 'dudette@gmail.com',
    associatedDevices: {
      associatedDevice: [{
        uuid: '236f9531-e4ee-42f0-9f52-249480b42927',
        name: 'SEP74A02FC0F752',
      }],
    },
    primaryDirectoryNumber: {
      uuid: '51d41da5-31ba-49ce-8540-ea103c33bc49',
      pattern: '2252',
      routePartition: {
        uuid: 'cd2002a3-9de4-4a5f-96e3-a74ab658aac9',
        name: '7e88d491-d6ca-4786-82ed-cbe9efb02ad2_000001_EXT_RP',
      },
    },
    directoryUri: '',
    telephoneNumber: '',
    title: '',
    mobileNumber: '',
    homeNumber: '',
    pagerNumber: '',
    selfService: '2252',
    userProfile: null,
    customer: {
      uuid: '7e88d491-d6ca-4786-82ed-cbe9efb02ad2',
      name: 'Huron Int Test 1',
    },
    uuid: '7f86555a-165f-412b-b31e-1cc6b1431bca',
    url: 'https://cmi.huron-int.com/api/v1/voice/customers/7e88d491-d6ca-4786-82ed-cbe9efb02ad2/users/7f86555a-165f-412b-b31e-1cc6b1431bca',
    links: [{
      rel: 'voice',
      href: '/api/v1/voice/customers/7e88d491-d6ca-4786-82ed-cbe9efb02ad2/users/7f86555a-165f-412b-b31e-1cc6b1431bca',
    }],
  };

  var noDirectoryCmiResponse = {
    firstName: 'firstName',
    middleName: 'middleName',
    lastName: 'lastName',
    nickName: 'nickName',
    userId: 'dudette@gmail.com',
    userName: 'dudette@gmail.com',
    mailId: 'dudette@gmail.com',
    associatedDevices: {
      associatedDevice: [{
        uuid: '236f9531-e4ee-42f0-9f52-249480b42927',
        name: 'SEP74A02FC0F752',
      }],
    },
    directoryUri: '',
    telephoneNumber: '',
    title: '',
    mobileNumber: '',
    homeNumber: '',
    pagerNumber: '',
    selfService: '2252',
    userProfile: null,
    customer: {
      uuid: '7e88d491-d6ca-4786-82ed-cbe9efb02ad2',
      name: 'Huron Int Test 1',
    },
    uuid: '7f86555a-165f-412b-b31e-1cc6b1431bca',
    url: 'https://cmi.huron-int.com/api/v1/voice/customers/7e88d491-d6ca-4786-82ed-cbe9efb02ad2/users/7f86555a-165f-412b-b31e-1cc6b1431bca',
    links: [{
      rel: 'voice',
      href: '/api/v1/voice/customers/7e88d491-d6ca-4786-82ed-cbe9efb02ad2/users/7f86555a-165f-412b-b31e-1cc6b1431bca',
    }],
  };

  var userListCISResponse = getJSONFixture('huron/json/autoAttendant/userListCISResponse.json');

  var userListCISResponse2 = {
    totalResults: '3',
    itemsPerPage: '1',
    startIndex: '3',
    schemas: [
      'urn:scim:schemas:core:1.0',
      'urn:scim:schemas:extension:cisco:commonidentity:1.0',
    ],
    Resources: [{
      userName: 'dudette@gmail.com',
      name: {
        givenName: 'some',
        familyName: 'user',
      },
      entitlements: [
        'ciscouc',
        'squared-call-initiation',
        'spark',
        'webex-squared',
      ],
      id: '47026507-4F83-0B5B-9C1D-8DBA89F2E01C',
      meta: {
        created: '2015-11-16T16:40:54.084Z',
        lastModified: '2016-01-06T18:06:47.999Z',
        version: '19382735439',
        location: 'https://identity.webex.com/identity/scim/7e88d491-d6ca-4786-82ed-cbe9efb02ad2/v1/Users/9ba7b358-6795-41d7-8b0a-c07b34d6715b',
        organizationID: '7e88d491-d6ca-4786-82ed-cbe9efb02ad2',
      },
      displayName: 'Super Admin',
      active: true,
      licenseID: [
        'CO_6a0254d2-37b7-4b01-a81b-41cd2cb91a32',
      ],
      avatarSyncEnabled: false,
    }],
    success: true,
  };

  var userListEmptyCISResponse = {
    totalResults: '3',
    itemsPerPage: '0',
    startIndex: '4',
    schemas: [
      'urn:scim:schemas:core:1.0',
      'urn:scim:schemas:extension:cisco:commonidentity:1.0',
    ],
    Resources: [],
    success: true,
  };

  var listUsersProps = {
    attributes: 'attributes=name,userName,userStatus,entitlements,displayName,photos,roles,active,trainSiteNames,licenseID,userSettings',
    filter: 'filter=active%20eq%20true%20or%20displayName%20sw%20%22xz%22',
    startIndex: 0,
    count: 10,
    sortBy: 'name',
    sortOrder: 'ascending',
  };

  // we have two test users - one with all the properties like display name, extension, etc., and another without
  var users = [{
    displayName: 'Super Admin',
    userName: 'dudette@gmail.com',
    id: '47026507-4F83-0B5B-9C1D-8DBA89F2E01C',
    extension: '2252',
  }, {
    displayName: '',
    userName: 'dude@gmail.com',
    id: '5FCF9B4A-4A44-943B-4A4A-A397974E97D4',
    extension: '',
  }, {
    displayName: 'Test Admin',
    userName: 'dudette@gmail.com',
    id: '47026507-4F83-0B5B-9C1D-8DBA89F2E01C',
    extension: '2252',
  }, {
    displayName: 'AA Admin',
    userName: 'dudette@gmail.com',
    id: '47026507-4F83-0B5B-9C1D-8DBA89F2E01C',
    extension: '2252',
  },

  ];

  var sortedOptions = [{
    description: users[3].displayName.concat(' (').concat(users[3].extension).concat(')'),
  }, {
    description: users[0].displayName.concat(' (').concat(users[0].extension).concat(')'),
  }, {
    description: users[2].displayName.concat(' (').concat(users[2].extension).concat(')'),
  }];

  var schedule = 'openHours';
  var index = 0;
  var keyIndex = 0;
  var menuId = 'menu1';

  var rawCeInfos = getJSONFixture('huron/json/autoAttendant/callExperiencesWithNumber.json');

  function raw2CeInfos(rawCeInfos) {
    var _ceInfos = [];
    for (var i = 0; i < rawCeInfos.length; i++) {
      var _ceInfo = AutoAttendantCeInfoModelService.newCeInfo();
      for (var j = 0; j < rawCeInfos[i].assignedResources.length; j++) {
        var _resource = AutoAttendantCeInfoModelService.newResource();
        _resource.setId(rawCeInfos[i].assignedResources[j].id);
        _resource.setTrigger(rawCeInfos[i].assignedResources[j].trigger);
        _resource.setType(rawCeInfos[i].assignedResources[j].type);
        _resource.setNumber(rawCeInfos[i].assignedResources[j].number);
        _ceInfo.addResource(_resource);
      }
      _ceInfo.setName(rawCeInfos[i].callExperienceName);
      _ceInfo.setCeUrl(rawCeInfos[i].callExperienceURL);
      _ceInfos[i] = _ceInfo;
    }
    return _ceInfos;
  }

  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(function (_$controller_, _$rootScope_, _AAUiModelService_, _AutoAttendantCeInfoModelService_, _AutoAttendantCeMenuModelService_, _AAModelService_, _$httpBackend_, _Authinfo_, _HuronConfig_, _UrlConfig_, _AACommonService_/* , _AAUserService_ */) {
    $rootScope = _$rootScope_;
    $scope = $rootScope;

    $controller = _$controller_;
    AAModelService = _AAModelService_;
    AAUiModelService = _AAUiModelService_;
    AutoAttendantCeInfoModelService = _AutoAttendantCeInfoModelService_;
    AutoAttendantCeMenuModelService = _AutoAttendantCeMenuModelService_;
    aaCommonService = _AACommonService_;

    $httpBackend = _$httpBackend_;
    authinfo = _Authinfo_;
    UrlConfig = _UrlConfig_;
    HuronConfig = _HuronConfig_;

    $scope.schedule = schedule;
    $scope.index = index;
    $scope.keyIndex = keyIndex;
    $scope.menuId = menuId;

    spyOn(authinfo, 'getOrgId').and.returnValue('1');

    spyOn(AAModelService, 'getAAModel').and.returnValue(aaModel);
    aaModel.ceInfos = raw2CeInfos(rawCeInfos);

    spyOn(AAUiModelService, 'getUiModel').and.returnValue(aaUiModel);
    AutoAttendantCeMenuModelService.clearCeMenuMap();
    aaUiModel[schedule] = AutoAttendantCeMenuModelService.newCeMenu();
    aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenu());

    spyOn(aaCommonService, 'isHybridEnabledOnOrg').and.returnValue(true);

    var listUsersUrl = UrlConfig.getScimUrl(authinfo.getOrgId()) +
      '?' + '&' + listUsersProps.attributes +
      '&' + listUsersProps.filter +
      '&count=' + listUsersProps.count +
      '&sortBy=' + listUsersProps.sortBy +
      '&sortOrder=' + listUsersProps.sortOrder;
    $httpBackend.whenGET(listUsersUrl).respond(200, userListCISResponse);

    var listUsersUrl2 = UrlConfig.getScimUrl(authinfo.getOrgId()) +
      '?' + '&' + listUsersProps.attributes +
      '&' + listUsersProps.filter +
      '&startIndex=10' +
      '&count=' + listUsersProps.count +
      '&sortBy=' + listUsersProps.sortBy +
      '&sortOrder=' + listUsersProps.sortOrder;
    $httpBackend.whenGET(listUsersUrl2).respond(200, userListCISResponse2);

    var listUsersUrl3 = UrlConfig.getScimUrl(authinfo.getOrgId()) +
      '?' + '&' + listUsersProps.attributes +
      '&' + listUsersProps.filter +
      '&startIndex=20' +
      '&count=' + listUsersProps.count +
      '&sortBy=' + listUsersProps.sortBy +
      '&sortOrder=' + listUsersProps.sortOrder;
    $httpBackend.whenGET(listUsersUrl3).respond(200, userListEmptyCISResponse);

    var listUsersUrl4 = UrlConfig.getScimUrl(authinfo.getOrgId()) +
      '?' + '&' + listUsersProps.attributes +
      '&' + listUsersProps.filter +
      '&startIndex=10' +
      '&count=1' +
      '&sortBy=' + listUsersProps.sortBy +
      '&sortOrder=' + listUsersProps.sortOrder;
    $httpBackend.whenGET(listUsersUrl4).respond(200, userListCISResponse2);

    var listUsersUrl5 = UrlConfig.getScimUrl(authinfo.getOrgId()) +
      '?' + '&' + listUsersProps.attributes +
      '&' + listUsersProps.filter +
      '&startIndex=10' +
      '&count=9' +
      '&sortBy=' + listUsersProps.sortBy +
      '&sortOrder=' + listUsersProps.sortOrder;
    $httpBackend.whenGET(listUsersUrl5).respond(200, userListCISResponse2);

    // user with all props including display name and extension
    var userCisUrl = UrlConfig.getScimUrl(authinfo.getOrgId()) + '/' + users[0].id;
    $httpBackend.whenGET(userCisUrl).respond(200, completeUserCisResponse);
    cmiCompleteUserGet = $httpBackend.whenGET(HuronConfig.getCmiUrl() + '/voice/customers/' + authinfo.getOrgId() + '/users/' + users[0].id);
    cmiCompleteUserGet.respond(200, directoryCmiResponse);

    // user with missing displayname and without extension
    userCisUrl = UrlConfig.getScimUrl(authinfo.getOrgId()) + '/' + users[1].id;
    $httpBackend.whenGET(userCisUrl).respond(200, notSoCompleteUserCisResponse);
    cmiNotSoCompleteUserGet = $httpBackend.whenGET(HuronConfig.getCmiUrl() + '/voice/customers/' + authinfo.getOrgId() + '/users/' + users[1].id);
    cmiNotSoCompleteUserGet.respond(200, noDirectoryCmiResponse);

    var cmiDirectoryNumberUrl = HuronConfig.getCmiUrl() + '/voice/customers/' + authinfo.getOrgId() + '/directorynumbers?order=pattern-asc&pattern=2252';
    var cmiExtensionInfo = [{
      pattern: '5801',
      description: '',
      voiceMailProfile: {
        uuid: 'e733741a-a7e2-4ab5-894f-81df6feaa56c',
        name: 'dec55d7a-9d08-4a12-a9a7-052939c29ae0_000001_VMProf',
      },
    }];
    cmiExtensionInfoGet = $httpBackend.whenGET(cmiDirectoryNumberUrl);
    cmiExtensionInfoGet.respond(200, cmiExtensionInfo);
  }));

  afterEach(function () {
    cmiCompleteUserGet = null;
    cmiNotSoCompleteUserGet = null;
    cmiExtensionInfoGet = null;

    $rootScope = null;
    $scope = null;

    $controller = null;
    AAModelService = null;
    AAUiModelService = null;
    AutoAttendantCeInfoModelService = null;
    AutoAttendantCeMenuModelService = null;
    aaCommonService = null;

    $httpBackend = null;
    authinfo = null;
    UrlConfig = null;
    HuronConfig = null;

    aaModel.ceInfos = null;

    aaUiModel[schedule] = null;
  });

  describe('AARouteToUser', function () {
    it('should be able to create new route to user entry', function () {
      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      expect(controller).toBeDefined();
      expect(controller.menuKeyEntry.actions[0].name).toEqual('routeToUser');
      expect(controller.menuKeyEntry.actions[0].value).toEqual('');
    });

    it('should be able to create new route to voicemail entry', function () {
      $scope.voicemail = true;

      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      expect(controller).toBeDefined();
      expect(controller.menuKeyEntry.actions[0].name).toEqual('routeToVoiceMail');
      expect(controller.menuKeyEntry.actions[0].value).toEqual('');
    });

    it('should initialize the options list, format extensions ,filter out users without extension and check for sorted list ', function () {
      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      // user with both display name and extension should have both

      controller.sort.fullLoad = 3;
      controller.sort.minOffered = 1;
      controller.getUsers();
      $httpBackend.flush();

      $scope.$apply();

      expect(controller.users.length).toEqual(3);
      for (var i = 0; i < sortedOptions.length; i++) {
        expect(controller.users[i].description).toEqual(sortedOptions[i].description);
      }
    });

    it('should keep querying CIS if minimum number of users are not available in a single query', function () {
      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      controller.sort.fullLoad = 4;
      controller.getUsers();

      $httpBackend.flush();

      $scope.$apply();

      // there are 3 users across the mocked CIS calls, but remember 1 user is a bad user
      expect(controller.users.length).toEqual(4);
    });

    it('should filter voicemail users correctly in successful case', function () {
      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      $scope.voicemail = true;
      controller.sort.fullLoad = 4;

      controller.getUsers();

      $httpBackend.flush();

      $scope.$apply();

      // there are 3 users across the mocked CIS calls, but remember 1 user is a bad user
      expect(controller.users.length).toEqual(4);
    });

    it('should filter voicemail users when voicemail profile query returns 404', function () {
      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      $scope.voicemail = true;
      cmiExtensionInfoGet.respond(404);

      controller.getUsers();

      $httpBackend.flush();

      $scope.$apply();

      // the 404 should mean all users don't have a voicemail profile
      expect(controller.users.length).toEqual(0);
    });

    it('should format name with error on extension correctly', function () {
      cmiCompleteUserGet.respond(500);

      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      // just the display name when it's unclear if user has extension due to CMI error (non-404)
      var nameNumber = users[0].displayName;

      controller.sort.fullLoad = 1;

      controller.getUsers();

      $httpBackend.flush();

      $scope.$apply();

      expect(controller.users[1].description).toEqual(nameNumber);
    });

    it('should show user with extension response as 404 for call free users', function () {
      var result = 'Super Admin (spark)';
      cmiCompleteUserGet.respond(404);

      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      controller.sort.fullLoad = 8;

      controller.getUsers();

      $httpBackend.flush();

      $scope.$apply();
      expect(controller.users.length).toEqual(4);
      expect(controller.users[0].description).toEqual(result);
    });

    it('should show user email id when dispalyName, firstname and lasname are empty', function () {
      var result = 'user@gmail.com (spark)';
      cmiCompleteUserGet.respond(404);

      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      controller.sort.fullLoad = 8;

      controller.getUsers();

      $httpBackend.flush();

      $scope.$apply();
      expect(controller.users.length).toEqual(4);
      expect(controller.users[2].description).toEqual(result);
    });

    it('should show user lastname when dispalyName and firstName is empty', function () {
      var result = 'Super Admin (spark)';
      cmiCompleteUserGet.respond(404);

      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      controller.sort.fullLoad = 8;

      controller.getUsers();

      $httpBackend.flush();

      $scope.$apply();
      expect(controller.users.length).toEqual(4);
      expect(controller.users[0].description).toEqual(result);
    });


    it('when user has selected route to voicemail and extension response is 404, it should omit that user', function () {
      $scope.voicemail = true;
      cmiCompleteUserGet.respond(404);
      var controller = $controller('AARouteToUserCtrl', {
        $scope: $scope,
      });

      // user with both display name and extension should have both

      controller.sort.fullLoad = 8;
      controller.sort.minOffered = 1;
      controller.getUsers();
      $httpBackend.flush();

      $scope.$apply();

      expect(controller.users.length).toEqual(0);
    });

    describe('activate', function () {
      it('should read and display an existing route to user entry', function () {
        var actionEntry = AutoAttendantCeMenuModelService.newCeActionEntry('routeToUser', users[0].id);

        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(actionEntry);
        aaUiModel[schedule].entries[0].addEntry(menuEntry);
        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        // user with both display name and extension should have both
        var nameNumber1 = users[0].displayName.concat(' (')
          .concat(users[0].extension).concat(')');

        $httpBackend.flush();

        $scope.$apply();

        expect(controller.userSelected.id).toEqual(users[0].id);
        expect(controller.userSelected.description).toEqual(nameNumber1);
      });

      it('should read and display an existing route to voicemail entry', function () {
        var actionEntry = AutoAttendantCeMenuModelService.newCeActionEntry('routeToVoiceMail', users[0].id);

        $scope.voicemail = true;

        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(actionEntry);
        aaUiModel[schedule].entries[0].addEntry(menuEntry);
        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        // user with both display name and extension should have both
        var nameNumber1 = users[0].displayName.concat(' (')
          .concat(users[0].extension).concat(')');

        $httpBackend.flush();

        $scope.$apply();

        expect(controller.userSelected.id).toEqual(users[0].id);
        expect(controller.userSelected.description).toEqual(nameNumber1);
      });

      it('should format selected name with error on extension correctly', function () {
        var actionEntry = AutoAttendantCeMenuModelService.newCeActionEntry('routeToUser', users[0].id);

        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(actionEntry);
        aaUiModel[schedule].entries[0].addEntry(menuEntry);

        cmiCompleteUserGet.respond(404);

        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        // just the display name when no extension found (404)
        var nameNumber = users[0].displayName;

        $httpBackend.flush();

        $scope.$apply();

        expect(controller.userSelected.id).toEqual(users[0].id);
        expect(controller.userSelected.description).toEqual(nameNumber);
      });
    });

    describe('populateUi', function () {
      it('should write UI entry back into UI model via populateUiModel', function () {
        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        controller.menuKeyEntry.actions[0].value = users[0].id;

        controller.populateUiModel();

        $httpBackend.flush();

        $scope.$apply();

        expect(controller.userSelected.id).toEqual(users[0].id);
      });
    });

    describe('Multi-Site', function () {
      var response = {};
      response.numbers = [{
        siteToSite: '81001111',
      }, {
        siteToSite: '81002222',
      }, {
        siteToSite: '81003333',
      }];
      var userMultiSite;

      beforeEach(function () {
        userMultiSite = HuronConfig.getCmiV2Url() + '/customers/' + authinfo.getOrgId() + '/users/' + users[0].id;
        spyOn(aaCommonService, 'isMultiSiteEnabled').and.returnValue(true);
      });

      afterEach(function () {
        userMultiSite = null;
      });

      it('should get extension from User Service', function () {
        $httpBackend.whenGET(userMultiSite).respond(200, response);
        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        controller.getUsers('', undefined);

        $httpBackend.flush();

        $scope.$apply();

        expect(controller.users[0].description).toContain('81001111');
        expect(controller.users[1].description).toContain('81002222');
        expect(controller.users[2].description).toContain('81003333');
      });
      it('should not get extension from User Service', function () {
        $httpBackend.whenGET(userMultiSite).respond(404, { error: 'error 404' });
        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        controller.getUsers('', undefined);
        $httpBackend.flush();

        $scope.$apply();
        var descrips = _.chain(controller.users)
          .map('description')
          .filter(function (o) {
            return o.includes('81001111');
          })
          .value();

        expect(descrips.length).toBe(0);
      });
    });

    describe('fromDecision', function () {
      beforeEach(function () {
        $scope.fromDecision = true;

        aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenuEntry());

        aaUiModel[schedule].entries[0].actions = [];

        var action = AutoAttendantCeMenuModelService.newCeActionEntry('conditional', '');
        aaUiModel[schedule].entries[0].actions[0] = action;
      });

      it('should create a Voice Mail conditional action with then clause', function () {
        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        expect(controller.menuEntry.actions[0].then).toBeDefined();
        expect(controller.menuEntry.actions[0].then.name).toEqual('routeToUser');
      });

      it('should create a condition action with then clause', function () {
        aaUiModel[schedule].entries[0].actions[0] = undefined;

        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        expect(controller.menuEntry.actions[0].name).toEqual('conditional');
        expect(controller.menuEntry.actions[0].then).toBeDefined();
        expect(controller.menuEntry.actions[0].then.name).toEqual('routeToUser');
      });

      it('should change an action from routetoQueue to routeToUser', function () {
        aaUiModel[schedule].entries[index].actions[0].then = AutoAttendantCeMenuModelService.newCeActionEntry('routeToQueue', '');

        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        expect(controller.menuEntry.actions[0].name).toEqual('conditional');
        expect(controller.menuEntry.actions[0].then).toBeDefined();
        expect(controller.menuEntry.actions[0].then.name).toEqual('routeToUser');
      });
    });

    describe('fromRouteCall overwrite', function () {
      beforeEach(function () {
        aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenuEntry());
        var action = AutoAttendantCeMenuModelService.newCeActionEntry('dummy', '');

        aaUiModel[schedule].entries[0].addAction(action);
      });

      it('should overwrite user id from model via saveUiModel', function () {
        $scope.fromRouteCall = true;

        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        controller.userSelected = {
          name: users[0].displayName,
          id: users[0].id,
        };

        controller.saveUiModel();

        $scope.$apply();

        expect(controller.menuEntry.actions[0].value).toEqual(users[0].id);
      });
      it('should be able to create new User entry from Route Call', function () {
        $scope.fromRouteCall = true;

        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        expect(controller.menuEntry.actions[0].name).toEqual('routeToUser');
        expect(controller.menuEntry.actions[0].value).toEqual('');
      });
    });

    describe('fromRouteCall', function () {
      beforeEach(function () {
        $scope.fromRouteCall = true;

        aaUiModel[schedule].addEntryAt(index, AutoAttendantCeMenuModelService.newCeMenuEntry());

        aaUiModel[schedule].entries[0].actions = [];
      });

      it('should be able to create new User entry from Route Call', function () {
        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        expect(controller.menuEntry.actions[0].name).toEqual('routeToUser');
        expect(controller.menuEntry.actions[0].value).toEqual('');
      });
    });

    describe('fromNewStep_Queue_Fallback', function () {
      it('should be able to create new route entry from Queue Fallback of new step', function () {
        var disconnect = AutoAttendantCeMenuModelService.newCeActionEntry('disconnect', '');
        var fallback = AutoAttendantCeMenuModelService.newCeMenuEntry();
        fallback.addAction(disconnect);
        var queueSettings = {};
        queueSettings.fallback = fallback;
        var routeToQueue = AutoAttendantCeMenuModelService.newCeActionEntry('routeToQueue', 'some-queue-id');
        routeToQueue.queueSettings = queueSettings;
        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(routeToQueue);
        aaUiModel[schedule].addEntryAt(index, menuEntry);
        $scope.fromRouteCall = true;
        $scope.fromFallback = true;

        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        var fallbackAction = _.get(controller.menuEntry, 'actions[0].queueSettings.fallback.actions[0]');
        $scope.$apply();
        expect(fallbackAction.name).toEqual('routeToUser');
        expect(fallbackAction.value).toEqual('');
      });
    });

    describe('fromPhoneMenu_Queue_Fallback', function () {
      it('should be able to create new route entry from Queue Fallback of Phone Menu', function () {
        var disconnect = AutoAttendantCeMenuModelService.newCeActionEntry('disconnect', '');
        var fallback = AutoAttendantCeMenuModelService.newCeMenuEntry();
        fallback.addAction(disconnect);
        var queueSettings = {};
        queueSettings.fallback = fallback;
        var routeToQueue = AutoAttendantCeMenuModelService.newCeActionEntry('routeToQueue', 'some-queue-id');
        routeToQueue.queueSettings = queueSettings;
        var menuEntry = AutoAttendantCeMenuModelService.newCeMenuEntry();
        menuEntry.addAction(routeToQueue);
        aaUiModel[schedule].entries[index].addEntryAt(index, menuEntry);

        $scope.fromRouteCall = false;
        $scope.fromFallback = true;

        var controller = $controller('AARouteToUserCtrl', {
          $scope: $scope,
        });

        var fallbackAction = _.get(controller.menuKeyEntry, 'actions[0].queueSettings.fallback.actions[0]');
        $scope.$apply();
        expect(fallbackAction.name).toEqual('routeToUser');
        expect(fallbackAction.value).toEqual('');
      });
    });
  });
});
