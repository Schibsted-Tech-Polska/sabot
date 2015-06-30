describe("Sabot", function() {
  describe("when working on a page with two A/B tests", function() {
    // create some test markup
    var html = window.__html__['test/html/two-tests.html'];
    var $root = $(html);
    $('body').append($root);

    // set up a predictable environment and capturing
    var warnings = [];
    var tomorrow = (new Date()).getTime + 1000 * 3600 * 24;
    var storage = mockStorage({
      sabotTestAssignments: {
        'colorful': {pick: 'green', expires: tomorrow}
      },
      sabotOutstandingConversions: [
        {test: 'converted', variant: 'blah'}
      ]
    });
    var randomness = mockRandom([0.65]);
    var reportedChoices = {}, reportedConversions = {};
    function record(where) {
      return function(test, variant) {
        where[test] = variant;
      }
    }

    // process the page
    sabot({
      rootElement: $root,
      storage: storage,
      randomizer: randomness,

      warningFn: function(w) { warnings.push(w); },
      onVariantChosen: record(reportedChoices),
      onConversion: record(reportedConversions)
    });

    // trigger a conversion
    $root.find('#s10').get(0).click();

    // check!

    it('should just have the "green" version in HTML for the first test', function() {
      assert.equal($root.find('#green').length, 1);
      assert.equal($root.find('#red').length, 0);
    });

    it('should just have the "size-10" version in HTML for the second test', function() {
      assert.equal($root.find('#s10').length, 1);
      assert.equal($root.find('#s12,#s14').length, 0);
    });

    it('should mark selected variants with a class', function() {
      assert.ok($root.find('*[data-ab="colorful:green"]').is('.ab-selected'));
      assert.ok($root.find('*[data-ab="sizes:size-10"]').is('.ab-selected'));
    });

    it("should save the assignments in local storage", function() {
      var stored = JSON.parse(storage.getItem('sabotTestAssignments'));
      assert.equal(stored['colorful'].pick, 'green');
      assert.equal(stored['sizes'].pick, 'size-10');
      assert.equal(stored['colorful'].expires, tomorrow);
      assert.ok(stored['sizes'].expires > (new Date()).getTime());
    });

    it("should report the loaded variants via the callback provided", function() {
      assert.deepEqual(reportedChoices, {
        'colorful': 'green',
        'sizes': 'size-10'
      });
    });

    it("should report the outstanding conversions via the callback provided", function() {
      assert.deepEqual(reportedConversions, {
        'converted': 'blah'
      });
    });

    it("should record the new conversion in local storage", function() {
      var conversions = JSON.parse(storage.getItem('sabotOutstandingConversions'));
      assert.deepEqual(conversions, [
        {test: 'sizes', variant: 'size-10'}
      ]);
    });

    it("should not have reported any warnings", function() {
      assert.deepEqual(warnings, []);
    });
  });
});
