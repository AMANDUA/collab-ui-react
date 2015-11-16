(function () {
  'use strict';

  /* @ngInject */
  function ExpresswayServiceSettingsController($state, $modal, ServiceDescriptor, Authinfo, USSService2, $stateParams, NotificationConfigService,
    MailValidatorService, XhrNotificationService, CertService, Notification, HelperNuggetsService) {
    var vm = this;
    vm.config = "";
    vm.wx2users = "";
    vm.serviceType = $stateParams.serviceType;
    vm.serviceId = HelperNuggetsService.serviceType2ServiceId(vm.serviceType);

    var readCerts = function () {
      CertService.getCerts(Authinfo.getOrgId()).then(function (res) {
        vm.certificates = res || [];
      }, function (err) {
        return XhrNotificationService.notify(err);
      });
    };

    vm.squaredFusionEc = false;
    vm.squaredFusionEcEntitled = Authinfo.isFusionEC();
    if (vm.squaredFusionEcEntitled) {
      ServiceDescriptor.isServiceEnabled("squared-fusion-ec", function (a, b) {
        vm.squaredFusionEc = b;
        if (vm.squaredFusionEc) {
          readCerts();
        }
      });
    }

    vm.storeEc = function () {
      ServiceDescriptor.setServiceEnabled("squared-fusion-ec", vm.squaredFusionEc,
        function (err) {
          // TODO: fix this callback crap!
          if (err) {
            XhrNotificationService.notify("Failed to enable Aware");
          }
        }
      );
      if (vm.squaredFusionEc) {
        readCerts();
      }
    };

    vm.loading = true;
    USSService2.getOrg(Authinfo.getOrgId()).then(function (res) {
      vm.loading = false;
      vm.sipDomain = res.sipDomain;
      vm.org = res || {};
    }, function (err) {
      //  if (err) return notification.notify(err);
    });

    vm.updateSipDomain = function () {
      vm.savingSip = true;

      USSService2.updateOrg(vm.org).then(function (res) {
        vm.savingSip = false;
      }, function (err) {
        vm.savingSip = false;
        Notification.error("hercules.errors.sipDomainInvalid");
      });
    };

    vm.config = "";
    NotificationConfigService.read(function (err, config) {
      vm.loading = false;
      if (err) {
        return XhrNotificationService.notify(err);
      }
      vm.config = config || {};
      if (vm.config.wx2users.length > 0) {
        vm.wx2users = _.map(vm.config.wx2users.split(','), function (user) {
          return {
            text: user
          };
        });
      } else {
        vm.wx2users = [];
      }
    });
    vm.cluster = $stateParams.cluster;

    vm.writeConfig = function () {
      vm.config.wx2users = _.map(vm.wx2users, function (data) {
        return data.text;
      }).toString();
      if (vm.config.wx2users && !MailValidatorService.isValidEmailCsv(vm.config.wx2users)) {
        Notification.error("hercules.errors.invalidEmail");
      } else {
        vm.savingEmail = true;
        NotificationConfigService.write(vm.config, function (err) {
          vm.savingEmail = false;
          if (err) {
            return XhrNotificationService.notify(err);
          }
        });
      }
    };

    vm.disableService = function (serviceId) {
      ServiceDescriptor.setServiceEnabled(serviceId, false, function (error) {
        // TODO: Strange callback result ???
        if (error !== null) {
          XhrNotificationService.notify(error);
        } else {
          $state.go(HelperNuggetsService.serviceType2RouteName(HelperNuggetsService.serviceId2ServiceType(serviceId)) + ".list", {
            serviceType: HelperNuggetsService.serviceId2ServiceType(serviceId)
          }, {
            reload: true
          });
        }
      });
    };

    vm.confirmDisable = function (serviceId) {
      $modal.open({
        templateUrl: "modules/hercules/expressway-service/confirm-disable-dialog.html",
        controller: DisableConfirmController,
        controllerAs: "disableConfirmDialog",
        resolve: {
          serviceId: function () {
            return serviceId;
          }
        }
      }).result.then(function () {
        vm.disableService(serviceId);
      });
    };

    vm.uploadCert = function (file) {
      if (!file) {
        return;
      }
      CertService.uploadCert(Authinfo.getOrgId(), file).then(readCerts, XhrNotificationService.notify);
    };

    vm.confirmCertDelete = function (cert) {
      $modal.open({
        templateUrl: "modules/hercules/expressway-service/confirm-certificate-delete.html",
        controller: ConfirmCertificateDeleteController,
        controllerAs: "confirmCertificateDelete",
        resolve: {
          cert: function () {
            return cert;
          }
        }
      }).result.then(readCerts);
    };

    vm.invalidEmail = function (tag) {
      Notification.error(tag.text + " is not a valid email");
    };
  }

  /* @ngInject */
  function DisableConfirmController(ServiceDescriptor, $modalInstance, serviceId) {
    var modalVm = this;
    modalVm.serviceId = serviceId;
    modalVm.serviceIconClass = ServiceDescriptor.serviceIcon(serviceId);

    modalVm.ok = function () {
      $modalInstance.close();
    };
    modalVm.cancel = function () {
      $modalInstance.dismiss();
    };
  }

  /* @ngInject */
  function ConfirmCertificateDeleteController(CertService, $modalInstance, XhrNotificationService, cert) {
    var vm = this;
    vm.cert = cert;
    vm.remove = function () {
      CertService.deleteCert(vm.cert.certId).then($modalInstance.close, XhrNotificationService.notify);
    };
    vm.cancel = function () {
      $modalInstance.dismiss();
    };
  }

  angular
    .module('Hercules')
    .controller('ExpresswayServiceSettingsController', ExpresswayServiceSettingsController);
}());