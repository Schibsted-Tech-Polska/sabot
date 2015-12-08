describe("Assigning user to variants", function() {

  var tomorrow = (new Date()).getTime() + 1000 * 3600 * 24;
  var anHourAgo = (new Date()).getTime() - 1000 * 3600;
  var expireInAWeek = 3600 * 24 * 7;

  var exampleTests = [
    {
      name: 'test-1',
      variants: [
        {name: '1a', weight: 0.5},
        {name: '1b', weight: 0.25},
        {name: '1c', weight: 0.25}
      ]
    },
    {
      name: 'test-2',
      variants: [
        {name: '2a', weight: 0.75},
        {name: '2b', weight: 0.25}
      ]
    }
  ];

  var conditionTests = [
    {
      name: 'c-test',
      variants: [
        {name: 'c-a', weight: 0.5, conditions: [function() { return false; }]},
        {name: 'c-b', weight: 0.5, conditions: [function() { return true; }]}
      ]
    }
  ]

  it("should assign according to weights correctly", function() {
    var random = mockRandom([0.9, 0.1]);
    var storage = mockObjectStorage({});
    var assignments = sabot.assignUserToVariants(exampleTests, storage, random, expireInAWeek);
    assert.deepEqual(assignments, {
      'test-1': '1c',
      'test-2': '2a'
    });
  });

  it("should use stored values and randomize those that are missing", function() {
    var random = mockRandom([0.6]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-2': {pick: '2a', expires: tomorrow}
      }
    });

    var assignments = sabot.assignUserToVariants(exampleTests, storage, random, expireInAWeek);

    assert.equal(assignments['test-1'], '1b');
    assert.equal(assignments['test-2'], '2a');
  });

  it("should save assigned values back into storage", function() {
    var random = mockRandom([0.6]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-2': {pick: '2a', expires: tomorrow}
      }
    });

    sabot.assignUserToVariants(exampleTests, storage, random, expireInAWeek);

    var stored = storage.getItem('sabotTestAssignments');
    assert.deepEqual(stored['test-2'], {pick: '2a', expires: tomorrow});
    assert.equal(stored['test-1'].pick, '1b');
  });

  it("should save correct expiry times", function() {
    var random = mockRandom([0.6]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-2': {pick: '2a', expires: tomorrow}
      }
    });

    sabot.assignUserToVariants(exampleTests, storage, random, expireInAWeek);

    var stored = storage.getItem('sabotTestAssignments')['test-1'];
    var aWeekFromNow = (new Date()).getTime() + 1000 * 3600 * 24 * 7;
    assert.ok(aWeekFromNow - stored.expires <= 5000); // allow some leeway since the clock is running all the time
  });

  it("should remove expired entries", function() {
    var random = mockRandom([0.6]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'expired': {pick: '2a', expires: anHourAgo}
      }
    });

    sabot.assignUserToVariants([], storage, random, expireInAWeek);

    assert.ok(!storage.getItem('sabotTestAssignments').expired);
  });

  it("should remove incorrect assignments", function() {
    var random = mockRandom([0.6]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'obsolete': 'pick'
      }
    });

    sabot.assignUserToVariants([], storage, random, expireInAWeek);

    assert.ok(!storage.getItem('sabotTestAssignments').obsolete);
  });

  it("should re-randomize user if the stored variant is absent", function() {
    var random = mockRandom([0.6, 0.5]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-1': {pick: 'bogus', expires: tomorrow}
      }
    });

    var assignments = sabot.assignUserToVariants(exampleTests, storage, random, expireInAWeek);

    assert.equal(assignments['test-1'], '1b');
  });

  it("should not return assignments for tests that are not on the page", function() {
    var random = mockRandom([]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-1': {pick: '1b', expires: tomorrow},
        'test-2': {pick: '2b', expires: tomorrow},
        'test-3': {pick: '3d', expires: tomorrow}
      }
    });

    var assignments = sabot.assignUserToVariants(exampleTests, storage, random, expireInAWeek);

    assert(!assignments['test-3']);
  });

  it("should retry random assignment if the chosen variant has a falsy condition", function() {
    var random = mockRandom([0.25, 0.75]);
    var storage = mockObjectStorage({});

    var assignments = sabot.assignUserToVariants(conditionTests, storage, random, expireInAWeek);

    assert.equal(assignments['c-test'], 'c-b');
  });

});
