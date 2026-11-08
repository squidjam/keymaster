const assert = require('node:assert/strict');
const test = require('node:test');

function createNode(tagName) {
  return {
    tagName,
    attributes: {},
    children: [],
    textContent: '',
    className: '',
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    append(child) {
      this.children.push(child);
    },
    replaceChildren(...children) {
      this.children = children;
    }
  };
}

class FakeHTMLElement {
  constructor() {
    this.attributes = {};
    this.isConnected = false;
    this.shadowRoot = null;
  }

  attachShadow() {
    this.shadowRoot = createNode('shadow-root');
    return this.shadowRoot;
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  setAttribute(name, value) {
    const previousValue = this.getAttribute(name);
    this.attributes[name] = String(value);
    if (previousValue !== String(value)) {
      this.attributeChangedCallback(name, previousValue, String(value));
    }
  }
}

test('renders platform-aware key caps and an accessible label', async () => {
  const previousHTMLElement = global.HTMLElement;
  const previousCustomElements = global.customElements;
  const previousDocument = global.document;
  const previousNavigator = global.navigator;
  const definitions = new Map();
  global.HTMLElement = FakeHTMLElement;
  global.customElements = {
    get: name => definitions.get(name),
    define: (name, constructor) => definitions.set(name, constructor)
  };
  global.document = { createElement: createNode };
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: { platform: 'Linux x86_64' }
  });

  try {
    const { KeymasterShortcut } = await import('../keymaster-shortcut.mjs?test');
    const shortcut = new KeymasterShortcut();
    shortcut.keys = 'command+k, ctrl+shift+p';
    shortcut.platform = 'mac';
    shortcut.isConnected = true;
    shortcut.connectedCallback();

    const renderedShortcuts = shortcut.shadowRoot.children[1];
    const firstChord = renderedShortcuts.children[0];
    const secondChord = renderedShortcuts.children[2];
    assert.equal(firstChord.children[0].textContent, '⌘');
    assert.equal(firstChord.children[2].textContent, 'K');
    assert.equal(renderedShortcuts.children[1].textContent, 'or');
    assert.equal(secondChord.children[0].textContent, '⌃');
    assert.equal(secondChord.children[2].textContent, '⇧');
    assert.equal(secondChord.children[4].textContent, 'P');
    assert.equal(shortcut.attributes.role, 'img');
    assert.equal(shortcut.attributes['aria-label'], 'Command plus K or Control plus Shift plus P');
  } finally {
    if (previousHTMLElement === undefined) delete global.HTMLElement;
    else global.HTMLElement = previousHTMLElement;
    if (previousCustomElements === undefined) delete global.customElements;
    else global.customElements = previousCustomElements;
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
    if (previousNavigator === undefined) delete global.navigator;
    else Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: previousNavigator
    });
  }
});
