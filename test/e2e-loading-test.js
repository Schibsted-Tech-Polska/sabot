describe("Sabot", function() {
  describe("when working on a page with two A/B tests", function() {
    var html = window.__html__['test/html/two-tests.html'];
    var $root = $(html);

    // set up a predictable environment and capturing
    var storedInfo = {
      sabotTestAssignments: {
        'colorful': 'green'
      }
    };
    var randomness = [0.65];
    var choices = {};
    function recordChoices(test, variant) {
      choices[test] = variant;
    }

    // process the page
    sabot({
      rootElement: $root,
      storage: mockStorage(storedInfo),
      randomizer: mockRandom(randomness),

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


  });
});
