export class SettingSection {

  public title: string;
  public template: string;
  public subsectionLabel: string;
  public subsectionDescription: string;

  public key: string;
  public show: boolean = false;

  constructor(settingKey: string) {
    this.key = settingKey;

    this.title = `globalSettings.${ settingKey }.title`;
    this.subsectionLabel = `globalSettings.${ settingKey }.subsectionLabel`;
    this.subsectionDescription = `globalSettings.${ settingKey }.subsectionDescription`;
    this.template = ``;
  }
}
