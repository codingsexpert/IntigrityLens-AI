// download-models.js
// ─────────────────────────────────────────────
// CHANCHAL — RUN THIS SCRIPT ONCE TO DOWNLOAD AI MODELS
//
// Run it from the /frontend folder with:
//   node download-models.js
//
// It will download 4 model files into /public/models/
// which face-api.js needs to detect faces.
// ─────────────────────────────────────────────
import https from 'https'
import fs    from 'fs'
import path  from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEST      = path.join(__dirname, 'public', 'models')
const BASE_URL  = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'

// The 4 files we need
const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
]

// Make sure /public/models/ exists
if (!fs.existsSync(DEST)) {
  fs.mkdirSync(DEST, { recursive: true })
  console.log('📁 Created /public/models/')
}

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url      = `${BASE_URL}/${filename}`
    const destPath = path.join(DEST, filename)

    if (fs.existsSync(destPath)) {
      console.log(`✅ Already exists: ${filename}`)
      resolve()
      return
    }

    console.log(`⬇  Downloading: ${filename}`)
    const file = fs.createWriteStream(destPath)

    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${filename}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        console.log(`✅ Done: ${filename}`)
        resolve()
      })
    }).on('error', err => {
      fs.unlink(destPath, () => {})  // delete partial file
      reject(err)
    })
  })
}

async function main() {
  console.log('\n🤖 IntegrityLens AI — Model Downloader')
  console.log('=======================================')
  console.log(`Saving to: ${DEST}\n`)

  try {
    for (const file of FILES) {
      await downloadFile(file)
    }
    console.log('\n🎉 All models downloaded successfully!')
    console.log('You can now run: npm run dev\n')
  } catch (err) {
    console.error('\n❌ Download failed:', err.message)
    console.log('\nManual alternative:')
    console.log('1. Open: https://github.com/justadudewhohacks/face-api.js/tree/master/weights')
    console.log('2. Download these 4 files:')
    FILES.forEach(f => console.log('   -', f))
    console.log('3. Put them in: frontend/public/models/')
  }
}

main()
