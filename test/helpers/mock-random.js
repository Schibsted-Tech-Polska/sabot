window.mockRandom = function(preprogrammedValues) {
  return function() {
    var value = preprogrammedValues.shift();
    if (value === undefined)
      throw new Error("Math.random() mock ran out of preprogrammed values.");
    return value;
  }
};
