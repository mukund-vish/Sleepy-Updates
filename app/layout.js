import Link from "next/link";
import { Manrope, Newsreader } from "next/font/google";
import NavProgress from "@/components/NavProgress";
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESC, jsonLd } from "@/lib/site";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--serif" });

const DEFAULT_TITLE = `${SITE_NAME} – ${SITE_TAGLINE}`;
const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: SITE_NAME };

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: SITE_DESC,
    locale: "en_IN",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: SITE_DESC, images: ["/og.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

export const viewport = { themeColor: "#0b0d1f", colorScheme: "dark" };

const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: DEFAULT_TITLE,
  url: SITE_URL,
  description: SITE_DESC,
  inLanguage: "en",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteLd) }} />
        <NavProgress />
        <header className="bar">
          <div className="wrap bar-in">
            <Link href="/" className="logo">
              <span className="moon" aria-hidden="true" />
              Sleepy Updates
            </Link>
            <nav>
              <Link href="/archive">Archive</Link>
              <Link href="/about">About</Link>
              <a href="/feed.xml">RSS</a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer>
          <div className="wrap">
            Summaries are written by AI from the linked sources, and images belong to their original
            publishers. Check the originals for detail. <Link href="/about">About</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}