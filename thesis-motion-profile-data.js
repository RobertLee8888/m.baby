import { PROFILES } from './mvp-social-detail-data.js';

// Profile metadata is independent of the feed snapshot. Bio sources are
// recorded in docs/thesis-card-transition.md; counts are demo fixtures.
export const PROFILE_DETAILS = {
  'tom-lee': {
    bio: 'Co-founder and Head of Research at Fundstrat. His research spans market strategy, small- and mid-cap stocks, and telecom services. Previously Chief Equity Strategist at J.P. Morgan and a Managing Director at Salomon Smith Barney.',
    channels: [['x', '@fundstrat', 'https://x.com/fundstrat']],
  },
  'raoul-pal': {
    bio: 'Co-founder and CEO of Real Vision and publisher of Global Macro Investor. Previously co-managed the GLG Global Macro Fund and hedge fund sales in equities and derivatives at Goldman Sachs.',
    channels: [['x', '@RaoulGMI', 'https://x.com/RaoulGMI']],
  },
  'jim-rogers': {
    role: 'Investor and author',
    bio: 'Author of Investment Biker. His travels examine economies and investment markets from the ground up, drawing on conversations with local business owners, bankers and investors across six continents.',
    channels: [['x', '@AllJimRogers', 'https://x.com/AllJimRogers']],
  },
  chamath: {
    role: PROFILES.chamath.role,
    bio: PROFILES.chamath.bio,
    followers: 12800,
    channels: [['x', '@chamath', 'https://x.com/chamath']],
  },
  'cathie-wood': {
    role: 'Founder, CEO & CIO, ARK Invest',
    bio: 'Founded ARK in 2014 to focus on disruptive innovation. Her investment approach spans multiomic sequencing, robotics, artificial intelligence, energy storage and blockchain technology. Previously CIO of Global Thematic Strategies at AllianceBernstein.',
    channels: [['x', '@CathieDWood', 'https://x.com/CathieDWood']],
  },
  gavin: {
    role: 'Managing Partner & CIO, Atreides',
    bio: 'CIO and Managing Partner at Atreides Management. Previously managed the Fidelity OTC fund from 2009 to 2017 and helped develop Fidelity\'s venture investing, with investments across public and private technology companies.',
    channels: [['x', '@GavinSBaker', 'https://x.com/GavinSBaker']],
  },
};
