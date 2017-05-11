/**
 * This filter takes a directory number object from the CMI API
 * /voice/customers/:customerId/directorynumbers/:directoryNumberId
 * and filters the result to look like:
 * 501 and (707) 731-5745
 * or in the case of no externalNumber:
 * 501
 * @param {$translate} - Translate Service
 * @param {PhoneNumberService} - Telephone Number service located in modules/huron/phoneNumber/phoneNumber.service.ts
 * @return {string} - The formatted number string.
 */

/* @ngInject */
export function callParkReversionDirectoryNumberFilter($translate, PhoneNumberService) {
  return filter;

  function filter(number: any): string {
    let filteredNumber = _.get(number, 'pattern', '');
    let externalNumber = _.get(number, 'alternateNumbers.externalNumber.pattern');

    if (externalNumber) {
      filteredNumber += ' ' + $translate.instant('common.and') + ' ' + PhoneNumberService.getNationalFormat(externalNumber);
    }

    return filteredNumber;
  }
}
