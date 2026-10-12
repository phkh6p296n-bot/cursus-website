// Build tooling on esbuild only (no other bundler needed).
//   node scripts/build.mjs dev        -> dev server with live reload on http://localhost:5173
//   node scripts/build.mjs prod       -> static site in dist/ (deploy this folder, e.g. Netlify)
//   node scripts/build.mjs artifact   -> single-file preview in artifact/cursus.html
//                                       (React loaded from cdnjs, everything else inlined)
// Env: LEAD_ENDPOINT=https://... sets where the booking form posts (empty = preview mode).
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? 'prod';
const leadEndpoint = process.env.LEAD_ENDPOINT ?? '';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap';
const REACT_UMD = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
];

const common = {
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  jsx: 'automatic',
  target: ['es2020'],
  loader: { '.json': 'json' },
  define: {
    __LEAD_ENDPOINT__: JSON.stringify(leadEndpoint),
    'process.env.NODE_ENV': JSON.stringify(mode === 'dev' ? 'development' : 'production'),
  },
  logLevel: 'info',
};

/** Maps react imports to the UMD globals for the single-file artifact build. */
const reactGlobals = {
  name: 'react-globals',
  setup(build) {
    const shims = {
      react: 'module.exports = window.React;',
      'react-dom/client': 'module.exports = window.ReactDOM;',
      'react-dom': 'module.exports = window.ReactDOM;',
      'react/jsx-runtime': `const R = window.React;
        function jsx(type, props, key) { return R.createElement(type, key === undefined ? props : Object.assign({}, props, { key })); }
        module.exports = { jsx, jsxs: jsx, Fragment: R.Fragment };`,
    };
    build.onResolve({ filter: /^react(-dom)?(\/client|\/jsx-runtime)?$/ }, (args) => ({ path: args.path, namespace: 'react-global' }));
    build.onLoad({ filter: /.*/, namespace: 'react-global' }, (args) => ({ contents: shims[args.path], loader: 'js' }));
  },
};

function htmlPage({ css, js, head = '', bodyEnd = '' }) {
  const tpl = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  return tpl
    .replace('<!-- HEAD -->', head + (css ? `\n    <link rel="stylesheet" href="${css}" />` : ''))
    .replace('<!-- SCRIPTS -->', (js ? `<script src="${js}"></script>` : '') + bodyEnd);
}

if (mode === 'dev') {
  const out = path.join(root, '.dev');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, 'index.html'),
    htmlPage({
      css: '/app.css',
      js: '/app.js',
      bodyEnd: `<script>new EventSource('/esbuild').addEventListener('change', () => location.reload())</script>`,
    }),
  );
  const ctx = await esbuild.context({ ...common, outfile: path.join(out, 'app.js'), sourcemap: true });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: out, port: 5173 });
  console.log(`\n  cursus dev server: http://localhost:${port}\n`);
} else if (mode === 'prod') {
  const out = path.join(root, 'dist');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
  const result = await esbuild.build({
    ...common,
    outdir: path.join(out, 'assets'),
    entryNames: 'app-[hash]',
    minify: true,
    metafile: true,
  });
  const files = Object.keys(result.metafile.outputs).map((f) => path.relative(out, path.join(root, f)));
  const js = files.find((f) => f.endsWith('.js'));
  const css = files.find((f) => f.endsWith('.css'));
  fs.writeFileSync(path.join(out, 'index.html'), htmlPage({ css: `/${css}`, js: `/${js}` }));
  for (const f of fs.readdirSync(path.join(root, 'public'))) fs.copyFileSync(path.join(root, 'public', f), path.join(out, f));
  console.log(`dist/ ready: ${js}, ${css}`);
} else if (mode === 'artifact') {
  const result = await esbuild.build({
    ...common,
    write: false,
    outdir: path.join(root, 'artifact/tmp'),
    minify: true,
    format: 'iife',
    plugins: [reactGlobals],
  });
  const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
  const css = result.outputFiles.find((f) => f.path.endsWith('.css')).text;
  // The artifact host adds doctype, <html>, <head> and <body>, so this is a fragment.
  const html = `<title>cursus</title>
<meta name="description" content="Die beste nächste Ladung für jeden LKW. KI-Disposition für Speditionen und Frächter.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${css.replace(/<\/style/gi, '<\\/style')}</style>
<div id="root"></div>
${REACT_UMD.map((src) => `<script src="${src}" crossorigin="anonymous"></script>`).join('\n')}
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
  fs.mkdirSync(path.join(root, 'artifact'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifact/cursus.html'), html);
  console.log(`artifact/cursus.html written (${Math.round(html.length / 1024)} KB)`);
} else {
  console.error(`Unknown mode ${mode}`);
  process.exit(1);
}
