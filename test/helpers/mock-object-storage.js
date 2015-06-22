window.mockObjectStorage = function(initial) {
  return new sabot.ObjectStorage(mockStorage(initial));
};
