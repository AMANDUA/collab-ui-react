(function () {
  'use strict';

  angular
    .module('uc.autoattendant')
    .factory('AutoAttendantCeMenuModelService', AutoAttendantCeMenuModelService);

  //
  // UI model:
  //
  // CeInfo
  //     name: String
  //     resources: CeInfoResource[]
  //     ceUrl: String
  //
  // CeInfoResource
  //     id: String // uuid
  //     trigger: String // 'inComing', 'outGoing'
  //     type: String // 'directoryNumber'
  //     number: String // '<E164>', '<DN>'
  //
  //
  // CeMenu
  //     type: String
  //     headers: CeMenuEntry[]
  //     entries: CeMenuEntry[]
  //
  // CeMenuEntry
  //     description: String
  //     type: String
  //
  //     key: String
  //     actions: Action[]
  //     timeout: String
  //     language: String
  //     voice: String
  //
  //     username: String
  //     password: String
  //     url: String
  //
  // Action
  //     name: String
  //     value: String
  //     description: String
  //     voice: String
  //
  function Action(name, value) {
    this.name = name;
    this.value = value;
    this.description = '';
    this.voice = '';
  }

  Action.prototype.clone = function () {
    var newObj = new Action(this.name, this.value);
    newObj.setDescription(this.description);
    newObj.setVoice(this.voice);
    return newObj;
  };

  Action.prototype.getName = function () {
    return this.name;
  };

  Action.prototype.setName = function (name) {
    this.name = name;
  };

  Action.prototype.getValue = function () {
    return this.value;
  };

  Action.prototype.setValue = function (value) {
    this.value = value;
  };

  Action.prototype.setDescription = function (description) {
    this.description = description;
  };

  Action.prototype.getDescription = function () {
    return this.description;
  };

  Action.prototype.setVoice = function (voice) {
    this.voice = voice;
  };

  Action.prototype.getVoice = function () {
    return this.voice;
  };

  function CeMenuEntry() {
    //
    // common
    //
    // properties:
    this.description = '';
    this.type = '';

    //
    // welcome menu entry
    // option menu entry
    //
    // properties:
    this.key = '';
    this.actions = [];
    this.timeout = '';
    this.language = '';
    this.voice = '';

    //
    // custom menu entry
    //
    // properties:
    this.username = '';
    this.password = '';
    this.url = '';
  }

  CeMenuEntry.prototype.clone = function () {
    var newObj = new CeMenuEntry();
    newObj.setDescription(this.description);
    newObj.setType(this.type);

    newObj.setKey(this.key);
    for (var i = 0; i < this.actions.length; i++) {
      newObj.actions[i] = this.actions[i].clone();
    }
    newObj.setTimeout(this.timeout);
    newObj.setLanguage(this.language);
    newObj.setVoice(this.voice);

    newObj.setUsername(this.username);
    newObj.setPassword(this.password);
    newObj.setUrl(this.url);

    return newObj;
  };

  CeMenuEntry.prototype.setDescription = function (description) {
    this.description = description;
  };

  CeMenuEntry.prototype.getDescription = function () {
    return this.description;
  };

  CeMenuEntry.prototype.setType = function (type) {
    this.type = type;
  };

  CeMenuEntry.prototype.getType = function () {
    return this.type;
  };

  CeMenuEntry.prototype.setKey = function (key) {
    this.key = key;
  };

  CeMenuEntry.prototype.getKey = function () {
    return this.key;
  };

  CeMenuEntry.prototype.addAction = function (action) {
    this.actions.push(action);
  };

  CeMenuEntry.prototype.setTimeout = function (timeout) {
    this.timeout = timeout;
  };

  CeMenuEntry.prototype.getTimeout = function () {
    return this.timeout;
  };

  CeMenuEntry.prototype.setLanguage = function (language) {
    this.language = language;
  };

  CeMenuEntry.prototype.getLanguage = function () {
    return this.language;
  };

  CeMenuEntry.prototype.setVoice = function (voice) {
    this.voice = voice;
  };

  CeMenuEntry.prototype.getVoice = function () {
    return this.voice;
  };

  CeMenuEntry.prototype.setPassword = function (password) {
    this.password = password;
  };

  CeMenuEntry.prototype.getPassword = function () {
    return this.password;
  };

  CeMenuEntry.prototype.setUsername = function (username) {
    this.username = username;
  };

  CeMenuEntry.prototype.getUsername = function () {
    return this.username;
  };

  CeMenuEntry.prototype.setUrl = function (url) {
    this.url = url;
  };

  CeMenuEntry.prototype.getUrl = function () {
    return this.url;
  };

  var ceMenuMap = {};
  var ceMenuCount = 0;

  function CeMenu() {
    this.type = '';
    this.headers = [];
    this.entries = [];
    this.id = 'menu' + ceMenuCount++;
    ceMenuMap[this.id] = this;
  }

  CeMenu.prototype.getId = function () {
    return this.id;
  };

  CeMenu.prototype.setType = function (menuType) {
    this.type = menuType;
  };

  CeMenu.prototype.getType = function () {
    return this.type;
  };

  CeMenu.prototype.addHeader = function (entry) {
    this.headers.push(entry);
  };

  CeMenu.prototype.addEntry = function (entry) {
    this.entries.push(entry);
  };

  CeMenu.prototype.addEntryAt = function (index, entry) {
    this.entries.splice(index, 0, entry);
  };

  CeMenu.prototype.appendEntry = function (entry) {
    this.entries.push(entry);
  };

  CeMenu.prototype.deleteEntryAt = function (index) {
    this.entries.splice(index, 1);
  };

  CeMenu.prototype.getEntryAt = function (index) {
    return this.entries[index];
  };

  function newRunActionsOnInput() {
    var obj = {};
    obj.description = '';
    obj.prompts = {};
    obj.inputs = [];
    return obj;
  }

  function CustomAction() {
    this.description = '';
    this.username = '';
    this.password = '';
    this.url = '';
  }

  function KeyAction() {
    this.key = '';
    this.value = '';
    this.keys = [];
  }


  /* @ngInject */
  function AutoAttendantCeMenuModelService(AAUtilityService) {

    // cannot use aaCommon's defined variables because of circular dependency.
    // aaCommonService shou not have this service, need to refactor it out.

    var DIGITS_DIAL_BY = 2;
    var DIGITS_RAW = 3;
    var DIGITS_CHOICE = 4;

    var service = {
      getWelcomeMenu: getWelcomeMenu,
      getCustomMenu: getCustomMenu,
      getOptionMenu: getOptionMenu,
      getCombinedMenu: getCombinedMenu,
      updateScheduleActionSetMap: updateScheduleActionSetMap,
      updateDefaultActionSet: updateDefaultActionSet,
      updateMenu: updateMenu,
      updateCombinedMenu: updateCombinedMenu,
      deleteMenu: deleteMenu,
      deleteCombinedMenu: deleteCombinedMenu,
      deleteScheduleActionSetMap: deleteScheduleActionSetMap,
      getCeMenu: getCeMenu,
      clearCeMenuMap: clearCeMenuMap,
      deleteCeMenuMap: deleteCeMenuMap,
      isCeMenu: isCeMenu,
      isCeMenuEntry: isCeMenuEntry,

      newCeMenu: function () {
        return new CeMenu();
      },

      newCeMenuEntry: function () {
        return new CeMenuEntry();
      },

      newCeActionEntry: function (name, value) {
        return new Action(name, value);
      },

    };

    return service;

    /////////////////////

    function encodeUtf8(stringToEncode) {
      if (stringToEncode) {
        try {
          var stringEncoded = encodeURIComponent(stringToEncode);
          var encodedStringUnescaped = unescape(stringEncoded);
          return encodedStringUnescaped;
        } catch (exception) {
          //exception can occur if string is ready encoded
          return stringToEncode;
        }
      }
      return stringToEncode;
    }

    function decodeUtf8(stringToDecode) {
      if (stringToDecode) {
        try {
          var stringEscaped = escape(stringToDecode);
          var escapedStringDecoded = decodeURIComponent(stringEscaped);
          return escapedStringDecoded;

        } catch (exception) {
          // exception can occur if string was previously encoded non-utf-8
          return stringToDecode;
        }
      }
      return stringToDecode;
    }

    function parseSayObject(menuEntry, inObject) {
      var action;
      action = new Action('say', decodeUtf8(inObject.value));
      if (!action.value) {
        action.name = 'play';
      }
      action.description = menuEntry.description;

      if (!_.isUndefined(inObject.voice)) {
        action.setVoice(inObject.voice);
      }
      menuEntry.addAction(action);
    }

    function parseSayList(menuEntry, objects) {
      for (var i = 0; i < objects.length; i++) {
        parseSayObject(menuEntry, objects[i]);
      }
    }

    function parsePlayObject(menuEntry, inObject) {
      var action;
      action = new Action('play', decodeUtf8(inObject.url));
      if (!_.isUndefined(inObject.voice)) {
        action.setVoice(inObject.voice);
      }
      action.deleteUrl = inObject.deleteUrl;
      menuEntry.addAction(action);
    }

    function parsePlayList(menuEntry, objects) {
      _.each(objects, function (o) {
        parsePlayObject(menuEntry, o);
      });
    }

    function createSayList(menuEntry) {
      var actions = menuEntry.actions;

      var newActionArray = [];
      for (var i = 0; i < actions.length; i++) {
        newActionArray[i] = {};
        menuEntry.description = actions[i].description;
        if (actions[i].deleteUrl && _.startsWith(actions[i].getValue(), 'http')) {
          newActionArray[i].url = (actions[i].getValue() ? encodeUtf8(actions[i].getValue()) : '');
          newActionArray[i].deleteUrl = actions[i].deleteUrl;
        } else {
          newActionArray[i].value = (actions[i].getValue() ? encodeUtf8(actions[i].getValue()) : '');
        }
        if (!_.isUndefined(actions[i].voice) && actions[i].voice.length > 0) {
          newActionArray[i].voice = actions[i].voice;
        }
      }
      return newActionArray;
    }

    function setDescription(action, task) {
      if (!_.isUndefined(task.description)) {
        action.setDescription(task.description);
      }
    }
    function makeRouteToQueue(inAction) {
      var action;
      action = new Action('routeToQueue', inAction.routeToQueue.id);
      setDescription(action, inAction.routeToQueue);
      try {
        action.description = JSON.parse(action.description);
      } catch (exception) {
        return;
      }
      cesLanguageVoice(action, inAction.routeToQueue);
      cesMaxWaitTime(action, inAction.routeToQueue);
      cesMoh(action, inAction.routeToQueue);
      cesIa(action, inAction.routeToQueue);
      cesPa(action, inAction.routeToQueue);
      cesFallback(action, inAction.routeToQueue);

      return action;

    }

    function parseAction(menuEntry, inAction) {
      //read from db
      var action;
      if (!_.isUndefined(inAction.play)) {
        action = new Action('play', decodeUtf8(inAction.play.url));
        setDescription(action, inAction.play);
        action.voice = inAction.play.voice;
        action.deleteUrl = decodeUtf8(inAction.play.deleteUrl);
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.say)) {
        action = new Action('say', decodeUtf8(inAction.say.value));
        setDescription(action, inAction.say);
        if (!_.isUndefined(inAction.say.voice)) {
          action.setVoice(inAction.say.voice);
        }
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.route)) {
        action = new Action('route', inAction.route.destination);
        setDescription(action, inAction.route);
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.routeToExtension)) {

        action = new Action('routeToExtension', inAction.routeToExtension.destination);

        setDescription(action, inAction.routeToExtension);

        menuEntry.addAction(action);

      } else if (!_.isUndefined(inAction.routeToHuntGroup)) {
        action = new Action('routeToHuntGroup', inAction.routeToHuntGroup.id);
        setDescription(action, inAction.routeToHuntGroup);
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.routeToUser)) {
        action = new Action('routeToUser', inAction.routeToUser.id);
        setDescription(action, inAction.routeToUser);
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.routeToVoiceMail)) {
        action = new Action('routeToVoiceMail', inAction.routeToVoiceMail.id);
        setDescription(action, inAction.routeToVoiceMail);
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.repeatActionsOnInput)) {
        action = new Action('repeatActionsOnInput', '');
        setDescription(action, inAction.repeatActionsOnInput);
        if (_.has(inAction.repeatActionsOnInput, 'level')) {
          action.level = inAction.repeatActionsOnInput.level;
        } else {
          action.level = 0;
        }
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.disconnect)) {
        action = new Action('disconnect', '');
        if (!_.isUndefined(inAction.disconnect.treatment)) {
          action.setValue(inAction.disconnect.treatment);
        } else {
          action.setValue('none');
        }
        if (!_.isUndefined(inAction.disconnect.description)) {
          action.setDescription(inAction.disconnect.description);
        }
        menuEntry.addAction(action);
      } else if (_.has(inAction, 'runActionsOnInput')) {
        action = new Action('runActionsOnInput', '');
        if (_.has(inAction.runActionsOnInput, 'inputType')) {
          action.inputType = inAction.runActionsOnInput.inputType;
          // check if this dial-by-extension
          if (_.includes([DIGITS_DIAL_BY, DIGITS_RAW, DIGITS_CHOICE], action.inputType) &&
            (_.has(inAction, 'runActionsOnInput.prompts.sayList') ||
            _.has(inAction, 'runActionsOnInput.prompts.playList'))) {
            var playList = inAction.runActionsOnInput.prompts.playList;
            if (playList && playList.length > 0 && !_.isUndefined(playList[0].url)) {
              action.url = decodeUtf8(inAction.runActionsOnInput.prompts.playList[0].url);
              action.deleteUrl = decodeUtf8(inAction.runActionsOnInput.prompts.playList[0].deleteUrl);
            } else {
              var sayList = inAction.runActionsOnInput.prompts.sayList;
              if (sayList.length > 0 && _.has(sayList[0], 'value')) {
                action.value = decodeUtf8(sayList[0].value);
              }
            }
            action.voice = inAction.runActionsOnInput.voice;
            action.description = inAction.runActionsOnInput.description;
            action.maxNumberOfCharacters = inAction.runActionsOnInput.maxNumberOfCharacters;
            action.minNumberOfCharacters = inAction.runActionsOnInput.minNumberOfCharacters;
            menuEntry.voice = inAction.runActionsOnInput.voice;
            menuEntry.language = inAction.runActionsOnInput.language;
            menuEntry.attempts = inAction.runActionsOnInput.attempts;
            if (_.includes([3, 4], action.inputType)) {
              action.variableName = inAction.runActionsOnInput.rawInputActions[0].assignVar.variableName;
            }
            if (_.has(inAction.runActionsOnInput, 'inputs') && inAction.runActionsOnInput.inputs.length > 0) {
              action.inputActions = [];
              _.forEach(inAction.runActionsOnInput.inputs, function (inputItem) {
                var k = new KeyAction();
                k.key = inputItem.input;

                if (_.has(inputItem, 'actions[0].assignVar')) {
                  k.value = _.get(inputItem.actions[0].assignVar, 'value');
                }
                action.inputActions.push(k);
              });
            }
            menuEntry.addAction(action);
          }
        }
      } else if (!_.isUndefined(inAction.goto)) {
        action = new Action('goto', inAction.goto.ceid);
        if (!_.isUndefined(inAction.goto.description)) {
          setDescription(action, inAction.goto.description);
        }
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.routeToSipEndpoint)) {
        action = new Action('routeToSipEndpoint', inAction.routeToSipEndpoint.url);
        setDescription(action, inAction.routeToSipEndpoint);
        menuEntry.addAction(action);
      } else if (!_.isUndefined(inAction.routeToQueue)) {
        //this occurs on the way in from the db
        action = makeRouteToQueue(inAction);
        if (!action) {
          return;
        }
        menuEntry.addAction(action);
      } else if (inAction.conditional) {
        var exp;

        action = new Action('conditional');
        action.if = {};
        exp = parseLeftRightExpression(inAction.conditional.expression);

        action.if.leftCondition = exp[0];
        action.if.rightCondition = exp[1];

        if (inAction.conditional.true[0].route) {
          action.then = new Action("route", inAction.conditional.true[0].route.destination);
        }
        if (inAction.conditional.true[0].routeToHuntGroup) {
          action.then = new Action("routeToHuntGroup", inAction.conditional.true[0].routeToHuntGroup.id);
        }
        if (inAction.conditional.true[0].goto) {
          action.then = new Action("goto", inAction.conditional.true[0].goto.ceid);
        }
        if (inAction.conditional.true[0].routeToUser) {
          action.then = new Action("routeToUser", inAction.conditional.true[0].routeToUser.id);
        }
        if (inAction.conditional.true[0].routeToVoiceMail) {
          action.then = new Action("routeToVoiceMail", inAction.conditional.true[0].routeToVoiceMail.id);
        }
        if (inAction.conditional.true[0].routeToQueue) {
          action.then = makeRouteToQueue(inAction.conditional.true[0]);
          if (!action.then) {
            return;
          }
        }

        menuEntry.addAction(action);

      } else {
        // insert an empty action
        action = new Action('', '');
        if (!_.isUndefined(inAction.description)) {
          action.setDescription(inAction.description);
        }
        menuEntry.addAction(action);
      }
    }
    function parseLeftRightExpression(expression) {
      return AAUtilityService.pullJSPieces(expression);
    }


    function cesLanguageVoice(action, inAction) {
      if (action) {
        if (_.isUndefined(action.queueSettings)) {
          action.queueSettings = {};
        }
        action.queueSettings.language = inAction.language;
        action.queueSettings.voice = inAction.voice;
      }
    }

    function cesMaxWaitTime(action, inAction) {
      if (action) {
        if (_.isUndefined(action.queueSettings)) {
          action.queueSettings = {};
        }
        action.queueSettings.maxWaitTime = inAction.queueMaxTime;
      }
    }

    /*
    * construct ces definition of Moh from db
    */
    function constructCesMoh(parsedDescription) {
      var musicOnHold = parsedDescription;
      var playAction = new Action('play', musicOnHold.queueMoH);
      playAction.setDescription(musicOnHold.description.musicOnHoldDescription);

      musicOnHold = new CeMenuEntry();
      musicOnHold.addAction(playAction);
      return musicOnHold;
    }


    /*
    * write initial announcement to db
    */
    function cesIa(action, inAction) {
      if (action) {
        try {
          if (_.isUndefined(action.queueSettings)) {
            inAction.description = JSON.parse(inAction.description);
            action.queueSettings = {};
          }
          action.queueSettings.initialAnnouncement = constructCesIa(inAction);
        } catch (exception) {
          action.queueSettings = {};
        }
      }
    }

    /*
     * write periodic announcement to db
     */
    function cesPa(action, inAction) {
      if (action) {
        try {
          if (_.isUndefined(action.queueSettings)) {
            inAction.description = JSON.parse(inAction.description);
            action.queueSettings = {};
          }
          action.queueSettings.periodicAnnouncement = constructCesPa(inAction);
        } catch (exception) {
          action.queueSettings = {};
        }
      }
    }

    /*
    * write fallback to db
    */
    function cesFallback(action, inAction) {
      if (action) {
        try {
          if (_.isUndefined(action.queueSettings)) {
            inAction.description = JSON.parse(inAction.description);
            action.queueSettings = {};
          }
          action.queueSettings.fallback = constructCesFallback(inAction);
        } catch (exception) {
          action.queueSettings = {};
        }
      }
    }
    /*
    *write Moh  to db
    */
    function cesMoh(action, inAction) {
      if (action) {
        try {
          inAction.description = JSON.parse(inAction.description);
          if (_.isUndefined(action.queueSettings)) {
            action.queueSettings = {};
          }
          action.queueSettings.musicOnHold = constructCesMoh(inAction);
        } catch (exception) {
          action.queueSettings = {};
        }
      }
    }

    /*
    * construct ces definition of IA from db
    */
    function constructCesIa(parsedDescription) {
      var iaType = parsedDescription.description.initialAnnouncementType;
      var action = new Action(iaType, parsedDescription.queueInitialAnnouncement);
      action.setDescription(parsedDescription.description.initialAnnouncementDescription);
      var initialAnnouncement = new CeMenuEntry();
      initialAnnouncement.addAction(action);
      return initialAnnouncement;
    }
    /*
    * construct ces definition of Fallback from db
    */
    function constructCesFallback(parsedDescription) {
      var fallback = parsedDescription.queueFallback;
      var action;
      var fallbackObject = Object.keys(fallback);
      var fallbackName = fallbackObject[0];
      if (_.isEqual(fallbackName, 'disconnect')) {
        action = new Action(fallbackName, '');
      } else {
        if (_.isEqual(fallbackName, 'goto')) {
          action = new Action(fallbackName, fallback[fallbackName].ceid);
        } else if (_.isEqual(fallbackName, 'routeToSipEndpoint')) {
          action = new Action(fallbackName, fallback[fallbackName].url);
        } else if (_.isEqual(fallbackName, 'route')) {
          action = new Action(fallbackName, fallback[fallbackName].destination);
        } else {
          action = new Action(fallbackName, fallback[fallbackName].id);
        }
      }
      fallback = new CeMenuEntry();
      fallback.addAction(action);
      return fallback;
    }

    /*
    * construct ces definition of PA from db
    */
    function constructCesPa(parsedDescription) {
      var paType = parsedDescription.description.periodicAnnouncementType;
      var periodicAnnouncements = parsedDescription.queuePeriodicAnnouncements[0];
      var periodicAnnouncement = periodicAnnouncements.queuePeriodicAnnouncement;
      var paInterval = periodicAnnouncements.queuePeriodicAnnouncementInterval;
      var action = new Action(paType, periodicAnnouncement);
      action.interval = paInterval;
      action.setDescription(parsedDescription.description.periodicAnnouncementDescription);
      periodicAnnouncement = new CeMenuEntry();
      periodicAnnouncement.addAction(action);
      return periodicAnnouncement;
    }

    function parseActions(menuEntry, actions) {
      for (var i = 0; i < actions.length; i++) {
        parseAction(menuEntry, actions[i]);
      }
    }

    function getWelcomeMenu(ceRecord, actionSetName) {

      if (_.isUndefined(ceRecord) || _.isUndefined(actionSetName)) {
        return undefined;
      }

      var actionSet = getActionSet(ceRecord, actionSetName);
      if (_.isUndefined(actionSet)) {
        return undefined;
      }

      if (_.isUndefined(actionSet.actions)) {
        return undefined;
      }
      var ceActionArray = actionSet.actions;
      var menuEntry;

      var menu = new CeMenu();
      menu.setType('MENU_WELCOME');

      for (var i = 0; i < ceActionArray.length; i++) {
        // dial by extension(runActionsOnInput) and is now ok in the Welcome menu.
        // if inputType is 2 then dial by extension, else make an option menu.

        if (_.isUndefined(ceActionArray[i].runActionsOnInput) && _.isUndefined(ceActionArray[i].runCustomActions)) {

          menuEntry = new CeMenuEntry();
          parseAction(menuEntry, ceActionArray[i]);
          if (menuEntry.actions.length > 0) {
            menu.addEntry(menuEntry);
          }
        } else {
          // check for dial by extension - inputType is only 2..3 for now.
          // 1 for option menu dialbyextension

          if (_.has(ceActionArray[i], 'runActionsOnInput.inputType') &&
            ceActionArray[i].runActionsOnInput.inputType !== 1) {
            menuEntry = new CeMenuEntry();
            parseAction(menuEntry, ceActionArray[i]);
            if (menuEntry.actions.length > 0) {
              menu.addEntry(menuEntry);
            }
          } else {
            var optionMenu = getOptionMenuFromAction(ceActionArray[i], actionSetName);
            if (!_.isUndefined(optionMenu)) {
              menu.addEntry(optionMenu);
            }
          }
        }
      }

      return menu;
    }

    /*
     */
    function getOptionMenu(ceRecord, actionSetName) {

      if (_.isUndefined(ceRecord) || _.isUndefined(actionSetName)) {
        return undefined;
      }

      var actionSet = getActionSet(ceRecord, actionSetName);

      if (_.isUndefined(actionSet)) {
        return undefined;
      }

      if (_.isUndefined(actionSet.actions)) {
        return undefined;
      }
      var ceActionArray = actionSet.actions;
      //
      // aaActionArray is actionSet['regularOpenActions'],
      // makes up of welcome menu's action objects, main menu object and custom menu object.
      // mainMenu is refered to as OPTION menu in the UI.
      //

      // returns only the first menu it finds
      var i = getActionIndex(ceActionArray, 'runActionsOnInput');
      if (i >= 0) {
        if (!_.isUndefined(ceActionArray[i]['runActionsOnInput'])) {
          return getOptionMenuFromAction(ceActionArray[i], actionSetName);
        }
      }
      return undefined;
    }

    function getOptionMenuFromAction(optionMenuAction, actionSetName) {

      if (!_.isUndefined(optionMenuAction) && !_.isUndefined(optionMenuAction.runActionsOnInput)) {
        var menu = new CeMenu();
        menu.setType('MENU_OPTION');
        var ceActionsOnInput = optionMenuAction.runActionsOnInput;
        var menuEntry;

        // Collect the accouncement header
        var announcementMenuEntry = new CeMenuEntry();
        announcementMenuEntry.setType('MENU_OPTION_ANNOUNCEMENT');
        menu.addHeader(announcementMenuEntry);
        if (!_.isUndefined(ceActionsOnInput) && !_.isUndefined(ceActionsOnInput.prompts)) {
          if (!_.isUndefined(ceActionsOnInput.prompts.description)) {
            announcementMenuEntry.setDescription(ceActionsOnInput.prompts.description);
          }
          if (!_.isUndefined(ceActionsOnInput.prompts.sayList)) {
            parseSayList(announcementMenuEntry, ceActionsOnInput.prompts.sayList);
          }
          if (!_.isUndefined(ceActionsOnInput.prompts.playList)) {
            parsePlayList(announcementMenuEntry, ceActionsOnInput.prompts.playList);
          }
        }

        if (!_.isUndefined(ceActionsOnInput.language)) {
          announcementMenuEntry.setLanguage(ceActionsOnInput.language);
        }
        if (!_.isUndefined(ceActionsOnInput.voice)) {
          announcementMenuEntry.setVoice(ceActionsOnInput.voice);
        }

        // Collect default handling actions
        var defaultMenuEntry = new CeMenuEntry();
        defaultMenuEntry.setType('MENU_OPTION_DEFAULT');
        menu.addHeader(defaultMenuEntry);

        // Collect timeout handling actions
        var timeoutMenuEntry = new CeMenuEntry();
        timeoutMenuEntry.setType('MENU_OPTION_TIMEOUT');
        timeoutMenuEntry.setTimeout(ceActionsOnInput.timeoutInSeconds || 5);

        if (!_.isUndefined(ceActionsOnInput.attempts)) {
          menu.attempts = ceActionsOnInput.attempts;
        }

        // Collect the main menu's options
        if (!_.isUndefined(ceActionsOnInput.inputs)) {
          for (var j = 0; j < ceActionsOnInput.inputs.length; j++) {
            var menuOption = ceActionsOnInput.inputs[j];
            if (!_.isUndefined(menuOption.input) && menuOption.input === 'default') {
              defaultMenuEntry.setDescription(menuOption.description || '');
              parseActions(defaultMenuEntry, menuOption.actions);
            } else if (!_.isUndefined(menuOption.input) && menuOption.input === 'timeout') {
              timeoutMenuEntry.setDescription(menuOption.description || '');
              parseActions(timeoutMenuEntry, menuOption.actions);
              // do not expose timeout entry by default
              menu.addHeader(timeoutMenuEntry);
            } else {
              // A displayable menu entry from CeDefinition must have both input (key) and
              // actions array defined.  It is better to skip any entry with either one of these
              // attributes missing to keep the UI stable.
              if (_.has(menuOption, 'input') && _.has(menuOption, 'actions')) {
                // Looks for menu or submenu, i.e., a runActionsOnInput object that has an
                // undefined runActionsOnInput.inputType or runActionsOnInput.inputType === 1.
                // Note, runActionsOnInput.inputType equals 2 is dialByExt.
                if (_.has(menuOption.actions[0], 'runActionsOnInput') &&
                  (!_.has(menuOption.actions[0], 'runActionsOnInput.inputType') ||
                    menuOption.actions[0].runActionsOnInput.inputType === 1)) {
                  menuEntry = getOptionMenuFromAction(menuOption.actions[0], actionSetName);
                  menuEntry.key = menuOption.input || '';
                } else {
                  menuEntry = new CeMenuEntry();
                  menuEntry.setType('MENU_OPTION');
                  menuEntry.setDescription(menuOption.description || '');
                  menuEntry.setKey(menuOption.input || '');
                  parseActions(menuEntry, menuOption.actions);
                }
                menu.addEntry(menuEntry);
              }
            }
          }
          return menu;
        }
      }
      return undefined;
    }

    function getCustomMenu(ceRecord, actionSetName) {

      if (_.isUndefined(ceRecord) || _.isUndefined(actionSetName)) {
        return undefined;
      }

      var actionSet = getActionSet(ceRecord, actionSetName);
      if (_.isUndefined(actionSet)) {
        return undefined;
      }

      if (_.isUndefined(actionSet.actions)) {
        return undefined;
      }

      var ceActionArray = actionSet.actions;

      var i = getActionIndex(ceActionArray, 'runCustomActions');

      if (i >= 0) {
        var menu = new CeMenu();
        menu.setType('MENU_CUSTOM');

        var ceCustomActions = ceActionArray[i];
        var menuEntry = new CeMenuEntry();
        for (var attr in ceCustomActions.runCustomActions) {
          menuEntry[attr] = ceCustomActions.runCustomActions[attr];
        }
        menu.addEntry(menuEntry);
        return menu;
      }

      return undefined;
    }

    function getCombinedMenu(ceRecord, actionSetName) {

      var welcomeMenu = getWelcomeMenu(ceRecord, actionSetName);
      if (!_.isUndefined(welcomeMenu)) {
        // remove the disconnect action because we manually add it to the UI
        var entries = welcomeMenu.entries;
        if (entries.length > 0) {
          var lastMenuEntry = entries[entries.length - 1];
          if (!_.isUndefined(lastMenuEntry.actions) && lastMenuEntry.actions.length > 0) {
            var action = lastMenuEntry.actions[0];
            if (action.name === 'disconnect') {
              entries = entries.pop();
            }
          }
        }
      }
      return welcomeMenu;
    }

    function addDisconnectAction(actions) {
      actions.push({});
      actions[actions.length - 1]['disconnect'] = {
        "treatment": "none",
      };
    }

    function updateScheduleActionSetMap(ceRecord, actionSetName, actionSetValue) {
      if (!ceRecord.scheduleEventTypeMap) {
        ceRecord['scheduleEventTypeMap'] = {};
      }
      if (actionSetName === 'openHours') {
        ceRecord.scheduleEventTypeMap['open'] = actionSetName;
      } else if (actionSetName === 'closedHours') {
        ceRecord.scheduleEventTypeMap['closed'] = actionSetName;
      } else if (actionSetName === 'holidays') {
        ceRecord.scheduleEventTypeMap['holiday'] = actionSetValue;
      }
    }

    function updateDefaultActionSet(ceRecord, hasClosedHours) {
      if (_.isUndefined(hasClosedHours) && !_.isEmpty(ceRecord.defaultActionSet)) {
        return;
      }
      if (hasClosedHours) {
        ceRecord.defaultActionSet = 'closedHours';
      } else {
        ceRecord.defaultActionSet = 'openHours';
      }
    }

    function updateCombinedMenu(ceRecord, actionSetName, aaCombinedMenu, actionSetValue) {

      updateScheduleActionSetMap(ceRecord, actionSetName, actionSetValue);

      updateMenu(ceRecord, actionSetName, aaCombinedMenu);
      if (aaCombinedMenu.length > 0) {
        if (aaCombinedMenu[aaCombinedMenu.length - 1].getType() === 'MENU_OPTION') {
          updateMenu(ceRecord, actionSetName, aaCombinedMenu[aaCombinedMenu.length - 1]);
        } else {
          deleteMenu(ceRecord, actionSetName, 'MENU_OPTION');
        }
      }
      // manually add a disconnect action to each defined actionSet
      var actionSet = getActionSet(ceRecord, actionSetName);
      if (actionSet.actions && actionSet.actions.length > 0) {
        if (_.isUndefined(actionSet.actions[actionSet.actions.length - 1].disconnect)) {
          addDisconnectAction(actionSet.actions);
        }
      }
    }

    /*
     * getActionIndex return the index to the given actionName in actionArray.
     *
     * actionArray: array of actions.
     * actionName: 'play', 'route', etc.
     */
    function getActionIndex(actionArray, actionName) {
      if (_.isUndefined(actionArray) || actionArray === null) {
        return -1;
      }

      if (_.isUndefined(actionName) || actionName === null) {
        return -1;
      }

      if (!_.isArray(actionArray)) {
        return -1;
      }

      for (var i = 0; i < actionArray.length; i++) {
        if (!_.isUndefined(actionArray[i][actionName])) {
          return i;
        }
      }
      // No Custom Menu found
      return -1;
    }

    function getActionObject(actionArray, actionName) {
      var i = getActionIndex(actionArray, actionName);
      if (i >= 0) {
        return actionArray[i];
      }
      return undefined;
    }

    /*
     * Walk the ceRecord and return the actionSet actionSetName.
     */
    function getActionSet(ceRecord, actionSetName) {
      if (!_.isArray(ceRecord.actionSets)) {
        return undefined;
      }
      for (var i = 0; i < ceRecord.actionSets.length; i++) {
        if (!_.isUndefined(ceRecord.actionSets[i].name) && ceRecord.actionSets[i].name === actionSetName) {
          return ceRecord.actionSets[i];
        }
      }
      return undefined;
    }

    /*
     * Walk the ceRecord and return the given actionSet actionSetName if found.
     * Construct and return one if not found.
     */
    function getAndCreateActionSet(ceRecord, actionSetName) {
      if (_.isUndefined(ceRecord.actionSets)) {
        ceRecord.actionSets = [];
      }

      var actionSet = getActionSet(ceRecord, actionSetName);
      if (_.isUndefined(actionSet)) {
        var i = ceRecord.actionSets.length;
        // add new actionSetName into actions array
        ceRecord.actionSets[i] = {};
        ceRecord.actionSets[i].name = actionSetName;
        ceRecord.actionSets[i].actions = [];
        actionSet = ceRecord.actionSets[i];
      }

      return actionSet;
    }

    function updateCustomMenu(ceRecord, actionSetName, aaMenu) {
      if (_.isUndefined(aaMenu.type) || aaMenu.type !== 'MENU_CUSTOM') {
        return false;
      }

      var actionSet = getAndCreateActionSet(ceRecord, actionSetName);

      var customAction = getActionObject(actionSet.actions, 'runCustomActions');
      if (_.isUndefined(customAction)) {
        var i = actionSet.actions.length;
        actionSet.actions[i] = {};
        actionSet.actions[i].runCustomActions = new CustomAction();
        customAction = actionSet.actions[i];
      }

      for (var attr in customAction['runCustomActions']) {
        customAction['runCustomActions'][attr] = aaMenu.entries[0][attr];
      }
      return true;
    }

    function createWelcomeMenu(aaMenu) {
      var newActionArray = [];
      for (var i = 0; i < aaMenu.entries.length; i++) {
        var menuEntry = aaMenu.entries[i];
        newActionArray[i] = {};
        if (menuEntry.type === 'MENU_OPTION') {
          newActionArray[i].runActionsOnInput = newRunActionsOnInput();
          createOptionMenu(newActionArray[i].runActionsOnInput, menuEntry);
        } else {
          if (!_.isUndefined(menuEntry.actions) && menuEntry.actions.length > 0) {
            var actionName = menuEntry.actions[0].getName();
            newActionArray[i][actionName] = {};
            if (!_.isUndefined(menuEntry.actions[0].description) && menuEntry.actions[0].description.length > 0) {
              newActionArray[i][actionName].description = menuEntry.actions[0].description;
            }
            if (actionName === 'say') {
              newActionArray[i][actionName].value = encodeUtf8(menuEntry.actions[0].getValue());
              newActionArray[i][actionName].voice = menuEntry.actions[0].voice;
            } else if (actionName === 'play') {
              newActionArray[i][actionName].url = menuEntry.actions[0].getValue();
              newActionArray[i][actionName].voice = menuEntry.actions[0].voice;
              newActionArray[i][actionName].deleteUrl = menuEntry.actions[0].deleteUrl;
              // newActionArray[i][actionName].url = MediaResourceService.getFileUrl(menuEntry.actions[0].getValue());
            } else if (actionName === 'route') {
              newActionArray[i][actionName].destination = menuEntry.actions[0].getValue();
            } else if (actionName === 'routeToVoiceMail') {
              newActionArray[i][actionName].id = menuEntry.actions[0].getValue();
            } else if (actionName === 'routeToUser') {
              newActionArray[i][actionName].id = menuEntry.actions[0].getValue();
            } else if (actionName === 'disconnect') {
              if (menuEntry.actions[0].getValue() && menuEntry.actions[0].getValue() !== 'none') {
                newActionArray[i][actionName].treatment = menuEntry.actions[0].getValue();
              }
            } else if (actionName === 'goto') {
              newActionArray[i][actionName].ceid = menuEntry.actions[0].getValue();
            } else if (actionName === 'routeToHuntGroup') {
              newActionArray[i][actionName].id = menuEntry.actions[0].getValue();
            } else if (actionName === 'routeToSipEndpoint') {
              newActionArray[i][actionName].url = menuEntry.actions[0].getValue();
            } else if (actionName === 'routeToQueue') {
              newActionArray[i][actionName] = populateRouteToQueue(menuEntry.actions[0]);
            } else if (actionName === 'runActionsOnInput') {
              if (_.includes([DIGITS_DIAL_BY, DIGITS_RAW, DIGITS_CHOICE], menuEntry.actions[0].inputType)) {
                // dial by extension of caller input
                newActionArray[i][actionName] = populateRunActionsOnInput(menuEntry.actions[0]);
                newActionArray[i][actionName].attempts = menuEntry.attempts;
                newActionArray[i][actionName].voice = menuEntry.actions[0].voice;
                newActionArray[i][actionName].language = menuEntry.actions[0].language;
              }
            } else if (actionName === 'conditional') {
              newActionArray[i][actionName] = createConditional(menuEntry.actions[0]);
            }
          }
        }
      }
      return newActionArray;
    }
    function createInListObj(action) {
      return AAUtilityService.generateFunction(action.if.leftCondition, AAUtilityService.splitOnCommas(action.if.rightCondition));
    }

    function createObj(tag, action) {
      var out = {};
      var destObj = {};
      /* special case routeToQueue */
      if (_.get(action.then, 'name') === 'routeToQueue') {
        destObj = populateRouteToQueue(action.then);
      } else {
        destObj[tag] = action.then.value;
      }
      out[action.then.name] = destObj;

      return out;

    }

    function createFalseObj() {
      var out = {};
      out.say = {};
      out.say.value = '';
      return out;
    }

    function createConditional(action) {

      var out = {};
      var tag;

      /* as of now, all are InList type expressions. callerReturned is not
         implemented yet.
      */

      out.expression = createInListObj(action);

      out.true = [];
      out.false = [];

      switch (action.then.name) {
        case 'route':
          tag = 'destination';
          break;
        case 'goto':
          tag = 'ceid';
          break;
        default:
          tag = 'id';
      }

      out.true.push(createObj(tag, action));
      out.false.push(createFalseObj());

      return out;

    }

    function updateWelcomeMenu(ceRecord, actionSetName, aaMenu) {
      if (_.isUndefined(aaMenu.type) || aaMenu.type !== 'MENU_WELCOME') {
        return false;
      }

      if (_.isUndefined(ceRecord.actionSets)) {
        ceRecord.actionSets = [];
      }

      var actionSet = getAndCreateActionSet(ceRecord, actionSetName);
      actionSet.actions = createWelcomeMenu(aaMenu);

      return true;
    }

    function createActionArray(actions) {
      var newActionArray = [];
      for (var i = 0; i < actions.length; i++) {
        newActionArray[i] = {};
        var actionName = actions[i].getName();
        var val = actions[i].getValue();
        newActionArray[i][actionName] = {};
        if (actionName === 'say') {
          newActionArray[i][actionName].value = encodeUtf8(val);
          newActionArray[i][actionName].voice = actions[i].voice;
        } else if (actionName === 'play') {
          // convert unique filename to corresponding URL
          newActionArray[i][actionName].url = encodeUtf8(val);
          newActionArray[i][actionName].voice = actions[i].voice;
          newActionArray[i][actionName].deleteUrl = actions[i].deleteUrl;
          // newActionArray[i][actionName].url = MediaResourceService.getFileUrl(val);
        } else if (actionName === 'route') {
          newActionArray[i][actionName].destination = val;
        } else if (actionName === 'routeToExtension') {
          newActionArray[i][actionName].destination = val;
        } else if (actionName === 'routeToVoiceMail') {
          newActionArray[i][actionName].id = val;
        } else if (actionName === 'routeToHuntGroup') {
          newActionArray[i][actionName].id = val;
        } else if (actionName === 'routeToUser') {
          newActionArray[i][actionName].id = val;
        } else if (actionName === 'goto') {
          newActionArray[i][actionName].ceid = val;
        } else if (actionName === 'routeToSipEndpoint') {
          newActionArray[i][actionName].url = val;
        } else if (actionName === 'routeToQueue') {
          newActionArray[i][actionName] = populateRouteToQueue(actions[i]);
        } else if (actionName === 'disconnect') {
          if (val && val !== 'none') {
            newActionArray[i][actionName].treatment = val;
          }
        } else if (actionName === 'runActionsOnInput') {
          newActionArray[i][actionName] = populateRunActionsOnInput(actions[i]);
        } else if (actionName === 'repeatActionsOnInput' && _.has(actions[i], 'level')) {
          newActionArray[i][actionName].level = actions[i].level;
        }

        if (!_.isUndefined(actions[i].description) && actions[i].description.length > 0) {
          newActionArray[i][actionName].description = actions[i].description;
        }
      }
      return newActionArray;
    }
    /*
    * Method for route to queue prior to CES def
    */
    function populateRouteToQueue(action) {
      var newAction = {};
      if (action) {
        newAction.id = action.value;
        newAction.language = action.queueSettings.language;
        newAction.voice = action.queueSettings.voice;
        newAction.queueMoH = action.queueSettings.musicOnHold.actions[0].getValue();
        newAction.queueInitialAnnouncement = action.queueSettings.initialAnnouncement.actions[0].getValue();
        var queuePeriodicAnnouncement = action.queueSettings.periodicAnnouncement.actions[0].getValue();
        var queuePeriodicAnnouncementInterval = action.queueSettings.periodicAnnouncement.actions[0].interval;
        var paAction = [];
        var paActionArray = {
          queuePeriodicAnnouncement: queuePeriodicAnnouncement,
          queuePeriodicAnnouncementInterval: queuePeriodicAnnouncementInterval,
        };
        paAction.push(paActionArray);
        newAction.queuePeriodicAnnouncements = paAction;
        var queueMaxTimeValue = action.queueSettings.maxWaitTime;

        newAction.queueMaxTime = (queueMaxTimeValue.label);
        if (_.isUndefined(queueMaxTimeValue.label)) {
          newAction.queueMaxTime = queueMaxTimeValue;
        }
        var destination = action.queueSettings.fallback.actions[0];
        var destinationName = destination.name;
        var fallbackAction = {};
        if (destinationName === 'disconnect') {
          fallbackAction[destinationName] = { treatment: 'none' };
        } else if (destinationName === 'route') {
          fallbackAction[destinationName] = { destination: destination.value, description: destination.description };
        } else if (destinationName === 'goto') {
          fallbackAction[destinationName] = { ceid: destination.value, description: destination.description };
        } else if (destinationName === 'routeToSipEndpoint') {
          fallbackAction[destinationName] = { url: destination.value, description: destination.description };
        } else {
          fallbackAction[destinationName] = { id: destination.value, description: destination.description };
        }
        var queueMaxDestination = fallbackAction;
        newAction.queueFallback = queueMaxDestination;
        if (_.isEmpty(action.description)) {
          //for default queue settings
          action.description = {
            musicOnHoldDescription: '',
            periodicAnnouncementType: 'play',
            periodicAnnouncementDescription: '',
            initialAnnouncementType: 'play',
            initialAnnouncementDescription: '',
          };
        }
        newAction.description = JSON.stringify(action.description);
      }
      return newAction;
    }
    /*
     * Set the defaults for Dial by Extension
     */
    function populateRunActionsOnInput(action) {
      var newAction = {};
      var prompts = {};
      var sayListArr = [];
      var playListArr = [];
      var playList = {};
      var sayList = {};
      var rawInputAction = {};
      var routeToExtension = {};
      var assignVar = {};
      if (!_.isUndefined(action.inputType)) {
        newAction.inputType = action.inputType;
        if (action.deleteUrl && _.startsWith(action.value, 'http')) {
          playList.url = encodeUtf8(action.value);
          playList.deleteUrl = encodeUtf8(action.deleteUrl);
          playListArr[0] = playList;
          prompts.playList = playListArr;
        } else {
          sayList.value = encodeUtf8(action.value);
          sayListArr[0] = sayList;
          prompts.sayList = sayListArr;
        }
        newAction.prompts = prompts;
        if (newAction.inputType == 2 && !_.isUndefined(action.value)) {
          newAction.description = action.description;
          routeToExtension.destination = '$Input';
          routeToExtension.description = action.description;
          rawInputAction.routeToExtension = routeToExtension;
          newAction.rawInputActions = [];
          newAction.rawInputActions[0] = rawInputAction;
          newAction.minNumberOfCharacters = action.minNumberOfCharacters;
          newAction.maxNumberOfCharacters = action.maxNumberOfCharacters;
          newAction.attempts = 3;
          newAction.repeats = 2;
        } else {
          newAction.description = action.description;
          assignVar.value = '$Input';
          assignVar.variableName = action.variableName;
          rawInputAction.assignVar = assignVar;
          newAction.rawInputActions = [];
          newAction.rawInputActions[0] = rawInputAction;

          if (newAction.inputType === 4) {
            newAction.inputs = [];
            _.forEach(action.inputActions, function (inputAction) {
              var assignVar = {};
              var assignVarItem = {};
              var inputItem = {};
              inputItem.actions = [];
              // remove input fields with blank values
              if (!_.isEmpty(inputAction.value)) {
                inputItem.input = inputAction.key;
                assignVarItem.variableName = action.variableName;
                assignVarItem.value = inputAction.value;
                assignVar.assignVar = assignVarItem;

                inputItem.actions.push(assignVar);

                newAction.inputs.push(inputItem);
              }
            });

          }

          newAction.minNumberOfCharacters = 1;
          newAction.maxNumberOfCharacters = action.maxNumberOfCharacters;
          newAction.language = action.language;
          newAction.voice = action.voice;
        }
      }
      return newAction;
    }
    /*
     * Read aaMenu and populate mainMenu object
     */
    function createOptionMenu(inputAction, aaMenu) {

      // create menuOptions section
      var newOptionArray = [];
      var menuEntry;

      for (var i = 0; i < aaMenu.entries.length; i++) {
        menuEntry = aaMenu.entries[i];
        // skip incomplete key/action definition
        if (menuEntry.key && _.has(menuEntry, 'actions') && menuEntry.actions.length > 0 && menuEntry.actions[0].name) {
          var newOption = {};
          newOption.description = menuEntry.description;
          newOption.input = menuEntry.key;
          newOption.actions = createActionArray(menuEntry.actions);
          newOptionArray.push(newOption);
        } else if (menuEntry.key && _.has(menuEntry, 'entries') && _.has(menuEntry, 'headers')) {
          newOption = {};
          if (!_.isUndefined(menuEntry.description)) {
            newOption.description = menuEntry.description;
          }
          newOption.input = menuEntry.key;
          newOption.actions = [];
          newOption.actions[0] = {};
          var _menu = newRunActionsOnInput();
          // for submenu, always return to parent when invalid inputs timeout.
          newOption.actions[0]['runActionsOnInput'] = _menu;
          newOption.actions[0]['runActionsOnInput']['incompleteInputActions'] = [{
            "repeatActionsOnInput": {
              "level": -1,
            },
          }];
          createOptionMenu(_menu, menuEntry);
          newOptionArray.push(newOption);
        }
      }

      // sort menu keys in ascending order
      newOptionArray.sort(function (a, b) {
        return a.input.localeCompare(b.input);
      });

      // create prompts section
      if (aaMenu.headers.length > 0) {
        menuEntry = aaMenu.headers[0];
        inputAction.prompts = {};
        var list = createSayList(menuEntry);
        //the playList is valid once a valid
        //deleteUrl has been configured
        //else it will go to a sayList, blank or otherwise
        //which is used later to trigger play or say
        if (_.get(list, '[0].deleteUrl', undefined)) {
          inputAction.prompts.playList = list;
        } else {
          inputAction.prompts.sayList = list;
        }
        // say list moves the description from the action to
        // the menuEntry so it is saved here. DB complains otherwise
        inputAction.prompts.description = menuEntry.description;
        if (_.has(aaMenu, 'attempts')) {
          inputAction.attempts = aaMenu.attempts;
        }
        inputAction.language = menuEntry.getLanguage();
        inputAction.voice = menuEntry.getVoice();
        // for Dial by Extension we need to copy the Phone Menu voice & language
        _.each(newOptionArray, function (obj) {
          if (obj.actions[0].runActionsOnInput &&
            obj.actions[0].runActionsOnInput.inputType === 2) {
            obj.actions[0].runActionsOnInput.voice = inputAction.voice;
            obj.actions[0].runActionsOnInput.language = inputAction.language;
          }
        });
      }

      if (aaMenu.headers.length > 1) {
        // create default action
        i = aaMenu.entries.length;
        menuEntry = aaMenu.headers[1];
        if (!_.isUndefined(menuEntry.actions) && menuEntry.actions.length > 0) {
          newOptionArray[i] = {};
          newOptionArray[i].description = menuEntry.description;
          newOptionArray[i].input = 'default';
          newOptionArray[i].actions = createActionArray(menuEntry.actions);
        }
      }

      // create timeout section
      // i = aaMenu.entries.length;
      // menuEntry = aaMenu.headers[2];
      // newOptionArray[i] = {};
      // newOptionArray[i].description = menuEntry.description;
      // newOptionArray[i].input = 'timeout';
      // newOptionArray[i].actions = createActionArray(menuEntry.actions);
      // inputAction.timeoutInSeconds = menuEntry.getTimeout();

      inputAction.inputs = newOptionArray;
    }

    function updateOptionMenu(ceRecord, actionSetName, aaMenu) {
      if (_.isUndefined(aaMenu.type) || aaMenu.type !== 'MENU_OPTION') {
        return false;
      }

      var actionSet = getAndCreateActionSet(ceRecord, actionSetName);
      var inputAction = getActionObject(actionSet.actions, 'runActionsOnInput');
      if (_.isUndefined(inputAction)) {
        var i = actionSet.actions.length;
        actionSet.actions[i] = {};
        actionSet.actions[i].runActionsOnInput = newRunActionsOnInput();
        inputAction = actionSet.actions[i];
      }
      createOptionMenu(inputAction.runActionsOnInput, aaMenu);

      return true;
    }

    function updateMenu(ceRecord, actionSetName, aaMenu) {
      if (_.isUndefined(aaMenu.type) || aaMenu.type === null) {
        return false;
      }
      if (aaMenu.type === 'MENU_WELCOME') {
        updateWelcomeMenu(ceRecord, actionSetName, aaMenu);
      } else if (aaMenu.type === 'MENU_OPTION') {
        updateOptionMenu(ceRecord, actionSetName, aaMenu);
      } else if (aaMenu.type === 'MENU_CUSTOM') {
        updateCustomMenu(ceRecord, actionSetName, aaMenu);
      }
      return true;
    }

    /*
     * actionSetName: 'regularOpenActions'
     * aaMenuType: 'MENU_CUSTOM', 'MENU_MAIN'
     * ceRecord: a customer AA record
     */
    function deleteMenu(ceRecord, actionSetName, aaMenuType) {

      if (_.isUndefined(actionSetName) || actionSetName === null) {
        return false;
      }

      if (_.isUndefined(aaMenuType) || aaMenuType === null) {
        return false;
      }

      if (_.isUndefined(ceRecord) || ceRecord === null) {
        return false;
      }

      // get the action object of actionSetName
      //
      var actionSet = getActionSet(ceRecord, actionSetName);
      if (_.isUndefined(actionSet)) {
        return false;
      }

      if (_.isUndefined(actionSet.actions)) {
        return false;
      }

      var aaActionArray = actionSet.actions;
      var i = -1;
      if (aaMenuType === 'MENU_CUSTOM') {
        i = getActionIndex(aaActionArray, 'runCustomActions');
      }

      if (aaMenuType === 'MENU_OPTION') {
        i = getActionIndex(aaActionArray, 'runActionsOnInput');
      }

      if (i >= 0) {
        aaActionArray.splice(i, 1);
        return true;
      }
      return false;
    }

    function deleteScheduleActionSetMap(ceRecord, actionSetName) {
      // remove associated schedule to actionSet map, e.g.,
      // scheduleEventTypeMap.open = 'openHours'
      var prop;
      if (!ceRecord.scheduleEventTypeMap) {
        return;
      }
      if (actionSetName === 'holidays') {
        prop = 'holiday';
      } else if (actionSetName === 'closedHours') {
        prop = 'closed';
      } else {
        prop = 'open';
      }
      if (prop) {
        delete ceRecord.scheduleEventTypeMap[prop];
      }
    }

    /*
     * actionSetName: 'regularOpenActions'
     * ceRecord: a customer AA record
     */
    function deleteCombinedMenu(ceRecord, actionSetName) {

      if (_.isUndefined(actionSetName) || actionSetName === null) {
        return false;
      }

      if (_.isUndefined(ceRecord) || ceRecord === null) {
        return false;
      }

      // remove associated schedule to actionSet map, e.g.,
      // scheduleEventTypeMap.open = 'openHours'
      deleteScheduleActionSetMap(ceRecord, actionSetName);

      // get the action object of actionSetName
      //
      for (var i = 0; i < ceRecord.actionSets.length; i++) {
        if (ceRecord.actionSets[i].name === actionSetName) {
          ceRecord.actionSets.splice(i, 1);
          return true;
        }
      }
      return false;
    }

    function objectType(obj) {
      if (obj) {
        var text = obj.constructor.toString();
        return text.match(/function (.*)\(/)[1];
      } else {
        return undefined;
      }
    }

    function getCeMenu(id) {
      return ceMenuMap[id];
    }

    function clearCeMenuMap() {
      ceMenuMap = {};
      ceMenuCount = 0;
    }

    function deleteCeMenuMap(menuId) {
      var menu = ceMenuMap[menuId];
      if (menu) {
        _.forEach(menu.entries, function (entry) {
          if (isCeMenu(entry)) {
            deleteCeMenuMap(entry.getId());
          }
        });
        delete ceMenuMap[menuId];
      }
    }

    function isCeMenu(obj) {
      return (objectType(obj) === 'CeMenu');
    }
    function isCeMenuEntry(obj) {
      return (objectType(obj) === 'CeMenuEntry');
    }


  }
})();
