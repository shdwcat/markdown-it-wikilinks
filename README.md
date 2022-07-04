# Markdown-It Wikilinks

Renders [Wikimedia-style links](https://www.mediawiki.org/wiki/Help:Links#Internal_links) in [markdown-it](https://github.com/markdown-it/markdown-it). This is useful for making Markdown-based wikis.

This version supports `[[#heading]]` links both within the current page and in other pages with `[[Other#heading]]`. It also supports relative location in links such as `../Main` which points to `Main` in the folder above the current file. All of these features work together, e.g. `[[../Main#menu|Go to Main Menu]]`.

Support for making links functional wihtin vscode's Markdown Preview is also available via the [`vscodeSupport`](#vscodesupport) option.

## Usage

Install this into your project:

```bash
npm --save install markdown-it-wikilinks
```

...and *use* it:

```js
const wikilinks = require('@shdwcat/markdown-it-wikilinks')(options)
const md = require('markdown-it')()
    .use(wikilinks)
    .render('Click [[Wiki Links|here]] to learn about [[/Wiki]] links.')
```

**Output:**

```html
<p>Click <a href="./Wiki_Links.html">here</a> to learn about <a href="/Wiki.html">Wiki</a> links.</p>
```

## Options

### `vscodeSupport`

**Default:** `false`

Enables functioning links in vscode's Markdown Preview by setting the `data-href` attribute on the anchor link.

### `baseURL`

**Default:** `/`

The base URL for absolute wiki links.

```js
const html = require('markdown-it')()
  .use(require('markdown-it-wikilinks')({ baseURL: '/wiki/' }))
  .render('[[/Main Page]]')
  // <p><a href="/wiki/Main_Page.html">Main Page</a></p>
```

### `relativeBaseURL`

**Default:** `./`

The base URL for relative wiki links.

```js
const html = require('markdown-it')()
  .use(require('markdown-it-wikilinks')({ relativeBaseURL: '#', uriSuffix: '' }))
  .render('[[Main Page]]')
  // <p><a href="#Main_Page">Main Page</a></p>
```

### `makeAllLinksAbsolute`

**Default:** `false`

Render all wiki links as absolute links.

### `uriSuffix`

**Default:** `.html`

Append this suffix to every link that doesn't already end with it.

If left blank, links will use the same extension as the markdown file itself. For example `[[Foo]]` in a file named `bar.md` will link to `Foo.md`.

```js
const html = require('markdown-it')()
  .use(require('markdown-it-wikilinks')({ uriSuffix: '.php' }))
  .render('[[Main Page]]')
  // <p><a href="./Main_Page.php">Main Page</a></p>
```

### `htmlAttributes`

**Default:** `{}`

An object containing HTML attributes to be applied to every link.

```js
const attrs = {
  'class': 'wikilink',
  'rel': 'nofollow'
}
const html = require('markdown-it')()
  .use(require('markdown-it-wikilinks')({ htmlAttributes: attrs }))
  .render('[[Main Page]]')
  // <p><a href="./Main_Page.html" class="wikilink" rel="nofollow">Main Page</a></p>
```

### `generatePageNameFromLabel`

Unless otherwise specified, the labels of the links are used as the targets. This means that a non-[piped](https://meta.wikimedia.org/wiki/Help:Piped_link) link such as `[[Slate]]` will point to the `Slate` page on your website.

But say you wanted a little more flexibility - like being able to have `[[Slate]]`, `[[slate]]`, `[[SLATE]]` and `[[Slate!]]` to all point to the same page. Well, you can do this by providing your own custom `generatePageNameFromLabel` function.

#### Example

```js
const _ = require('lodash')

function myCustomPageNameGenerator(label) {
  return label.split('/').map(function(pathSegment) {
    // clean up unwanted characters, normalize case and capitalize the first letter
    pathSegment = _.deburr(pathSegment)
    pathSegment = pathSegment.replace(/[^\w\s]/g, '')

    // normalize case
    pathSegment = _.capitalize(pathSegment.toLowerCase())

    return pathSegment
  })
}

const html = require('markdown-it')()
  .use(require('markdown-it-wikilinks')({ generatePageNameFromLabel: myCustomPageNameGenerator }))
  .render('Vive la [[révolution!]] VIVE LA [[RÉVOLUTION!!!]]')
  // <p>Vive la <a href="./Revolution.html">révolution!</a> VIVE LA <a href="./Revolution.html">RÉVOLUTION!!!</a></p>
```

Please note that the `generatePageNameFromLabel` function does not get applied for [piped links](https://meta.wikimedia.org/wiki/Help:Piped_link) such as `[[/Misc/Cats/Slate|kitty]]` since those already come with a target. 

### `postProcessPagePath`

A transform applied to the path in a relative link. For example, in `../path/foo.md`, the path is `../path`.

The default transform makes no changes.

### `postProcessPageName`

A transform applied to every page name. You can override it just like `generatePageNameFromLabel` (see above).

The default transform does the following things:

* trim surrounding whitespace
* [sanitize](https://github.com/parshap/node-sanitize-filename) the string
* replace spaces with underscores

### `postProcessLabel`

A transform applied to every link label. You can override it just like `generatePageNameFromLabel` (see above).

The default transform does the following things:

* strips file extension
* replaces dots dashes and underscores with spaces
* trims surrounding whitespace
* capitalizes first letter

## Credits

Based on [thomaskoppelaar's fork](https://github.com/thomaskoppelaar/markdown-it-wikilinks) of [markdown-it-wikilinks](https://github.com/jsepia/markdown-it-wikilinks).
