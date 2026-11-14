// zhangWeb 视频播放器：本地 media 文件夹 + 文件选择器，原生 video
(function () {
  const video = document.getElementById('video');
  const nowTitle = document.getElementById('now-title');
  const listEl = document.getElementById('video-list');
  const addBtn = document.getElementById('add-files-btn');
  const fileInput = document.getElementById('file-input');
  const speedBtn = document.getElementById('speed-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  const SPEEDS = [1, 1.25, 1.5, 2, 0.5, 0.75];
  let speedIdx = 0;
  let videos = [];
  let currentIndex = -1;

  function renderList() {
    listEl.innerHTML = '';
    if (!videos.length) {
      listEl.innerHTML = '<div class="empty-tip">还没有视频。<br>把 mp4 等视频文件放入 <b>media/video</b> 文件夹后刷新，<br>或点击「添加本地文件」。</div>';
      return;
    }
    videos.forEach((v, i) => {
      const div = document.createElement('div');
      div.className = 'media-item' + (i === currentIndex ? ' active' : '');
      div.innerHTML = '<span class="m-name"></span>';
      div.querySelector('.m-name').textContent = (i === currentIndex ? '▶ ' : '') + v.name;
      if (v.removable) {
        const rm = document.createElement('button');
        rm.className = 'm-remove';
        rm.textContent = '✕';
        rm.title = '移除';
        rm.addEventListener('click', (e) => {
          e.stopPropagation();
          removeVideo(i);
        });
        div.appendChild(rm);
      }
      div.addEventListener('click', () => playIndex(i));
      listEl.appendChild(div);
    });
  }

  function playIndex(i) {
    if (i < 0 || i >= videos.length) return;
    currentIndex = i;
    video.src = videos[i].url;
    nowTitle.textContent = videos[i].name;
    video.play().catch(() => {});
    renderList();
  }

  function removeVideo(i) {
    const wasCurrent = i === currentIndex;
    URL.revokeObjectURL(videos[i].url);
    videos.splice(i, 1);
    if (wasCurrent) {
      video.pause();
      video.removeAttribute('src');
      currentIndex = -1;
      nowTitle.textContent = '未在播放';
      if (videos.length) playIndex(Math.min(i, videos.length - 1));
    } else if (i < currentIndex) {
      currentIndex--;
    }
    renderList();
  }

  async function loadServerMedia() {
    try {
      const res = await fetch('api/media?dir=video');
      const data = await res.json();
      data.files.forEach((url) => {
        videos.push({ name: decodeURIComponent(url.split('/').pop()), url, removable: false });
      });
    } catch { /* 服务器不可用时忽略 */ }
    renderList();
  }

  speedBtn.addEventListener('click', () => {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    video.playbackRate = SPEEDS[speedIdx];
    speedBtn.textContent = `⏩ 倍速 ${SPEEDS[speedIdx].toFixed(speedIdx === 0 ? 1 : 2).replace(/0+$/, '').replace(/\.$/, '')}×`;
    if (SPEEDS[speedIdx] === 1) speedBtn.textContent = '⏩ 倍速 1.0×';
  });
  speedBtn.textContent = '⏩ 倍速 1.0×';

  fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen().catch(() => {});
    }
  });

  addBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    [...fileInput.files].forEach((f) => {
      videos.push({ name: f.name, url: URL.createObjectURL(f), removable: true });
    });
    fileInput.value = '';
    renderList();
    if (currentIndex === -1 && videos.length) playIndex(0);
  });

  loadServerMedia();
})();
