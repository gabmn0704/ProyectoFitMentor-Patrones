// Genera los iconos de Expo (icon, adaptive, splash, favicon) a partir de la marca de assets/brand/logo.svg.
// Uso: npm run icons
const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

const out = path.join(__dirname, '..', 'assets')

const grad =
  '<defs><linearGradient id="fm-g" x1="130" y1="410" x2="390" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#19E3A1"/><stop offset="1" stop-color="#D4FF3A"/></linearGradient></defs>'
const mark = (fill) =>
  `<g transform="translate(256 258) scale(1.1) translate(-281 -260)" fill="${fill}" stroke="${fill}" stroke-width="24" stroke-linejoin="round"><path d="M160 392V128h222l-40 64H224v52h74l-40 64h-34v84z"/><path d="M308 392l50-80 50 80z"/></g>`
const svg = (viewBox, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${grad}${body}</svg>`

const jobs = {
  // Cuadrado completo y sin transparencia: el sistema aplica el redondeo.
  'icon.png': [1024, svg('0 0 512 512', `<rect width="512" height="512" fill="#0A0E13"/>${mark('url(#fm-g)')}`)],
  // Android adaptativo: la marca queda dentro de la zona segura (66 %).
  'android-icon-foreground.png': [1024, svg('-30 -30 572 572', mark('url(#fm-g)'))],
  'android-icon-background.png': [1024, svg('0 0 512 512', '<rect width="512" height="512" fill="#0A0E13"/>')],
  'android-icon-monochrome.png': [1024, svg('-30 -30 572 572', mark('#ffffff'))],
  'splash-icon.png': [1024, svg('-30 -30 572 572', mark('url(#fm-g)'))],
  'favicon.png': [96, svg('0 0 512 512', `<rect width="512" height="512" rx="116" fill="#0A0E13"/>${mark('url(#fm-g)')}`)],
}

for (const [name, [size, source]] of Object.entries(jobs)) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng()
  fs.writeFileSync(path.join(out, name), png)
  console.log(`${name} ${size}px ${png.length} bytes`)
}
