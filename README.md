# hylite

A CLI for syntax highlighting code to HTML (...using
[highlight.js](https://www.npmjs.com/package/highlight.js) under the hood).

## To run

### Not installed

```bash
bunx hylite --help
```

Or, if you don't have `bun` installed, with `npx`:

```bash
npx hylite --help
```

### Installed

First install:

```bash
npm install hylite
```

You can either execute it directly:

```bash
./node_modules/.bin/hylite --help
```

Or if you have your `PATH` set, like this:

```bash
export PATH="node_modules/.bin:$PATH"
```

...you'll be able to just type:

```bash
hylite --help
```

## Usage

There are many way to execute the CLI. :

- By `stdin`
- By giving the name of the file
- By a snippet of code

Only when you use a file name/path can it make a good guess of the language.
Otherwise, you'll have to lass the `--language` (or `-l`)  flag.

### By `stdin`

```bash
hylite -l py < mycode.py
```

🎵 This is the same as `cat mycode.py | hyite -l py`

### By giving the name of the file

```bash
hylite myapp.jsx
```

### By a snippet of code

```bash
hylite -l go 'var s string = Acetaminophen.String()'
```

The HTML it produces can be put into a web page, but you probably want
to wrap it in:

```html
<pre>
    <code class="hljs">
        {SNIPPET CODE HERE}
    </code>
</pre>
```

`hylite` can take care of that for you with `--wrapped` (or `-w`). For example:

```bash
❯ hylite -l go -w 'var s string = Acetaminophen.String()'
<pre><code class="hljs"><span class="hljs-keyword">var</span> s <span class="hljs-type">string</span> = Acetaminophen.String()</code></pre>
```

## CSS

In its simplest form, to generate the CSS, use:

```bash
hylite -c
```

(or just `hylite --css`)

That will use `highlight.js`'s `default.css` stylesheet. To see what other
themes are available, run:

```bash
hylite --list-css
```

Now, suppose you want `tokyo-night-dark`, go back and run:

```bash
hylite --css tokyo-night-dark
```

If you want to support both light and dark mode in your application, you
have to pick a theme that has both dark and light versions
(see `hylite --list-css`). For example:

```bash
hylite --css tokyo-night-dark
hylite --css tokyo-night-light
```

Copy each one into this CSS template:

```css

/* PUT YOUR LIGHT MODE CSS HERE */

@media only screen and (prefers-color-scheme: dark) {

    /* PUT YOUR DARK MODE CSS HERE */

}
```

### Preview server

If you want to see what all the different styles look like, you need to
use `bun`. Example:

```bash
❯ hylite -p health.json
Now open http://localhost:3000
```

It will display your `health.json` file but at the top of the page you
can click and select the different possible themes.

![Preview different CSS themes on localhost:3000](./preview-server.png)

## To develop

You must use [Bun](https://bun.sh) to test locally. The most basic form
is using `bun run src/index.ts`.

### First install

If you have cloned the repo, you just need to run:

```bash
bun install
```

...to install the dependencies.

To run:

```bash
bun run src/index.ts --help
```

### Tests

```bash
bun test [--watch]
```

But note that the GitHub Actions workflows do more things with the build
artifact `dist/index.js`. To generate the `dist/index.js`, use:

```bash
bun run build
```

The Node end-to-end test suite uses this `dist/index.js` execlusively.
At the moment (Sept 2023), with `bun` 1.0.2, it appears that generating
the `dist/index.js` is potentially different depending on the platform.

### To release

Run:

```bash
bun run release
```

This will execute `bun run build` and if that `dist/index.js` becomes
different, the release process is halted.
