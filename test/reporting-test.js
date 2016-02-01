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

    sabot.reportThroughCallbacks(assignments, mockObjectStorage({}), loadCallback, function(){});

    assert.deepEqual(gatheredInfo, assignments);
  });

  it("should not issue any callbacks if we can't write to storage", function() {
    var assignments = {
      'test-1': '1b',
      'test-2': '2c'
    };
    var storage = mockObjectStorage({});
    var called = false;
    function trackingCallback() { called = true; }

    storage.writesAreFailing = true;
    sabot.reportThroughCallbacks(assignments, storage, trackingCallback, function(){});

    assert.ok(!called);
  });

  it("should report outstanding conversions", function() {
    var storage = mockObjectStorage({
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
    var storage = mockObjectStorage({
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
    var storage = mockObjectStorage({
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
