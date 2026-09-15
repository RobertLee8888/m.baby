import { THESIS_ASSETS as assets } from './mvp-thesis-assets.js';
import { ARTICLE } from './mvp-social-detail-data.js';

// Figma 5851:100223. Lifecycle and generation mode are explicit content data.
const HOME = [
  ['P06', '5742:114435', 'first-card'],
  ['P01', '5742:114434', 'P01'],
  ['S05', '5742:114441', 'S05'],
  ['P04', '5742:114443', 'P04'],
  ['S01', '5742:114437', 'S01'],
  ['P07', '5742:114440', 'P07'],
  ['P02', '5742:114438', 'P02'],
  ['S02', '5742:114439', 'S02'],
  ['S06', '5742:114442', 'S06'],
];

export function thesisCards(cards) {
  return HOME.map(([key, nodeId, assetKey]) => {
    const card = cards.find(item => item.social.key === key);
    const art = assets[assetKey];
    const social = { ...card.social, nodeId, generationMode: key === 'P01' ? 'manual' : 'auto',
      thesisType: key === 'P01' ? 'Thesis update' : 'New thesis',
      charts: Object.entries(art).filter(([name]) => /^imgChart/.test(name)).map(([, src]) => src) };
    let sources = card.sources.map((source, index) => index ? source : { ...source, img: art.imgAvatar || source.img,
      role: key.startsWith('S') ? '' : source.role, handle: key.startsWith('S') ? '' : source.handle });
    if (key === 'P01') social.paragraphs = ARTICLE.paragraphs;
    if (key === 'P02') social.statements = ["Altman would lead Microsoft's new AI group, drawing on Microsoft's experience giving founders room to build independent teams."];
    if (key === 'P04') {
      social.age = 'Sep 23, 2024';
      social.statements = ['Broad access to AI depends on abundant, affordable compute, supported by enough energy and chips. Without that infrastructure, AI could become a scarce resource whose benefits concentrate among the wealthy.'];
      sources = [{ ...sources[0], name: 'Sam Altman', role: 'Co-founder, OpenAI', reference: undefined, media: undefined,
        url: 'https://ia.samaltman.com/', platform: 'website', summary: social.statements[0] }];
    }
    return { ...card, referenceNodeId: nodeId, age: social.age, social, sources,
      tickers: key === 'P04' ? [] : card.tickers, blocks: [] };
  });
}

export const ASSET_TYPES = ['All', 'US Stock', 'Non-US Stock', 'Binance Spot', 'Hyperliquid Spot'];
export const SEARCH_TICKERS = [
  ['NVDA', 'NVIDIA Corporation', '223.67 USD', '-0.87%', 'US Stock', 'imgLogoComp'],
  ['TSLA', 'Tesla, Inc.', '367.81 USD', '-0.08%', 'US Stock', 'imgLogoComp1'],
  ['MSFT', 'Microsoft Corporation', '491.65 USD', '-0.44%', 'US Stock', 'imgLogoComp2'],
  ['GOOGL', 'Alphabet Inc.', '330.65 USD', '-2.28%', 'US Stock'],
  ['AMZN', 'Amazon.com, Inc.', '252.40 USD', '-1.78%', 'US Stock', 'imgLogoComp3'],
  ['META', 'Meta Platforms, Inc.', '718.2 USD', '-0.4%', 'US Stock'],
  ['9988.HK', 'Alibaba Group', '110.3 HKD', '+0.18%', 'Non-US Stock', 'imgImage'],
  ['BTC', 'Bitcoin', '77,636.83 USDT', '+0.26%', 'Binance Spot', 'imgGroup2'],
  ['HYPE', 'Hyperliquid', '83.248 USDC', '+0.58%', 'Hyperliquid Spot'],
].map(([sym, co, price, change, assetType, logo]) => ({ sym, co, price, change, assetType, img: assets.search[logo],
  aliases: sym === 'MSFT' ? ['Azure', 'Microsoft Azure datacenter capacity and annual revenue'] : [] }));

export const PEOPLE = [
  ['Gavin Baker', 'Managing Partner & CIO, Atreides', 'imgAvatar'],
  ['Satya Nadella', 'Chairman & CEO, Microsoft', 'imgAvatar1'],
  ['Chamath Palihapitiya', '@chamath', 'imgLeadingVisual'],
  ['Sam Altman', 'Co-founder, OpenAI', 'imgAvatar2'],
  ['Warren Buffett', 'Chairman & CEO, Berkshire Hathaway', 'imgAvatar3'],
  ['Elon Musk', 'CEO, SpaceX', 'imgAvatar4'],
  ['Dario Amodei', 'Co-founder & CEO, Anthropic', 'imgAvatar5'],
  ['Jensen Huang', 'Founder & CEO, NVIDIA', 'imgAvatarJensenHuang'],
].map(([name, role, asset]) => ({ id: name, name, role, img: assets.search[asset], bot: name === 'Chamath Palihapitiya',
  crop: name === 'Jensen Huang' }));
