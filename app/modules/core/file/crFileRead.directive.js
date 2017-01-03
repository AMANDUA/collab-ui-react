(function () {
  'use strict';

  angular.module('Core')
    .directive('crFileRead', fileRead);

  /* @ngInject */
  function fileRead($window) {
    var directive = {
      restrict: 'A',
      scope: {
        file: '=',
        fileName: '=',
        fileMaxSizeError: '&',
        fileTypeError: '&',
        readingStrategy: '@',
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs) {

      element.on('change', onChange);
      element.on('click', onClick);

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

      function onChange(changeEvent) {
        var reader = new $window.FileReader();
        var file = changeEvent.target.files[0];
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
            });
          }
        }
      }

      function onClick() {
        element.val('');
      }
    }

  }

})();
