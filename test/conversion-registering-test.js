var CONVERSIONS = 'sabotOutstandingConversions';

describe("Conversions", function() {
  var testHTML = window.__html__['test/html/conversion-registering.html'];
  var tests = [
    {
      name: 'colorful',
      conversion: {selector: '.button', event: 'click'}
    }
  ];

  it("should be registered when a matching selector/event pair occurs", function() {
    var $root = $(testHTML);

    var storage = mockStorage({});
    sabot.registerConversionListeners($root, tests, storage);

    $root.find(".button").trigger('click');

    assert.deepEqual(storage.getItem(CONVERSIONS), [
      {test: 'colorful', variant: 'red'}
    ]);
  });

  it("should be appended to an existing list", function() {
    var $root = $(testHTML);

    var storage = mockStorage({
      sabotOutstandingConversions: [
        {test: 'earlier', variant: 'conversion'}
      ]
    });
    sabot.registerConversionListeners($root, tests, storage);

    $root.find(".button").trigger('click');
    $root.find(".button").trigger('click');
    $root.find(".button").trigger('click');

    assert.deepEqual(storage.getItem('sabotOutstandingConversions'), [
      {test: 'earlier', variant: 'conversion'},
      {test: 'colorful', variant: 'red'}
    ]);
  });

  it("should report a conversion just once per test", function() {
    var $root = $(testHTML);

    var storage = mockStorage({});
    sabot.registerConversionListeners($root, tests, storage);

    $root.find(".button").trigger('click');
    $root.find(".button").trigger('click');
    $root.find(".button").trigger('click');

    assert.equal(storage.getItem('sabotOutstandingConversions').length, 1);
  });
});
