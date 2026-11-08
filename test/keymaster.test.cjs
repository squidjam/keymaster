const assert = require('node:assert/strict');
const test = require('node:test');

let key;
let listeners;
let originalDocument;
let originalWindow;

function setup(t) {
  originalDocument = global.document;
  originalWindow = global.window;
  listeners = {};
  global.document = {
    addEventListener(type, listener) {
      listeners[type] = listener;
    }
  };
  global.window = {
    addEventListener(type, listener) {
      listeners[type] = listener;
    }
  };
  delete require.cache[require.resolve('../keymaster.js')];
  key = require('../keymaster.js');
  t.after(() => {
    delete require.cache[require.resolve('../keymaster.js')];
    if (originalDocument === undefined) delete global.document;
    else global.document = originalDocument;
    if (originalWindow === undefined) delete global.window;
    else global.window = originalWindow;
  });
}

function event(type, overrides = {}) {
  const keyboardEvent = {
    code: 'KeyA',
    key: 'a',
    target: { tagName: 'BODY' },
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    prevented: false,
    stopped: false,
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; },
    ...overrides
  };
  listeners[type](keyboardEvent);
  return keyboardEvent;
}

test('loads in CommonJS without browser globals', () => {
  const documentBefore = global.document;
  const windowBefore = global.window;
  delete global.document;
  delete global.window;
  delete require.cache[require.resolve('../keymaster.js')];
  const loaded = require('../keymaster.js');
  assert.equal(typeof loaded, 'function');
  assert.equal(typeof loaded.setScope, 'function');
  delete require.cache[require.resolve('../keymaster.js')];
  if (documentBefore !== undefined) global.document = documentBefore;
  if (windowBefore !== undefined) global.window = windowBefore;
});

test('dispatches using KeyboardEvent.code and tracks pressed keys', t => {
  setup(t);
  let calls = 0;
  key('a', () => { calls += 1; });
  event('keydown');
  assert.equal(calls, 1);
  assert.deepEqual(key.getPressedKeyCodes(), [65]);
  event('keyup');
  assert.equal(key.isPressed('a'), false);
});

test('supports the named comma key alias', t => {
  setup(t);
  let calls = 0;
  key('comma', () => { calls += 1; });
  event('keydown', { code: 'Comma', key: ',' });
  assert.equal(calls, 1);
});

test('matches modifiers exactly and exposes modifier aliases', t => {
  setup(t);
  let plainCalls = 0;
  let modifiedCalls = 0;
  key('d', () => { plainCalls += 1; });
  key('ctrl+shift+d', () => { modifiedCalls += 1; });
  event('keydown', {
    code: 'KeyD', key: 'D', ctrlKey: true, shiftKey: true
  });
  assert.equal(plainCalls, 0);
  assert.equal(modifiedCalls, 1);
  assert.equal(key.ctrl, true);
  assert.equal(key.shift, true);
});

test('dispatches global and active-scope shortcuts', t => {
  setup(t);
  let globalCalls = 0;
  let scopedCalls = 0;
  key('a', () => { globalCalls += 1; });
  key('a', 'editor', () => { scopedCalls += 1; });
  key.setScope('preview');
  event('keydown');
  assert.equal(globalCalls, 1);
  assert.equal(scopedCalls, 0);
  event('keyup');
  key.setScope('editor');
  event('keydown');
  assert.equal(globalCalls, 2);
  assert.equal(scopedCalls, 1);
});

test('ignores editable targets unless the filter is overridden', t => {
  setup(t);
  let calls = 0;
  key('a', () => { calls += 1; });
  event('keydown', { target: { tagName: 'INPUT' } });
  event('keydown', { target: { tagName: 'DIV', isContentEditable: true } });
  assert.equal(calls, 0);
  key.filter = () => true;
  event('keydown');
  assert.equal(calls, 1);
});

test('a false handler prevents default and stops propagation', t => {
  setup(t);
  key('a', () => false);
  const keyboardEvent = event('keydown');
  assert.equal(keyboardEvent.prevented, true);
  assert.equal(keyboardEvent.stopped, true);
});

test('unbind removes only the requested modifier combination', t => {
  setup(t);
  let plainCalls = 0;
  let modifiedCalls = 0;
  key('x', () => { plainCalls += 1; });
  key('ctrl+x', () => { modifiedCalls += 1; });
  key.unbind('ctrl+x');
  event('keydown', { code: 'KeyX', key: 'x', ctrlKey: true });
  assert.equal(modifiedCalls, 0);
  event('keyup', { code: 'KeyX', key: 'x', ctrlKey: false });
  event('keydown', { code: 'KeyX', key: 'x' });
  assert.equal(plainCalls, 1);
});

test('focus clears stale pressed-key state', t => {
  setup(t);
  event('keydown');
  assert.equal(key.isPressed('a'), true);
  listeners.focus();
  assert.equal(key.isPressed('a'), false);
  assert.deepEqual(key.getPressedKeyCodes(), []);
});

test('dispatches punctuation, function, and named special keys', t => {
  setup(t);
  const sequence = [];
  const punctuation = [
    [',', 'Comma'], ['.', 'Period'], ['/', 'Slash'], ['`', 'Backquote'],
    ['-', 'Minus'], ['=', 'Equal'], [';', 'Semicolon'], ["'", 'Quote'],
    ['[', 'BracketLeft'], [']', 'BracketRight'], ['\\', 'Backslash']
  ];
  punctuation.forEach(([character, code]) => {
    key(character, () => sequence.push(character));
    event('keydown', { code, key: character });
    event('keyup', { code, key: character });
  });
  key('up', () => sequence.push('up'));
  key('enter', () => sequence.push('enter'));
  event('keydown', { code: 'ArrowUp', key: 'ArrowUp' });
  event('keyup', { code: 'ArrowUp', key: 'ArrowUp' });
  event('keydown', { code: 'Enter', key: 'Enter' });
  event('keyup', { code: 'Enter', key: 'Enter' });
  for (let number = 1; number <= 19; number += 1) {
    key(`f${number}`, () => sequence.push(`f${number}`));
    event('keydown', { code: `F${number}`, key: `F${number}` });
    event('keyup', { code: `F${number}`, key: `F${number}` });
  }
  assert.deepEqual(sequence, [
    ...punctuation.map(([character]) => character),
    'up', 'enter',
    ...Array.from({ length: 19 }, (_, index) => `f${index + 1}`)
  ]);
});

test('unbinds multiple shortcuts and preserves other scopes', t => {
  setup(t);
  let issueCalls = 0;
  let fileCalls = 0;
  key('a, b', () => { issueCalls += 1; });
  key.unbind('a, b');
  event('keydown');
  event('keyup');
  event('keydown', { code: 'KeyB', key: 'b' });
  assert.equal(issueCalls, 0);

  key('a', 'issues', () => { issueCalls += 1; });
  key('a', 'files', () => { fileCalls += 1; });
  key.setScope('issues');
  event('keydown');
  event('keyup');
  key.unbind('a', 'issues');
  event('keydown');
  assert.equal(issueCalls, 1);
  key.setScope('files');
  event('keydown');
  assert.equal(fileCalls, 1);
});

test('deletes a scope without removing global shortcuts', t => {
  setup(t);
  let globalCalls = 0;
  let scopedCalls = 0;
  key('a', () => { globalCalls += 1; });
  key('a', 'editor', () => { scopedCalls += 1; });
  key.deleteScope('editor');
  key.setScope('editor');
  event('keydown');
  assert.equal(globalCalls, 1);
  assert.equal(scopedCalls, 0);
});

test('uses the scope selected by the filter, not a prior scope snapshot', t => {
  setup(t);
  let calls = 0;
  key('a', 'editor', () => { calls += 1; });
  key.filter = () => {
    key.setScope('editor');
    return true;
  };
  event('keydown');
  assert.equal(calls, 1);
});

test('keeps the active scope stable while handlers change it', t => {
  setup(t);
  let firstScopeCalls = 0;
  let secondScopeCalls = 0;
  key('a', 'first', () => {
    firstScopeCalls += 1;
    key.setScope('second');
  });
  key('a', 'second', () => { secondScopeCalls += 1; });
  key.setScope('first');
  event('keydown');
  assert.equal(firstScopeCalls, 1);
  assert.equal(secondScopeCalls, 0);
  event('keyup');
  event('keydown');
  assert.equal(secondScopeCalls, 1);
});
