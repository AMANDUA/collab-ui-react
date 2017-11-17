#!/bin/bash

function ex_usage {
    >&2 echo "usage: $(basename "$0") <path-to-new-component-dir>"
    >&2 echo ""
    >&2 echo "ex."
    >&2 echo "  # make component dir in current working dir"
    >&2 echo "  $(basename "$0") my-component"
    >&2 echo ""
    >&2 echo "  # or specify path"
    >&2 echo "  $(basename "$0") ./path/to/create/my-component"
}


# early out if looking for usage
if [[ "$1" == "--help" \
    || "$1" == "-h" \
    || "$1" == "-?"
    || $# -eq 0 ]]; then
    ex_usage
    exit 1
fi

function kebab_case_to_pascal_case {
  sed -E 's/(^|-)([a-z])/\U\2/g'
}

function pascal_case_to_camel_case {
  sed -E 's/^([A-Z])/\L\1/'
}

function html_element_to_component_basename {
    echo "$1" | kebab_case_to_pascal_case
}

function html_element_to_directive_name {
    echo "$1" | kebab_case_to_pascal_case | pascal_case_to_camel_case
}

function subdir_path_to_ng_module_name {
    # remove './' prefix, then convert '/' chars to '.'
    echo "$1" | sed -e 's/^..//' | tr '/' .
}

function get_ng_module_name {
    local dir_name="$1"
    local THIS_PWD
    THIS_PWD="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # start search for relevant subdir from '.../app/modules'
    pushd "$THIS_PWD/../app/modules" > /dev/null
    local subdir_path
    subdir_path="$(find . -type d -name "${dir_name}")"
    subdir_path="$(subdir_path_to_ng_module_name "$subdir_path")"
    echo "$subdir_path"
    popd > /dev/null
}

dir_path="$1"
mkdir "$dir_path"

html_element_name="$(basename "$dir_path")"
js_component_file="${html_element_name}.component.ts"
js_component_file_no_ext="${html_element_name}.component"
js_component_spec_file="${html_element_name}.component.spec.ts"
template_file="${html_element_name}.html"
js_component_name="$(html_element_to_component_basename "$html_element_name")Component"
js_directive_name="$(html_element_to_directive_name "$html_element_name")"
js_controller_name="$(html_element_to_component_basename "$html_element_name")Controller"
ng_module_name="$(get_ng_module_name "$html_element_name")"

function print_index_ts {
    cat << _EOF
import { $js_component_name } from './${js_component_file_no_ext}';

export default angular.module('${ng_module_name}', [
  require('angular-translate'),
  require('collab-ui-ng').default,
])
  .component('${js_directive_name}', new ${js_component_name}())
  .name;
_EOF
}

function print_component_ts {
    cat << _EOF
class $js_controller_name implements ng.IComponentController {
}

export class $js_component_name implements ng.IComponentOptions {
  public controller = ${js_controller_name};
  public template = require('./${template_file}');
  public bindings = {};
}
_EOF
}

function print_component_spec_ts {
    cat << _EOF
import moduleName from './index';

describe('Component: ${js_directive_name}:', () => {
  beforeEach(function() {
    this.initModules(moduleName);
    this.injectDependencies(
      // TODO: add dependencies here
    );
  });

  // TODO: use as-appropriate
  beforeEach(function () {
    // this.compileTemplate('<${html_element_name}></${html_element_name}>');
    // this.compileComponent('${js_directive_name}', { ... });
  });

  describe('primary behaviors (view):', () => {
    it('...', function () {
      // TODO: implement
    });
  });

  describe('primary behaviors (controller):', () => {
    it('...', function () {
      // TODO: implement
    });
  });
});
_EOF
}

touch "${dir_path}/${template_file}"
print_component_ts > "${dir_path}/${js_component_file}"
print_component_spec_ts  > "${dir_path}/${js_component_spec_file}"
print_index_ts > "${dir_path}/index.ts"

function has_parent_index_ts {
    test -s "$(get_parent_index_ts_file "$1")"
}

function get_parent_index_ts_file  {
    echo "${1}/../index.ts"
}

function add_import_of_module_name {
    local dir_path="$1"
    local js_directive_name="$2"
    local html_element_name="$3"
    local parent_index_ts_file
    parent_index_ts_file="$(get_parent_index_ts_file "$dir_path")"
    local line_num_of_last_import_statement

    # grep for lines with 'import'-statement
    line_num_of_last_import_statement="$(grep -n "^import " "$parent_index_ts_file" 2>/dev/null | tail -1 | cut -d: -f1)"
    line_num_of_last_import_statement="${line_num_of_last_import_statement}"
    local import_statement="import ${js_directive_name}ModuleName from './${html_element_name}';"

    # if no line found, insert at line 1, otherwise insert after last import statement
    if [ -z "$line_num_of_last_import_statement" ]; then
        sed -i -E "1i $import_statement" "$parent_index_ts_file"
    else
        sed -i -E "${line_num_of_last_import_statement}a $import_statement" "$parent_index_ts_file"
    fi
}

if has_parent_index_ts "$dir_path"; then
    add_import_of_module_name "$dir_path" "$js_directive_name" "$html_element_name"
fi
