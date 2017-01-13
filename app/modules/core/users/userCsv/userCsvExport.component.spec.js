'use strict';

describe('crUserCsvExport Component', function () {

  var DATA_URL = 'file_url.csv';
  var TRANSLATED_STRING = 'translated-string';

  var fakeModal = {
    result: {
      then: function (okCallback, cancelCallback) {
        this.okCallback = okCallback;
        this.cancelCallback = cancelCallback;
      }
    },
    close: function (item) {
      this.result.okCallback(item);
    },
    dismiss: function (type) {
      this.result.cancelCallback(type);
    }
  };

  ///////////////////

  function init() {
    this.initModules('Core', 'Huron', 'Sunlight');
    this.injectDependencies('$compile', '$componentController', '$modal', '$q', '$scope', '$rootScope', '$timeout', '$translate', 'Analytics', 'CsvDownloadService', 'Notification');
    initDependencySpies.apply(this);
    initUtils.apply(this);
  }

  function initDependencySpies() {
    spyOn(this.Notification, 'success');
    spyOn(this.CsvDownloadService, 'getCsv').and.returnValue(this.$q.when(DATA_URL));
    spyOn(this.CsvDownloadService, 'cancelDownload');
    spyOn(this.$modal, 'open').and.returnValue(fakeModal);
    spyOn(this.$translate, 'instant').and.returnValue(TRANSLATED_STRING);
    spyOn(this.$rootScope, '$emit');
    spyOn(this.Analytics, 'trackAddUsers').and.returnValue(this.$q.when({}));

  }

  function initUtils() {

    this.clickElement = function clickElement(selector) {
      this.element.find(selector)[0].click();
    };

    this.setElementValue = function setElementValue(selector, value) {
      $(this.element.find(selector)[0]).val(value).triggerHandler('input');
    };

  }

  function initComponent(html) {
    this.element = angular.element(html);
    this.element = this.$compile(this.element)(this.$scope);
    this.$scope.$digest();
    this.$timeout.flush();
    this.vm = this.element.isolateScope().$ctrl;
  }

  function initController() {
    this.vm = this.$componentController('crUserCsvExport', {
      $scope: this.$scope,
      $element: angular.element('')
    }, this.bindings);
    this.$scope.$apply();
    this.vm.$onInit();
  }

  afterEach(function () {
    if (this.element) {
      this.element.remove();
    }
  });

  beforeEach(init);

  /////////////

  describe('Component', function () {

    beforeEach(function () {
      this.$scope.testIsOverExportThreshold = false;
      this.$scope.onTestExportDownloadStatus = function () {
      };
      spyOn(this.$scope, 'onTestExportDownloadStatus');

      var html = '<cr-user-csv-export is-over-export-threshold="testIsOverExportThreshold" on-status-change="onTestExportDownloadStatus(isExporting, dataUrl)"></cr-user-csv-export>';
      initComponent.apply(this, [html]);
    });

    it('should have required HTML', function () {

      expect(this.vm.onStatusChange).toBeDefined();
      expect(this.vm.isOverExportThreshold).toBeFalsy();
      expect(this.$scope.onTestExportDownloadStatus).not.toHaveBeenCalled();

      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.element.find('[ng-click]')).toHaveLength(2);
      expect(this.element.find('[ng-click="$ctrl.exportCsv()"]')).toHaveLength(1);
      expect(this.element.find('[ng-click="$ctrl.downloadTemplate()"]')).toHaveLength(1);

      this.vm.isDownloading = true;
      this.$scope.$apply();

      expect(this.vm.isDownloading).toBeTruthy();
      expect(this.element.find('[ng-click]')).toHaveLength(1);
      expect(this.element.find('[ng-click="$ctrl.cancelDownload()"]')).toHaveLength(1);

      expect(this.element.find('.download-anchor')).toHaveLength(1);
    });

    it('should download template when button pressed', function () {
      expect(this.vm.isDownloading).toBeFalsy();

      // press the download template button
      this.clickElement('[ng-click="$ctrl.downloadTemplate()"]');
      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-begin');

      expect(this.vm.isDownloading).toBeTruthy();
      expect(this.$scope.onTestExportDownloadStatus).toHaveBeenCalledWith(true, undefined);

      this.$timeout.flush();
      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.$scope.onTestExportDownloadStatus).toHaveBeenCalledWith(false, DATA_URL);
      expect(this.Notification.success).toHaveBeenCalled();
      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-end');
    });

    it('should download csv when button pressed and download accepted', function () {
      expect(this.vm.isDownloading).toBeFalsy();

      // press the download CSV button
      this.clickElement('[ng-click="$ctrl.exportCsv()"]');

      // tell the modal it should close (OK)
      fakeModal.close();

      expect(this.$modal.open).toHaveBeenCalledTimes(1);

      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-begin');

      expect(this.vm.isDownloading).toBeTruthy();
      expect(this.$scope.onTestExportDownloadStatus).toHaveBeenCalledWith(true, undefined);

      this.$timeout.flush();
      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.$scope.onTestExportDownloadStatus).toHaveBeenCalledWith(false, DATA_URL);
      expect(this.Notification.success).toHaveBeenCalled();
      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-end');
    });

    it('should not download csv when button pressed and download canceled', function () {
      expect(this.vm.isDownloading).toBeFalsy();

      // press the download CSV button
      this.clickElement('[ng-click="$ctrl.exportCsv()"]');

      // tell the modal it should cancel (Cancel)
      fakeModal.result.cancelCallback = _.noop;
      fakeModal.dismiss();
      this.$scope.$apply();

      expect(this.$rootScope.$emit).not.toHaveBeenCalledWith('csv-download-begin');
      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.$scope.onTestExportDownloadStatus).not.toHaveBeenCalled();
      expect(this.$rootScope.$emit).not.toHaveBeenCalledWith('csv-download-begin');
    });

    it('should display warning if download exceeds maxUserThreshold', function () {
      this.$scope.testIsOverExportThreshold = true;

      expect(this.vm.isDownloading).toBeFalsy();

      // press the download CSV button
      this.clickElement('[ng-click="$ctrl.exportCsv()"]');

      // close the first export confirm dialog
      fakeModal.close();

      // warning dialog should appear.  close it to start download
      fakeModal.close();

      expect(this.$modal.open).toHaveBeenCalledTimes(2);

      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-begin');

      expect(this.vm.isDownloading).toBeTruthy();
      expect(this.$scope.onTestExportDownloadStatus).toHaveBeenCalledWith(true, undefined);

      this.$timeout.flush();
      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.$scope.onTestExportDownloadStatus).toHaveBeenCalledWith(false, DATA_URL);
      expect(this.Notification.success).toHaveBeenCalled();
      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-end');
    });

  });

  describe('Component as a link', function () {

    beforeEach(function () {
      this.$scope.testIsOverExportThreshold = false;
      this.$scope.onTestExportDownloadStatus = function () {
      };
      spyOn(this.$scope, 'onTestExportDownloadStatus');

      var html = '<cr-user-csv-export as-link="Click to Export" is-over-export-threshold="testIsOverExportThreshold" on-status-change="onTestExportDownloadStatus(isExporting, dataUrl)"></cr-user-csv-export>';
      initComponent.apply(this, [html]);

    });

    it('should have required HTML', function () {

      expect(this.vm.onStatusChange).toBeDefined();
      expect(this.vm.isOverExportThreshold).toBeFalsy();
      expect(this.$scope.onTestExportDownloadStatus).not.toHaveBeenCalled();

      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.element.find('[ng-click="$ctrl.downloadTemplate()"]')).toHaveLength(0);
      var exportElement = this.element.find('a[ng-click="$ctrl.exportCsv()"]');
      expect(exportElement).toBeDefined();


      this.vm.isDownloading = true;
      this.$scope.$apply();

      expect(this.vm.isDownloading).toBeTruthy();
      expect(this.element.find('[ng-click]')).toHaveLength(1);
      expect(this.element.find('[ng-click="$ctrl.cancelDownload()"]')).toHaveLength(1);
      expect(this.element.find('.icon.icon-spinner')).toHaveLength(1);
      expect(this.element.find('.download-anchor')).toHaveLength(1);
    });


  });

  /////////////

  describe('Controller', function () {

    beforeEach(function () {
      this.bindings = {
        onStatusChange: jasmine.createSpy('onStatusChange'),
        isOverExportThreshold: false,
        useCsvDownloadDirective: false
      };
      initController.apply(this);
    });

    it('should register/unregister event handlers over lifecycle', function () {

      var listeners = this.$rootScope.$$listeners;

      // event handlers should be registered on rootScope
      expect(_.isFunction(listeners['csv-download-request-started'][0])).toBeTruthy();
      expect(_.isFunction(listeners['csv-download-request-completed'][0])).toBeTruthy();

      this.vm.$onDestroy();

      // event handlers should no longer be registered on root scope
      expect(_.isFunction(listeners['csv-download-request-started'][0])).toBeFalsy();
      expect(_.isFunction(listeners['csv-download-request-completed'][0])).toBeFalsy();

    });

    it('should support downloadTemplate()', function () {

      expect(this.vm.isDownloading).toBeFalsy();
      this.vm.downloadTemplate();

      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-begin');
      expect(this.vm.isDownloading).toBeTruthy();
      expect(this.CsvDownloadService.getCsv).toHaveBeenCalledWith('template', false, 'template.csv');
      expect(this.bindings.onStatusChange).toHaveBeenCalledWith({
        isExporting: true
      });

      this.$scope.$apply();
      this.$timeout.flush();

      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.bindings.onStatusChange).toHaveBeenCalledWith({
        isExporting: false,
        dataUrl: DATA_URL
      });
      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-end');
    });

    it('should support exportCsv()', function () {

      expect(this.vm.isDownloading).toBeFalsy();
      this.vm.exportCsv();

      expect(this.$rootScope.$emit).not.toHaveBeenCalledWith('csv-download-begin');
      fakeModal.close();

      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-begin');
      expect(this.vm.isDownloading).toBeTruthy();
      expect(this.CsvDownloadService.getCsv).toHaveBeenCalledWith('user', false, TRANSLATED_STRING);
      expect(this.bindings.onStatusChange).toHaveBeenCalledWith({
        isExporting: true
      });

      this.$scope.$apply();
      this.$timeout.flush();

      expect(this.vm.isDownloading).toBeFalsy();
      expect(this.bindings.onStatusChange).toHaveBeenCalledWith({
        isExporting: false,
        dataUrl: DATA_URL
      });
      expect(this.$rootScope.$emit).toHaveBeenCalledWith('csv-download-end');
    });

    it('should support canceling download/export()', function () {
      this.vm.cancelDownload();
      expect(this.CsvDownloadService.cancelDownload).toHaveBeenCalled();
    });
  });

});
