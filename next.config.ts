import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      // Old poster-capture URL: /?poster=X -> /journey?poster=X (query is forwarded automatically).
      {
        source: "/",
        has: [{ type: "query", key: "poster" }],
        destination: "/journey",
        permanent: false,
      },
      { source: "/gallery", destination: "/collection", permanent: true },
      // 7-slide project deck (static file in public/slides/).
      { source: "/slides", destination: "/slides/index.html", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
