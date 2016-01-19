describe("Test parsing", function() {
  var testHTML = "<div>" +
    "<meta type='ab-test' " +
      "data-name='very-important-test' " +
      "data-variants='pretty(75%),ugly-1(12.5%),ugly-2(12.5%)' " +
      "data-conversion-event-global='a|click'>" +
    "<meta type='ab-test' " +
      "data-name='second-test' " +
      "data-variants='first,second' " +
      "data-conversion-event='button.submit|click'>" +
    "</div>";
  var $root = $(testHTML);
  var tests = sabot.parseTests($root);

  it("should find all the tests defined in <meta> tags", function() {
    assert.equal(tests.length, 2)
  });

  it("should parse the names correctly", function() {
    var names = tests.map(function(t) { return t.name; });
    assert.deepEqual(names, ['very-important-test', 'second-test']);
  });

  it("should parse test variants with weights correctly", function() {
    var importantVariants = tests[0].variants;
    assert.deepEqual(importantVariants, [
      {name: 'pretty', weight: 0.75, conditions: []},
      {name: 'ugly-1', weight: 0.125, conditions: []},
      {name: 'ugly-2', weight: 0.125, conditions: []}
    ]);
  });

  it("should assume equal weights for variants if none are provided", function() {
    var secondVariants = tests[1].variants;
    assert.deepEqual(secondVariants, [
      {name: 'first', weight: 0.5, conditions: []},
      {name: 'second', weight: 0.5, conditions: []}
    ]);
  });

  it("should parse conversion events correctly", function() {
    var conversions = tests.map(function(t) { return t.conversion; });
    assert.deepEqual(conversions, [
      {event: 'click', selector: 'a', global: true},
      {event: 'click', selector: 'button.submit', global: false}
    ]);
  });

  it("should not care about whitespace in variants", function() {
    var testHTML = "<div>" +
      "<meta type='ab-test' " +
        "data-name='very-important-test' " +
        "data-variants='a (25% ), b ( 25 % ),c(50%)' " +
        "data-conversion-event='a|click'>" +
      "</div>";
    var $test = $(testHTML);
    var tests = sabot.parseTests($test);

    assert.deepEqual(tests[0].variants, [
      {name: 'a', weight: 0.25, conditions: []},
      {name: 'b', weight: 0.25, conditions: []},
      {name: 'c', weight: 0.5, conditions: []}
    ]);
  });

  it("should parse conditions correctly", function() {
    var testHTML = '<div><meta type="ab-test" data-name="t" data-variants="a(50%:logged-in),b(25%),c(25%:foo)" data-conversion-event="a|click"></div>';
    var $test = $(testHTML);
    var conditions = {
      'logged-in': function(){ return false; },
      'foo': function() { return true; }
    };

    var tests = sabot.parseTests($test, undefined, conditions);

    var parsedConditions = tests[0].variants.map(function(v) { return v.conditions });
    var aConditions = parsedConditions[0], bConditions = parsedConditions[1], cConditions = parsedConditions[2];

    assert.deepEqual(aConditions, [conditions['logged-in']]);
    assert.deepEqual(bConditions, []);
    assert.deepEqual(cConditions, [conditions.foo]);
  });
});
