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
    <div className="flex min-h-screen flex-col items-center justify-center bg-soon-bg px-6 py-12">
      <div className="flex w-full max-w-4xl flex-col items-center gap-10">
        <h1 className="soon-title text-center font-medium leading-tight tracking-[0.08em] text-soon-fg">
          VEILØRIS VEM AÍ!! VOCÊ ESTÁ PRONTO?
        </h1>
        <img
          src="/veilorius-investigation.svg"
          alt="Duas pessoas investigando uma pista com uma grande lupa"
          className="h-auto w-full max-w-2xl rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  );
}
