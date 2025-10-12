import { Metadata } from "next";

const TITLE = "Euno - Your AI Companion for Life's Moments";
const DESCRIPTION =
  "Euno is your always-available AI companion who listens, understands, and supports you through every emotion. Whether you're seeking comfort, motivation, or just someone to talk to, Euno adapts to be your perfect friend, mentor, or confidant.";

const BASE_URL = "https://euno.live/";
const PREVIEW_IMAGE = "/og-image.jpg";
const ALT_TITLE = "Euno - Your Personal AI Friend & Emotional Support";

export const siteConfig: Metadata = {
  title: {
    default: TITLE,
    template: "%s | Euno - Your AI Companion for Life's Moments",
  },
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: "Euno",
  authors: [{ name: "Euno Team" }],
  creator: "Euno Team",
  publisher: "Euno Technologies",
  category: "AI Companion",
  classification: "Artificial Intelligence",
  metadataBase: new URL(BASE_URL),

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Euno",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        alt: ALT_TITLE,
        type: "image/png",
      },
      {
        url: PREVIEW_IMAGE,
        width: 1200,
        height: 1200,
        alt: ALT_TITLE,
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@euno_ai",
    creator: "@euno_ai",
    title: TITLE,
    description: DESCRIPTION,
    images: [PREVIEW_IMAGE],
  },

  keywords: [
    "Euno",
    "Euno AI",
    "AI companion",
    "AI friend",
    "AI confidant",
    "emotional support AI",
    "AI for loneliness",
    "mental wellness app",
    "talk to AI",
    "AI that listens",
    "empathetic AI",
    "voice companion",
    "personal AI assistant",
    "human-like AI",
    "stress relief app",
    "AI friendship",
    "AI emotional connection",
    "mindful AI",
    "AI chatbot for support",
    "digital companion",
  ],

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-US": BASE_URL,
      en: `${BASE_URL}/en`,
    },
  },

  referrer: "origin-when-cross-origin",
  colorScheme: "light dark",
};
