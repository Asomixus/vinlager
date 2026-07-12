import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vinlager",
    short_name: "Vinlager",
    description: "Oversikt over vinlageret",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1017",
    theme_color: "#1c1017",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
