describe("Warnings", function() {
  describe("should be reported for", function() {

    it("bad test names", function() {
      var warnings = warningsFor('bad/test-name.html');
      expectOneWarningIncluding(warnings, "!@#$");
    });

    it("bad variant names", function() {
      var warnings = warningsFor('bad/variant-name.html');
      expectOneWarningIncluding(warnings, "blah(");
    });

    it("bad weight format", function() {
      var warnings = warningsFor('bad/variant-weight.html');
      expectOneWarningIncluding(warnings, "bogus");
    });

    it("missing attributes", function() {
      var warnings = warningsFor('bad/missing-conversion.html');
      expectOneWarningIncluding(warnings, "");
    });

    it("bad conversion events", function() {
      var warnings = warningsFor('bad/conversion-event.html');
      expectOneWarningIncluding(warnings, "sayWHAT?");
    });

    it("data-ab container with no matching test", function() {
      var warnings = warningsFor('bad/no-test-for-container.html');
      expectOneWarningIncluding(warnings, "missing-test:a");
    });

    it("data-ab container with no matching variant", function() {
      var warnings = warningsFor('bad/no-variant-for-container.html');
      expectOneWarningIncluding(warnings, "test:missing");
    });

    it("data-ab container with bad format", function() {
      var warnings = warningsFor('bad/container.html');
      expectOneWarningIncluding(warnings, "!@#$");
    });

    it("missing callback", function() {
      var warnings = [];
      sabot({
        rootElement: $("<div>"),
        warningFn: function(warning) {
          warnings.push(warning);
        },
        onVariantChosen: function() {}
      });

      expectOneWarningIncluding(warnings, "onConversion");
    })
  });
});

function warningsFor(fixtureName) {
  var warnings = [];
  var html = window.__html__['test/html/' + fixtureName];
  var $root = $(html);

  sabot({
    rootElement: $root,
    warningFn: function(warning) {
      warnings.push(warning);
    },
    onConversion: function() {},
    onVariantChosen: function() {}
  });

  return warnings;
}

function expectOneWarningIncluding(warnings, expectedText) {
  assert.equal(warnings.length, 1, "Expected one warning");
  assert.ok(warnings[0].indexOf(expectedText) >= 0, "Expected to find '" + expectedText + "' in warning");
}
