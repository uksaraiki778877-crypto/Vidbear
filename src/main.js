
import './style.css'
import { registerPlugin } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

const NativeDownloader = registerPlugin('NativeDownloader')
const app = document.querySelector('#app')
const API = 'https://vidbear.onrender.com'
.	
 

app.innerHTML = `
<div class="vb">
<header>
<div class="logo">Vid<span>Bear</span> 🐻</div>
<div class="top-search">
<input id="ytSearch" placeholder="Search videos..." type="search">
<button id="ytSearchBtn">⌕</button>
</div>
</header>

<div class="tabs">
<button class="active" data-query="trending videos">FEATURED</button>
<button data-query="movies trailers">MOVIE</button>
<button data-query="music videos">MUSIC</button>
<button data-query="web series">WEB SERIES</button>
<button data-query="sports videos">SPORTS</button>
</div>

<div class="socials">
<button class="yt" id="ytQuick">▶</button>
<button class="fb" id="fbQuick">f</button>
<button class="wa" id="waQuick">◉</button>
<button class="ig" id="igQuick">◎</button>
<button class="more" id="moreQuick">•••</button>
</div>

<h2 class="section-title">Featured Videos</h2>

<div class="feed-card">
<div class="thumb" id="feedOne">
<span>▶</span>
<div class="play">▶</div>
<div class="thumb-label">FEATURED VIDEO</div>
</div>
<div class="feed-info">
<strong>Trending YouTube Videos</strong>
<div class="feed-actions">
<span>Explore popular videos</span>
<button class="feedSearch" data-query="trending YouTube videos">↗</button>
</div>
</div>
</div>

<div class="feed-card">
<div class="thumb two">
<span>🎬</span>
<div class="play">▶</div>
<div class="thumb-label">MOVIES</div>
</div>
<div class="feed-info">
<strong>Latest Movie Trailers</strong>
<div class="feed-actions">
<span>Explore movie videos</span>
<button class="feedSearch" data-query="latest movie trailers">↗</button>
</div>
</div>
</div>

<div class="feed-card">
<div class="thumb three">
<span>🎵</span>
<div class="play">▶</div>
<div class="thumb-label">MUSIC</div>
</div>
<div class="feed-info">
<strong>Popular Music Videos</strong>
<div class="feed-actions">
<span>Explore music videos</span>
<button class="feedSearch" data-query="popular music videos">↗</button>
</div>
</div>
</div>

<div class="card" id="downloader">
<h2>⬇ Video Downloader</h2>
<p>Paste a direct video link or supported platform link.</p>
<input id="url" type="url" placeholder="Paste video link here">
<button class="action" id="preview">▶ Preview Video</button>
<button class="action secondary" id="open">↗ Open Link</button>
<button class="action" id="download">⬇ Download Video</button>
<div id="status"></div>
<div id="player"></div>
</div>

<div class="card" id="converter">
<h2>🎵 MP3 Converter</h2>
<p>Select your own video or a video you have permission to convert.</p>
<label class="file-label">
Choose Video File
<input id="videoFile" type="file" accept="video/*">


</label>
<button class="action" id="convert">Convert to MP3</button>
</div>

<div class="card" id="historySection">
<h2>Download History</h2>
<div id="history"></div>
<button class="action secondary" id="clear">Clear History</button>
</div>

<footer>VidBear • Video Downloader</footer>
</div>

<nav class="bottom-nav">
<button class="active" id="homeNav"><span>⌂</span>HOME</button>
<button id="trendingNav"><span>▷</span>TRENDING</button>
<button id="meNav"><span>♙</span>ME</button>
</nav>
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

function youtubeSearch() {
 const query = $('ytSearch').value.trim()
 if (!query) {
  $('ytSearch').focus()
  return show('Please enter a YouTube search.')
 }
 const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
 Browser.open({url}).catch(e => show('Cannot open YouTube: ' + (e.message || e)))
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

 if (platform(u) === 'youtube') {
  return show('Use YouTube official Download option if available, or download your own videos from YouTube Studio.')
 }

 if (!/\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) {
  return show('Direct MP4 video link required. Use official platform download options for social media.')
 }

 const btn = $('download')
 btn.disabled = true

 try {
  let name = decodeURIComponent(u.pathname.split('/').pop() || '')
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (!name) name = 'VidBear_' + Date.now() + '.mp4'

  const result = await NativeDownloader.download({
   url: u.href,
   fileName: name
  })

  saveHistory(u.href, result.fileName || name)
  show('Download started! Check notification. Folder: Movies/VidBear/')
 } catch (e) {
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

$('ytSearchBtn').onclick = youtubeSearch
$('ytSearch').addEventListener('keydown', e => {
 if (e.key === 'Enter') youtubeSearch()
})

$('preview').onclick = preview
$('open').onclick = openLink
$('download').onclick = download
$('convert').onclick = convertMP3


$('clear').onclick = () => {
 localStorage.removeItem('vb_history')
 history()
 show('History cleared.')
}

$('ytSearchBtn').onclick = youtubeSearch
$('ytSearch').addEventListener('keydown', e => {
 if (e.key === 'Enter') youtubeSearch()
})

$('ytQuick').onclick = () => Browser.open({url:'https://www.youtube.com'})
$('fbQuick').onclick = () => Browser.open({url:'https://www.facebook.com'})
$('waQuick').onclick = () => Browser.open({url:'https://www.whatsapp.com'})
$('igQuick').onclick = () => Browser.open({url:'https://www.instagram.com'})
$('moreQuick').onclick = () => {
 document.getElementById('downloader').scrollIntoView({behavior:'smooth'})
}

document.querySelectorAll('[data-query]').forEach(btn => {
 btn.onclick = () => {
  $('ytSearch').value = btn.dataset.query
  youtubeSearch()
 }
})

document.querySelectorAll('.feedSearch').forEach(btn => {
 btn.onclick = () => {
  $('ytSearch').value = btn.dataset.query
  youtubeSearch()
 }
})

$('homeNav').onclick = () => window.scrollTo({top:0,behavior:'smooth'})
$('trendingNav').onclick = () => {
 $('ytSearch').value = 'trending videos'
 youtubeSearch()
}
$('meNav').onclick = () => {
 $('historySection').scrollIntoView({behavior:'smooth'})
}

history()

