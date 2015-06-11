module.exports = assignUserToVariants;

var ASSIGNMENT_ITEM = 'sabotTestAssignments';

function assignUserToVariants(tests, storage, randomizer) {
  var assignments = storage.getItem(ASSIGNMENT_ITEM) || {};
  tests.map(function(test) {
    var previous = assignments[test.name];
    console.log(previous, test.variants);
    if (previous) {
      // check if the saved variant actually exists in this test
      var variantExists = test.variants.some(function(v) {
        return v.name == previous;
      });
      console.log(previous, variantExists);
      // already assigned for the test, we're good
      if (variantExists)
        return;
    }

    // new assignment needed for the test, pick one
    assignments[test.name] = pickVariantRandomly(test.variants, randomizer);
  });
  storage.setItem(ASSIGNMENT_ITEM, assignments);
  return assignments;
}

// Randomly picks one of the variants, using probabilities defined by weights. All the weights must sum up to 1.
function pickVariantRandomly(choices, random) {
  var pick = random();
  var soFar = 0.0, index = 0;
  while (true) {
    if (pick < choices[index].weight + soFar) {
      return choices[index].name;
    } else {
      soFar += choices[index].weight;
      index++;
    }
  }
}
