const HTMLElementBase = globalThis.HTMLElement || class {};

const modifierNames = new Set([
  'shift', 'ctrl', 'control', 'alt', 'option', 'command', 'cmd', 'meta'
]);

const keyLabels = {
  backspace: ['Backspace', 'Backspace'],
  tab: ['Tab', 'Tab'],
  enter: ['Enter', 'Enter'],
  return: ['Enter', 'Enter'],
  esc: ['Esc', 'Escape'],
  escape: ['Esc', 'Escape'],
  space: ['Space', 'Space'],
  up: ['↑', 'Up Arrow'],
  down: ['↓', 'Down Arrow'],
  left: ['←', 'Left Arrow'],
  right: ['→', 'Right Arrow'],
  home: ['Home', 'Home'],
  end: ['End', 'End'],
  pageup: ['PgUp', 'Page Up'],
  pagedown: ['PgDn', 'Page Down'],
  delete: ['Del', 'Delete'],
  del: ['Del', 'Delete'],
  comma: [',', 'Comma'],
  ',': [',', 'Comma']
};

const modifierLabels = {
  shift: { mac: ['⇧', 'Shift'], other: ['Shift', 'Shift'] },
  ctrl: { mac: ['⌃', 'Control'], other: ['Ctrl', 'Control'] },
  control: { mac: ['⌃', 'Control'], other: ['Ctrl', 'Control'] },
  alt: { mac: ['⌥', 'Option'], other: ['Alt', 'Alt'] },
  option: { mac: ['⌥', 'Option'], other: ['Alt', 'Alt'] },
  command: { mac: ['⌘', 'Command'], other: ['Win', 'Windows'] },
  cmd: { mac: ['⌘', 'Command'], other: ['Win', 'Windows'] },
  meta: { mac: ['⌘', 'Command'], other: ['Win', 'Windows'] }
};

function splitShortcuts(value) {
  const shortcuts = value.replace(/\s/g, '').split(',');
  if (shortcuts.length > 1 && shortcuts.at(-1) === '') {
    shortcuts[shortcuts.length - 2] += ',';
    shortcuts.pop();
  }
  return shortcuts.filter(Boolean);
}

function isMacPlatform() {
  const platform = globalThis.navigator?.userAgentData?.platform ||
    globalThis.navigator?.platform || '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

function modifierLabel(token, isMac) {
  const labels = modifierLabels[token];
  return labels ? labels[isMac ? 'mac' : 'other'] : null;
}

function describeToken(token, isMac) {
  const modifier = modifierLabel(token, isMac);
  if (modifier) return modifier;
  const keyLabel = keyLabels[token];
  if (keyLabel) return keyLabel;
  const label = token.length === 1 ? token.toUpperCase() : token;
  return [label, label];
}

export class KeymasterShortcut extends HTMLElementBase {
  static get observedAttributes() {
    return ['keys', 'platform'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  get keys() {
    return this.getAttribute('keys') || '';
  }

  set keys(value) {
    this.setAttribute('keys', value);
  }

  get platform() {
    return this.getAttribute('platform') || 'auto';
  }

  set platform(value) {
    this.setAttribute('platform', value);
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const shortcuts = splitShortcuts(this.keys);
    const requestedPlatform = this.platform.toLowerCase();
    const isMac = requestedPlatform === 'mac' ||
      (requestedPlatform === 'auto' && isMacPlatform());
    const root = document.createElement('span');
    const accessibleShortcuts = [];

    root.className = 'shortcuts';
    root.setAttribute('aria-hidden', 'true');

    shortcuts.forEach((shortcut, shortcutIndex) => {
      if (shortcutIndex > 0) {
        const alternative = document.createElement('span');
        alternative.className = 'alternative';
        alternative.setAttribute('part', 'separator');
        alternative.textContent = 'or';
        root.append(alternative);
      }

      const chord = document.createElement('span');
      chord.className = 'chord';
      const spokenChord = [];
      const tokens = shortcut.split('+').map(token => token || ',');

      tokens.forEach((token, tokenIndex) => {
        const [visualLabel, spokenLabel] = describeToken(token.toLowerCase(), isMac);
        if (tokenIndex > 0) {
          const separator = document.createElement('span');
          separator.className = 'plus';
          separator.setAttribute('part', 'separator');
          separator.textContent = '+';
          chord.append(separator);
        }

        const key = document.createElement('kbd');
        key.setAttribute('part', 'key');
        key.textContent = visualLabel;
        chord.append(key);
        spokenChord.push(spokenLabel);
      });

      root.append(chord);
      accessibleShortcuts.push(spokenChord.join(' plus '));
    });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        --keymaster-key-background: #f0f3f5;
        --keymaster-key-color: #20282d;
        --keymaster-key-border: #b7c1c7;
        --keymaster-key-radius: 4px;
        --keymaster-key-shadow: 0 1px 0 #b7c1c7;
        --keymaster-key-font: ui-monospace, "SFMono-Regular", Consolas, monospace;
        --keymaster-key-gap: 0.25em;
        color: inherit;
        display: inline-flex;
        vertical-align: middle;
      }
      .shortcuts, .chord { align-items: center; display: inline-flex; gap: var(--keymaster-key-gap); }
      .alternative { color: currentColor; font: 0.8em/1 sans-serif; opacity: 0.65; padding: 0 0.15em; }
      .plus { color: currentColor; font: 0.8em/1 sans-serif; opacity: 0.65; }
      kbd {
        background: var(--keymaster-key-background);
        border: 1px solid var(--keymaster-key-border);
        border-radius: var(--keymaster-key-radius);
        box-shadow: var(--keymaster-key-shadow);
        color: var(--keymaster-key-color);
        font: 500 0.82em/1.35 var(--keymaster-key-font);
        min-width: 1.5em;
        padding: 0.12em 0.38em;
        text-align: center;
        white-space: nowrap;
      }
      kbd[part="key"] { box-sizing: border-box; }
    `;

    this.shadowRoot.replaceChildren(style, root);
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', accessibleShortcuts.join(' or '));
  }
}

if (globalThis.customElements && !globalThis.customElements.get('keymaster-shortcut')) {
  globalThis.customElements.define('keymaster-shortcut', KeymasterShortcut);
}

export default KeymasterShortcut;
