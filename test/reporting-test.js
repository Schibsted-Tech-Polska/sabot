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
});
