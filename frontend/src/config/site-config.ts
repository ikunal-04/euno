import { Metadata } from 'next';

const TITLE = 'Euno — Your AI Companion for Life\'s Moments';
const DESCRIPTION =
  'Euno is your always-available AI companion that adapts to be the friend, parent, teacher, or confidant you need. Share your thoughts, relieve stress, combat loneliness, and talk through life\'s challenges with an AI that truly listens and understands.';

const PREVIEW_IMAGE_URL = 'https://euno.live/og-banner.png'; // 🔹 Replace with your actual OG image URL
const ALT_TITLE = 'Euno - Your Personal AI Companion & Emotional Support';
const BASE_URL = 'https://euno.live';

export const siteConfig: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: '/favicon.ico',
  },
  applicationName: 'Euno',
  creator: 'Euno Team',
  category: 'AI Technology',
  metadataBase: new URL(BASE_URL),

  alternates: {
    canonical: BASE_URL,
  },

  keywords: [
    'AI companion',
    'Euno AI',
    'emotional support AI',
    'AI friend',
    'stress relief app',
    'loneliness solution',
    'AI confidant',
    'mental wellness',
    'voice companion',
    'someone to talk to',
    'AI emotional support',
    'reduce anxiety',
    'personal AI assistant',
    'artificial intelligence companion',
    'empathetic AI',
  ],

  twitter: {
    card: 'summary_large_image',
    creator: '@euno_ai', // 🔹 Replace with your handle if available
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: PREVIEW_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: ALT_TITLE,
      },
    ],
  },

  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Euno',
    url: BASE_URL,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: PREVIEW_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: ALT_TITLE,
      },
    ],
  },
};