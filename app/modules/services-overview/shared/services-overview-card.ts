export interface ICardButton {
  name: string;
  buttonClass?: string;
  routerState?: string;
  buttonState?: string;
  externalLink?: string;
  onClick?: () => void;
}

export interface ICardStatus {
  status: string | undefined;
  text: string | undefined;
  routerState: string;
}

export enum CardType {
  cloud,
  hybrid,
  cmc,
}

export interface ICardParams {
  active?: boolean;
  display?: boolean;
  cardClass?: string;
  cardType?: CardType;
  description: string;
  icon?: string;
  name: string;
  template?: string;
  setupMode?: boolean;
  infoIcon?: string;
  infoText?: string;
}

export abstract class ServicesOverviewCard {

  private cardType: CardType;
  private description: string;
  private icon: string;
  private template: string;
  public cardClass: string;
  public active: boolean;
  public display: boolean;
  public loading = true;
  public name: string;
  public status: ICardStatus;
  public setupMode: boolean;
  public infoIcon: string;
  public infoText: string;

  public getCardType() {
    return this.cardType;
  }

  public showStatus() {
    return !this.loading && this.active && !!(this.status && this.status.status);
  }

  public abstract getButtons(): ICardButton[];

  public abstract getShowMoreButton(): ICardButton | undefined;

  public constructor({
    active = true,
    cardClass = 'cs-card',
    cardType = CardType.cloud,
    description,
    display = true,
    icon = '',
    name,
    template = 'modules/services-overview/shared/services-overview-card.html',
    setupMode = false,
    infoIcon = '',
    infoText = '',
  }: ICardParams) {
    this.active = active;
    this.cardClass = cardClass;
    this.cardType = cardType;
    this.description = description;
    this.display = display;
    this.icon = icon;
    this.name = name;
    this.template = template;
    this.setupMode = setupMode;
    this.infoIcon = infoIcon;
    this.infoText = infoText;
  }
}
