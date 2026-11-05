import './style.css'
import { registerPlugin } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

const NativeDownloader = registerPlugin('NativeDownloader')
const app = document.querySelector('#app')

const API = 'https://vidbear.onrender.com'

app.innerHTML = `
<style>
*{box-sizing:border-box}
body{margin:0;background:#10131c;color:white;font-family:Arial,sans-serif}
.vb{max-width:500px;margin:auto;padding:20px 16px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}
.logo{font-size:28px;font-weight:900;color:#62e6a5}
.logo span{color:white}
button{border:0;border-radius:12px;padding:14px;background:#62e6a5;color:#10131c;font-weight:bold;cursor:pointer}
button:disabled{opacity:.5}
.card{background:#1c2230;border-radius:18px;padding:20px;margin-bottom:18px}
input{width:100%;padding:16px;background:#111722;border:1px solid #3b4558;color:white;border-radius:12px;margin:14px 0}
.action{width:100%;margin-top:12px}
.secondary{background:#30394b;color:white}
#player{margin-top:14px}
video,iframe{width:100%;border:0;border-radius:12px;background:#000}
video{aspect-ratio:16/9}
iframe{aspect-ratio:16/9;max-height:520px}
#status{display:none;margin-top:14px;padding:13px;background:#283548;border-radius:10px;overflow-wrap:anywhere}
.history{padding:12px 0;border-bottom:1px solid #394052;overflow-wrap:anywhere}
.history button{margin-top:8px}
p{color:#b1bbca;line-height:1.5}
footer{text-align:center;color:#8892a3;font-size:12px;padding:20px}
.file-label{display:block;background:#111722;padding:16px;border:1px dashed #62e6a5;border-radius:12px;margin-top:14px}
</style>

<div class="vb">
<header>
<button class="secondary" id="back">← Back</button>
<div class="logo">Vid<span>Bear</span> 🐻</div>
</header>

<div class="card">
<h2>Video Downloader</h2>
<p>YouTube, Facebook, TikTok and direct video links.</p>
<input id="url" type="url" placeholder="Paste video link here">

<button class="action" id="preview">▶ Preview Video</button>
<button class="action" id="open">↗ Open Link</button>
<button class="action" id="download">⬇ Download Video</button>

<div id="status"></div>
<div id="player"></div>
</div>

<div class="card">
<h2>🎵 MP3 Converter</h2>
<p>Select your own video or a video you have permission to convert.</p>
<label class="file-label">
Choose Video File
<input id="videoFile" type="file" accept="video/*">
</label>
<button class="action" id="convert">Convert to MP3</button>
</div>

<div class="card">
<h2>Download History</h2>
<div id="history"></div>
<button class="action secondary" id="clear">Clear History</button>
</div>

<footer>VidBear • Video Downloader</footer>
</div>
`

const $ = id => document.getElementById(id)

function show(message) {
 $('status').style.display = 'block'
 $('status').textContent = message
}

function validUrl() {
 try {
  const u = new URL($('url').value.trim())
  return ['http:','https:'].includes(u.protocol) ? u : null
 } catch {
  return null
 }
}

function platform(u) {
 const h = u.hostname.toLowerCase()
 if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(h)) return 'youtube'
 if (/(^|\.)facebook\.com$|(^|\.)fb\.watch$/.test(h)) return 'facebook'
 if (/(^|\.)tiktok\.com$/.test(h)) return 'tiktok'
 if (/(^|\.)instagram\.com$/.test(h)) return 'instagram'
 return 'other'
}

function youtubeId(u) {
 if (u.hostname.includes('youtu.be')) {
  return u.pathname.split('/').filter(Boolean)[0] || ''
 }
 if (u.pathname === '/watch') return u.searchParams.get('v') || ''
 const parts = u.pathname.split('/').filter(Boolean)
 if (['shorts','embed','live'].includes(parts[0])) return parts[1] || ''
 return ''
}

function history() {
 let items = []
 try {
  items = JSON.parse(localStorage.getItem('vb_history') || '[]')
 } catch {}

 $('history').innerHTML = ''

 if (!items.length) {
  $('history').textContent = 'No downloads yet.'
  return
 }

 items.forEach(item => {
  const div = document.createElement('div')
  div.className = 'history'
  const title = document.createElement('div')
  title.textContent = item.name
  const date = document.createElement('p')
  date.textContent = item.date
  div.append(title,date)
  $('history').append(div)
 })
}

function saveHistory(url,name) {
 let items = []
 try {
  items = JSON.parse(localStorage.getItem('vb_history') || '[]')
 } catch {}
 items.unshift({url,name,date:new Date().toLocaleString()})
 localStorage.setItem('vb_history',JSON.stringify(items.slice(0,30)))
 history()
}

async function openLink() {
 const u = validUrl()
 if (!u) return show('Please enter a valid URL.')
 try {
  await Browser.open({url:u.href})
 } catch(e) {
  show('Cannot open link: ' + (e.message || e))
 }
}

function preview() {
 const u = validUrl()
 if (!u) return show('Please enter a valid URL.')

 const p = platform(u)
 const player = $('player')
 player.innerHTML = ''

 if (p === 'youtube') {
  const id = youtubeId(u)
  if (!id) return show('YouTube video link could not be identified.')
  const frame = document.createElement('iframe')
  frame.src = 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?playsinline=1&rel=0'
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  frame.allowFullscreen = true
  frame.referrerPolicy = 'strict-origin-when-cross-origin'
  frame.title = 'YouTube Video Player'
  player.append(frame)
  return show('YouTube official player. Press play to watch.')
 }

 if (p === 'facebook') {
  const frame = document.createElement('iframe')
  frame.src = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(u.href) + '&show_text=false'
  frame.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share'
  frame.allowFullscreen = true
  player.append(frame)
  return show('Facebook official video player.')
 }

 if (p === 'tiktok') {
  const match = u.pathname.match(/\/video\/(\d+)/)
  if (!match) return show('TikTok video ID not found.')
  const frame = document.createElement('iframe')
  frame.src = 'https://www.tiktok.com/player/v1/' + match[1] + '?music_info=1&description=1'
  frame.allow = 'autoplay; encrypted-media; picture-in-picture'
  frame.allowFullscreen = true
  player.append(frame)
  return show('TikTok official player.')
 }

 if (p === 'instagram') {
  const match = u.pathname.match(/\/(p|reel|tv)\/([^/]+)/)
  if (!match) return show('Open this Instagram link in Instagram.')
  const frame = document.createElement('iframe')
  frame.src = 'https://www.instagram.com/' + match[1] + '/' + encodeURIComponent(match[2]) + '/embed'
  frame.allowFullscreen = true
  player.append(frame)
  return show('Instagram official embed.')
 }

 if (/\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) {
  const v = document.createElement('video')
  v.controls = true
  v.playsInline = true
  v.preload = 'metadata'
  v.src = u.href
  v.onerror = () => show('Video preview unavailable.')
  player.append(v)
  return show('Direct video link detected.')
 }

 show('This is a webpage link, not a direct video file.')
}

async function download() {
 const u = validUrl()
 if (!u) return show('Please enter a valid URL.')

 if (platform(u) !== 'other') {
  return show('Use official platform download options, or download your own media.')
 }

 if (!/\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) {
  return show('Direct video file link required.')
 }

 const btn = $('download')
 btn.disabled = true
 try {
  let name = decodeURIComponent(u.pathname.split('/').pop() || '')
  name = name.replace(/[^a-zA-Z0-9._-]/g,'_')
  if (!name) name = 'VidBear_' + Date.now() + '.mp4'
  const result = await NativeDownloader.download({url:u.href,fileName:name})
  saveHistory(u.href,result.fileName || name)
  show('Download started. Check notification. Folder: Movies/VidBear/')
 } catch(e) {
  show('Download error: ' + (e.message || String(e)))
 } finally {
  btn.disabled = false
 }
}

async function convertMP3() {
 const file = $('videoFile').files[0]
 if (!file) return show('Please choose a video file first.')

 const btn = $('convert')
 btn.disabled = true
 btn.textContent = 'Converting...'
 show('Uploading video. Please wait...')

 try {
  const form = new FormData()
  form.append('video', file)

  const response = await fetch(API + '/api/convert-mp3', {
   method: 'POST',
   body: form
  })

  if (!response.ok) {
   const errorText = await response.text()
   let message = 'Conversion failed'
   try {
    message = JSON.parse(errorText).error || message
   } catch {}
   throw new Error(message)
  }

  const blob = await response.blob()
  if (!blob.size) throw new Error('Empty MP3 file received')

  show('Saving MP3 to your phone...')

  const dataUrl = await new Promise((resolve, reject) => {
   const reader = new FileReader()
   reader.onload = () => resolve(reader.result)
   reader.onerror = () => reject(new Error('Could not read MP3 file'))
   reader.readAsDataURL(blob)
  })

  const base64 = dataUrl.split(',')[1]
  const fileName = 'VidBear_' + Date.now() + '.mp3'

  const result = await NativeDownloader.saveBase64({
   data: base64,
   fileName
  })

  saveHistory('MP3 Conversion', result.fileName || fileName)
  show('MP3 saved successfully! Folder: Music/VidBear/')
 } catch (e) {
  show('MP3 Error: ' + (e.message || String(e)))
 } finally {
  btn.disabled = false
  btn.textContent = 'Convert to MP3'
 }
}

$('preview').onclick = preview
$('open').onclick = openLink
$('download').onclick = download
$('convert').onclick = convertMP3

$('back').onclick = () => {
 $('url').value = ''
 $('player').innerHTML = ''
 $('status').style.display = 'none'
 window.scrollTo({top:0,behavior:'smooth'})
}

$('clear').onclick = () => {
 localStorage.removeItem('vb_history')
 history()
 show('History cleared.')
}

history()
