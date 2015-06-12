describe("Reporting ", function() {

  it("should provide the right info to the onVariantChosen callback", function() {
    var assignments = {
      'test-1': '1b',
      'test-2': '2c'
    };

    var gatheredInfo = {};
    function loadCallback(test, variant) {
      gatheredInfo[test] = variant;
    }

    sabot.reportThroughCallbacks(assignments, mockStorage(), loadCallback, function(){});

    assert.deepEqual(gatheredInfo, assignments);
  });

  it("should report outstanding conversions", function() {
    var storage = mockStorage({
      'sabotOutstandingConversions': [
        {test: '1', variant: 'b'}
      ]
    });

    var conversionsReported = [];
    function conversionCallback(test, variant) {
      conversionsReported.push(test + variant);
    }

    sabot.reportThroughCallbacks({}, storage, function(){}, conversionCallback);

    assert.deepEqual(conversionsReported, ['1b']);
  });

  it("should remove successfully reported conversions from storage", function() {
    var storage = mockStorage({
      'sabotOutstandingConversions': [
        {test: '1', variant: 'b'}
      ]
    });

    function conversionCallback() {
      return $.Deferred().resolve("Ok!");
    }

    sabot.reportThroughCallbacks({}, storage, function(){}, conversionCallback);

    assert.deepEqual(storage.getItem('sabotOutstandingConversions'), []);
  });

  it("should not remove conversions if reporting fails", function() {
    var storage = mockStorage({
      'sabotOutstandingConversions': [
        {test: '1', variant: 'b'}
      ]
    });

    function conversionCallback() {
      return $.Deferred().fail("Argh!");
    }

    sabot.reportThroughCallbacks({}, storage, function(){}, conversionCallback);

    assert.deepEqual(storage.getItem('sabotOutstandingConversions').length, 1);
  });


});
