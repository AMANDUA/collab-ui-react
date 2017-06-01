'use strict';

describe('Service: AAUtilityService', function () {
  var AAUtilityService;
  var ASTParser;
  var ASTWalker;
  beforeEach(angular.mock.module('uc.autoattendant'));
  beforeEach(angular.mock.module('Huron'));

  beforeEach(inject(function (_AAUtilityService_, _ASTWalker_, _ASTParser_) {
    AAUtilityService = _AAUtilityService_;
    ASTParser = _ASTParser_;
    ASTWalker = _ASTWalker_;
    spyOn(ASTParser, 'parse').and.callThrough();
    spyOn(ASTWalker, 'ancestor').and.callThrough();
  }));

  afterEach(function () {

  });

  describe('CONSTANTS', function () {

    it('should test the conditionalArr service value set', function () {
      expect(AAUtilityService.CONSTANTS.js.conditionalArr).toEqual('checks');
    });

    it('should test the func service value set', function () {
      expect(AAUtilityService.CONSTANTS.js.func).toEqual('var func = function ()');
    });

    it('should test the CallExpression service value set', function () {
      expect(AAUtilityService.CONSTANTS.expressions.CallExpression).toEqual('CallExpression');
    });

    it('should test the ThisExpression service value set', function () {
      expect(AAUtilityService.CONSTANTS.expressions.ThisExpression).toEqual('ThisExpression');
    });

  });

  describe('removeEscapeChars', function () {

    it('should remove escape characters', function () {
      var string = '\\\'test\\\'';
      var expected = '\'test\'';
      var check = AAUtilityService.removeEscapeChars(string);
      expect(check).toEqual(expected);
    });

    it('should not remove characters', function () {
      var string = 'test';
      var expected = 'test';
      var check = AAUtilityService.removeEscapeChars(string);
      expect(check).toEqual(expected);
    });

    it('should not fail on undefined', function () {
      var string = undefined;
      var expected = undefined;
      var check = AAUtilityService.removeEscapeChars(string);
      expect(check).toEqual(expected);
    });
  });

  describe('generateFunction', function () {

    it('should not fail on undefined condition', function () {
      var condition = undefined;
      var elements = ['test'];
      var expected = 'var func = function () { return this[\'' + undefined + '\'] != this[\'' + undefined + '\']; };';
      var check = AAUtilityService.generateFunction(condition, elements);
      expect(check).toEqual(expected);
    });

    it('should not fail on undefined elements', function () {
      var condition = 'test';
      var elements = undefined;
      var expected = 'var func = function () { return this[\'' + 'test' + '\'] != this[\'' + 'test' + '\']; };';
      var check = AAUtilityService.generateFunction(condition, elements);
      expect(check).toEqual(expected);
    });

    it('should not fail on elements with 0 length', function () {
      var condition = 'test';
      var elements = [];
      var expected = 'var func = function () { return this[\'' + 'test' + '\'] != this[\'' + 'test' + '\']; };';
      var check = AAUtilityService.generateFunction(condition, elements);
      expect(check).toEqual(expected);
    });

    it('should return function formatted on test elements well formatted no apostrophes', function () {
      var condition = 'test';
      var elements = ['test0,test1', 'test2', 'test3', 'test4', 'test5', 'test6, test7', '     ', 'test8 test9 test 10', 'test11 "test12" test13'];
      var expected = 'var func = function () {var checks = []; checks.push(\'test0,test1\'); checks.push(\'test2\'); checks.push(\'test3\'); checks.push(\'test4\'); checks.push(\'test5\'); checks.push(\'test6, test7\'); checks.push(\'     \'); checks.push(\'test8 test9 test 10\'); checks.push(\'test11 "test12" test13\'); return checks.indexOf(this[\'test\']) !== -1 };';
      var check = AAUtilityService.generateFunction(condition, elements);
      expect(check).toEqual(expected);
    });

    it('should return function formatted on test elements well formatted returned caller', function () {
      var condition = 'callerReturned';
      var elements = 'test0,test1';
      var expected = 'var func = function () {return (parseInt(this[\'CURRENT_TIME\']) - parseInt(this[\'CS_LAST_CALL_TIME\']) < ' + elements + '); };';
      var check = AAUtilityService.generateFunction(condition, elements);
      expect(check).toEqual(expected);
    });

    it('should return false function formatted on zero elements', function () {
      var condition = 'callerReturned';
      var elements = '';
      var expected = AAUtilityService.CONSTANTS.js.func + ' { return this[\'' + condition + '\'] != this[\'' + condition + '\']; };';
      var check = AAUtilityService.generateFunction(condition, elements);
      expect(check).toEqual(expected);
    });

    it('should return function formatted on test elements well formatted with apostrophes', function () {
      var condition = 'test';
      var elements = ['test0,test1', 'test2', 'test3', 'test4', 'test5', 'test6, test7', '     ', 'test8 test9 test 10', 'test11 "test12" test13', 'test14 O\'test15'];
      var expected = 'var func = function () {var checks = []; checks.push(\'test0,test1\'); checks.push(\'test2\'); checks.push(\'test3\'); checks.push(\'test4\'); checks.push(\'test5\'); checks.push(\'test6, test7\'); checks.push(\'     \'); checks.push(\'test8 test9 test 10\'); checks.push(\'test11 "test12" test13\'); checks.push(\'test14 O\'test15\'); return checks.indexOf(this[\'test\']) !== -1 };';
      var check = AAUtilityService.generateFunction(condition, elements);
      expect(check).toEqual(expected);
    });
  });

  describe('pullJSPieces', function () {

    it('should not fail on undefined expression', function () {
      var string = undefined;
      var expected = { };
      expected.ifCondition = '';
      expected.isConditions = '';
      var check = AAUtilityService.pullJSPieces(string);
      expect(check).toEqual(expected);
    });

    it('should not extract an if condition formatted incorrectly', function () {
      var string = 'thsi[\'test\']';
      var expected = { };
      expected.ifCondition = '';
      expected.isConditions = '';
      var check = AAUtilityService.pullJSPieces(string);
      expect(check).toEqual(expected);
    });

    it('should extract an is condition formatted correctly', function () {
      var string = 'var func = function () {var checks = []; checks.push(\'test0 test1\'); return checks.indexOf(this[\'test\']) !== -1 };';
      var expected = { };
      expected.ifCondition = 'test';
      expected.isConditions = 'test0 test1';
      var check = AAUtilityService.pullJSPieces(string);
      expect(check).toEqual(expected);
    });

    it('should extract an is condition formatted correctly 2x', function () {
      var string = 'var func = function () {var checks = []; checks.push(\'test0 test1\'); checks.push(\'test2\'); return checks.indexOf(this[\'test\']) !== -1 };';
      var expected = { };
      expected.ifCondition = 'test';
      expected.isConditions = 'test0 test1, test2';
      var check = AAUtilityService.pullJSPieces(string);
      expect(check).toEqual(expected);
    });

    it('should not extract an is condition formatted incorrectly', function () {
      var string = 'var func = function () {var checks = []; skcehc.push(\'test0 test1\'); skcehc.push(\'test2\') return checks.indexOf(this[\'test\']) !== -1 };';
      var expected = { };
      expected.ifCondition = '';
      expected.isConditions = '';
      var check = AAUtilityService.pullJSPieces(string);
      expect(check).toEqual(expected);
    });
  });

  describe('splitOnCommas', function () {

    it('should split the string correctly based on quotes and commas', function () {
      var string = '"test0,test1",test2, test3,test4, "test5", "test6, test7", "     ",       "test8 test9 test 10", "test11 "test12" test13"';
      var expected = ['test0,test1', 'test2', 'test3', 'test4', 'test5', 'test6, test7', '     ', 'test8 test9 test 10', 'test11 "test12" test13'];
      var check = AAUtilityService.splitOnCommas(string);
      expect(check).toEqual(expected);
    });

    it('should split the string correctly based on quotes and commas and new lines', function () {
      var string = '"test0,test1",test2, test3,test4, "test5", "test6, test7",\n"     ",       "test8 test9 test 10", "test11 "test12" test13"';
      var expected = ['test0,test1', 'test2', 'test3', 'test4', 'test5', 'test6, test7', '     ', 'test8 test9 test 10', 'test11 "test12" test13'];
      var check = AAUtilityService.splitOnCommas(string);
      expect(check).toEqual(expected);
    });

    it('should split the string correctly based on emptiness', function () {
      var string = '';
      var expected = [];
      var check = AAUtilityService.splitOnCommas(string);
      expect(check).toEqual(expected);
    });

    it('should split the string correctly based on empty null', function () {
      var string = ',';
      var expected = [];
      var check = AAUtilityService.splitOnCommas(string);
      expect(check).toEqual(expected);
    });

    it('should split the string correctly based on spaces', function () {
      var string = ' ';
      var expected = [''];
      var check = AAUtilityService.splitOnCommas(string);
      expect(check).toEqual(expected);
    });

  });

  describe('countOccurences', function () {

    it('should test for 1 number of chars', function () {
      expect(AAUtilityService.countOccurences('The quick brown fox jumps over the lazy dog', 'z')).toEqual(1);
    });

    it('should test for 2 number of chars', function () {
      expect(AAUtilityService.countOccurences('The quick brown fox jumps over the lazy dogs', 's')).toEqual(2);
    });
  });

  describe('addQuotesAroundCommadQuotedValues', function () {

    it('should add quotes on comma', function () {
      var string = ',';
      var expected = '","';
      var check = AAUtilityService.addQuotesAroundCommadQuotedValues(string);
      expect(check).toEqual(expected);
    });

    it('should add quotes on quotes', function () {
      var string = 'test "the" value';
      var expected = '"test "the" value"';
      var check = AAUtilityService.addQuotesAroundCommadQuotedValues(string);
      expect(check).toEqual(expected);
    });

    it('should not add quotes', function () {
      var string = 'test';
      var expected = 'test';
      var check = AAUtilityService.addQuotesAroundCommadQuotedValues(string);
      expect(check).toEqual(expected);
    });
  });
});
