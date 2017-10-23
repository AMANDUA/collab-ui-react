module.exports = {
  extends: ['../.eslintrc.js'],
  plugins: ['lodash', 'promise'],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  rules: {
    // custom rule defined in config/rules/protractor-guidelines.js
    // deactivated because tons of e2e tests do not pass it…
    'protractor-guidelines': 0,
    // ---
    'block-scoped-var': 0,
    'guard-for-in': 0,
    'no-cond-assign': 0,
    'no-extra-semi': 0,
    'no-lone-blocks': 0,
    'no-loop-func': 0,
    'no-param-reassign': 0,
    'no-trailing-spaces': 0,
    'one-var-declaration-per-line': 0,
    'one-var': 0,
    'radix': 0,
    'semi-spacing': 0,
    'semi': 0,
    'wrap-iife': 0,
    'yoda': 0,
  },
  globals: {
    _: true,
    $: true,
    activate: true,
    afterAll: true,
    afterEach: true,
    AmCharts: true,
    angular: true,
    autoattendant: true,
    bard: true,
    before: true,
    beforeAll: true,
    beforeEach: true,
    browser: true,
    by: true,
    callrouting: true,
    cdr: true,
    config: true,
    customers: true,
    deleteUtils: true,
    aaGetCeUtils: true,
    createUtils: true,
    describe: true,
    disyncwizard: true,
    download: true,
    element: true,
    enterpriseResource: true,
    expect: true,
    exports: true,
    fail: true,
    getJSONFixture: true,
    gssDashboard: true,
    gssComponent: true,
    gssService: true,
    gssIncident: true,
    helper: true,
    huntGroup: true,
    huronFeatures: true,
    careLandingPage: true,
    careFeatureLandingPage: true,
    careChatTemplateSetupPage: true,
    careVirtualAssistantTemplateSetupPage: true,
    careSettingsPage: true,
    inject: true,
    invite: true,
    inviteusers: true,
    isProductionBackend: true,
    it: true,
    jasmine: true,
    landing: true,
    log: true,
    login: true,
    manage: true,
    mediaservice: true,
    meetings: true,
    module: true,
    moment: true,
    navigation: true,
    notifications: true,
    orgprofile: true,
    partner: true,
    process: true,
    Promise: true,
    protractor: true,
    provisionerKeepCustomer: true,
    reports: true,
    require: true,
    roles: true,
    servicesetup: true,
    sinon: true,
    spyOn: true,
    ssowizard: true,
    support: true,
    telephony: true,
    trialextinterest: true,
    users: true,
    usersettings: true,
    utilization: true,
    utils: true,
    wizard: true,
    xdescribe: true,
    xit: true,
  }
};
