import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const publicDir = join(root, 'public')
const manifestPath = join(publicDir, 'manifest.webmanifest')
const swPath = join(publicDir, 'sw.js')
const htmlPath = join(root, 'index.html')

const failures = []

const fail = (message) => {
  failures.push(message)
}

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`)
    return null
  }
}

const readText = (path) => {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    fail(`${path} could not be read: ${error.message}`)
    return ''
  }
}

const getPngSize = (path) => {
  const buffer = readFileSync(path)
  const pngSignature = '89504e470d0a1a0a'
  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    return null
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

const manifest = readJson(manifestPath)
const serviceWorker = readText(swPath)
const indexHtml = readText(htmlPath)

if (manifest) {
  const requiredManifestFields = [
    'name',
    'short_name',
    'start_url',
    'scope',
    'display',
    'background_color',
    'theme_color',
    'icons',
  ]

  for (const field of requiredManifestFields) {
    if (!manifest[field]) fail(`manifest missing required field: ${field}`)
  }

  if (manifest.display !== 'standalone') {
    fail('manifest display should be standalone')
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : []
  const has192 = icons.some((icon) => icon.sizes === '192x192')
  const has512 = icons.some((icon) => icon.sizes === '512x512')
  const hasMaskable = icons.some((icon) => String(icon.purpose ?? '').includes('maskable'))

  if (!has192) fail('manifest needs a 192x192 icon')
  if (!has512) fail('manifest needs a 512x512 icon')
  if (!hasMaskable) fail('manifest needs a maskable icon')

  for (const icon of icons) {
    const src = String(icon.src ?? '')
    const sizes = String(icon.sizes ?? '')
    if (!src.startsWith('/')) {
      fail(`manifest icon src should be absolute: ${src}`)
      continue
    }

    const iconPath = join(publicDir, src.slice(1))
    if (!existsSync(iconPath)) {
      fail(`manifest icon missing file: ${src}`)
      continue
    }

    if (icon.type === 'image/png' && sizes.includes('x')) {
      const [expectedWidth, expectedHeight] = sizes.split('x').map(Number)
      const actual = getPngSize(iconPath)
      if (!actual) {
        fail(`manifest icon is not a PNG: ${src}`)
      } else if (actual.width !== expectedWidth || actual.height !== expectedHeight) {
        fail(`manifest icon ${src} is ${actual.width}x${actual.height}, expected ${sizes}`)
      }
    }
  }
}

const requiredHtmlSnippets = [
  '<html lang="pt-BR">',
  'rel="manifest"',
  'rel="apple-touch-icon"',
  'viewport-fit=cover',
  'mobile-web-app-capable',
  'apple-mobile-web-app-capable',
  'theme-color',
]

for (const snippet of requiredHtmlSnippets) {
  if (!indexHtml.includes(snippet)) fail(`index.html missing: ${snippet}`)
}

const requiredSwSnippets = [
  'CACHE_NAME',
  '/index.html',
  '/manifest.webmanifest',
  '/if-icon-192.png',
  'request.mode === \'navigate\'',
  'self.skipWaiting',
  'self.clients.claim',
]

for (const snippet of requiredSwSnippets) {
  if (!serviceWorker.includes(snippet)) fail(`sw.js missing: ${snippet}`)
}

if (failures.length > 0) {
  console.error('PWA check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('PWA check passed.')
