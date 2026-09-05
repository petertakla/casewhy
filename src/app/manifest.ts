import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CaseWhy",
    short_name: "CaseWhy",
    description:
      "AI-explained USCIS case status tracking. Know what's happening with your immigration case, and why.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#1baf7a",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
