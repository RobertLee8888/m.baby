import { ARTICLE, SIGNALS } from './mvp-social-detail-data.js';

// Dates and summaries: Figma 6720:92464. Jul 10 full text: 5689:96154.
// Other historical records contain only the text and source supplied in the timeline.
const HISTORY = [
  { id: 'P01-jul10', date: 'Jul 10, 14:32',
    paragraphs: ['Integrated platforms may capture more of that demand if they can deliver compute efficiently, but the shift in margins is not yet clear.', ARTICLE.paragraphs[0], ARTICLE.paragraphs[1]],
    analysis: 'Usage growth alone does not establish who captures the margin.', charts: true, signals: SIGNALS },
  { id: 'P01-jul8', date: 'Jul 8, 09:18', paragraphs: [ARTICLE.paragraphs[1]] },
  { id: 'P01-jul6', date: 'Jul 6, 16:45', paragraphs: [ARTICLE.paragraphs[2] + ' Whether greater adoption changes that balance remains to be seen.'] },
  { id: 'P01-jul3', date: 'Jul 3, 11:06', paragraphs: ['The key question is whether wider adoption can offset lower revenue per token. His caveat is central: inexpensive tokens may represent much of current usage, while the most capable models still capture most economic value.'] },
  { id: 'P01-jun30', date: 'Jun 30, 08:24', paragraphs: ['If lower-priced open or closed models take share from frontier labs with high inference margins, customers could get more intelligence for each dollar and increase their token usage. Whether greater adoption changes that balance remains to be seen.'] },
];

export function thesisVersions(base, related) {
  const latest = { id: 'latest', date: base.social.age, card: base,
    summary: (base.social.paragraphs || base.social.statements)[0], related,
    signals: base.social.key === 'P01' ? SIGNALS : base.sources.map(source => ({ ...source,
      text: source.summary || base.social.statements[0], analysis: base.social.analysis })) };
  if (base.social.key !== 'P01') return [latest];
  return [latest, ...HISTORY.map(record => ({
    id: record.id, date: record.date, summary: record.paragraphs[0].replace(/\.$/, '...'),
    signals: record.signals || [], related: [],
    card: { ...base, blocks: [], social: { ...base.social, version: record.id, age: record.date,
      paragraphs: record.paragraphs, statements: record.paragraphs,
      analysis: record.analysis || record.paragraphs[0], charts: record.charts ? base.social.charts : [] } },
  }))];
}
