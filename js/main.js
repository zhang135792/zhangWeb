// zhangWeb 公共脚本：导航高亮
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const target = a.getAttribute('href');
    if (target === page) a.classList.add('active');
  });
});
