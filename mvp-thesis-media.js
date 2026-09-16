export function thesisMedia({ el, img }, media) {
  const gallery = el('span', 'thesis-charts thesis-media');
  gallery.setAttribute('aria-label', 'Update images');
  media.forEach(item => {
    const frame = el('span', 'thesis-chart thesis-media-item');
    const picture = img(item.src); picture.alt = item.alt;
    picture.width = 240; picture.height = 135;
    if (item.cover) picture.classList.add('is-cover');
    frame.append(picture); gallery.append(frame);
  });
  return gallery;
}
