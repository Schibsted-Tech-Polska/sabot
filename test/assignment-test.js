describe("Assigning user to variants", function() {

  var ASSIGNMENT_ITEM = 'sabotTestAssignments';

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

  it("should assign according to weights correctly", function() {
    var random = mockRandom([0.9, 0.1]);
    var storage = mockObjectStorage({});
    var assignments = sabot.assignUserToVariants(exampleTests, storage, random);
    assert.deepEqual(assignments, {
      'test-1': '1c',
      'test-2': '2a'
    });
  });

  it("should use stored values and randomize those that are missing", function() {
    var random = mockRandom([0.6]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-2': '2a'
      }
    });

    var assignments = sabot.assignUserToVariants(exampleTests, storage, random);

    assert.equal(assignments['test-1'], '1b');
    assert.equal(assignments['test-2'], '2a');
  });

  it("should save assigned values back into storage", function() {
    var random = mockRandom([0.6]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-2': '2a'
      }
    });

    sabot.assignUserToVariants(exampleTests, storage, random);

    assert(storage.getItem('sabotTestAssignments'), {
      'test-1': '1b',
      'test-2': '2a'
    });
  });

  it("should re-randomize user if the stored variant is absent", function() {
    var random = mockRandom([0.6, 0.5]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-1': 'bogus'
      }
    });

    var assignments = sabot.assignUserToVariants(exampleTests, storage, random);

    assert.equal(assignments['test-1'], '1b');
  });

  it("should not return assignments for tests that are not on the page", function() {
    var random = mockRandom([]);
    var storage = mockObjectStorage({
      sabotTestAssignments: {
        'test-1': '1b',
        'test-2': '2b',
        'test-3': '3d'
      }
    });

    var assignments = sabot.assignUserToVariants(exampleTests, storage, random);

    assert(!assignments['test-3']);
  });
});
