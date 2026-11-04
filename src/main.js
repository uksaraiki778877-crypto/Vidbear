import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
<style>
*{box-sizing:border-box}
body{margin:0;background:#10131c;color:white;font-family:Arial,sans-serif}
#app{min-height:100vh}
.vb{max-width:500px;margin:auto;padding:20px 16px}
.vb-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}
.vb-logo{font-size:27px;font-weight:900;color:#62e6a5}
.vb-logo span{color:white}
.vb-btn{border:0;border-radius:12px;padding:13px 17px;background:#62e6a5;color:#10131c;font-weight:bold;cursor:pointer}
.vb-back{background:#252b39;color:white}
.vb-card{background:#1c2230;border-radius:20px;padding:20px;margin-bottom:18px}
.vb h2{font-size:22px;margin:5px 0 10px}
.vb p{color:#aeb7c7;line-height:1.5}
.vb input,.vb select{width:100%;padding:16px;border:1px solid #3b4558;background:#111722;color:white;border-radius:12px;margin:12px 0;font-size:15px}
.vb .download{width:100%;margin-top:12px;font-size:16px}
.vb .secondary{background:#30394b;color:white}
.vb video{width:100%;border-radius:12px;margin-top:12px;background:#000}
.vb-history{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 0;border-bottom:1px solid #343c4d;overflow-wrap:anywhere}
.vb-history small{display:block;color:#9daabd;margin-top:5px}
.vb-history button{flex-shrink:0}
.vb-status{padding:12px;border-radius:10px;background:#252e40;color:#bdebd4;margin-top:12px;display:none;overflow-wrap:anywhere}
.vb-footer{text-align:center;color:#788397;font-size:12px;padding:20px}
.vb button:disabled{opacity:.5}
</style>

<div class="vb">
 <header class="vb-header">
  <button class="vb-btn vb-back" id="backBtn">← Back</button>
  <div class="vb-logo">Vid<span>Bear</span> 🐻</div>
 </header>

 <section class="vb-card">
  <h2>Video Downloader</h2>
  <p>Paste your video URL below to preview or download.</p>
  <input id="videoUrl" type="url" placeholder="Paste video URL here">

  <select id="quality">
   <option value="original">Original Quality</option>
  </select>

  <button class="vb-btn download" id="previewBtn">▶ Preview Video</button>
  <button class="vb-btn download" id="downloadBtn">⬇ Download Video</button>

  <div id="status" class="vb-status"></div>
  <div id="preview"></div>
 </section>

 <section class="vb-card">
  <h2>Download History</h2>
  <div id="history"></div>
  <button class="vb-btn secondary download" id="clearHistory">Clear History</button>
 </section>

 <div class="vb-footer">VidBear • Your Video Companion</div>
</div>
`

const $ = id => document.getElementById(id)

const urlInput = $('videoUrl')
const statusBox = $('status')
const previewBox = $('preview')
const previewBtn = $('previewBtn')
const downloadBtn = $('downloadBtn')

function message(text) {
 statusBox.style.display = 'block'
 statusBox.textContent = text
}

function hideMessage() {
 statusBox.style.display = 'none'
}

function getUrl() {
 try {
  const url = new URL(urlInput.value.trim())
  if (!['http:', 'https:'].includes(url.protocol)) return null
  return url
 } catch {
  return null
 }
}

function isYouTube(url) {
 return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(url.hostname)
}

function youtubeId(url) {
 if (url.hostname.includes('youtu.be')) {
  return url.pathname.slice(1).split('/')[0]
 }
 if (url.pathname === '/watch') {
  return url.searchParams.get('v')
 }
 const match = url.pathname.match(/\/(embed|shorts)\/([^/?]+)/)
 return match ? match[2] : null
}

function saveHistory(url, name) {
 let items = JSON.parse(localStorage.getItem('vidbear_history') || '[]')
 items = items.filter(item => item.url !== url)
 items.unshift({url, name, date:new Date().toLocaleString()})
 localStorage.setItem('vidbear_history', JSON.stringify(items.slice(0,30)))
 renderHistory()
}

function renderHistory() {
 const items = JSON.parse(localStorage.getItem('vidbear_history') || '[]')
 $('history').innerHTML = ''

 if (!items.length) {
  $('history').innerHTML = '<p>No downloads yet.</p>'
  return
 }

 items.forEach(item => {
  const div = document.createElement('div')
  div.className = 'vb-history'

  const info = document.createElement('div')
  info.style.minWidth = '0'

  const title = document.createElement('strong')
  title.textContent = item.name

  const date = document.createElement('small')
  date.textContent = item.date

  info.append(title, date)

  const open = document.createElement('button')
  open.className = 'vb-btn secondary'
  open.textContent = 'Open'
  open.onclick = () => {
   urlInput.value = item.url
   previewVideo()
  }

  div.append(info, open)
  $('history').append(div)
 })
}

function previewVideo() {
 hideMessage()
 previewBox.innerHTML = ''

 const url = getUrl()
 if (!url) {
  message('Please enter a valid video URL.')
  return
 }

 if (isYouTube(url)) {
  const id = youtubeId(url)

  if (!id) {
   message('Invalid YouTube video link.')
   return
  }

  const iframe = document.createElement('iframe')
  iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id)
  iframe.width = '100%'
  iframe.height = '230'
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
  iframe.allowFullscreen = true
  iframe.style.borderRadius = '12px'

  const open = document.createElement('button')
  open.className = 'vb-btn download'
  open.textContent = 'Open in YouTube'
  open.onclick = () => window.open(url.href, '_blank')

  const note = document.createElement('p')
  note.textContent = 'For downloads, use YouTube’s official download options where available.'

  previewBox.append(iframe, open, note)
  message('YouTube video detected.')
  return
 }

 const video = document.createElement('video')
 video.controls = true
 video.preload = 'metadata'
 video.src = url.href
 video.onerror = () => message('Preview unavailable. The server may block access.')
 previewBox.append(video)
 message('Video preview loaded.')
}

async function downloadVideo() {
 hideMessage()

 const url = getUrl()
 if (!url) {
  message('Please enter a valid video URL.')
  return
 }

 if (isYouTube(url)) {
  message('YouTube videos must be downloaded using official YouTube options where available.')
  return
 }

 downloadBtn.disabled = true
 downloadBtn.textContent = 'Downloading...'

 try {
  const response = await fetch(url.href)

  if (!response.ok) throw new Error('Server error: ' + response.status)

  const type = response.headers.get('content-type') || ''

  if (!type.includes('video/') && !url.pathname.match(/\.(mp4|webm|mov|m4v)$/i)) {
   throw new Error('This URL does not appear to be a direct video file.')
  }

  const blob = await response.blob()
  if (!blob.size) throw new Error('Empty video file.')

  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const filename = url.pathname.split('/').pop() || 'vidbear-video.mp4'

  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)

  saveHistory(url.href, filename)
  message('Download started successfully!')

 } catch (error) {
  message('Download failed: ' + error.message + '. Server CORS restrictions may prevent downloading.')
 } finally {
  downloadBtn.disabled = false
  downloadBtn.textContent = '⬇ Download Video'
 }
}

previewBtn.addEventListener('click', previewVideo)
downloadBtn.addEventListener('click', downloadVideo)

$('clearHistory').addEventListener('click', () => {
 localStorage.removeItem('vidbear_history')
 renderHistory()
 message('History cleared.')
})

$('backBtn').addEventListener('click', () => {
 previewBox.innerHTML = ''
 hideMessage()
 urlInput.value = ''
 window.scrollTo({top:0, behavior:'smooth'})
})

window.addEventListener('popstate', () => {
 previewBox.innerHTML = ''
 hideMessage()
})

urlInput.addEventListener('input', hideMessage)

renderHistory()

if ('serviceWorker' in navigator) {
 window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
 })
}
