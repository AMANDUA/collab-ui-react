(function () {
  'use strict';

  angular.module('Core')
    .directive('crFileDrop', fileDrop);

  /* @ngInject */
  function fileDrop($window, $timeout) {
    var directive = {
      restrict: 'A',
      scope: {
        file: '=',
        fileName: '=',
        fileMaxSizeError: '&',
        fileTypeError: '&',
        fileValidator: '&',
        readingStrategy: '@',
      },
      link: link,
    };

    return directive;

    function link(scope, element, attrs) {
      var DRAG_OVER = 'dragover';

      element.on('dragover', onDragOverOrEnter);
      element.on('dragenter', onDragOverOrEnter);

      element.on('dragend', onDragEndOrLeave);
      element.on('dragleave', onDragEndOrLeave);

      element.on('drop', onDragEndOrLeave);
      element.on('drop', onDrop);

      function checkSize(size) {
        if (_.isUndefined(attrs.fileMaxSize) || (size / 1024) / 1024 < attrs.fileMaxSize) {
          return true;
        } else {
          if (_.isFunction(scope.fileMaxSizeError)) {
            scope.fileMaxSizeError();
          }
          return false;
        }
      }

      function isTypeValid(type, name) {
        if (_.isUndefined(attrs.fileType) || (type && attrs.fileType.indexOf(type) > -1)) {
          return true;
        } else {
          if (isSuffixValid(name)) {
            return true;
          } else if (_.isFunction(scope.fileTypeError)) {
            scope.fileTypeError();
          }
          return false;
        }
      }

      function isSuffixValid(name) {
        if (_.isString(name)) {
          var nameParts = name.split('.');
          var suffix = nameParts[nameParts.length - 1];
          if (attrs.fileSuffix && attrs.fileSuffix.indexOf(suffix) > -1) {
            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      function onDragOverOrEnter(event) {
        element.addClass(DRAG_OVER);
        event.preventDefault();
        event.dataTransfer = event.dataTransfer || event.originalEvent.dataTransfer;
        event.dataTransfer.dropEffect = 'copy';
      }

      function onDragEndOrLeave() {
        element.removeClass(DRAG_OVER);
      }

      function onDrop(event) {
        event.preventDefault();
        event.dataTransfer = event.dataTransfer || event.originalEvent.dataTransfer;
        var reader = new $window.FileReader();
        var file = event.dataTransfer.files[0];
        var name = file.name;
        var type = file.type;
        var size = file.size;
        reader.onload = onLoad;
        if (scope.readingStrategy === 'dataURL') {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }

        function onLoad(loadEvent) {
          if (checkSize(size) && isTypeValid(type, name)) {
            scope.$apply(function () {
              scope.file = loadEvent.target.result;
              scope.fileName = name;
              if (_.isFunction(scope.fileValidator)) {
                $timeout(function () {
                  scope.fileValidator();
                });
              }
            });
          }
        }
      }
    }
  }

})();
