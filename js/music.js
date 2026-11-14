// zhangWeb 音乐播放器：本地 media 文件夹 + 文件选择器，原生 audio
(function () {
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progress = document.getElementById('progress');
  const curTimeEl = document.getElementById('cur-time');
  const durTimeEl = document.getElementById('dur-time');
  const volume = document.getElementById('volume');
  const volNum = document.getElementById('vol-num');
  const loopBtn = document.getElementById('loop-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const nowTitle = document.getElementById('now-title');
  const listEl = document.getElementById('track-list');
  const addBtn = document.getElementById('add-files-btn');
  const fileInput = document.getElementById('file-input');

  // tracks: { name, url, removable }
  let tracks = [];
  let currentIndex = -1;
  let shuffle = false;

  const LOOP_LABELS = ['🔁 顺序循环', '🔂 单曲循环', '➡️ 播放一次'];

  function fmt(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function renderList() {
    listEl.innerHTML = '';
    if (!tracks.length) {
      listEl.innerHTML = '<div class="empty-tip">还没有歌曲。<br>把 mp3 等音频文件放入 <b>media/music</b> 文件夹后刷新，<br>或点击「添加本地文件」。</div>';
      return;
    }
    tracks.forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'media-item' + (i === currentIndex ? ' active' : '');
      div.innerHTML = '<span class="m-name"></span>';
      div.querySelector('.m-name').textContent = (i === currentIndex ? '▶ ' : '') + t.name;
      if (t.removable) {
        const rm = document.createElement('button');
        rm.className = 'm-remove';
        rm.textContent = '✕';
        rm.title = '移除';
        rm.addEventListener('click', (e) => {
          e.stopPropagation();
          removeTrack(i);
        });
        div.appendChild(rm);
      }
      div.addEventListener('click', () => playIndex(i));
      listEl.appendChild(div);
    });
  }

  function playIndex(i) {
    if (i < 0 || i >= tracks.length) return;
    currentIndex = i;
    audio.src = tracks[i].url;
    nowTitle.textContent = tracks[i].name;
    audio.play().catch(() => {});
    renderList();
  }

  function togglePlay() {
    if (!tracks.length) return;
    if (currentIndex === -1) return playIndex(0);
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function nextTrack(auto) {
    if (!tracks.length) return;
    let i;
    if (shuffle && tracks.length > 1) {
      do { i = Math.floor(Math.random() * tracks.length); } while (i === currentIndex);
    } else {
      i = (currentIndex + 1) % tracks.length;
    }
    if (auto && loopBtn.dataset.mode === 'once' && currentIndex >= 0) {
      // 播放一次模式：自然结束不再继续
      audio.pause();
      return;
    }
    playIndex(i);
  }

  function prevTrack() {
    if (!tracks.length) return;
    playIndex((currentIndex - 1 + tracks.length) % tracks.length);
  }

  function removeTrack(i) {
    const wasCurrent = i === currentIndex;
    URL.revokeObjectURL(tracks[i].url);
    tracks.splice(i, 1);
    if (wasCurrent) {
      audio.pause();
      audio.removeAttribute('src');
      currentIndex = -1;
      nowTitle.textContent = '未在播放';
      if (tracks.length) playIndex(Math.min(i, tracks.length - 1));
    } else if (i < currentIndex) {
      currentIndex--;
    }
    renderList();
  }

  // ---- 加载 media/music 文件夹 ----
  async function loadServerMedia() {
    try {
      const res = await fetch('api/media?dir=music');
      const data = await res.json();
      data.files.forEach((url) => {
        tracks.push({ name: decodeURIComponent(url.split('/').pop()), url, removable: false });
      });
    } catch { /* 服务器不可用时忽略 */ }
    renderList();
  }

  // ---- 事件 ----
  playBtn.addEventListener('click', togglePlay);
  nextBtn.addEventListener('click', () => nextTrack(false));
  prevBtn.addEventListener('click', prevTrack);

  audio.addEventListener('play', () => (playBtn.textContent = '⏸'));
  audio.addEventListener('pause', () => (playBtn.textContent = '▶'));
  audio.addEventListener('ended', () => {
    if (loopBtn.dataset.mode === 'single') {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      nextTrack(true);
    }
  });
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    progress.value = Math.round((audio.currentTime / audio.duration) * 1000);
    curTimeEl.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', () => {
    durTimeEl.textContent = fmt(audio.duration);
  });

  let seeking = false;
  progress.addEventListener('input', () => {
    seeking = true;
    if (audio.duration) curTimeEl.textContent = fmt((progress.value / 1000) * audio.duration);
  });
  progress.addEventListener('change', () => {
    if (audio.duration) audio.currentTime = (progress.value / 1000) * audio.duration;
    seeking = false;
  });

  volume.addEventListener('input', () => {
    audio.volume = volume.value / 100;
    volNum.textContent = volume.value;
  });
  audio.volume = 0.8;

  loopBtn.dataset.mode = 'order';
  loopBtn.addEventListener('click', () => {
    const modes = ['order', 'single', 'once'];
    const cur = modes.indexOf(loopBtn.dataset.mode);
    loopBtn.dataset.mode = modes[(cur + 1) % modes.length];
    loopBtn.textContent = LOOP_LABELS[(cur + 1) % LOOP_LABELS.length];
  });
  shuffleBtn.addEventListener('click', () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle('secondary', shuffle);
    shuffleBtn.classList.toggle('ghost', !shuffle);
  });

  addBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    [...fileInput.files].forEach((f) => {
      tracks.push({ name: f.name, url: URL.createObjectURL(f), removable: true });
    });
    fileInput.value = '';
    renderList();
    if (currentIndex === -1 && tracks.length) playIndex(0);
  });

  loadServerMedia();
})();
