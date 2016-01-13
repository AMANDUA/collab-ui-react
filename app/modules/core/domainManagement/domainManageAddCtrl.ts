namespace domainManagement {

  class DomainManageAddCtrl {
    private _domain;

    /* @ngInject */
    constructor(private $state, private DomainManagementService) {
    }

    public add() {
      let ctrl = this;

      this.DomainManagementService.addDomain(this._domain).then(
        function () {
          ctrl.$state.go('domainmanagement');
        },
        function (err) {
          console.log('could not add domain (example failure): ' + ctrl._domain + err);
        }
      )
    }

    public cancel() {
      this.$state.go('domainmanagement');
    }

    get domain() {
      return this._domain;
    }

    set domain(domain) {
      this._domain = domain;
    }

    //gui valid

    public validate() {
      if (this._domain && this._domain.length > 0) {

        if (/^(([^\.]+\.)+[^\.]{2,})$/g.test(this._domain)) {
          return {valid: true, empty: false};
        }
        //if (/^(([a-åA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9]){2,}$/g.test(this._domain)) {
        //  return {valid: true, empty: false};
        //}
        else {
          return {valid: false, empty: false};
        }
      }
      else {
        return {valid: false, empty: true};
      }
    }

    get isValid() {
      let validation = this.validate();
      return validation && validation.valid;
    }

    get addEnabled() {
      return this._domain && this._domain.length > 0 && this.isValid;
    }
  }
  angular
    .module('Core')
    .controller('DomainManageAddCtrl', DomainManageAddCtrl);
}
