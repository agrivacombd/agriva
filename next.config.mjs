/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // This legacy product URL is referenced by an indexed AGRIVA article
        // and Search Console, but the product's current canonical slug changed.
        source: "/marketplace/agriva-black-rice-seed-ab21bee5",
        destination: "/marketplace/black-rice-seeds",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "agriva.com.bd", pathname: "/**" },
    ],
  },
};
export default nextConfig;
