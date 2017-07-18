
interface IPoint {
  top: number;
  left: number;
}

interface IRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export class ScrollIndicatorController {

  public static readonly MORE_CONTENT_CHECK_INTERVAL = 500;
  public static readonly LAST_VISIBLE_ELEMENT_SELECTOR = `:last-child:last:visible`;

  private intervalPromise: ng.IPromise<boolean>;
  private _endOfContent;

  public moreContent = false;

  /* @ngInject */
  constructor(
    private $interval: ng.IIntervalService,
    private $element: ng.IAugmentedJQuery,
  ) { }

  private pointInRect(point: IPoint, rect: IRect): boolean {
    return point.left >= rect.left && point.left <= rect.right &&
      point.top >= rect.top && point.top <= rect.bottom;
  }

  public $onInit(): void {

    // set up an interval to test if we need to indicate scrolling
    this.intervalPromise = this.$interval(() => {
      this.moreContent = false;
      if (!angular.isElement(this._endOfContent)) {
        this._endOfContent = this.$element.find(ScrollIndicatorController.LAST_VISIBLE_ELEMENT_SELECTOR)[0];
      } else {
        // if the eoc tag is not in the clinet bounding rect, then we have content that is not visible
        const eocRect = this._endOfContent.getBoundingClientRect();
        const parentRect = this.$element[0].getBoundingClientRect();
        this.moreContent = !this.pointInRect(eocRect, parentRect);
      }
    }, ScrollIndicatorController.MORE_CONTENT_CHECK_INTERVAL);
  }

  public scrollToEnd(callback?: () => void): void {
    this.$element.animate({
      scrollTop: this.$element[0].scrollHeight,
    }, { complete: callback });
  }

  public $onDestroy(): void {
    // cancel the interval
    if (angular.isDefined(this.intervalPromise)) {
      this.$interval.cancel(this.intervalPromise);
    }
  }

}

export class ScrollIndicatorDirective implements ng.IDirective {
  public restrict = 'A';
  public controller = ScrollIndicatorController;
  public controllerAs = '$ctrl';
  public link: ng.IDirectiveLinkFn = (
    $scope: ng.IScope,
    $element: ng.IAugmentedJQuery,
  ) => {

    // add flag to the end of the content. When not visible, then we need
    // to scroll.
    $element.append($('<div class="scroll-indicator-eoc-tag"></div>'));

    $scope.$ctrl.indicatorElement = this.$compile(`
      <div ng-show="$ctrl.moreContent" class="scroll-indicator">
        <span class="icon icon-right-arrow-contain" ng-click="$ctrl.scrollToEnd()"></span>
      </div>`)($scope);

    // append html as a sibling after our element
    $scope.$ctrl.indicatorElement.insertAfter($element);
  }

  constructor(
    private $compile: ng.ICompileService,
  ) { }

  /* @ngInject */
  public static factory($compile) {
    return new ScrollIndicatorDirective($compile);
  }
}
