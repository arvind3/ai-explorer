const test = require('node:test');
const assert = require('node:assert/strict');

const { isFreeModel, chooseCategory, parsePrice } = require('../model-utils.js');

test('parsePrice supports numeric strings and rejects missing values', () => {
  assert.equal(parsePrice('0.000000'), 0);
  assert.equal(parsePrice(0), 0);
  assert.equal(parsePrice('1.25'), 1.25);
  assert.equal(parsePrice(undefined), Number.POSITIVE_INFINITY);
  assert.equal(parsePrice('not-a-number'), Number.POSITIVE_INFINITY);
});

test('isFreeModel accepts zero-value prices in OpenRouter string format', () => {
  const model = {
    pricing: {
      prompt: '0.000000',
      completion: '0'
    }
  };

  assert.equal(isFreeModel(model), true);
});

test('isFreeModel rejects paid models', () => {
  const model = {
    pricing: {
      prompt: '0.000001',
      completion: '0.00'
    }
  };

  assert.equal(isFreeModel(model), false);
});

test('chooseCategory is deterministic for uncategorized models', () => {
  const sampleModel = { id: 'vendor/model-without-keywords', name: 'Neutral Name' };
  const first = chooseCategory(sampleModel);
  const second = chooseCategory(sampleModel);

  assert.equal(first, second);
  assert.match(first, /Writing|Coding|Learning|Business|Creative/);
});

test('chooseCategory still honors keyword-based routing', () => {
  assert.equal(chooseCategory({ id: 'open/model-coder-v1', name: '' }), 'Coding');
  assert.equal(chooseCategory({ id: 'vision/model', name: '' }), 'Creative');
  assert.equal(chooseCategory({ id: 'edu/model', name: '' }), 'Learning');
  assert.equal(chooseCategory({ id: 'assistant/model', name: '' }), 'Writing');
});
