export declare class KeymasterShortcut extends HTMLElement {
  keys: string;
  platform: string;
}

export default KeymasterShortcut;

declare global {
  interface HTMLElementTagNameMap {
    'keymaster-shortcut': KeymasterShortcut;
  }
}