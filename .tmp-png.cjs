const fs = require('fs')
const zlib = require('zlib')

function decodePng(file) {
  const buf = fs.readFileSync(file)
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8) throw new Error('bit depth ' + bitDepth)
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : -1
  if (channels < 0) throw new Error('color type ' + colorType)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(height * stride)
  let pos = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++]
    const row = raw.subarray(pos, pos + stride); pos += stride
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null
    const cur = out.subarray(y * stride, (y + 1) * stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0
      const b = prev ? prev[x] : 0
      const c = prev && x >= channels ? prev[x - channels] : 0
      let v = row[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
      }
      cur[x] = v & 0xff
    }
  }
  return { width, height, channels, data: out }
}

function purpleStats(file, region) {
  const { width, height, channels, data } = decodePng(file)
  let purple = 0, bright = 0, total = 0
  const x0 = region ? Math.max(0, Math.floor(region.x)) : 0
  const y0 = region ? Math.max(0, Math.floor(region.y)) : 0
  const x1 = region ? Math.min(width, Math.ceil(region.x + region.w)) : width
  const y1 = region ? Math.min(height, Math.ceil(region.y + region.h)) : height
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * channels
      const r = data[i], g = data[i + 1], b = data[i + 2]
      total++
      if (b > 110 && b - g > 40 && r > 80 && b >= r - 10) purple++
      if (r + g + b > 320) bright++
    }
  }
  return { purple, bright, total }
}

const [fileA, fileB, regionJson] = process.argv.slice(2)
const region = regionJson ? JSON.parse(regionJson) : null
console.log(JSON.stringify({
  before: purpleStats(fileA, region),
  after: purpleStats(fileB, region),
}, null, 2))
