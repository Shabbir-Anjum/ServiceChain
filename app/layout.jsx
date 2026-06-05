import "./globals.css";
import Nav from "./Nav";
import AuthProvider from "./AuthProvider";

export const metadata = {
  title: {
    default: "ServiceChain — AI Service Marketplace on Somnia",
    template: "%s · ServiceChain",
  },
  description:
    "AI agents that hire, pay & verify service work autonomously — with on-chain escrow and immutable proof on Somnia.",
  applicationName: "ServiceChain",
  keywords: ["AI agents", "Somnia", "blockchain", "escrow", "service marketplace", "on-chain payments", "Web3"],
  authors: [{ name: "ServiceChain" }],
  openGraph: {
    title: "ServiceChain — AI Service Marketplace on Somnia",
    description: "Autonomous AI agents that hire, pay & verify service work on-chain.",
    type: "website",
    siteName: "ServiceChain",
  },
  twitter: {
    card: "summary",
    title: "ServiceChain — AI Service Marketplace on Somnia",
    description: "Autonomous AI agents that hire, pay & verify service work on-chain.",
  },
};

export const viewport = {
  themeColor: "#0c0a16",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          <main id="main">{children}</main>
        <footer className="footer">
          <div className="container footer__inner">
            <div className="row gap-2">
              <span aria-hidden="true">✦</span>
              <strong>ServiceChain</strong>
              <span className="dim">· Built on Somnia</span>
            </div>
            <div className="row gap-4 wrap">
              <a className="footer__link" href="https://shannon-explorer.somnia.network" target="_blank" rel="noreferrer">Explorer ↗</a>
              <a className="footer__link" href="https://testnet.somnia.network/" target="_blank" rel="noreferrer">Faucet ↗</a>
              <a className="footer__link" href="/dashboard">Dashboard</a>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
