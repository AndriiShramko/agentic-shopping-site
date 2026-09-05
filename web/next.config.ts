import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Static export (owner's playbook §15: every site is its own tiny Docker; the hub has ~2 GB RAM
// free, so a node server is overkill for a one-pager). nginx:alpine serves ./out with gzip and
// does the locale redirect on "/" from the cookie / Accept-Language (deploy/nginx.conf).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default withNextIntl(nextConfig);
