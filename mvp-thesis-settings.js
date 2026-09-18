const SETTINGS_ASSETS = 'assets/thesis/settings/';

export function createThesisSettings(ui, controls) {
  const { el, img, btn, icon, pageShell, push } = ui;

  function switchControl(label, checked = true) {
    const control = btn('thesis-switch', label);
    control.setAttribute('role', 'switch');
    control.setAttribute('aria-checked', String(checked));
    control.append(el('span'));
    control.addEventListener('click', () => {
      control.setAttribute('aria-checked', String(control.getAttribute('aria-checked') !== 'true'));
    });
    return control;
  }

  function section(title, description, content) {
    const node = el('section', 'thesis-settings-section');
    const head = el('header', 'thesis-settings-section-head');
    head.append(el('h2', null, title));
    if (description) head.append(el('p', null, description));
    node.append(head, content);
    return node;
  }

  function field(label, value, multiline = false) {
    const wrap = el('label', 'thesis-settings-field');
    wrap.append(el('span', null, label));
    const input = el(multiline ? 'textarea' : 'input');
    if (multiline) input.placeholder = value;
    else input.value = value;
    wrap.append(input);
    return wrap;
  }

  function actionButton(label, active = false) {
    const action = btn('thesis-settings-action', label);
    action.textContent = label;
    action.dataset.connected = String(active);
    action.addEventListener('click', () => {
      const connected = action.dataset.connected !== 'true';
      action.dataset.connected = String(connected);
      action.textContent = connected ? 'Disconnect' : 'Connect';
      action.setAttribute('aria-label', action.textContent);
    });
    return action;
  }

  function accountPage() {
    const body = el('div', 'thesis-settings-body thesis-settings-account');
    const profile = el('section', 'thesis-settings-profile');
    const avatar = el('span', 'thesis-settings-avatar');
    avatar.append(img(SETTINGS_ASSETS + 'avatar.png'), img(SETTINGS_ASSETS + 'edit.svg'));
    const identity = el('div', 'thesis-settings-identity');
    const name = el('div', 'thesis-settings-name');
    name.append(el('strong', null, 'Sheer'), el('span', 'is-pro', 'Pro'), el('span', 'is-annual', 'Annual'));
    const meta = el('div', 'thesis-settings-meta');
    meta.append(el('span', null, '@sheer'), el('span', null, 'Joined 12/23/2025'));
    identity.append(name, meta);
    const header = el('div', 'thesis-settings-profile-head'); header.append(avatar, identity);
    profile.append(header, field('Nickname', 'Sheer'), field('User Info', 'Introduce about yourself...', true));
    body.append(profile);

    const providers = el('div', 'thesis-settings-card thesis-provider-list');
    [
      ['gmail.svg', 'Gmail', 'sheer@alva.xyz', null],
      ['email.svg', 'Email', 'sheer@alva.xyz', 'Disconnect'],
      ['x.svg', 'X (Twitter)', '@sheer_lee', 'Connect'],
      ['telegram.svg', 'Telegram', '', 'Connect'],
      ['discord.svg', 'Discord', '', 'Connect'],
      ['apple.svg', 'Apple', '', 'Connect'],
    ].forEach(([asset, nameLabel, account, action]) => {
      const row = el('div', 'thesis-provider-row');
      const copy = el('div', 'thesis-provider-copy');
      copy.append(el('strong', null, nameLabel));
      if (account) copy.append(el('span', null, account));
      row.append(img(SETTINGS_ASSETS + asset), copy);
      if (action === 'Disconnect') row.append(el('span', 'thesis-settings-disconnect', action));
      else if (action) row.append(actionButton(action));
      providers.append(row);
    });
    body.append(section('Sign-in methods', 'Manage third-party accounts for signing in to Alva.', providers));

    const notification = el('div', 'thesis-settings-card thesis-setting-row');
    const notificationCopy = el('div', 'thesis-setting-copy');
    notificationCopy.append(el('strong', null, 'Notifications'), el('span', null, 'Price alerts, mentions & product updates'));
    notification.append(img(SETTINGS_ASSETS + 'notification.svg'), notificationCopy, switchControl('Notifications'));
    body.append(section('Notifications', 'Choose which alerts Alva sends you', notification));

    const privacy = el('div', 'thesis-settings-card thesis-setting-row');
    const privacyCopy = el('div', 'thesis-setting-copy');
    privacyCopy.append(el('strong', null, 'Allow AI to process your content'), el('span', null, 'Messages, context and Automation tasks'));
    privacy.append(privacyCopy, switchControl('Allow AI to process your content'));
    body.append(section('Privacy', 'Control how your content is processed', privacy));

    const sharing = el('div', 'thesis-settings-card thesis-setting-row');
    const sharingCopy = el('div', 'thesis-setting-copy');
    sharingCopy.append(el('strong', null, 'Share usage and chat data'), el('span', null, 'Feature usage, crash reports and chats'));
    sharing.append(sharingCopy, switchControl('Share usage and chat data'));
    const improve = section('Help improve Alva', 'Choose what you share to help us make Alva better', sharing);
    improve.append(el('a', 'thesis-settings-learn', 'Learn how Alva uses your data'));
    body.append(improve);

    const more = el('div', 'thesis-settings-card thesis-more-list');
    const logout = btn('thesis-more-row', 'Log out'); logout.append(img(SETTINGS_ASSETS + 'logout.svg'), el('span', null, 'Log out'));
    const remove = btn('thesis-more-row', 'Delete account'); remove.append(img(SETTINGS_ASSETS + 'delete.svg'), el('span', null, 'Delete account'));
    remove.addEventListener('click', () => controls.confirm({ title: 'Delete account?', description: 'This action is disabled in the demo.', action: 'Close', onConfirm() {} }));
    more.append(logout, remove);
    body.append(section('More', '', more));
    return body;
  }

  function usagePage() {
    const body = el('div', 'thesis-settings-body thesis-settings-usage');
    const summary = el('div', 'thesis-usage-summary');
    const plan = el('div', 'thesis-plan-row');
    const planName = el('div'); planName.append(el('strong', null, 'Pro'), el('span', null, 'Annually'));
    const planActions = el('div');
    const plans = btn('thesis-settings-action', 'View all plans'); plans.textContent = 'View all plans';
    const planSettings = btn('thesis-settings-icon-button', 'Plan settings'); planSettings.append(img(SETTINGS_ASSETS + 'usage-settings.svg'));
    planActions.append(plans, planSettings); plan.append(planName, planActions);
    const dates = el('div', 'thesis-plan-dates');
    dates.append(el('span', null, 'Start Date'), el('strong', null, '01/08/2026'), el('span', null, 'Next Billing'), el('strong', null, '01/08/2027'));
    summary.append(plan, dates);

    const credits = el('section', 'thesis-settings-card thesis-credit-card');
    const available = el('span', null, 'Available');
    const total = el('div', 'thesis-credit-total'); total.append(el('strong', null, '10,000'), el('span', null, 'Credits'), img(SETTINGS_ASSETS + 'usage-info.svg'));
    const expiry = el('p', null, '300 expire tomorrow, 2,400 in 3 days \u00b7 10% Used');
    const warning = el('div', 'thesis-credit-warning');
    warning.append(img(SETTINGS_ASSETS + 'usage-warning.svg'), el('p', null, 'Your subscription will expire on Jan 8, 2027 and you will be downgraded to Free afterward.'), icon('ui-arrow-right-l2.svg'));
    credits.append(available, total, expiry, warning);
    [
      ['Daily', 'Limited Bonus', '800 / 1,000', 'Reset in 6h', 32, 'is-green'],
      ['Monthly', '', '8,640 / 21,360', 'Reset in 23d', 68, 'is-blue'],
      ['Pack', '', '2,920', 'Never expires', 0, ''],
    ].forEach(([label, badge, amount, note, progress, tone]) => {
      const row = el('div', 'thesis-credit-row');
      const title = el('div'); title.append(el('strong', null, label)); if (badge) title.append(el('span', 'thesis-credit-badge', badge));
      const value = el('div'); value.append(el('span', null, amount), el('small', null, note));
      row.append(title, value);
      if (progress) { const bar = el('span', 'thesis-credit-progress ' + tone); const fill = el('i'); fill.style.width = progress + '%'; bar.append(fill); row.append(bar); }
      credits.append(row);
    });
    const refill = el('div', 'thesis-auto-refill'); refill.append(el('strong', null, 'Auto-refill'), el('span', null, 'Off'), el('small', null, 'Automatically top up credits when your balance runs low.'));
    credits.append(refill); summary.append(credits); body.append(summary);

    const history = el('div', 'thesis-settings-card thesis-credit-history');
    history.append(el('time', null, '08/22/2026'));
    [
      ['usage-thread.svg', 'Alva Agent', '-80'],
      ['usage-dashboard.svg', 'Viral Video Spotlight', '-500'],
      ['usage-dashboard.svg', 'Viral Video Spotlight', '-800'],
      ['usage-lightning.svg', 'space-rs-rotation', '-800'],
      ['usage-lightning.svg', 'ai-chip-supply-chain', '-800'],
      ['usage-dashboard.svg', 'Viral Video Spotlight', '-2000'],
      ['usage-thread.svg', 'Alva Agent', '-300'],
      ['usage-thread.svg', 'Alva Agent', '+1500'],
      ['usage-dashboard.svg', 'Viral Video Spotlight', '-1200'],
      ['usage-thread.svg', 'Alva Agent', '+20000'],
    ].forEach(([asset, label, amount]) => {
      const row = el('div', 'thesis-history-row');
      row.append(img(SETTINGS_ASSETS + asset), el('span', null, label), el('strong', amount.startsWith('+') ? 'is-positive' : '', amount));
      history.append(row);
    });
    body.append(section('Credits History', '', history));
    return body;
  }

  function portfolioPage() {
    const body = el('div', 'thesis-settings-body thesis-settings-portfolio');
    const brokerHead = el('div', 'thesis-settings-inline-head');
    const copy = el('div'); copy.append(el('h2', null, 'Broker Connections'), el('p', null, 'Connect your brokerage accounts to enable trading.'));
    const add = btn('thesis-settings-action', 'Add broker'); add.append(icon('ui-add-l2.svg'), 'Add'); brokerHead.append(copy, add); body.append(brokerHead);
    const brokers = el('div', 'thesis-broker-list');
    [
      ['broker-alpaca.svg', 'Alpaca', 'PA3***6PEJ', 'Live', 'is-live'],
      ['broker-alpaca.svg', 'Alpaca', 'RF6***8BVC', 'Paper', 'is-paper'],
      ['broker-binance.svg', 'Binance', 'U***6789', 'Live', 'is-live'],
    ].forEach(([asset, name, account, status, tone]) => {
      const row = el('div', 'thesis-settings-card thesis-broker-row');
      const info = el('div', 'thesis-broker-info');
      const details = el('div'); details.append(el('strong', null, name));
      const meta = el('span'); meta.append(account, el('i', 'thesis-broker-status ' + tone, status)); details.append(meta);
      info.append(img(SETTINGS_ASSETS + asset), details);
      row.append(info, actionButton('Disconnect', true)); brokers.append(row);
    });
    body.append(brokers);

    const risk = el('div', 'thesis-settings-card thesis-rule-list');
    [['Max Single Order', '$5,000', true], ['Max Daily Turnover', '', false], ['Max Daily Orders', '100', true]].forEach(([label, value, checked]) => {
      const row = el('div', 'thesis-rule-row'); row.append(el('span', null, label));
      if (value) row.append(el('strong', null, value), img(SETTINGS_ASSETS + 'edit.svg'));
      row.append(switchControl(label, checked)); risk.append(row);
    });
    body.append(section('Global Risk Rules', 'Applies to all strategy bindings', risk));
    const notices = el('div', 'thesis-settings-card thesis-rule-list');
    [['Order filled', true], ['Rebalance triggered', false], ['Risk Alert', true], ['Daily P&L Summary', true]].forEach(([label, checked]) => {
      const row = el('div', 'thesis-rule-row'); row.append(el('span', null, label), switchControl(label, checked)); notices.append(row);
    });
    body.append(section('Notifications', 'Configure alerts and daily reports', notices));
    return body;
  }

  function agentPage() {
    const body = el('div', 'thesis-settings-body thesis-settings-agent');
    const connected = el('div', 'thesis-connected-list');
    const telegram = el('div', 'thesis-agent-card is-active');
    const telegramCopy = el('div', 'thesis-agent-copy'); telegramCopy.append(el('strong', null, 'Telegram'), el('span', null, 'Sheerruan'));
    telegram.append(img(SETTINGS_ASSETS + 'agent-telegram.svg'), telegramCopy, el('span', 'thesis-settings-disconnect', 'Disconnect'), el('i', 'thesis-agent-check', '\u2713'));
    const discord = el('div', 'thesis-agent-card');
    const discordTop = el('div', 'thesis-agent-card-top'); const discordCopy = el('div', 'thesis-agent-copy'); discordCopy.append(el('strong', null, 'Discord'), el('span', null, 'sheer-ruan'));
    discordTop.append(img(SETTINGS_ASSETS + 'agent-discord.svg'), discordCopy, el('span', 'thesis-settings-disconnect', 'Disconnect'), el('i', 'thesis-agent-check is-muted', '\u2713'));
    const discordLink = btn('thesis-agent-link', 'Add Alva to your Discord servers'); discordLink.append(icon('mvp-link-l.svg'), el('span', null, 'Add Alva to your Discord servers'), icon('ui-arrow-right-l2.svg'));
    discord.append(discordTop, discordLink); connected.append(telegram, discord);
    body.append(section('Connected App', 'Connected apps and pick which one gets your Alva messages.', connected));
    const divider = el('div', 'thesis-more-apps', 'More apps');
    body.append(divider);
    const apps = el('div', 'thesis-more-app-list');
    const slack = el('div', 'thesis-settings-card thesis-more-app');
    const slackCopy = el('div', 'thesis-agent-copy'); slackCopy.append(el('strong', null, 'Slack'), el('span', null, 'Alva app in your workspace'));
    slack.append(img(SETTINGS_ASSETS + 'agent-slack-color.svg'), slackCopy, actionButton('Connect'));
    const message = el('div', 'thesis-settings-card thesis-more-app');
    const messageCopy = el('div', 'thesis-agent-copy'); messageCopy.append(el('strong', null, 'iMessage'), el('span', null, 'Scan the QR code, or connect directly below.'));
    message.append(img(SETTINGS_ASSETS + 'agent-imessage.svg'), messageCopy, icon('ui-arrow-right-l2.svg'));
    apps.append(slack, message); body.append(apps);
    const instructions = el('textarea', 'thesis-agent-instructions'); instructions.placeholder = 'Add your custom instructions...';
    body.append(section('Customize Your Assistant', 'Define the personality, tone, and response style.', instructions));
    return body;
  }

  function open() {
    const { page, scroll } = pageShell('Settings');
    page.dataset.socialPage = 'settings';
    const pager = controls.pager(['Account', 'Usage', 'Portfolio', 'Alva Agent'], name => ({
      Account: accountPage,
      Usage: usagePage,
      Portfolio: portfolioPage,
      'Alva Agent': agentPage,
    })[name](), {
      onSelect() { scroll.scrollTop = 0; },
    });
    pager.nav.classList.add('thesis-settings-tabs');
    pager.nav.setAttribute('data-scroll-divider-edge', '');
    pager.viewport.classList.add('thesis-settings-pages');
    scroll.append(pager.nav, pager.viewport);
    const stopSizing = controls.fitPager(pager, scroll, pager.nav);
    push(page, null, stopSizing);
  }

  return { open };
}
