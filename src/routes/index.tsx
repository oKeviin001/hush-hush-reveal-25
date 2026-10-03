import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock3,
  FileSearch,
  LockKeyhole,
  Map,
  MessageSquareText,
  Search,
  ShieldAlert,
  Skull,
  Sparkles,
  Users,
  X,
  Link2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VEILØRIS — Arquivos" },
      {
        name: "description",
        content: "Um thriller investigativo narrativo.",
      },
      { property: "og:title", content: "VEILØRIS" },
      {
        property: "og:description",
        content: "Investigue. Conecte. Reconsidere.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

type View = "cases" | "briefing" | "investigation";
type InterviewTarget = "Marcus Rook" | "Helena Graves" | "Tobias Flint" | "Rowan Pike" | "Daniel Cross";
type JournalTab = "clues" | "suspects" | "contradictions" | "hypotheses" | "timeline";
type GameStatus = "investigating" | "solved";

const STORAGE_KEY = "veilorius-case-01-state-v2";

type InterviewQuestion = {
  id: string;
  label: string;
  response: string;
  unlockClue?: string;
  requires?: string[];
};

type Interview = {
  role: string;
  summary: string;
  questions: InterviewQuestion[];
};

type Clue = {
  id: string;
  title: string;
  description: string;
  source: string;
  discovered: boolean;
};

const crew = [
  ["Elias Vane", "Capitão / vítima"],
  ["Marcus Rook", "Primeiro imediato"],
  ["Helena Graves", "Navegadora"],
  ["Tobias Flint", "Cozinheiro"],
  ["Rowan Pike", "Contramestre"],
  ["Clara Bell", "Médica"],
  ["Silas Reed", "Armeiro"],
  ["Nora Finch", "Mantimentos"],
  ["Gideon Marsh", "Carpinteiro"],
  ["Eliza Wren", "Costureira"],
  ["Hugo Black", "Vigia"],
  ["Vincent Cole", "Responsável pela carga"],
  ["Miriam Locke", "Registros"],
  ["Arthur Grey", "Marinheiro veterano"],
  ["Beatrice Shaw", "Marinheira"],
  ["Daniel Cross", "Aprendiz"],
  ["Thomas Ash", "Animais / carga viva"],
  ["Rose Mercer", "Auxiliar"],
];

const interviews: Record<InterviewTarget, Interview> = {
  "Marcus Rook": {
    role: "Primeiro imediato",
    summary: "Teve uma discussão séria com Elias pouco antes da tempestade.",
    questions: [
      { id: "where", label: "Onde você estava quando a tempestade começou?", response: "Na área de comando. Eu estava conferindo a tripulação." },
      { id: "fight", label: "Por que você discutiu com Elias?", response: "Eu queria afastar algumas pessoas da tripulação. Elias não concordou." },
      { id: "cargo", label: "O que você estava escondendo dele?", response: "Irregularidades na carga. Eu pretendia resolver aquilo antes de envolver o capitão.", unlockClue: "marcus-cargo" },
      { id: "alone", label: "Você entrou na cabine de Elias?", response: "Não depois da discussão. Não naquela noite.", requires: ["cargo"] },
    ],
  },
  "Helena Graves": {
    role: "Navegadora",
    summary: "Conhece o navio e a rota melhor do que quase todos a bordo.",
    questions: [
      { id: "where", label: "Onde você estava quando a tempestade começou?", response: "Na sala de navegação." },
      { id: "alone", label: "Você estava sozinha?", response: "Sim. Pelo menos durante a maior parte do tempo." },
      { id: "route", label: "A carta náutica foi alterada?", response: "Houve uma alteração na rota. Eu não queria que todos soubessem onde estivemos antes da tempestade.", unlockClue: "helena-route" },
      { id: "shadow", label: "Você viu alguém perto da cabine?", response: "Vi uma sombra no corredor. Não consegui identificar quem era.", requires: ["route"] },
    ],
  },
  "Tobias Flint": {
    role: "Cozinheiro",
    summary: "Seus horários não coincidem perfeitamente com os registros da cozinha.",
    questions: [
      { id: "where", label: "Onde você estava?", response: "Na cozinha. Preparando comida para a tripulação." },
      { id: "bottles", label: "Por que algumas garrafas desapareceram?", response: "Eu estava guardando bebida que não deveria estar ali. Era um pequeno esquema de contrabando.", unlockClue: "tobias-smuggling" },
      { id: "time", label: "Você saiu da cozinha?", response: "Por alguns minutos. Não queria que descobrissem o que eu estava fazendo." },
      { id: "captain", label: "Você encontrou Elias naquela noite?", response: "Não. E não tenho motivo para mentir sobre isso.", requires: ["bottles"] },
    ],
  },
  "Rowan Pike": {
    role: "Contramestre",
    summary: "Foi visto em uma área onde não deveria estar durante a tempestade.",
    questions: [
      { id: "where", label: "Onde você estava durante a tempestade?", response: "Perto do compartimento de ferramentas." },
      { id: "tools", label: "Por que estava ali?", response: "Uma parte do navio estava danificada. Eu estava tentando consertá-la em segredo.", unlockClue: "rowan-repair" },
      { id: "access", label: "Você tinha acesso às ferramentas?", response: "Sim. Era meu trabalho. Isso não significa que usei alguma delas contra Elias." },
      { id: "captain", label: "Por que esconder o reparo?", response: "Eu tinha medo de ser responsabilizado pela falha.", requires: ["tools"] },
    ],
  },
  "Daniel Cross": {
    role: "Aprendiz",
    summary: "Quase sempre passa despercebido. Elias, porém, vinha observando seus movimentos.",
    questions: [
      { id: "where", label: "Onde você estava quando a tempestade começou?", response: "No convés inferior, ajudando com as amarras." },
      { id: "captain", label: "Quando foi a última vez que falou com Elias?", response: "Antes da tempestade. Ele me perguntou sobre os registros de carga.", unlockClue: "daniel-knowledge" },
      { id: "cabin", label: "Você sabia onde Elias guardava seus registros?", response: "Não. Eu não tinha motivo para saber disso.", unlockClue: "daniel-access", requires: ["captain"] },
      { id: "rope", label: "Você tocou nas cordas da cabine naquela noite?", response: "Não. Não entrei na cabine.", unlockClue: "daniel-rope", requires: ["cabin"] },
    ],
  },
};

const initialClues: Clue[] = [
  {
    id: "storm",
    title: "O temporal",
    description:
      "A tempestade era forte demais para que outro navio se aproximasse com segurança.",
    source: "Cabine do capitão",
    discovered: true,
  },
  {
    id: "wet-rope",
    title: "Corda molhada",
    description:
      "Uma corda molhada foi encontrada na cabine. Seu significado ainda não está claro.",
    source: "Cabine do capitão",
    discovered: false,
  },
  {
    id: "table-scratch",
    title: "Marca recente",
    description:
      "Um risco recente na madeira da mesa não parece ter sido causado por uma lâmina.",
    source: "Mesa",
    discovered: false,
  },
  {
    id: "route",
    title: "Carta náutica",
    description:
      "Uma carta apresenta sinais de alteração. A rota registrada pode não ser a verdadeira.",
    source: "Mesa",
    discovered: false,
  },
  {
    id: "marcus-cargo",
    title: "Irregularidades na carga",
    description: "Marcus escondia problemas na carga e mentiu para evitar que Elias descobrisse.",
    source: "Interrogatório de Marcus",
    discovered: false,
  },
  {
    id: "helena-route",
    title: "Alteração de rota",
    description: "Helena admite que alterou a rota por um motivo pessoal, não para atacar Elias.",
    source: "Interrogatório de Helena",
    discovered: false,
  },
  {
    id: "tobias-smuggling",
    title: "Contrabando de bebida",
    description: "Tobias escondia um pequeno esquema de contrabando e mentiu para protegê-lo.",
    source: "Interrogatório de Tobias",
    discovered: false,
  },
  {
    id: "rowan-repair",
    title: "Reparo secreto",
    description: "Rowan estava consertando uma parte danificada do navio e temia ser responsabilizado.",
    source: "Interrogatório de Rowan",
    discovered: false,
  },
  {
    id: "bed-button",
    title: "Botão preso no tecido",
    description: "Um pequeno botão ficou preso na cama. O padrão do tecido combina com a jaqueta de aprendiz de Daniel Cross.",
    source: "Cama",
    discovered: false,
  },
  {
    id: "daniel-knowledge",
    title: "Conhecimento indevido",
    description: "Daniel sabia que Elias estava verificando os registros de carga antes que essa informação fosse divulgada publicamente.",
    source: "Interrogatório de Daniel",
    discovered: false,
  },
  {
    id: "daniel-access",
    title: "Acesso à cabine",
    description: "Daniel conhece a rotina e os locais onde Elias guardava documentos, embora diga que não deveria saber disso.",
    source: "Interrogatório de Daniel",
    discovered: false,
  },
  {
    id: "daniel-rope",
    title: "Contradição da corda",
    description: "Daniel nega ter entrado na cabine, mas a investigação da corda coloca alguém com acesso ao convés inferior perto da cabine durante a tempestade.",
    source: "Interrogatório de Daniel",
    discovered: false,
  },
];

function Game() {
  const [view, setView] = useState<View>("cases");
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalTab, setJournalTab] = useState<JournalTab>("clues");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [clues, setClues] = useState<Clue[]>(initialClues);
  const [visitedAreas, setVisitedAreas] = useState<string[]>([]);
  const [interviewTarget, setInterviewTarget] = useState<InterviewTarget | null>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [connections, setConnections] = useState<string[]>([]);
  const [status, setStatus] = useState<GameStatus>("investigating");
  const [endingOpen, setEndingOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.clues)) setClues(parsed.clues);
      if (Array.isArray(parsed.visitedAreas)) setVisitedAreas(parsed.visitedAreas);
      if (Array.isArray(parsed.askedQuestions)) setAskedQuestions(parsed.askedQuestions);
      if (Array.isArray(parsed.connections)) setConnections(parsed.connections);
      if (parsed.status === "solved") setStatus("solved");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        clues, visitedAreas, askedQuestions, connections, status,
      }));
    } catch {}
  }, [clues, visitedAreas, askedQuestions, connections, status]);

  const discoveredCount = clues.filter((clue) => clue.discovered).length;
  const discoveredClues = useMemo(
    () => clues.filter((clue) => clue.discovered),
    [clues],
  );

  function discoverClue(id: string) {
    setClues((current) =>
      current.map((clue) => (clue.id === id ? { ...clue, discovered: true } : clue)),
    );
  }

  function inspect(area: string) {
    setSelectedArea(area);
    setVisitedAreas((current) =>
      current.includes(area) ? current : [...current, area],
    );

    if (area === "Mesa") {
      discoverClue("table-scratch");
      discoverClue("route");
    }
    if (area === "Cordas") discoverClue("wet-rope");
    if (area === "Cama") discoverClue("bed-button");
  }

  function askQuestion(person: InterviewTarget, question: InterviewQuestion) {
    setAskedQuestions((current) => current.includes(person + ":" + question.id) ? current : [...current, person + ":" + question.id]);
    if (question.unlockClue) discoverClue(question.unlockClue);
  }

  function connectEvidence(id: string) {
    setConnections((current) => current.includes(id) ? current : [...current, id]);
  }

  function solveCase() {
    const required = ["storm", "bed-button", "daniel-knowledge", "daniel-access"];
    if (required.every((id) => clues.some((clue) => clue.id === id && clue.discovered))) {
      setStatus("solved");
      setEndingOpen(true);
      return;
    }
    setJournalOpen(true);
    setJournalTab("hypotheses");
  }

  function resetCase() {
    setClues(initialClues);
    setVisitedAreas([]);
    setAskedQuestions([]);
    setConnections([]);
    setStatus("investigating");
    setEndingOpen(false);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  if (view === "investigation") {
    return (
      <InvestigationView
        discoveredCount={discoveredCount}
        clues={discoveredClues}
        selectedArea={selectedArea}
        selectedPerson={selectedPerson}
        visitedAreas={visitedAreas}
        onInspect={inspect}
        onPerson={setSelectedPerson}
        interviewTarget={interviewTarget}
        onInterview={setInterviewTarget}
        askedQuestions={askedQuestions}
        onAskQuestion={askQuestion}
        onBack={() => setView("briefing")}
        onJournal={() => setJournalOpen(true)}
        connections={connections}
        onConnect={connectEvidence}
        status={status}
        onSolve={solveCase}
        onReset={resetCase}
        endingOpen={endingOpen}
      >
        {journalOpen && (
          <Journal
            tab={journalTab}
            setTab={setJournalTab}
            clues={discoveredClues}
            onClose={() => setJournalOpen(false)}
          />
        )}
      </InvestigationView>
    );
  }

  if (view === "briefing") {
    return (
      <BriefingView
        onBack={() => setView("cases")}
        onStart={() => setView("investigation")}
      />
    );
  }

  return <CasesView onOpen={() => setView("briefing")} />;
}

function Shell({
  children,
  eyebrow,
  onJournal,
  showBack,
  onBack,
}: {
  children: React.ReactNode;
  eyebrow: string;
  onJournal?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <main className="veil-shell min-h-screen">
      <header className="veil-header">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            className="veil-brand"
            onClick={onBack}
            aria-label="Voltar"
          >
            {showBack && <ArrowLeft size={17} />}
            <span>VEILØRIS</span>
          </button>
          <div className="veil-eyebrow">{eyebrow}</div>
          {onJournal ? (
            <button className="veil-icon-button" onClick={onJournal} title="Abrir caderno">
              <BookOpen size={19} />
              <span className="hidden sm:inline">CADERNO</span>
            </button>
          ) : (
            <div className="w-10 sm:w-28" />
          )}
        </div>
      </header>
      {children}
    </main>
  );
}

function CasesView({ onOpen }: { onOpen: () => void }) {
  return (
    <Shell eyebrow="ARQUIVOS">
      <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl flex-col px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mb-12 max-w-3xl">
          <p className="veil-kicker">ARQUIVO PRIVADO // INVESTIGADORES VALE & CROWE</p>
          <h1 className="veil-display mt-4">CASOS</h1>
          <p className="veil-lead mt-5">
            Algumas respostas não estão escondidas. Só estão esperando que você
            perceba o que já viu.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
          <button className="case-card case-card-active text-left" onClick={onOpen}>
            <div className="case-art">
              <img
                src="/veilorius-investigation.svg"
                alt="Investigadores procurando uma pista"
              />
              <div className="case-art-overlay" />
              <div className="case-number">CASE 01</div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="veil-kicker">ARQUIVO ABERTO</p>
                  <h2 className="veil-card-title mt-2">O ÚLTIMO TEMPORAL</h2>
                </div>
                <span className="case-status">INVESTIGAÇÃO DISPONÍVEL</span>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--veil-muted)]">
                Um capitão morto. Uma tempestade impossível. Vinte pessoas a
                bordo. E a primeira hipótese parece simples demais.
              </p>
              <div className="mt-7 flex items-center gap-2 text-sm font-semibold tracking-wide text-[var(--veil-paper)]">
                INVESTIGAR <ChevronRight size={17} />
              </div>
            </div>
          </button>

          <div className="case-card case-card-locked">
            <div className="flex items-center gap-3">
              <LockKeyhole size={18} />
              <span>ARQUIVO BLOQUEADO</span>
            </div>
            <h3 className="mt-8 font-serif text-3xl text-[var(--veil-paper)]">
              Caso 02
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--veil-muted)]">
              Este arquivo será desbloqueado posteriormente.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-16 text-xs uppercase tracking-[0.22em] text-[var(--veil-dim)]">
          Observe. Questione. Conecte.
        </div>
      </section>
    </Shell>
  );
}

function BriefingView({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <Shell eyebrow="CASE 01 // BRIEFING" showBack onBack={onBack}>
      <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <p className="veil-kicker">ARQUIVO 01</p>
            <h1 className="veil-display mt-3 max-w-4xl">O ÚLTIMO TEMPORAL</h1>
            <p className="veil-lead mt-5 max-w-2xl">
              Durante uma tempestade violenta, Elias Vane, capitão do navio, é
              encontrado morto dentro de sua cabine.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <BriefStat icon={<Users size={17} />} value="20" label="A bordo" />
              <BriefStat icon={<Clock3 size={17} />} value="~10–18 min" label="Experiência" />
              <BriefStat icon={<ShieldAlert size={17} />} value="7 / 10" label="Dificuldade" />
            </div>

            <div className="veil-paper mt-10 p-6 sm:p-8">
              <p className="veil-kicker">RELATÓRIO INICIAL</p>
              <p className="mt-5 font-serif text-xl leading-9 text-[var(--veil-paper)]">
                “A primeira hipótese aponta para um ataque externo. Mas nenhum
                navio deveria ter conseguido chegar perto durante o temporal.”
              </p>
              <div className="mt-7 border-t border-white/10 pt-5 text-sm leading-7 text-[var(--veil-muted)]">
                Elias vinha investigando discretamente a possibilidade de haver
                um infiltrado entre sua própria tripulação.
              </div>
            </div>
          </div>

          <aside className="veil-side-panel">
            <div className="flex items-center gap-3 text-[var(--veil-paper)]">
              <Skull size={18} />
              <span className="text-xs font-bold tracking-[0.18em]">A VÍTIMA</span>
            </div>
            <h2 className="mt-5 font-serif text-3xl text-[var(--veil-paper)]">Elias Vane</h2>
            <p className="mt-2 text-sm text-[var(--veil-muted)]">Capitão</p>
            <div className="mt-7 space-y-4 text-sm leading-6 text-[var(--veil-muted)]">
              <p>Conhecido por ser extremamente cuidadoso.</p>
              <p>Nas últimas semanas, começou a desconfiar de alguém dentro da tripulação.</p>
            </div>
            <button className="veil-primary-button mt-8 w-full" onClick={onStart}>
              INICIAR INVESTIGAÇÃO <ChevronRight size={17} />
            </button>
          </aside>
        </div>
      </section>
    </Shell>
  );
}

function BriefStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="veil-stat">
      <div className="text-[var(--veil-gold)]">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function InvestigationView({
  children,
  discoveredCount,
  clues,
  selectedArea,
  selectedPerson,
  visitedAreas,
  onInspect,
  onPerson,
  interviewTarget,
  onInterview,
  askedQuestions,
  onAskQuestion,
  onBack,
  onJournal,
  connections,
  onConnect,
  status,
  onSolve,
  onReset,
  endingOpen,
}: {
  children: React.ReactNode;
  discoveredCount: number;
  clues: Clue[];
  selectedArea: string | null;
  selectedPerson: string | null;
  visitedAreas: string[];
  onInspect: (area: string) => void;
  onPerson: (person: string | null) => void;
  interviewTarget: InterviewTarget | null;
  onInterview: (person: InterviewTarget | null) => void;
  askedQuestions: string[];
  onAskQuestion: (person: InterviewTarget, question: InterviewQuestion) => void;
  onBack: () => void;
  onJournal: () => void;
  connections: string[];
  onConnect: (id: string) => void;
  status: GameStatus;
  onSolve: () => void;
  onReset: () => void;
  endingOpen: boolean;
}) {
  const areas = ["Mesa", "Janela", "Porta", "Armário", "Cama", "Cordas"];

  return (
    <Shell eyebrow="CASE 01 // INVESTIGAÇÃO" showBack onBack={onBack} onJournal={onJournal}>
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-5 sm:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="veil-kicker">CABINE DO CAPITÃO</p>
            <h1 className="mt-2 font-serif text-3xl text-[var(--veil-paper)] sm:text-4xl">
              O Último Temporal
            </h1>
          </div>
          <div className="veil-progress">
            <span>PISTAS</span>
            <strong>{discoveredCount}</strong>
            <span>/ 12</span>
          </div>
        </div>

        <div className="investigation-grid">
          <div className="cabin-scene" aria-label="Representação da cabine do capitão">
            <div className="cabin-window">
              <div className="rain-line rain-a" />
              <div className="rain-line rain-b" />
              <div className="rain-line rain-c" />
              <span>O MAR</span>
            </div>
            <div className="cabin-lantern">✦</div>
            <div className="cabin-map">CARTA<br />NÁUTICA</div>
            <div className="cabin-bed" />
            <div className="cabin-table">
              <span className="table-paper" />
              <span className="table-mark" />
            </div>
            <div className="cabin-door" />
            <div className="cabin-rope" />
            <div className="cabin-caption">
              <FileSearch size={15} />
              Observe o ambiente. Nem tudo aqui é o que parece.
            </div>

            {areas.map((area) => (
              <button
                key={area}
                className={"scene-hotspot " + (visitedAreas.includes(area) ? "visited" : "")}
                data-area={area}
                onClick={() => onInspect(area)}
              >
                <span>{area}</span>
              </button>
            ))}
          </div>

          <aside className="investigation-sidebar">
            <div className="veil-sidebar-block">
              <p className="veil-kicker">EVIDÊNCIAS RECENTES</p>
              <div className="mt-4 space-y-3">
                {clues.map((clue) => (
                  <button
                    key={clue.id}
                    className="clue-row text-left"
                    onClick={() => onInspect(clue.source.replace("Cabine do capitão", "Mesa"))}
                  >
                    <Sparkles size={14} />
                    <span>{clue.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="veil-sidebar-block">
              <p className="veil-kicker">PESSOAS A BORDO</p>
              <div className="mt-4 max-h-72 space-y-1 overflow-auto pr-1">
                {crew.map(([name, role]) => (
                  <button
                    key={name}
                    className="person-row"
                    onClick={() => onPerson(name)}
                  >
                    <span>
                      <strong>{name}</strong>
                      <small>{role}</small>
                    </span>
                    {(["Marcus Rook", "Helena Graves", "Tobias Flint", "Rowan Pike", "Daniel Cross"] as string[]).includes(name) ? <MessageSquareText size={14} /> : <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="veil-sidebar-block">
              <p className="veil-kicker">CONECTAR EVIDÊNCIAS</p>
              <div className="mt-4 space-y-2">
                <button
                  className="clue-row text-left"
                  disabled={!clues.some((c) => c.id === "storm") || !clues.some((c) => c.id === "wet-rope")}
                  onClick={() => onConnect("storm+wet-rope")}
                >
                  <Link2 size={14} />
                  <span>Temporal + corda molhada</span>
                </button>
                <button
                  className="clue-row text-left"
                  disabled={!clues.some((c) => c.id === "daniel-knowledge") || !clues.some((c) => c.id === "daniel-access")}
                  onClick={() => onConnect("daniel-knowledge+daniel-access")}
                >
                  <Link2 size={14} />
                  <span>Conhecimento + acesso de Daniel</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-[var(--veil-dim)]">Conexões registradas: {connections.length}</p>
            </div>

            {visitedAreas.length >= 6 && discoveredCount >= 8 && (
              <div className="veil-sidebar-block">
                <p className="veil-kicker">NOTA ENCONTRADA</p>
                <p className="mt-3 font-serif text-sm italic leading-6 text-[var(--veil-paper)]">
                  “Você já viu isso antes. Só não tinha percebido o que significava.”
                </p>
                <small className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-[var(--veil-dim)]">
                  17:42 // arquivo sem assinatura
                </small>
              </div>
            )}

            <div className="veil-sidebar-block">
              <p className="veil-kicker">ADRIAN & SAMUEL</p>
              <p className="mt-3 text-sm leading-6 text-[var(--veil-muted)]">
                Adrian observa a sequência. Samuel pressiona as respostas.
              </p>
              <div className="mt-3 grid gap-2">
                <div className="person-row"><span><strong>Adrian Vale</strong><small>Investigador / analista</small></span></div>
                <div className="person-row"><span><strong>Samuel Crowe</strong><small>Investigador / interrogador</small></span></div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-2 px-4 pb-8 sm:px-8">
        <button className="veil-secondary-button" onClick={onSolve}>
          {status === "solved" ? "CASO RESOLVIDO" : "VERIFICAR HIPÓTESE"}
        </button>
        <button className="veil-secondary-button" onClick={onReset}>REINICIAR CASO</button>
      </div>

      {status === "solved" && (
        <div className="mx-auto mb-8 w-full max-w-7xl px-4 sm:px-8">
          <div className="veil-paper border-l-2 border-[var(--veil-gold)] p-5">
            <p className="veil-kicker">HIPÓTESE CONFIRMADA</p>
            <p className="mt-2 font-serif text-xl text-[var(--veil-paper)]">Daniel Cross é o infiltrado.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--veil-muted)]">Conhecimento indevido + acesso à cabine enfraquecem as versões dos demais e sustentam a conclusão.</p>
          </div>
        </div>
      )}

      {selectedArea && (
        <AreaModal
          area={selectedArea}
          discoveredIds={clues.map((clue) => clue.id)}
          onClose={() => onInspect("")}
        />
      )}
      {selectedPerson && (
        <PersonModal person={selectedPerson} onClose={() => onPerson(null)} onInterview={(person) => { onPerson(null); onInterview(person); }} />
      )}
      {interviewTarget && (
        <InterviewModal person={interviewTarget} askedQuestions={askedQuestions} onAsk={onAskQuestion} onClose={() => onInterview(null)} />
      )}
      {children}
      {endingOpen && <EndingModal onClose={() => setEndingOpen(false)} onReset={onReset} />}
    </Shell>
  );
}

function AreaModal({ area, discoveredIds, onClose }: { area: string; discoveredIds: string[]; onClose: () => void }) {
  const has = (id: string) => discoveredIds.includes(id);
  const content: Record<string, { title: string; text: string; note: string }> = {
    Mesa: {
      title: "A mesa",
      text: has("daniel-knowledge")
        ? "A superfície está coberta por cartas e registros. Depois do interrogatório, fica claro que Daniel conhecia uma investigação que Elias mantinha discreta."
        : "A superfície está coberta por cartas náuticas e documentos. Um risco recente corta a madeira. Uma das cartas parece ter sido alterada.",
      note: has("route")
        ? "A rota alterada explica uma mentira de Helena, mas não explica a morte."
        : "A carta deve ser revisitada depois que outros depoimentos forem comparados.",
    },
    Cordas: {
      title: "As cordas",
      text: "Uma corda molhada repousa perto do armário. O interior do navio não deveria estar molhado assim.",
      note: "Pista registrada: Corda molhada.",
    },
    Janela: {
      title: "A janela",
      text: has("storm")
        ? "A chuva golpeia o vidro. O mar está impraticável. A tempestade torna a aproximação de outro navio extremamente improvável."
        : "A chuva golpeia o vidro. Lá fora, o mar é quase impossível de enxergar através da tempestade.",
      note: has("wet-rope")
        ? "Com a corda molhada, a investigação passa a considerar movimentação interna no navio."
        : "Volte aqui depois de examinar as cordas.",
    },
    Porta: {
      title: "A porta",
      text: "Não há sinais claros de arrombamento. A fechadura parece intacta.",
      note: "A hipótese de uma invasão externa começa a exigir mais evidências.",
    },
    Armário: {
      title: "O armário",
      text: "Ferramentas, documentos e objetos pessoais estão organizados com cuidado. Algo parece ter sido retirado recentemente.",
      note: "Ainda não há informação suficiente para concluir o que desapareceu.",
    },
    Cama: {
      title: "A cama",
      text: has("bed-button")
        ? "A cama está parcialmente desarrumada. O botão preso no tecido não combina com os uniformes dos quatro suspeitos iniciais."
        : "A cama está parcialmente desarrumada. Um pequeno botão está preso no tecido.",
      note: has("daniel-access")
        ? "Depois de descobrir o acesso de Daniel, o botão deixa de parecer um detalhe casual."
        : "Revisite esta área depois de descobrir quem conhecia a rotina da cabine.",
    },
  };

  const item = content[area] ?? content.Mesa;

  return (
    <div className="veil-modal-backdrop" onClick={onClose}>
      <div className="veil-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <p className="veil-kicker">OBSERVAÇÃO</p>
        <h2 className="mt-3 font-serif text-3xl text-[var(--veil-paper)]">{item.title}</h2>
        <p className="mt-5 text-base leading-8 text-[var(--veil-muted)]">{item.text}</p>
        <div className="mt-6 border-l-2 border-[var(--veil-gold)] pl-4 text-sm leading-6 text-[var(--veil-paper)]">
          {item.note}
        </div>
        <button className="veil-secondary-button mt-8" onClick={onClose}>
          VOLTAR À INVESTIGAÇÃO
        </button>
      </div>
    </div>
  );
}

function PersonModal({ person, onClose, onInterview }: { person: string; onClose: () => void; onInterview: (person: InterviewTarget) => void }) {
  const entry = crew.find(([name]) => name === person);
  return (
    <div className="veil-modal-backdrop" onClick={onClose}>
      <div className="veil-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <p className="veil-kicker">TRIPULAÇÃO</p>
        <h2 className="mt-3 font-serif text-3xl text-[var(--veil-paper)]">{person}</h2>
        <p className="mt-2 text-sm text-[var(--veil-gold)]">{entry?.[1]}</p>
        <p className="mt-6 text-base leading-8 text-[var(--veil-muted)]">
          Você ainda não sabe o suficiente sobre esta pessoa. Isso não significa
          que ela seja inocente — apenas que a investigação ainda não terminou.
        </p>
        {(["Marcus Rook", "Helena Graves", "Tobias Flint", "Rowan Pike", "Daniel Cross"] as string[]).includes(person) && (
          <button className="veil-primary-button mt-7 w-full" onClick={() => onInterview(person as InterviewTarget)}>
            INTERROGAR <MessageSquareText size={16} />
          </button>
        )}
        <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--veil-dim)]">
          <MessageSquareText size={14} />
          Novos diálogos serão desbloqueados conforme as pistas forem conectadas.
        </div>
      </div>
    </div>
  );
}

function InterviewModal({ person, askedQuestions, onAsk, onClose }: { person: InterviewTarget; askedQuestions: string[]; onAsk: (person: InterviewTarget, question: InterviewQuestion) => void; onClose: () => void }) {
  const interview = interviews[person];
  return (
    <div className="veil-modal-backdrop" onClick={onClose}>
      <div className="veil-modal interview-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        <p className="veil-kicker">INTERROGATÓRIO // SAMUEL CROWE</p>
        <h2 className="mt-3 font-serif text-3xl text-[var(--veil-paper)]">{person}</h2>
        <p className="mt-1 text-sm text-[var(--veil-gold)]">{interview.role}</p>
        <p className="mt-5 border-l-2 border-[var(--veil-gold)] pl-4 text-sm leading-7 text-[var(--veil-muted)]">{interview.summary}</p>
        <div className="mt-7 space-y-2">
          {interview.questions.filter((question) => !question.requires || question.requires.every((required) => askedQuestions.includes(person + ":" + required))).map((question) => {
            const key = person + ":" + question.id;
            const asked = askedQuestions.includes(key);
            return (
              <div key={question.id} className="interview-question">
                <button className="question-button" onClick={() => onAsk(person, question)}>
                  <span>{question.label}</span>
                  <ChevronRight size={15} />
                </button>
                {asked && (
                  <div className="interview-response">
                    <span className="response-speaker">{person}</span>
                    <p>{question.response}</p>
                    {question.unlockClue && <small>Nova informação registrada no caderno.</small>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button className="veil-secondary-button mt-7" onClick={onClose}>ENCERRAR INTERROGATÓRIO</button>
      </div>
    </div>
  );
}

function Journal({
  tab,
  setTab,
  clues,
  onClose,
}: {
  tab: JournalTab;
  setTab: (tab: JournalTab) => void;
  clues: Clue[];
  onClose: () => void;
}) {
  return (
    <div className="veil-modal-backdrop" onClick={onClose}>
      <div className="veil-journal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-[var(--veil-gold)]" />
          <div>
            <p className="veil-kicker">CADERNO DE INVESTIGAÇÃO</p>
            <h2 className="mt-1 font-serif text-3xl text-[var(--veil-paper)]">Anotações</h2>
          </div>
        </div>

        <div className="journal-tabs">
          {([
            ["clues", "Pistas"],
            ["suspects", "Suspeitos"],
            ["contradictions", "Contradições"],
            ["hypotheses", "Hipóteses"],
            ["timeline", "Linha do tempo"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "clues" && (
          <div className="journal-list">
            {clues.map((clue) => (
              <article key={clue.id} className="journal-entry">
                <span className="journal-index">01</span>
                <div>
                  <h3>{clue.title}</h3>
                  <p>{clue.description}</p>
                  <small>{clue.source}</small>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "suspects" && (
          <div className="journal-list">
            {[
              ["Marcus Rook", "Primeiro imediato", "Discutiu seriamente com Elias."],
              ["Helena Graves", "Navegadora", "A rota apresenta inconsistências."],
              ["Tobias Flint", "Cozinheiro", "Existem problemas nos horários."],
              ["Rowan Pike", "Contramestre", "Foi visto onde não deveria estar."],
            ].map(([name, role, note], index) => (
              <article key={name} className="journal-entry">
                <span className="journal-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{name}</h3>
                  <small>{role}</small>
                  <p>{note}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "contradictions" && (
          <div className="journal-list">
            {[
              ["storm", "Ataque externo", "A tempestade e a ausência de arrombamento enfraquecem a hipótese externa."],
              ["route", "Helena Graves", "A rota alterada prova uma mentira, mas não prova o assassinato."],
              ["daniel-knowledge", "Daniel Cross", "Daniel sabia que Elias investigava os registros antes de isso ser divulgado."],
              ["daniel-access", "Daniel Cross", "Daniel conhece a rotina da cabine apesar de negar motivo para isso."],
            ].map(([id, title, text], index) => (
              <article key={id} className="journal-entry">
                <span className="journal-index">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{text}</p><small>{clues.some((clue) => clue.id === id) ? "Pista registrada" : "Aguardando evidência"}</small></div>
              </article>
            ))}
          </div>
        )}

        {tab === "hypotheses" && (
          <div className="journal-list">
            {[
              ["Ataque externo", "Hipótese enfraquecida", "O temporal torna a aproximação externa improvável."],
              ["Alguém dentro do navio", "Em investigação", "As evidências agora apontam para dentro."],
              ["Responsável tinha acesso à cabine", "Em investigação", "Acesso e rotina da cabine são centrais."],
              ["Daniel Cross é o infiltrado", clues.some((c) => c.id === "daniel-access") ? "Hipótese fortalecida" : "Em investigação", "Conhecimento indevido + acesso formam a linha principal de investigação."],
            ].map(([title, state, text], index) => (
              <article key={title} className="journal-entry">
                <span className="journal-index">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><small>{state}</small><p>{text}</p></div>
              </article>
            ))}
          </div>
        )}

        {tab === "timeline" && (
          <div className="journal-list">
            {[
              ["16:40", "Tempestade começa a se formar."],
              ["17:05", "Capitão conversa com alguém."],
              ["17:30", "Tempestade aumenta."],
              ["17:42", "Algo acontece na cabine."],
              ["17:54", "Momento provável da morte."],
              ["18:10", "Corpo encontrado."],
            ].map(([time, event]) => (
              <article key={time} className="timeline-entry">
                <strong>{time}</strong>
                <span>{event}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EndingModal({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  return (
    <div className="veil-modal-backdrop" onClick={onClose}>
      <div className="veil-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        <p className="veil-kicker">CASE 01 // CONCLUSÃO</p>
        <h2 className="mt-3 font-serif text-4xl text-[var(--veil-paper)]">O Último Temporal</h2>
        <p className="mt-6 text-base leading-8 text-[var(--veil-muted)]">
          A investigação descarta o ataque externo e separa as mentiras dos quatro suspeitos iniciais de uma intenção homicida.
        </p>
        <div className="mt-7 border-l-2 border-[var(--veil-gold)] pl-4">
          <p className="font-serif text-xl text-[var(--veil-paper)]">Daniel Cross — o infiltrado.</p>
          <p className="mt-2 text-sm leading-7 text-[var(--veil-muted)]">
            A conclusão nasce da combinação entre conhecimento que ele não deveria possuir, acesso à cabine e os detalhes encontrados na cena.
          </p>
        </div>
        <p className="mt-6 text-sm leading-7 text-[var(--veil-muted)]">
          A hipótese é confirmada pela lógica apresentada ao jogador, não por uma revelação externa à investigação.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <button className="veil-primary-button" onClick={onClose}>VOLTAR AO CADERNO</button>
          <button className="veil-secondary-button" onClick={onReset}>RECOMEÇAR CASO</button>
        </div>
      </div>
    </div>
  );
}
