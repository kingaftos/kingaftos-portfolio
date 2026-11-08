// ============================================================
// ADD YOUR PROJECTS HERE. Copy one block, paste it at the TOP of
// the list (newest first), edit the text, save, and redeploy.
// Numbers (01, 02...) are added automatically.
//   status: "live" or "dev"
//   code / demo: optional links. Leave out or use "" to hide.
// ============================================================
const PROJECTS = [
  {
    name: "FAD CryptoWatch",
    desc: "Live cryptocurrency price tracker for BTC, ETH, SOL, and USDT with real-time API integration and multi-currency support. Built with Flutter & Dart.",
    tags: ["Flutter", "Dart", "REST API", "CoinGecko", "Android"],
    result: "Real-time prices across 4 assets, refreshing with zero lag.",
    status: "live",
    code: "https://github.com/kingaftos"
  },
  {
    name: "AFTOSMine — Tap-to-Earn",
    desc: "Mobile mining app built on the tap-to-earn model with custom FAD Coin 3D asset integration. State management, mining logic, and full UI in Flutter.",
    tags: ["Flutter", "Dart", "Mobile", "GameFi"],
    result: "Functional tap-to-earn economy loop, actively being refined.",
    status: "dev",
    code: "https://github.com/kingaftos"
  },
  {
    name: "ReviewReply — AI Review Responder",
    desc: "Web tool that helps local businesses generate professional responses to their Google reviews instantly. Built for restaurants, salons, and gyms.",
    tags: ["HTML5", "CSS3", "JavaScript", "Web App"],
    result: "Cuts review-response time from minutes to seconds.",
    status: "live",
    code: "https://github.com/kingaftos"
  },
  {
    name: "Personal Portfolio (This Site)",
    desc: "Dark-themed developer portfolio built from scratch with pure HTML, CSS, and JavaScript.",
    tags: ["HTML5", "CSS3", "JavaScript"],
    result: "Turns visitors into WhatsApp enquiries.",
    status: "live",
    code: "https://github.com/kingaftos"
  }
];

(function () {
  const box = document.getElementById('projects-list');
  if (!box) return;
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  box.innerHTML = PROJECTS.map((p, i) => {
    const links = [p.demo && ['↗ Live Demo', p.demo], p.code && ['↗ View Code', p.code]]
      .filter(Boolean)
      .map(([l, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" class="project-link">${l}</a>`).join('');
    const st = p.status === 'dev' ? ['status-dev', '◐ In Dev'] : ['status-live', '● Live'];
    return `<div class="project-card">
      <div class="project-num">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <div class="project-name">${esc(p.name)}</div>
        <div class="project-desc">${esc(p.desc)}</div>
        <div class="project-tags">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        ${p.result ? `<div class="project-result">→ <strong>Result:</strong> ${esc(p.result)}</div>` : ''}
        <div class="project-links">${links}</div>
      </div>
      <div class="project-status ${st[0]}">${st[1]}</div>
    </div>`;
  }).join('');
})();
