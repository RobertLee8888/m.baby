(function () {
  'use strict';

  const A = 'assets/';
  const screens = new Map([...document.querySelectorAll('[data-screen]')].map(el => [el.dataset.screen, el]));
  let current = 'splash';
  let loginBackTarget = 'welcome';
  let notificationFlowCompleted = false;
  let splashFinished = false;
  let splashFallback;
  const MIN_PICKS = 3;
  const MAX_PICKS = 8;
  const selected = new Set(['NVDA', 'MU', 'HBM']);

  const picks = [
    { id: 'NVDA', name: 'NVDA', type: 'AI compute', image: A + 'market-logo-nvda.png' },
    { id: 'TSLA', name: 'TSLA', type: 'EV · Robotaxi', image: A + 'onboarding-tsla.svg' },
    { id: 'BTC', name: 'BTC', type: 'Crypto', mark: '₿' },
    { id: 'META', name: 'META', type: 'AI · Ads', image: A + 'feed-logo-meta.svg' },
    { id: 'AMD', name: 'AMD', type: 'AI compute', image: A + 'onboarding-amd.svg' },
    { id: 'MU', name: 'MU', type: 'Memory', image: A + 'market-logo-mu.png' },
    { id: 'AI Infra', name: 'AI Infra', type: 'Theme', mark: 'AI' },
    { id: 'HBM', name: 'HBM', type: 'Theme', mark: 'HB' },
    { id: 'Stablecoin', name: 'Stablecoin', type: 'Theme', mark: 'S' },
    { id: 'Nuclear', name: 'Nuclear', type: 'Theme', mark: 'N' },
    { id: 'Jensen Huang', name: 'Jensen Huang', type: 'Key figure', image: A + 'onboarding-jensen.png?v=2' },
    { id: 'Jerome Powell', name: 'Jerome Powell', type: 'Key figure', image: A + 'onboarding-jerome.png?v=2' },
    { id: 'QQQ', name: 'QQQ', type: 'Index', image: A + 'onboarding-qqq.svg' },
    { id: 'TSM', name: 'TSM', type: 'Semis', image: A + 'onboarding-tsm.png' },
    { id: 'AVGO', name: 'AVGO', type: 'Semis', image: A + 'onboarding-avgo.svg' },
    { id: 'COIN', name: 'COIN', type: 'Crypto', image: A + 'onboarding-coin.svg' },
    { id: 'SPY', name: 'SPY', type: 'Index', image: A + 'onboarding-spy.svg' },
    { id: 'Elon Musk', name: 'Elon Musk', type: 'Key figure', mark: 'E' },
  ];

  function go(name) {
    const previous = screens.get(current);
    const next = screens.get(name);
    if (!next || next === previous) return;
    previous.classList.remove('is-active');
    next.classList.add('is-active');
    current = name;
  }

  function finishSplash() {
    if (splashFinished) return;
    splashFinished = true;
    window.clearTimeout(splashFallback);
    document.getElementById('themeColor').content = '#ffffff';
    go('welcome');
    screens.get('splash').classList.remove('is-revealing');
    screens.get('welcome').classList.remove('is-under-splash');
  }

  function startSplash() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.requestAnimationFrame(finishSplash);
      return;
    }

    const splash = screens.get('splash');
    splash.addEventListener('animationend', finishSplash, { once: true });
    splashFallback = window.setTimeout(finishSplash, 1900);
    screens.get('welcome').classList.add('is-under-splash');
    // The shared reveal includes a brief logo hold before uncovering the page.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      if (!splashFinished) splash.classList.add('is-revealing');
    }));
  }

  function goLogin(backTarget) {
    loginBackTarget = backTarget;
    go('login');
  }

  function iconFor(pick) {
    const icon = document.createElement('span');
    icon.className = 'picker-icon';
    if (pick.image) {
      const img = document.createElement('img');
      img.src = pick.image;
      img.alt = '';
      icon.appendChild(img);
    } else {
      icon.textContent = pick.mark;
    }
    return icon;
  }

  function renderPicks(query) {
    const grid = document.getElementById('pickerGrid');
    const empty = document.getElementById('gridEmpty');
    const q = (query || '').trim().toLowerCase();
    const visible = picks.filter(p => `${p.name} ${p.type}`.toLowerCase().includes(q));
    grid.replaceChildren();
    visible.forEach(pick => {
      const isSelected = selected.has(pick.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'picker-card' + (isSelected ? ' is-selected' : '');
      card.setAttribute('aria-pressed', String(isSelected));
      card.disabled = selected.size >= MAX_PICKS && !isSelected;
      card.append(iconFor(pick));
      const name = document.createElement('span');
      name.className = 'picker-name';
      name.textContent = pick.name;
      const type = document.createElement('span');
      type.className = 'picker-type';
      type.textContent = pick.type;
      card.append(name, type);
      card.addEventListener('click', () => {
        if (selected.has(pick.id)) selected.delete(pick.id);
        else if (selected.size < MAX_PICKS) selected.add(pick.id);
        renderPicks(document.getElementById('watchSearch').value);
        updateSelection();
      });
      grid.appendChild(card);
    });
    empty.hidden = visible.length > 0;
    empty.querySelector('b').textContent = query || '';
  }

  function updateSelection() {
    const count = selected.size;
    document.getElementById('selectionNote').textContent = count === MAX_PICKS
      ? `${count} selected · maximum reached`
      : `${count} selected · pick ${MIN_PICKS}–${MAX_PICKS} to start`;
    document.getElementById('continueButton').disabled = count < MIN_PICKS;
  }

  function enterMvp() {
    try { window.top.location.hash = '#/mvp'; }
    catch (_) { window.location.href = 'index.html#/mvp'; }
  }

  document.getElementById('startButton').addEventListener('click', () => go('watch'));
  document.getElementById('signInButton').addEventListener('click', () => goLogin('welcome'));
  document.getElementById('watchBack').addEventListener('click', () => go('welcome'));
  document.getElementById('notifyBack').addEventListener('click', () => go('watch'));
  document.getElementById('continueButton').addEventListener('click', () => {
    if (selected.size < MIN_PICKS) return;
    if (notificationFlowCompleted) goLogin('watch');
    else go('notify');
  });
  document.getElementById('notNowButton').addEventListener('click', () => goLogin('notify'));
  document.getElementById('notificationsButton').addEventListener('click', () => {
    notificationFlowCompleted = true;
    goLogin('watch');
  });
  document.getElementById('loginBack').addEventListener('click', () => go(loginBackTarget));
  document.querySelectorAll('[data-login-submit]').forEach(button => button.addEventListener('click', enterMvp));
  document.getElementById('watchSearch').addEventListener('input', e => renderPicks(e.target.value));
  document.getElementById('replayButton').addEventListener('click', () => window.location.reload());
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      if (document.activeElement === document.getElementById('watchSearch')) return;
      if (current === 'login') go(loginBackTarget);
      else if (current === 'notify') go('watch');
      else if (current === 'watch') go('welcome');
    }
  });

  renderPicks('');
  updateSelection();
  // The prototype shell reveals its iframe on load; start after it is visible.
  if (document.readyState === 'complete') startSplash();
  else window.addEventListener('load', startSplash, { once: true });
})();
