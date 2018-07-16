import { FtswConfig } from './ftsw-config';
import { BsftOrder } from './bsft-order';
import { Site, ILicenseInfo } from './bsft-site';

export class FtswConfigService {

  private ftswConfig: FtswConfig;
  private editSite: Site | undefined;

  /* @ngInject */
  constructor() {
    this.ftswConfig = new FtswConfig();
    this.ftswConfig.licenses.push({
      name: 'standard',
      available: 35,
      total: 100,
    }, {
      name: 'places',
      available: 70,
      total: 100,
    });
  }

  public getFtswConfig(): FtswConfig {
    return _.cloneDeep(this.ftswConfig);
  }

  public getSites(): Site[] {
    return _.get(this.ftswConfig, 'sites', []);
  }

  public setSites(sites: Site[]) {
    _.set(this.ftswConfig, 'sites', sites);
  }

  public addSite(site: Site) {
    this.ftswConfig.sites.push(site);
  }

  public getOrders(): BsftOrder[] {
    return _.get(this.ftswConfig, 'orders', []);
  }

  public setOrders(orders: BsftOrder[]) {
    _.set(this.ftswConfig, 'Orders', orders);
  }

  public addOrder(order: BsftOrder) {
    this.ftswConfig.bsftOrders.push(order);
  }

  public removeSite(site: Site) {
    _.remove(this.ftswConfig.sites, (s) => s.name === site.name);
  }

  public getLicensesInfo(): ILicenseInfo[] {
    return _.get(this.ftswConfig, 'licenses', []);
  }

  public setLicensesInfo(licenses: ILicenseInfo[]) {
    _.set(this.ftswConfig, 'licenses', licenses);
  }

  public setEditSite(site: Site) {
    this.editSite = site;
  }

  public getEditSite() {
    const copySite = _.cloneDeep(this.editSite);
    this.editSite = undefined;
    return copySite;
  }

  public updateSite(site) {
    const siteindex = _.findIndex(this.getSites(), (findSite) => findSite.uuid === site.uuid);
    this.getSites()[siteindex] = site;
  }

  public removeDefault() {
    const site = _.find(this.getSites(), (findSite) => findSite.defaultLocation === true);
    site.defaultLocation = false;
    this.updateSite(site);
  }
}
