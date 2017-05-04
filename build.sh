#!/bin/bash

# import helper functions
# shellcheck disable=SC1091
source ./bin/include/pid-helpers
# shellcheck disable=SC1091
source ./bin/include/setup-helpers
# shellcheck disable=SC1091
source ./bin/include/env-var-helpers


# -----
# Phase 1: Pre-setup
# - look for any zombie instances of process names (there shouldn't be any when Jenkins runs this)
proc_names_to_scan="bin\\/sc gulp bin\\/spin"
for i in $proc_names_to_scan; do
    if [ -n "$(get_pids "$i")" ]; then
        echo "[WARN] stale process found: $i"
        kill_wait "$i"
    fi
done

# - detect if running in local dev environment, inject env vars as appropriate (this won't be needed
#   in a Jenkins build env, as env vars are injected via other means)
if ! is_ci; then
    echo "[INFO] detected running in local dev environment, injecting build env vars for \"dev\"."
    inj_build_env_vars_for "dev"
fi


# -----
# Phase 2: Dependencies
if [ -f "$BUILD_DEPS_ARCHIVE" ]; then
    # unpack previously built dependencies (but don't overwrite anything newer)
    echo "[INFO] Restoring previous deps..."
    tar --keep-newer-files -xf "$BUILD_DEPS_ARCHIVE"
fi

# shellcheck disable=SC2154
echo "[INFO] Inspecting checksums of $manifest_files from last successful build... "
# shellcheck disable=SC2154
checksums_ok=$(is_checksums_ok "$manifest_checksums_file" && echo "true" || echo "false")

echo "[INFO] Checking if it is time to refresh..."
min_refresh_period=$(( 60 * 60 * 24 ))  # 24 hours
# shellcheck disable=SC2154
time_to_refresh=$(is_time_to_refresh $min_refresh_period "$last_refreshed_file" \
    && echo "true" || echo "false")

echo "[INFO] checksums_ok: $checksums_ok"
echo "[INFO] time_to_refresh: $time_to_refresh"
if [ "$checksums_ok" = "true" ] && [ "$time_to_refresh" = "false" ]; then
    echo "[INFO] Install manifests haven't changed and not yet time to refresh, restore soft " \
        "dependencies..."
    ./setup.sh --restore
else
    # we want to fresh install npm dependencies
    echo "[INFO] Running 'setup'..."
    ./setup.sh

    # setup succeeded
    # shellcheck disable=SC2181
    if [ $? -eq 0 ]; then
        # - regenerate .manifest-checksums
        echo "[INFO] Generating new manifest checksums file..."
        mk_checksum_file "$manifest_checksums_file" "$manifest_files"

        # - regenerate .last-refreshed
        echo "[INFO] Generating new last-refreshed file..."
        mk_last_refreshed_file "$last_refreshed_file"

        # archive dependencies
        echo "[INFO] Generating new build deps archive for later re-use..."
        tar -cpf "$BUILD_DEPS_ARCHIVE" \
            "$last_refreshed_file" \
            "$manifest_checksums_file" \
            .cache/npm-deps-for-*.tar.gz

    # setup failed
    else
        # setup was triggered because one of the manifest files changed
        if [ "$checksums_ok" = "false" ]; then
            exit 1
        fi

        # setup was triggered only because refresh window has expired
        if [ "$time_to_refresh" = "true" ]; then
            echo "[INFO] 'setup.sh' failed, but was triggered only because the refresh window " \
                "expired, falling back to recent successfully built dependencies..."
            # re-use deps from previous successful build (if possible)
            ./setup.sh --restore
        else
            # refresh window hasn't expired
            exit 1
        fi
    fi
fi

# print top-level node module versions
npm ls --depth=1


# -----
# Phase 3: Build
function do_webpack {
    # - webpack loaders have caused segfaults frequently enough to warrant simply retrying the command
    #   until it succeeds
    # - as this script is run by a jenkins builder, the potential infinite loop is mitigated by the
    #   absolute timeout set for the job (currently 30 min.)
    local webpack_exit_code
    export npm_lifecycle_event="build"
    while true; do
        time nice -10 webpack --bail --profile --env.nolint --env.noprogress --devtool source-map
        webpack_exit_code=$?
        if [ "$webpack_exit_code" -ne 132 ] && \
            [ "$webpack_exit_code" -ne 137 ] && \
            [ "$webpack_exit_code" -ne 139 ] && \
            [ "$webpack_exit_code" -ne 255 ]; then
            break
        fi
    done
    return "$webpack_exit_code"
}

set -e

# notes:
# - building the prod-version of webpack takes 5+ min.
# - start it in the background at the beginning to leverage concurrency
#   - it is single-threaded, so will not monopolize all the available cpu
#   - capture the pid, so we can wait on it before proceeding to e2e tests
(
    set +e
    # - 'typings' seems to be required for webpack to succeed
    npm run typings
    time do_webpack
    echo $? > ./.cache/webpack_exit_code
    set -e
) &
webpack_pid=$!

npm run lint
npm run json-verify
npm run languages-verify
nice -15 npm run test -- --env.noprogress
set +e


# webpack must complete before running e2e tests
set -x
wait "$webpack_pid"
read -r webpack_exit_code < ./.cache/webpack_exit_code
[ "$webpack_exit_code" -eq 0 ] || exit "$webpack_exit_code"
set +x


# e2e tests
./e2e.sh | tee ./.cache/e2e-sauce-logs

# groom logs for cleaner sauce labs output
# shellcheck disable=SC1091
source ./bin/include/sauce-results-helpers
mk_test_report ./.cache/e2e-sauce-logs | tee "./.cache/e2e-report-for-${BUILD_TAG}"


# -----
# Phase 4: Package
# Check build number
if [ -n "$BUILD_NUMBER" ]; then
    echo "Build Number: $BUILD_NUMBER"
else
    echo "Build Number not set $BUILD_NUMBER"
    BUILD_NUMBER=0
fi
rm -f wx2-admin-web-client.*.tar.gz

# important: we untar with '--strip-components=1', so use 'dist/*' and NOT './dist/*'
tar -zcvf "$APP_ARCHIVE" dist/*
tar -zcvf "$SOURCE_MAP_ARCHIVE" dist-source-map/*
tar -zcvf "$COVERAGE_ARCHIVE" ./test/coverage/

# archive e2e test results
tar -cf "$E2E_TEST_RESULTS_ARCHIVE" "./test/e2e-protractor/reports/${BUILD_TAG}"
