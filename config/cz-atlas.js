'use strict';

var wrap = require('word-wrap');
var editor = require('editor');
var fs = require('fs');
var temp = require('temp').track();

var maxLineWidth = 100;

// Our custom implementation of commitizen (https://github.com/commitizen/cz-cli)
// used by `npm run commit` or 'git cz'
// Loosely based on:
// https://github.com/leonardoanalista/cz-customizable
// https://github.com/commitizen/cz-conventional-changelog
module.exports = {
  prompter: function (cz, commit) {
    console.log('\nLine 1 cropped at ' + maxLineWidth + ' characters. Subsequent lines wrapped after ' + maxLineWidth + ' characters.\n');

    var questions = [{
      type: 'list',
      name: 'type',
      message: 'Select the type of change that you\'re committing:',
      choices: [{
        name: 'feat:     A new feature (use WIP until feature is complete)',
        value: 'feat'
      }, {
        name: 'fix:      A bug fix (use WIP until fix is complete)',
        value: 'fix'
      }, {
        name: 'docs:     Documentation only changes',
        value: 'docs'
      }, {
        name: 'style:    Changes that do not affect the meaning of the code\n            (white-space, formatting, missing semi-colons, etc)',
        value: 'style'
      }, {
        name: 'refactor: A code change that neither fixes a bug or adds a feature',
        value: 'refactor'
      }, {
        name: 'perf:     A code change that improves performance',
        value: 'perf'
      }, {
        name: 'test:     Changes to automated tests',
        value: 'test'
      }, {
        name: 'chore:    Changes to the build process or auxiliary tools\n            and libraries such as documentation generation',
        value: 'chore'
      }, {
        name: 'revert:   Revert to a commit',
        value: 'revert'
      }, {
        name: 'WIP:      Work in progress',
        value: 'WIP'
      }]
    }, {
      type: 'list',
      name: 'module',
      message: 'Select the module affected by this change (use * for none):\n',
      choices: [
        'core',
        'devices',
        'ediscovery',
        'helpdesk',
        'hercules',
        'huron',
        'mediafusion',
        'messenger',
        'sunglight',
        'support',
        'trials',
        'users',
        'webex',
        '*',
        'CHANGELOG',
        'custom'
      ]
    }, {
      type: 'input',
      name: 'module',
      message: 'Enter text to describe the module:',
      when: function (answers) {
        return answers.module === 'custom';
      }
    }, {
      type: 'input',
      name: 'subject',
      message: 'Write a short description of the change (<80 chars). Begin with User Story or defect # if applicable:\n',
      validate: function (value) {
        return !!(value && value.length < 80);
      },
    }, {
      type: 'input',
      name: 'body',
      message: 'Write a longer description of the change (optional). Use "|" to break new line:\n'
    }, {
      type: 'input',
      name: 'footer',
      message: 'Provide any helpful links (e.g. Fixes #123).  User story, defect, or gist links are mandatory. Use "|" to break new line:\n'
    }, {
      type: 'expand',
      name: 'confirmCommit',
      message: function (answers) {
        var SEP = '--------------------------------------------------------';
        console.log('\n' + SEP + '\n' + buildCommit(answers) + '\n' + SEP + '\n');
        return 'Proceed with commit? (Y)es, (N)o, (E)dit w/editor';
      },
      choices: [{
        key: 'y',
        name: 'Yes',
        value: 'yes'
      }, {
        key: 'n',
        name: 'Abort commit',
        value: 'no'
      }, {
        key: 'e',
        name: 'Edit message',
        value: 'edit'
      }],
      default: 0
    }];

    cz.prompt(questions)
      .then(function (answers) {
        if (answers.confirmCommit === 'edit') {
          temp.open('ATLAS_GIT_COMMIT', function (err, info) {
            if (!err) {
              fs.write(info.fd, buildCommit(answers));
              fs.close(info.fd, function () {
                editor(info.path, function (code) {
                  if (code === 0) {
                    var commitStr = fs.readFileSync(info.path, {
                      encoding: 'utf8'
                    });
                    commit(commitStr);
                  } else {
                    console.log('Editor returned non zero value. Commit message was:\n' + buildCommit(answers));
                  }
                });
              });
            }
          });
        } else if (answers.confirmCommit === 'yes') {
          commit(buildCommit(answers));
        } else {
          console.log('Commit has been canceled.');
        }
      });
  }
};

function buildCommit(answers) {
  var wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: maxLineWidth
  };

  function addModule(module) {
    return '(' + module.trim() + '): ';
  }

  function addSubject(subject) {
    return subject.trim();
  }

  function escapeSpecialChars(result) {
    /* eslint no-param-reassign:0, no-useless-escape:0 */
    var specialChars = ['\`'];
    specialChars.forEach(function (item) {
      // For some strange reason, we have to pass additional '\' slash to commitizen. Total slashes are 4.
      // If user types "feat: `string`", the commit preview should show "feat: `\\string\\`".
      // Don't worry. The git log will be "feat: `string`"
      result = result.replace(new RegExp(item, 'g'), '\\\\`');
    });
    return result;
  }

  function parseNewLines(a) {
/* Looking at Angular JS changelog format, multiple blank lines are allowed
    var b;
    while ( (b = a.replace(/\|\|/g, '|')) !== a ) {
      a = b;
    }
*/
    if (a[a.length - 1] === '|') {
      a = a.slice(0, -1);
    }
    return a.split('|').join('\n');
  }

  // Hard limit this line
  var head = (answers.type + addModule(answers.module) + addSubject(answers.subject)).slice(0, maxLineWidth);

  // Wrap these lines at 100 characters
  var body = parseNewLines(wrap(answers.body, wrapOptions) || '');
  var footer = parseNewLines(wrap(answers.footer, wrapOptions) || '');

  var result = head;
  if (body) {
    result += '\n\n' + body;
  }
  if (footer) {
    result += '\n\n' + footer;
  }

  return escapeSpecialChars(result);
}
