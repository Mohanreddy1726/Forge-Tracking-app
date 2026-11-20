import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forge — Build Yourself. Every Day.",
    short_name: "Forge",
    description: "Transformation command center: weight, habits, workouts, nutrition and discipline.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#171a21",
    theme_color: "#e86328",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
