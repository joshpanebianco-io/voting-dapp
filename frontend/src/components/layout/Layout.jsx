import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { WalletModals } from "../wallet/WalletModals";
import { ConfigBanner, NetworkBanner } from "./Banners";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <ConfigBanner />
      <NetworkBanner />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
      <Footer />
      <WalletModals />
    </div>
  );
}

/** Consistent page heading block. */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className || ""}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-1 text-sm font-medium text-accent">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
