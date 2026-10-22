import { POSTS } from './thesis-motion-data.js?v=3';
import { PROFILE_DETAILS } from './thesis-motion-profile-data.js?v=1';

// An author has one identity across all their theses and entry points.
export const PEOPLE = new Map(POSTS.map(post => [post.authorId, {
  id: post.authorId, name: post.name, role: post.role, avatar: post.avatar,
  bot: true, followers: 0, ...PROFILE_DETAILS[post.authorId],
}]));

export function postsFor(person) { return POSTS.filter(post => post.authorId === person.id); }
export function postFor(id) { return POSTS.find(post => post.id === id); }
export function personFor(post) { return PEOPLE.get(post.authorId || post.id); }

export function renderProfile(root, person, ui) {
  const { el, image, icon, button, identity, followButton, followerCount, postCard, back, settle, share } = ui;
  root.setAttribute('aria-label', person.name + ' profile'); root.dataset.profile = person.id;
  const surface = el('div', 'motion-profile-surface');
  const header = el('header', 'motion-profile-header');
  const backButton = button('motion-icon-button', 'Back from profile', back); backButton.dataset.back = '';
  backButton.append(icon('onboarding-arrow-left-l1.svg'));
  const collapsed = identity(person, false, false); collapsed.classList.add('motion-profile-collapsed');
  collapsed.setAttribute('aria-hidden', 'true'); collapsed.inert = true;
  const shareButton = button('motion-icon-button', 'Share profile', () => share(person));
  shareButton.append(icon('thesis/profile-imgShareL.svg'));
  header.append(backButton, collapsed, followButton(person), shareButton);

  const scroll = el('div', 'motion-profile-scroll');
  const about = el('section', 'motion-profile-about');
  const hero = identity(person, false, false); hero.classList.add('motion-profile-hero');
  const info = hero.querySelector('.motion-person');
  if (person.bot) {
    [hero, collapsed].forEach(row => {
      const badge = icon('thesis/search-imgBotNotOnAlva.svg'); badge.classList.add('motion-profile-badge');
      row.querySelector('.motion-name').append(badge);
    });
  }
  if (person.pro) info.querySelector('.motion-name').append(el('span', 'motion-profile-pro', 'Pro'));
  if (person.joined) {
    info.querySelector('.motion-role')?.remove();
    const meta = el('div', 'motion-profile-meta'); meta.append(el('span', '', person.handle), el('span', '', 'Joined ' + person.joined)); info.append(meta);
  }
  about.append(hero);
  if (person.followers != null) {
    const stats = el('div', 'motion-profile-stats');
    const followers = el('span'); followers.append(followerCount(person), ' ', el('span', 'motion-profile-stat-label', 'Followers'));
    stats.append(followers);
    if (person.following != null) {
      const following = el('span'); following.append(person.following + ' ', el('span', 'motion-profile-stat-label', 'Following'));
      stats.append(following);
    }
    about.append(stats);
  }
  let bioContent, bioMore;
  if (person.bio) {
    const bio = el('p', 'motion-profile-bio', person.bio);
    if (person.bot) {
      const more = button('motion-profile-more', 'Show more bio', () => {
        bio.classList.toggle('is-expanded');
        const expanded = bio.classList.contains('is-expanded');
        more.textContent = expanded ? 'Show less' : 'Show more'; more.setAttribute('aria-expanded', String(expanded));
      });
      bio.classList.add('is-truncated'); more.textContent = 'Show more'; more.setAttribute('aria-expanded', 'false');
      bioContent = bio; bioMore = more;
      const wrap = el('div', 'motion-profile-bio-wrap'); wrap.append(bio, more); about.append(wrap);
    } else about.append(bio);
  }
  if (person.channels) {
    const channels = el('div', 'motion-profile-channels');
    person.channels.forEach(([platform, label, url]) => {
      const link = el('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.append(image('assets/social-channel-' + platform + '.svg'), el('span', '', label)); channels.append(link);
    });
    about.append(channels);
  }
  if (person.bot) {
    const note = el('p', 'motion-profile-note');
    note.append(icon('thesis/search-imgBotNotOnAlva.svg'), el('span', '', 'Compiled from public information. Not affiliated with Alva.')); about.append(note);
  }
  const tabs = el('div', 'motion-detail-tabs motion-profile-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Thesis status');
  const panels = el('div', 'motion-panels'); const track = el('div', 'motion-panel-track');
  const active = el('div', 'motion-panel motion-profile-list');
  active.append(...postsFor(person).map(post => postCard(post, false)));
  const archived = el('div', 'motion-panel motion-profile-list');
  archived.append(el('p', 'motion-profile-empty', 'No archived theses'));
  const panes = [active, archived];
  let timer;
  function select(index) {
    clearTimeout(timer); panels.classList.add('is-switching');
    [...tabs.children].forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    panes.forEach((pane, i) => { pane.inert = i !== index; pane.setAttribute('aria-hidden', String(i !== index)); });
    track.style.transform = `translateX(-${index * 100}%)`;
    timer = setTimeout(() => panels.classList.remove('is-switching'), 260);
  }
  ['Active', 'Archived'].forEach((name, index) => {
    const tab = button('', name, () => select(index)); tab.textContent = name; tab.setAttribute('role', 'tab');
    tab.id = root.id + '-status-' + index; tab.setAttribute('aria-controls', tab.id + '-panel');
    panes[index].id = tab.id + '-panel'; panes[index].setAttribute('role', 'tabpanel'); panes[index].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
      select(next); tabs.children[next].focus({ preventScroll: true });
    });
    tabs.append(tab);
  });
  track.append(active, archived); panels.append(track);
  scroll.append(about, tabs, panels); surface.append(header, scroll); root.append(surface);
  select(0); panels.classList.remove('is-switching');
  const fit = () => {
    panels.style.setProperty('--panel-min-height', Math.max(0, scroll.clientHeight - tabs.offsetHeight) + 'px');
    if (bioMore) bioMore.hidden = !bioContent.classList.contains('is-expanded') && bioContent.scrollHeight <= bioContent.clientHeight + 1;
  };
  const observer = new ResizeObserver(fit); observer.observe(scroll);
  if (bioContent) observer.observe(bioContent);
  fit();
  function paint() {
    const p = Math.max(0, Math.min(1, (scroll.scrollTop - hero.offsetHeight) / 20));
    root.style.setProperty('--profile-header-p', p);
    collapsed.setAttribute('aria-hidden', String(p === 0));
    header.classList.toggle('is-scrolled', scroll.scrollTop > 0 && scroll.scrollTop < about.offsetHeight);
  }
  scroll.addEventListener('scroll', () => { settle(); paint(); }, { passive: true });
  paint();
  return () => { observer.disconnect(); clearTimeout(timer); };
}
