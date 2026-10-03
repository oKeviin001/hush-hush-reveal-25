import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VEILØRIS" },
      {
        name: "description",
        content: "VEILØRIS vem aí. Você está pronto?",
      },
      { property: "og:title", content: "VEILØRIS" },
      {
        property: "og:description",
        content: "VEILØRIS vem aí. Você está pronto?",
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
      <h1 className="soon-title text-center font-medium leading-tight tracking-[0.08em] text-soon-fg">
        VEILØRIS VEM AÍ!! VOCÊ ESTÁ PRONTO?
      </h1>
    </div>
  );
}

