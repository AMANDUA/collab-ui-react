require('./_wizard.scss');

(function () {
  'use strict';

  angular.module('Core')
    .factory('PromiseHook', PromiseHook)
    .controller('WizardCtrl', WizardCtrl)
    .directive('crWizard', crWizard)
    .directive('crWizardNav', crWizardNav)
    .directive('crWizardMain', crWizardMain)
    .directive('crWizardButtons', crWizardButtons);

  /* @ngInject */
  function PromiseHook($q) {
    return factory;

    function factory(scope, name, tabControllerAs, subTabControllerAs) {
      var promises = [];
      (function traverse(scope) {
        if (!scope) {
          return;
        }

        if (_.hasIn(scope, name)) {
          promises.push($q.resolve(scope[name]()));
          return;
        } else if (tabControllerAs || subTabControllerAs) {
          if (_.hasIn(scope, tabControllerAs + '.' + name)) {
            promises.push($q.resolve(scope[tabControllerAs][name]()));
            return;
          }
          if (_.hasIn(scope, subTabControllerAs + '.' + name)) {
            promises.push($q.resolve(scope[subTabControllerAs][name]()));
            return;
          }
        }

        traverse(scope.$$childHead);
        traverse(scope.$$nextSibling);
      })(scope.$$childHead);

      // If we need to wait for a promise, make the button spin
      if (promises.length > 0) {
        scope['wizard'].wizardNextLoad = true;
      }
      return $q.all(promises);
    }
  }

  /* @ngInject */
  function WizardCtrl($controller, $modal,
    $rootScope, $scope, $state, $stateParams, $timeout, $translate,
    Authinfo, Config, PromiseHook, SessionStorage) {
    var vm = this;
    vm.current = {};

    vm.currentTab = $stateParams.currentTab;
    vm.currentStep = $stateParams.currentStep;
    vm.onlyShowSingleTab = $stateParams.onlyShowSingleTab;
    vm.numberOfSteps = $stateParams.numberOfSteps;
    vm.showStandardModal = $stateParams.showStandardModal;

    vm.termsCheckbox = false;
    vm.isCustomerPartner = isCustomerPartner;
    vm.isFromPartnerLaunch = isFromPartnerLaunch;
    vm.hasDefaultButtons = hasDefaultButtons;
    vm.helpUrl = (Authinfo.isPartnerAdmin() || Authinfo.isPartnerSalesAdmin()) ? Config.partnerSupportUrl : Config.supportUrl;

    vm.getTabController = getTabController;
    vm.getSubTabController = getSubTabController;
    vm.getSubTabTitle = getSubTabTitle;

    vm.setSubTab = setSubTab;
    vm.resetSubTab = resetSubTab;
    vm.setTab = setTab;

    vm.previousTab = previousTab;
    vm.nextTab = nextTab;
    vm.previousStep = previousStep;
    vm.nextStep = nextStep;
    vm.goToStep = goToStep;
    vm.getRequiredTabs = getRequiredTabs;

    vm.isFirstTab = isFirstTab;
    vm.isLastTab = isLastTab;
    vm.isFirstStep = isFirstStep;
    vm.isLastStep = isLastStep;
    vm.isFirstTime = isFirstTime;
    vm.isWizardModal = isWizardModal;

    vm.nextText = $translate.instant('common.next');
    vm.isNextDisabled = false;

    vm.openTermsAndConditions = openTermsAndConditions;
    vm.closeModal = closeModal;
    vm.isCurrentTab = isCurrentTab;
    vm.loadOverview = loadOverview;
    vm.showDoItLater = false;
    vm.wizardNextLoad = false;

    vm.showSkipTabBtn = false;

    // If tabs change (feature support in SetupWizard) and a step is not defined, re-initialize
    $scope.$watchCollection('tabs', function (tabs) {
      if (tabs && tabs.length > 0 && _.isUndefined(vm.current.step)) {
        init();
      }
    });

    function initCurrent() {
      if ($stateParams.currentTab) {
        vm.current.tab = _.find(getTabs(), {
          name: $stateParams.currentTab,
        });
      } else {
        vm.current.tab = getTabs()[0];
      }

      if ($stateParams.currentSubTab) {
        vm.current.subTab = _.find(getTab().subTabs, {
          name: $stateParams.currentSubTab,
        });
      }

      var steps = getSteps();
      if (steps.length) {
        var index = _.findIndex(steps, {
          name: $stateParams.currentStep,
        });
        if (index === -1) {
          index = 0;
        }
        vm.current.step = steps[index];
      }

    }
    function init() {
      initCurrent();
      setNextText();
      vm.isNextDisabled = false;
    }

    function getSteps() {
      var tab = getTab();
      if (!_.isUndefined(tab) && _.isArray(tab.steps)) {
        return tab.steps;
      } else if (!_.isUndefined(tab) && _.isArray(tab.subTabs) && tab.subTabs.length > 0) {
        for (var i = 0; i < tab.subTabs.length; i++) {
          if (_.isUndefined(getSubTab()) || tab.subTabs[i] === getSubTab()) {
            vm.current.subTab = tab.subTabs[i];
            return tab.subTabs[i].steps;
          }
        }
      } else {
        return [];
      }
    }

    function getStep() {
      return vm.current.step;
    }

    function setStep(step) {
      vm.current.step = step;
      setNextText();
      vm.isNextDisabled = false;
    }

    function getStepName() {
      var step = getStep();
      if (step) {
        return step.name;
      }
    }

    function getSubTab() {
      return vm.current.subTab;
    }

    function setSubTab(subTab) {
      vm.current.subTab = subTab;
      if (!_.isUndefined(subTab)) {
        setStep(getSteps()[0]);
      }
    }

    function resetSubTab(stepIndex) {
      setSubTab(getSubTab());
      setStep(getSteps()[stepIndex || 0]);
    }

    function getTabs() {
      return $scope.tabs;
    }

    function getTab() {
      return vm.current.tab;
    }

    function setTab(tab, subTab, stepIndex) {
      vm.current.tab = tab;
      setSubTab(subTab);
      setStep(getSteps()[typeof stepIndex === 'undefined' ? 0 : stepIndex]);
    }

    function getSubTabTitle() {
      var tab = getTab();
      if (tab.subTabs) {
        for (var i = 0; i < tab.subTabs.length; i++) {
          if (tab.subTabs[i].name === getSubTab()) {
            return tab.subTabs[i].title;
          }
        }
      }
    }

    /* @ngInject */
    function getTabController($scope) {
      var tab = getTab();
      if (tab && tab.controller) {
        return $controller(tab.controller, {
          $scope: $scope,
        });
      }
    }

    /* @ngInject */
    function getSubTabController($scope) {
      var subTab = getSubTab();
      if (subTab && subTab.controller) {
        return $controller(subTab.controller, {
          $scope: $scope,
        });
      }
    }

    function loadOverview() {
      $state.go('overview');
    }

    function previousTab() {
      var tabs = getTabs();
      if (_.isArray(tabs)) {
        var tabIndex = tabs.indexOf(getTab());
        if (tabIndex > 0) {
          setTab(tabs[tabIndex - 1]);
        }
      }
    }

    function nextTab() {
      var tabs = getTabs();
      vm.wizardNextLoad = false;
      if (_.isArray(tabs)) {
        var tabIndex = tabs.indexOf(getTab());
        $scope.tabs[tabIndex].required = false;
        if (tabIndex + 1 < tabs.length) {
          setTab(tabs[tabIndex + 1]);
        } else if (tabIndex + 1 === tabs.length && _.isFunction($scope.finish)) {
          $timeout(function () {
            vm.wizardNextLoad = true;
          });
          $scope.finish();
        }
      }
    }

    function previousStep() {
      var steps = getSteps();
      if (_.isArray(steps)) {
        var index = steps.indexOf(getStep());
        if (index > 0) {
          setStep(steps[index - 1]);
        } else if (index === 0) {
          previousTab();
        }
      }
    }

    function nextStep() {
      var subTabControllerAs = _.isUndefined(getSubTab()) ? undefined : getSubTab().controllerAs;
      new PromiseHook($scope, getStepName() + 'Next', getTab().controllerAs, subTabControllerAs).then(function () {
        if (getTab().name === 'enterpriseSettings') {
          if (getStep().name === 'enterpriseSipUrl') {
            $rootScope.$broadcast('wizard-enterprise-sip-url-event');
          } else if (getStep().name === 'enterprisePmrSetup') {
            $rootScope.$broadcast('wizard-enterprise-pmr-event');
            nextStepSuccessful();
          } else {
            nextStepSuccessful();
          }
        } else {
          nextStepSuccessful();
        }
      }).finally(function () {
        vm.wizardNextLoad = false;
      });
    }

    var enterpriseSipSaveDeregister = $rootScope.$on('wizard-enterprise-sip-save', function () {
      nextStepSuccessful();
    });
    $scope.$on('$destroy', enterpriseSipSaveDeregister);

    function nextStepSuccessful() {
      var steps = getSteps();
      if (_.isArray(steps)) {
        var index = steps.indexOf(getStep());
        if (index + 1 < steps.length) {
          setStep(steps[index + 1]);
        } else if (index + 1 === steps.length) {
          nextTab();
        }
      }
    }

    function goToStep(requestedStep) {
      var steps = getSteps();
      if (_.isArray(steps)) {
        var index = _.map(steps, function (step) {
          return step.name;
        }).indexOf(requestedStep);
        if (index === -1 || index >= steps.length) {
          nextStep();
        } else if (index < steps.length) {
          setStep(steps[index]);
        }
      }
    }

    function getRequiredTabs() {
      return getTabs().filter(function (tab) {
        return tab.required;
      }).map(function (tab) {
        return $translate.instant(tab.label);
      });
    }

    function isCustomerPartner() {
      return Authinfo.hasRole('CUSTOMER_PARTNER');
    }

    function isFromPartnerLaunch() {
      return SessionStorage.get('customerOrgId') !== null;
    }

    function isFirstTab() {
      return getTabs().indexOf(getTab()) === 0;
    }

    function isLastTab() {
      var tabs = getTabs();
      return tabs.indexOf(getTab()) === tabs.length - 1;
    }

    function isFirstStep() {
      return getSteps().indexOf(getStep()) === 0;
    }

    function isLastStep() {
      var steps = getSteps();
      return steps.indexOf(getStep()) === steps.length - 1;
    }

    function isSingleTabSingleStep() {
      return vm.onlyShowSingleTab && vm.numberOfSteps === 1;
    }

    function isFirstTime() {
      return $scope.isFirstTime;
    }

    function isCurrentTab(tabName) {
      return tabName === vm.current.tab.name;
    }

    function isWizardModal() {
      return true;
    }

    function setNextText() {
      if ((isFirstTab() && isFirstTime() && !isCustomerPartner() && !isFromPartnerLaunch()) || (isFirstTab() && isFirstStep() && !isSingleTabSingleStep())) {
        vm.nextText = $translate.instant('firstTimeWizard.getStarted');
      } else if (isFirstTime() && isLastTab() && isLastStep()) {
        vm.nextText = $translate.instant('common.finish');
      } else if (isLastStep()) {
        vm.nextText = $translate.instant('common.save');
      } else {
        vm.nextText = $translate.instant('common.next');
      }

      // enable/disable skip tab button
      vm.showSkipTabBtn = (vm.isFirstTime() && (vm.current.tab.name === 'addUsers' || vm.current.tab.name === 'careSettings')
        && vm.isFirstStep());
    }

    $scope.$on('wizardNextButtonDisable', function (event, status) {
      event.stopPropagation();
      vm.isNextDisabled = status;
    });
    $scope.$on('wizardNextButtonLoading', function (event, status) {
      event.stopPropagation();
      vm.wizardNextLoad = status;
    });

    function openTermsAndConditions() {
      $modal.open({
        templateUrl: 'modules/core/wizard/termsAndConditions.tpl.html',
      });
    }

    function closeModal() {
      $state.modal.close();
    }

    function hasDefaultButtons() {
      if (vm.current.step) {
        return _.isUndefined(vm.current.step.buttons);
      }
      return false;
    }

    $scope.$on('wizardNextText', function (event, action) {
      event.stopPropagation();
      if (action == 'next') {
        vm.nextText = $translate.instant('common.next');
      } else if (action == 'finish') {
        vm.nextText = $translate.instant('common.save');
      }
    });

  }

  function crWizard() {
    var directive = {
      controller: 'WizardCtrl',
      controllerAs: 'wizard',
      restrict: 'AE',
      scope: {
        tabs: '=',
        finish: '=',
        isFirstTime: "=",
      },
      templateUrl: 'modules/core/wizard/wizard.tpl.html',
    };

    return directive;
  }

  function crWizardNav() {
    var directive = {
      require: '^crWizard',
      restrict: 'AE',
      templateUrl: 'modules/core/wizard/wizardNav.tpl.html',
    };

    return directive;
  }

  /* @ngInject */
  function crWizardMain($compile, $timeout) {
    var directive = {
      require: '^crWizard',
      restrict: 'AE',
      scope: true,
      templateUrl: 'modules/core/wizard/wizardMain.tpl.html',
      link: link,
    };

    return directive;

    function link(scope, element) {

      var cancelTabWatch = scope.$watch('wizard.current.tab', recompile);
      var cancelSubTabWatch = scope.$watch('wizard.current.subTab', recompile);

      function recompile(newValue, oldValue) {
        if (newValue !== oldValue && oldValue !== undefined) {
          cancelTabWatch();
          cancelSubTabWatch();
          $timeout(function () {
            var parentScope = scope.$parent;
            scope.$destroy();
            element.replaceWith($compile(element)(parentScope));
          });
        }
      }
    }
  }

  /* @ngInject */
  function crWizardButtons($compile, $timeout) {
    var directive = {
      restrict: 'AE',
      scope: true,
      templateUrl: 'modules/core/wizard/wizardButtons.tpl.html',
      link: link,
    };

    return directive;

    function link(scope, element) {

      var cancelStepWatch = scope.$watch('wizard.current.step', recompile);
      var wizardNextTextWatch = scope.$watch('wizard.nextText', recompile);

      function recompile(newValue, oldValue) {
        if (newValue !== oldValue) {
          cancelStepWatch();
          wizardNextTextWatch();
          $timeout(function () {
            var parentScope = scope.$parent;
            scope.$destroy();
            element.replaceWith($compile(element)(parentScope));
          });
        }
      }
    }
  }
})();
