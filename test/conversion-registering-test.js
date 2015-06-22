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

    var storage = mockObjectStorage({});
    sabot.registerConversionListeners($root, tests, storage);

    $('body').append($root);
    $root.find(".button").get(0).click();

    assert.deepEqual(storage.getItem(CONVERSIONS), [
      {test: 'colorful', variant: 'red'}
    ]);
  });

  it("should be appended to an existing list", function() {
    var $root = $(testHTML);

    var storage = mockObjectStorage({
      sabotOutstandingConversions: [
        {test: 'earlier', variant: 'conversion'}
      ]
    });
    sabot.registerConversionListeners($root, tests, storage);

    $('body').append($root);
    $root.find(".button").get(0).click();

    assert.deepEqual(storage.getItem('sabotOutstandingConversions'), [
      {test: 'earlier', variant: 'conversion'},
      {test: 'colorful', variant: 'red'}
    ]);
  });

  it("should report a conversion just once per test", function() {
    var $root = $(testHTML);

    var storage = mockObjectStorage({});
    sabot.registerConversionListeners($root, tests, storage);

    $('body').append($root);
    $root.find(".button").get(0).click();
    $root.find(".button").get(0).click();
    $root.find(".button").get(0).click();

    assert.equal(storage.getItem('sabotOutstandingConversions').length, 1);
  });

  it("should report conversion from child element clicks", function() {
    var $root = $(testHTML);

    var storage = mockObjectStorage({});
    sabot.registerConversionListeners($root, tests, storage);

    $root.find(".button-child").get(0).click();

    assert(storage.getItem('sabotOutstandingConversions'));
    assert.equal(storage.getItem('sabotOutstandingConversions').length, 1);
  });

  it("should not report conversion from non-matching elements", function() {
    var $root = $(testHTML);

    var storage = mockObjectStorage({});
    sabot.registerConversionListeners($root, tests, storage);

    $root.find(".ignore-me").get(0).click();

    assert(!storage.getItem('sabotOutstandingConversions'));
  });

  it("should catch the conversion even if .stopPropagation() is used", function() {
    var $root = $(testHTML);

    var storage = mockObjectStorage({});
    sabot.registerConversionListeners($root, tests, storage);

    $root.find(".button").click(function(evt) {
      evt.stopPropagation();
    });

    $('body').append($root);
    $root.find(".button").get(0).click();

    assert.equal(storage.getItem('sabotOutstandingConversions').length, 1);
  });
});
