# keymaster.js

Keymaster is a dependency-free library for defining and dispatching keyboard
shortcuts in web applications. It preserves the `key(...)` API and includes a
native custom element for displaying shortcuts.

## Usage

For a browser script, include `keymaster.js`:

```html
<script src="keymaster.js"></script>
```

The package can also be loaded with CommonJS (`require('keymaster')`). It has no
runtime dependencies. Run `npm test` to execute the Node test suite.

## TypeScript

Type declarations are included; no separate `@types` package is needed. With
`esModuleInterop` enabled, import and register shortcuts like this:

```typescript
import key from 'keymaster';

key('ctrl+k', (event, shortcut) => {
  console.log(shortcut.shortcut, shortcut.scope);
});
```

Import the custom element module to register its tag and add its type to
`document.createElement`:

```typescript
import 'keymaster/shortcut-element';

const shortcut = document.createElement('keymaster-shortcut');
shortcut.keys = 'ctrl+k';
shortcut.platform = 'auto';
```

## Display shortcuts

Import the custom element once through a package-aware bundler or import map.
It registers `<keymaster-shortcut>` automatically:

```html
<script type="module">
  import 'keymaster/shortcut-element';
</script>

<keymaster-shortcut keys="ctrl+k"></keymaster-shortcut>
<keymaster-shortcut keys="command+k, ctrl+k"></keymaster-shortcut>
```

The `keys` attribute accepts the same modifier names and `+` chord syntax as
the keyboard library. Comma-separated shortcuts render as alternatives. The
`platform` attribute accepts `auto` (the default), `mac`, or another value to
choose platform-specific modifier labels.

The element uses an open shadow root. Style the key caps and separators with
CSS custom properties or parts:

```css
keymaster-shortcut {
  --keymaster-key-background: #fff;
  --keymaster-key-color: #20282d;
  --keymaster-key-border: #8b969d;
  --keymaster-key-radius: 3px;
}

keymaster-shortcut::part(key) {
  padding: 0.2em 0.5em;
}
```

## Defining shortcuts

One global method is exposed, `key` which defines shortcuts when
called directly.

```javascript
// define short of 'a'
key('a', function(){ alert('you pressed a!') });

// returning false stops the event and prevents default browser events
key('ctrl+r', function(){ alert('stopped reload!'); return false });

// multiple shortcuts that do the same thing
key('⌘+r, ctrl+r', function(){ });
```

The handler method is called with two arguments set, the keydown `event` fired, and
an object containing, among others, the following two properties:

`shortcut`: a string that contains the shortcut used, e.g. `ctrl+r`
`scope`: a string describing the scope (or `all`)

```javascript
key('⌘+r, ctrl+r', function(event, handler){
  console.log(handler.shortcut, handler.scope);
});

// "ctrl+r", "all"
```


## Supported keys

Keymaster understands the following modifiers:
`⇧`, `shift`, `option`, `⌥`, `alt`, `ctrl`, `control`, `command`, and `⌘`.

The following special keys can be used for shortcuts:
`backspace`, `tab`, `clear`, `enter`, `return`, `esc`, `escape`, `space`,
`up`, `down`, `left`, `right`, `home`, `end`, `pageup`, `pagedown`, `del`, `delete`
and `f1` through `f19`.


## Modifier key queries

At any point in time (even in code other than key shortcut handlers),
you can query the `key` object for the state of any keys. This
allows easy implementation of things like shift+click handlers. For example,
`key.shift` is `true` if the shift key is currently pressed.

```javascript
if(key.shift) alert('shift is pressed, OMGZ!');
```


## Other key queries

At any point in time (even in code other than key shortcut handlers),
you can query the `key` object for the state of any key. This
is very helpful for game development using a game loop. For example,
`key.isPressed(77)` is `true` if the M key is currently pressed.

```javascript
if(key.isPressed("M")) alert('M key is pressed, can ya believe it!?');
if(key.isPressed(77)) alert('M key is pressed, can ya believe it!?');
```

You can also get these as an array using...
```javascript
key.getPressedKeyCodes() // returns an array of key codes currently pressed
```


## Scopes

If you want to reuse the same shortcut for separate areas in your single page app,
Keymaster supports switching between scopes. Use the `key.setScope` method to set scope.

```javascript
// define shortcuts with a scope
key('o, enter', 'issues', function(){ /* do something */ });
key('o, enter', 'files', function(){ /* do something else */ });

// set the scope (only 'all' and 'issues' shortcuts will be honored)
key.setScope('issues'); // default scope is 'all'

// remove all events that are set in 'issues' scope
key.deleteScope('issues');

```


## Filter key presses

By default, when an `INPUT`, `SELECT` or `TEXTAREA` element is focused, Keymaster doesn't process any shortcuts.

You can change this by overwriting `key.filter` with a new function. This function is called before
Keymaster processes shortcuts, with the keydown event as argument.

If your function returns false, then the no shortcuts will be processed.

Here's the default implementation for reference:

```javascript
function filter(event){
  var tagName = (event.target || event.srcElement).tagName;
  return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
}
```

If you only want _some_ shortcuts to work while in an input element, you can change the scope in the
`key.filter` function. Here's an example implementation, setting the scope to either `'input'` or `'other'`.
Don't forget to return `true` so the any shortcuts get processed.

```javascript
key.filter = function(event){
  var tagName = (event.target || event.srcElement).tagName;
  key.setScope(/^(INPUT|TEXTAREA|SELECT)$/.test(tagName) ? 'input' : 'other');
  return true;
}
```

However a more robust way to handle this is to use proper
focus and blur event handlers on your input element, and change scopes there as you see fit.


## noConflict mode

You can call ```key.noConflict``` to remove the ```key``` function from global scope and restore whatever ```key``` was defined to before Keymaster was loaded. Calling ```key.noConflict``` will return the Keymaster ```key``` function.

```javascript
var k = key.noConflict();
k('a', function() { /* ... */ });

key()
// --> TypeError: 'undefined' is not a function
```


## Unbinding shortcuts

Similar to defining shortcuts, they can be unbound using `key.unbind`.

```javascript
// unbind 'a' handler
key.unbind('a');

// unbind a key only for a single scope
// when no scope is specified it defaults to the current scope (key.getScope())
key.unbind('o, enter', 'issues');
key.unbind('o, enter', 'files');
```


## Notes

The browser entry uses `KeyboardEvent.code` when available and falls back to
legacy key codes. Shortcuts are ignored in input, select, textarea, and
content-editable elements by default. Override `key.filter` to change this.

The `index.html` file is the publishable interactive demo. Serve the repository
root over HTTP to try it locally.


## Contributing

Run `npm test` before submitting a change. The browser demo is in `index.html`.

Keymaster may be freely distributed under the MIT license. See `MIT-LICENSE`.
