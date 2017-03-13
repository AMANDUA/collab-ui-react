var fs = require('fs');
var _ = require('lodash');

var L10N_DIR = 'app/l10n';
var L10N_SOURCE_VALUE_REGEX = /(value:\s'[a-z]{2}_[A-Z]{2}')/g;
var L10N_SOURCE_REGEX = /[a-z]{2}_[A-Z]{2}/;
var L10N_SOURCE = 'app/modules/core/l10n/languages.js';

var languages = fs.readFileSync(L10N_SOURCE, 'utf8').match(L10N_SOURCE_VALUE_REGEX).map(function (language) {
  return language.match(L10N_SOURCE_REGEX)[0];
});

var files = fs.readdirSync(L10N_DIR).map(function (file) {
  return file.replace('.json', '');
});

var missingFiles = _.difference(languages, files);
if (missingFiles.length) {
  throw new Error('Localization files are missing for the following languages: ' + missingFiles.join(', '));
}

var missingRefs = _.difference(files, languages);
if (missingRefs.length) {
  throw new Error('The following localization files are not referenced in code: ' + missingRefs.join(', '));
}
