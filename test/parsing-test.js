describe("Test parsing", function() {
  var testHTML = "<div>" +
    "<meta type='ab-test' " +
      "data-name='very-important-test' " +
      "data-variants='pretty(75%),ugly-1(12.5%),ugly-2(12.5%)' " +
      "data-conversion-event='a|click'>" +
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
      {name: 'pretty', weight: 0.75},
      {name: 'ugly-1', weight: 0.125},
      {name: 'ugly-2', weight: 0.125}
    ]);
  });

  it("should assume equal weights for variants if none are provided", function() {
    var secondVariants = tests[1].variants;
    assert.deepEqual(secondVariants, [
      {name: 'first', weight: 0.5},
      {name: 'second', weight: 0.5}
    ]);
  });

  it("should parse conversion events correctly", function() {
    var conversions = tests.map(function(t) { return t.conversion; });
    assert.deepEqual(conversions, [
      {event: 'click', selector: 'a'},
      {event: 'click', selector: 'button.submit'}
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
      {name: 'a', weight: 0.25},
      {name: 'b', weight: 0.25},
      {name: 'c', weight: 0.5}
    ]);
  });
});
