class CalendarServiceSettingsPageComponentCtrl implements ng.IComponentController {

  /* @ngInject */
  constructor(
    private Analytics,
  ) {
    this.Analytics.trackHSNavigation(Analytics.sections.HS_NAVIGATION.eventNames.VISIT_CAL_EXC_SETTINGS);
  }

}

export class CalendarServiceSettingsPageComponent implements ng.IComponentOptions {
  public controller = CalendarServiceSettingsPageComponentCtrl;
  public templateUrl = 'modules/hercules/service-settings/calendar-service-settings-page/calendar-service-settings-page.component.html';
}
