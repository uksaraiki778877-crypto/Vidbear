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
.card{background:#1c2230;border-radius:18px;padding:20px;margin-bottom:18px}
input{width:100%;padding:16px;background:#111722;border:1px solid #3b4558;color:white;border-radius:12px;margin:14px 0}
.action{width:100%;margin-top:12px}
.secondary{background:#30394b;color:white}
video{width:100%;margin-top:14px;border-radius:12px;background:#000}
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
<p>Paste your video URL below.</p>
<input id="url" type="url" placeholder="https://example.com/video.mp4">

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

function show(text) {
 $('status').style.display = 'block'
 $('status').textContent = text
}

function validUrl() {
 try {
  const u = new URL($('url').value.trim())
  if (!['http:','https:'].includes(u.protocol)) return null
  return u
 } catch {
  return null
 }
}

function youtube(u) {
 return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(u.hostname)
}

function history() {
 let items = JSON.parse(localStorage.getItem('vb_history') || '[]')
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
 let items = JSON.parse(localStorage.getItem('vb_history') || '[]')
 items = items.filter(x => x.url !== url)
 items.unshift({
  url,
  name,
  date:new Date().toLocaleString()
 })
 localStorage.setItem('vb_history',JSON.stringify(items.slice(0,30)))
 history()
}

async function openLink() {
 const u = validUrl()
 if (!u) return show('Please enter a valid URL.')

 try {
  await Browser.open({url:u.href})
 } catch(e) {
  show('Cannot open link: '+e.message)
 }
}

function preview() {
 const u = validUrl()
 if (!u) return show('Please enter a valid URL.')

 $('player').innerHTML = ''

 if (youtube(u)) {
  show('YouTube link detected. Open it in YouTube.')
  return openLink()
 }

 const v = document.createElement('video')
 v.controls = true
 v.playsInline = true
 v.preload = 'metadata'
 v.src = u.href
 v.onerror = () => show('Preview unavailable. This link may not be a direct video.')
 $('player').append(v)
 show('Preview loading...')
}

async function download() {
 const u = validUrl()
 if (!u) return show('Please enter a valid URL.')

 if (youtube(u)) {
  return show('Use YouTube official download options where available.')
 }

 const btn = $('download')
 btn.disabled = true
 btn.textContent = 'Starting download...'

 try {
  const path = u.pathname.split('/').pop()
  const name = path && /\.[a-z0-9]{2,5}$/i.test(path)
   ? decodeURIComponent(path)
   : 'VidBear_' + Date.now() + '.mp4'

  const result = await NativeDownloader.download({
   url:u.href,
   fileName:name
  })

  saveHistory(u.href,result.fileName)

  show(
   'Download started! Check your notification. Save location: Movies/VidBear/'
   + result.fileName
  )
 } catch(e) {
  show('Download error: '+(e.message || String(e)))
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
