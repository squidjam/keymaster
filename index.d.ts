declare function keymaster(shortcut: string, handler: keymaster.Handler): void;
declare function keymaster(
  shortcut: string,
  scope: string,
  handler: keymaster.Handler
): void;

declare namespace keymaster {
  interface HandlerInfo {
    shortcut: string;
    scope: string;
    method: Handler;
    key: string;
    mods: number[];
  }

  type Handler = (event: KeyboardEvent, info: HandlerInfo) => void | boolean;
  type Filter = (event: KeyboardEvent) => boolean;

  let shift: boolean;
  let alt: boolean;
  let option: boolean;
  let ctrl: boolean;
  let control: boolean;
  let command: boolean;
  let filter: Filter;

  function setScope(scope?: string): void;
  function getScope(): string;
  function deleteScope(scope: string): void;
  function isPressed(keyCode: string | number): boolean;
  function getPressedKeyCodes(): number[];
  function noConflict(): typeof keymaster;
  function unbind(shortcut: string, scope?: string): void;
}

export = keymaster;