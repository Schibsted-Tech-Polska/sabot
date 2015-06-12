describe("Removal of unselected variants", function() {
  var testHTML = window.__html__['test/html/one-test.html'];
  var $root = $(testHTML);
  var assignments = {colorful: 'green'};

  sabot.removeUnselectedVariants($root, assignments);

  it("should remove unneeded nodes", function() {
    assert.equal($root.find('#red').length, 0);
  });

  it("should keep selected nodes", function() {
    assert.equal($root.find('#green').length, 1);
  });

  it("should emit a warning when no node matches");
});
