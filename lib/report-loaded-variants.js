module.exports = reportLoadedVariants;

function reportLoadedVariants(assignments, callback) {
  Object.keys(assignments).map(function(test) {
    callback(test, assignments[test]);
  });
}
