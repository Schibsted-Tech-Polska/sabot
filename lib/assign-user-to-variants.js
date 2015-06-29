module.exports = assignUserToVariants;

var STORED_ASSIGNMENTS = require('./constants').STORED_ASSIGNMENTS;

// creates a map of {testName: selectedVariant}, ensuring that randomized assignments
// are properly stored
function assignUserToVariants(tests, storage, randomizer, validityTimeInSeconds) {
  // get stored stuff
  var assignments = storage.getItem(STORED_ASSIGNMENTS) || {};

  // some of the stored assignments might be expired
  removeExpiredAssignments(assignments);

  // for each test, either listen to the stored entry (if it's present and valid)
  // or generate a new assignment randomly
  tests.map(function(test) {
    var previous = assignments[test.name];
    if (previous) {
      // check if the saved variant actually exists in this test
      var variantExists = test.variants.some(function(v) {
        return v.name == previous.pick;
      });
      // already assigned for the test, we're good
      if (variantExists)
        return;
    }

    // new assignment needed for the test, pick one
    assignments[test.name] = generateNewAssignment(test, randomizer, validityTimeInSeconds);
  });

  // updated assignments go back into storage
  storage.setItem(STORED_ASSIGNMENTS, assignments);

  // create the final structure with just the tests we're interested in
  var final = {};
  tests.map(function(test) {
    final[test.name] = assignments[test.name].pick;
  });
  return final;
}

function generateNewAssignment(test, randomizer, validForSec) {
  return {
    pick: pickVariantRandomly(test.variants, randomizer),
    expires: (new Date()).getTime() + validForSec * 1000
  };
}

// Removes all assignment entries that have an 'expired' property in the past.
function removeExpiredAssignments(assignments) {
  var expiredTests = Object.keys(assignments).filter(function(test) {
    var assignment = assignments[test];
    return (!assignment.expires) || (assignment.expires < (new Date().getTime()));
  });

  expiredTests.map(function(test) {
    delete assignments[test];
  });
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
