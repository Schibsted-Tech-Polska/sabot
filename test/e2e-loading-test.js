describe("Sabot", function() {
  describe("when working on a page with two A/B tests", function() {
    var html = window.__html__['test/html/two-tests.html'];
    var $root = $(html);

    // set up a predictable environment and capturing
    var storage = mockStorage({
      sabotTestAssignments: {
        'colorful': 'green'
      }
    });
    var randomness = mockRandom([0.65]);
    var reportedChoices = {};
    function recordChoices(test, variant) {
      reportedChoices[test] = variant;
    }

    // process the page
    sabot({
      rootElement: $root,
      storage: storage,
      randomizer: randomness,

      onVariantChosen: recordChoices
    });

    it('should just have the "green" version in HTML for the first test', function() {
      assert.equal($root.find('#green').length, 1);
      assert.equal($root.find('#red').length, 0);
    });

    it('should just have the "size-10" version in HTML for the second test', function() {
      assert.equal($root.find('#s10').length, 1);
      assert.equal($root.find('#s12,#s14').length, 0);
    });

    it("should save the assignments in local storage", function() {
      assert.deepEqual(storage.getItem('sabotTestAssignments'), {
        'colorful': 'green',
        'sizes': 'size-10'
      });
    });

    it("should report the loaded variants via the callback provided", function() {
      assert.deepEqual(reportedChoices, {
        'colorful': 'green',
        'sizes': 'size-10'
      });
    });
  });
});
