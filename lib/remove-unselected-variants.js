module.exports = removeUnselectedVariants;

function removeUnselectedVariants($root, assignments) {
  var candidates = $root.find('*[data-ab]');
  candidates.toArray().map(function(candidate) {
    var $candidate = $(candidate);
    var abInfo = $candidate.data('ab').split(":");
    var abTest = abInfo[0], abVariant = abInfo[1];
    if (assignments[abTest] != abVariant)
      $candidate.remove();
  });
}
