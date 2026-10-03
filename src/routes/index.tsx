import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kevin — Coming Soon" },
      {
        name: "description",
        content: "Algo novo está chegando. Volte em breve.",
      },
      { property: "og:title", content: "Kevin — Coming Soon" },
      {
        property: "og:description",
        content: "Algo novo está chegando. Volte em breve.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComingSoon,
});

function ComingSoon() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-soon-bg px-6">
      <h1 className="soon-title text-center font-medium tracking-[0.08em] text-soon-fg">
        COMING SOON
      </h1>
    </div>
  );
}
