import './style.css'
import { registerPlugin } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

const NativeDownloader = registerPlugin('NativeDownloader')
const app = document.querySelector('#app')

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
iframe{aspect-ratio:9/16;max-height:520px}
#status{display:none;margin-top:14px;padding:13px;background:#283548;border-radius:10px;overflow-wrap:anywhere}
.history{padding:12px 0;border-bottom:1px solid #394052;overflow-wrap:anywhere}
.history button{margin-top:8px}
p{color:#b1bbca;line-height:1.5}
footer{text-align:center;color:#8892a3;font-size:12px;padding:20px}
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

  const btn = document.createElement('button')
  btn.className = 'secondary'
  btn.textContent = 'Open link'
  btn.onclick = () => {
   $('url').value = item.url
   openLink()
  }

  div.append(title,date,btn)
  $('history').append(div)
 })
}

function saveHistory(url,name) {
 let items = []

 try {
  items = JSON.parse(localStorage.getItem('vb_history') || '[]')
 } catch {}

 items = items.filter(x => x.url !== url)
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

  if (!id) {
   show('YouTube video link could not be identified. Open the link instead.')
   return
  }

  const frame = document.createElement('iframe')
  frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id)
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  frame.allowFullscreen = true
  player.append(frame)
  show('YouTube official player.')
  return
 }

 if (p === 'facebook') {
  const frame = document.createElement('iframe')
  frame.src = 'https://www.facebook.com/plugins/video.php?href=' +
   encodeURIComponent(u.href) + '&show_text=false'
  frame.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share'
  frame.allowFullscreen = true
  player.append(frame)
  show('Facebook official video player. Private videos may not display.')
  return
 }

 if (p === 'tiktok') {
  const match = u.pathname.match(/\/video\/(\d+)/)

  if (!match) {
   show('TikTok video ID not found. Open this link in TikTok.')
   return
  }

  const frame = document.createElement('iframe')
  frame.src = 'https://www.tiktok.com/player/v1/' + match[1] +
   '?music_info=1&description=1'
  frame.allow = 'autoplay; encrypted-media; picture-in-picture'
  frame.allowFullscreen = true
  player.append(frame)
  show('TikTok official player.')
  return
 }

 if (p === 'instagram') {
  const match = u.pathname.match(/\/(p|reel|tv)\/([^/]+)/)

  if (match) {
   const frame = document.createElement('iframe')
   frame.src = 'https://www.instagram.com/' + match[1] + '/' +
    encodeURIComponent(match[2]) + '/embed'
   frame.allowFullscreen = true
   player.append(frame)
   show('Instagram official embed. Private posts may not display.')
   return
  }

  show('Open this Instagram link in Instagram.')
  return
 }

 if (/\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) {
  const v = document.createElement('video')
  v.controls = true
  v.playsInline = true
  v.preload = 'metadata'
  v.src = u.href
  v.onerror = () => show('Video preview unavailable.')
  player.append(v)
  show('Direct video link detected.')
  return
 }

 show('This is a webpage link, not a direct video file. Open the link to watch.')
}

async function download() {
 const u = validUrl()
 if (!u) return show('Please enter a valid URL.')

 const p = platform(u)

 if (p !== 'other') {
  return show(
   'This platform does not provide a direct video file through this link. ' +
   'Use the platform official download option where available, or download a video you own.'
  )
 }

 const ext = u.pathname.match(/\.(mp4|webm|m4v|mov)$/i)

 if (!ext) {
  return show('Direct MP4, WebM, M4V or MOV video file link required.')
 }

 const btn = $('download')
 btn.disabled = true
 btn.textContent = 'Starting download...'

 try {
  let name = decodeURIComponent(u.pathname.split('/').pop() || '')
  name = name.replace(/[^a-zA-Z0-9._-]/g,'_')

  if (!name) name = 'VidBear_' + Date.now() + '.mp4'

  const result = await NativeDownloader.download({
   url:u.href,
   fileName:name
  })

  saveHistory(u.href,result.fileName || name)

  show('Download started. Check notification. Folder: Movies/VidBear/')
 } catch(e) {
  show('Download error: ' + (e.message || String(e)))
 } finally {
  btn.disabled = false
  btn.textContent = '⬇ Download Video'
 }
}

$('preview').onclick = preview
$('open').onclick = openLink
$('download').onclick = download

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
