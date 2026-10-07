# VEILØRIS — Habilidades dos personagens

## Regra visual de desenvolvimento
Toda habilidade nova, correção ou mudança importante deve ser descrita com um exemplo visual de bloco de notas antes/depois da implementação.

---

## JUGO

### A — LANÇA CELESTIAL
Avanço rápido com a lança, dano e empurrão.

```text
👤⚔️  ───────────────→  💥👤
       ⚡⚡⚡⚡⚡
```

### B — ÓRBITA DEVASTADORA
Seis esferas saem da órbita e atacam em sequência.

```text
          🟣
           ↘
🟣 ─────→ 👤 ←──── 🟣
           ↗
          🟣
```

### C — SEIS ESFERAS: COLAPSO CÓSMICO
As seis esferas convergem para o alvo e Jugo finaliza com a lança.

```text
              🟣
       🟣           🟣
               👤
       🟣           🟣
              🟣
                 ↓
                💥
```

---

## ECRONIX

### A — GARRAS DO ESCORPIÃO
Avanço agressivo com golpe de curto alcance.

```text
👹🦂  ───────→  💥👤
       ⚔️
```

### B — ESFERAS DO CAOS
Três esferas de caos são lançadas em sequência curta.

```text
          🟣
           ↘
👹  ───────→  🟣 ───→ 💥👤
```

### C — FORMA FINAL ECRONIX
Transforma-se na forma final e recebe aumento de pressão/dano durante a Ultimate.

```text
👹
 ↓
🩸⚔️🐒
 ↓
💥👤
```

---

## KAIRA

### A — LANÇA DE GELO
Investida curta com a lança.

```text
👩⚔️  ───────→  💥👤
```

### B — DISPARO PRECISO
Disparo de rifle rápido e de longo alcance.

```text
👩🔫  ─────────────────────→  🎯👤
                         💥
```

### C — CAÇADORA DE DOIS MUNDOS
Kaira entra na forma besta durante a Ultimate e executa uma investida.

```text
👩🔫  ─────→  🎯👤
 ↓
🐺❄️  ─────────→  💥👤
```

---

## ARQUEIRO

A identidade existente continua sendo a de zoner de longa distância.

### Ultimate A — RAJADA
Cinco flechas, uma depois da outra.

```text
🏹 → 🏹 → 🏹 → 🏹 → 🏹
```

### Ultimate B — PERFURAÇÃO
Uma flecha normal viaja até perto do Jugo, divide-se em duas, fica presa por 0,5 s e explode.

```text
🏹 ─────────────────→ 👤
                       ↓
                     🏹
                       👤
                     🏹
                       ↓
                      💥
```

A IA escolhe A/B e o jogador não escolhe a Ultimate.

---

## Implementação atual

- Jugo, Ecronix e Kaira estão disponíveis na seleção de personagem.
- Arqueiro, Ecronix e Kaira estão disponíveis na seleção de oponente.
- Cada personagem tem nome e rótulos A/B/C dinâmicos no HUD.
- Ecronix e Kaira possuem IA básica própria quando selecionados como oponente.
- Os novos personagens usam arte vetorial temporária no repositório; ela pode ser substituída posteriormente pelas artes finais sem alterar o sistema de habilidades.
