describe("Reporting which variants are loaded", function() {

  it("should provide the right info to the callback", function() {
    var assignments = {
      'test-1': '1b',
      'test-2': '2c'
    };

    var gatheredInfo = {};
    function callback(test, variant) {
      gatheredInfo[test] = variant;
    }

    sabot.reportLoadedVariants(assignments, callback);
    assert.deepEqual(gatheredInfo, assignments);
  });
});
