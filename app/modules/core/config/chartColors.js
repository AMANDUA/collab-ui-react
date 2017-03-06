(function () {
  'use strict';

  var chartColors = {
    // Toolkit Colors
    alertsBase: '#F96452',
    attentionBase: '#F5A623',
    brandWhite: '#FFFFFF',
    ctaBase: '#43A942',
    ctaLight: '#8BCA8A',
    ctaLighter: '#D4ECD4',
    grayDarkFour: '#292929',
    grayDarkThree: '#343537',
    grayDarkTwo: '#4F5051',
    grayDarkOne: '#6a6b6c',
    grayBase: '#858688',
    grayLightOne: '#AEAEAF',
    grayLightTwo: '#D7D7D8',
    grayLightThree: '#EBEBEC',
    grayLightFour: '#F5F5F6',
    negativeBase: '#F5483F',
    negativeDarker: '#D03D35',
    peopleBase: '#14A792',
    peopleLight: '#6ec9bc',
    peopleLighter: '#C9EBE6',
    primaryBase: '#049FD9',
    primaryDarker: '#0387B8',
    primaryLight: '#66C5E8',

    // Non-Toolkit Colors
    colorPurple: '#8E5ACF',
    colorLightGreenFill: '#017900',
    colorLightRedFill: '#FF0000',
    colorLightYellowFill: '#FFA200',
    gray: '#aaa',
    metricDarkGreen: '#417505',
  };

  angular
    .module('Core')
    .value('chartColors', chartColors);

}());
