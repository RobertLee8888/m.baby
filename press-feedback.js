(function () {
  'use strict';

  const TARGETS = [
    'button',
    'a[href]',
    '[role="button"]',
    '[role="tab"]',
    '[role="radio"]',
    'summary',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    '[data-pressable]',
  ].join(',');
  const reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const states = new WeakMap();
  const active = new Set();

  function targetFrom(node) {
    const target = node && node.closest ? node.closest(TARGETS) : null;
    if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return null;
    return target;
  }

  function currentScale(target) {
    const value = getComputedStyle(target).scale;
    return !value || value === 'none' ? '1' : value;
  }

  function animateScale(target, pressed) {
    const state = states.get(target) || {};
    const from = currentScale(target);
    if (state.animation) state.animation.cancel();

    if (reduceMotion && reduceMotion.matches) {
      target.style.scale = '';
      return;
    }

    if (!target.animate) {
      target.style.scale = pressed ? '.96' : '';
      return;
    }

    const animation = target.animate(
      [{ scale: from }, { scale: pressed ? '.96' : '1' }],
      { duration: 120, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'forwards' },
    );
    state.animation = animation;
    states.set(target, state);

    if (!pressed) {
      animation.finished.then(() => {
        if (states.get(target)?.animation !== animation) return;
        animation.cancel();
        states.delete(target);
      }).catch(() => {});
    }
  }

  function press(target, source) {
    if (!target || active.has(target)) return;
    active.add(target);
    const state = states.get(target) || {};
    state.source = source;
    states.set(target, state);
    target.classList.add('is-unified-pressed');
    animateScale(target, true);
  }

  function release(target) {
    if (!target || !active.has(target)) return;
    active.delete(target);
    target.classList.remove('is-unified-pressed');
    animateScale(target, false);
  }

  document.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    press(targetFrom(event.target), 'pointer');
  }, true);

  ['pointerup', 'pointercancel'].forEach(type => {
    document.addEventListener(type, () => {
      [...active].forEach(target => {
        if (states.get(target)?.source === 'pointer') release(target);
      });
    }, true);
  });

  document.addEventListener('keydown', event => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    press(targetFrom(event.target), 'keyboard');
  }, true);

  document.addEventListener('keyup', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    release(targetFrom(event.target));
  }, true);

  window.addEventListener('blur', () => [...active].forEach(release));
}());
