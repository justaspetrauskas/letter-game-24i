# Letter Game

A falling-letters reaction game. Letters drop down the screen and you clear them by pressing
their key — but only while **two or more of the same letter** are on screen at once. A lone
letter can't be cleared, so it's as much about reading the board as reacting fast. Tiles that
are ready to clear get a white outline.

Let twenty letters hit the floor and it's over.

## Running it

```bash
npm install
```

```bash
npm run dev
```

That serves the client on [http://localhost:3000](http://localhost:3000).

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server for the client |
| `npm run dev:server` | Node API server on port 4000 |
| `npm test` | Vitest across every workspace |
| `npm run typecheck` | `tsc --noEmit` across every workspace |
| `npm run build` | Production build |

## Layout

```
packages/
  engine/     the game itself — pure TypeScript, no React, no DOM
  protocol/   socket contract + config validation, shared by both ends
  client/     Vite + React + Konva, renders engine state
  server/     Fastify + socket.io, runs the same engine headlessly
```

Client and server follow the same layout rule: one folder per thing, named after the thing, with
its test and notes sitting beside it. No barrel files — every import names the file it came from,
so a jump-to-definition lands somewhere identifiable rather than in a wall of `index.ts`.

```
client/src/components/Room/Room.tsx      server/src/rooms/rooms.ts
client/src/components/Room/…             server/src/rooms/rooms.test.ts
                                         server/src/rooms/rooms.notes.md
```

Both packages resolve `@/` to their own `src`, so imports read the same on either side.

The interesting part is that `packages/engine` has no idea the other two exist. It's a pure,
deterministic, JSON-serializable simulation:

```ts
const game = createGame(seed);
const next = step(game);        // advances exactly 1/60s
const scored = pressKey(next, "a");
```

Because it's seeded, the same seed always produces the same sequence of letters — on any
machine, in any process. `packages/server` imports the identical module and runs it headlessly,
which is what makes fair multiplayer and replays possible later.

Rendering is a pure function of that state. There are no timers in the components and no
tweens; the pop-in and fade animations are derived from the engine's own clock, so pausing the
simulation pauses the animation exactly.

## Rooms

Start the server alongside the client and you can share a room:

```bash
npm run dev:server
```

One player creates a room and gets a four-character code; anyone entering that code joins and
is handed **the same seed**, so every player's letters fall in exactly the same order. The
player list updates live as people come and go, and the host passes to the next player if they
leave.

Everyone plays their own board, and the sidebar becomes a live scoreboard — score and lives for
each player, reordered as you overtake each other. Since the letters are identical for everyone,
the standings are a fair comparison rather than a curiosity.

Scores are reported by the client, so they're forgeable by anyone willing to open a console. The
server clamps them into sane ranges, which stops a garbage value breaking the display, but it
does not make them trustworthy. Fine for playing with friends; not fine for a leaderboard.

### Attacks

Clear four or more letters at once and you throw junk letters at everyone else in the room — one
per letter above the threshold, capped at five. They arrive red and dashed, fall faster than
normal, and cost a life if you let them land. Big clears stop being just points and become a
weapon.

The subtle part: junk draws from a **separate RNG stream**. If it shared the main one, a single
attack would permanently desync that player's letters from everyone else's, and the shared seed —
the whole reason the scores are comparable — would be worthless the moment anyone landed a hit.
With a second stream, everyone still gets an identical base sequence and junk is strictly extra
on top. Junk also doesn't count toward levelling, so being attacked can't shove you up a level.

Attacks arriving while you're paused wait rather than being dropped, so pausing to dodge doesn't
work.

Anything a client sends as round config is clamped by `sanitiseGameConfig` before it reaches
the engine. A room's config is handed to everyone in it, so an empty letter pool or a
`minMatch` of 50 would otherwise break the game for the whole room.

## Themed rounds

Give the server an Anthropic API key and you can type a theme — "deep ocean", "volcano",
"library" — and get a round built around it: a letter pool drawn from words on that theme, plus
difficulty tuned to its mood.

Copy `.env.example` to `.env` and put your key in it:

```bash
cp .env.example .env
```

Without a key the rest of the game works exactly as before and the panel just says so. The key
lives only on the server; the browser never sees it.

Anything the model returns is clamped by the same `sanitiseGameConfig` that guards untrusted
socket clients, because a generated round is just a `Partial<GameConfig>` and an empty letter
pool or a `minMatch` of 50 would break the game. Generation is rate-limited to five requests a
minute per IP and cached for an hour per theme — it costs money per call, so don't expose the
endpoint publicly without adding auth.

Both AI features pick their model from `.env`, and the defaults lean cheap:

| Variable | Default | Why |
| --- | --- | --- |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | Round generation is rare — rate-limited and cached an hour — so quality matters more than cost |
| `ANTHROPIC_COMMENTARY_MODEL` | `claude-haiku-4-5` | The rival fires all game long for twelve words a time |

These aren't interchangeable strings: models differ in which request fields they accept, and
sending an unsupported one is an error, not a shrug. Haiku 4.5 rejects the `effort` parameter
that the Opus and Sonnet 5 models take. `modelProfile()` on the server works out what each model
supports and builds the request to match, so switching model in `.env` actually works. Point one
at something unrecognised and it still runs, just without effort control.

## The rival

With the same key, a rival watches you play and comments — dry, competitive, faintly smug. It
only speaks when something actually happened: a big clear, a level up, a run of misses, panic
mashing, or the mistake it enjoys most, letting a letter drop while another copy of it was still
falling. Otherwise it says nothing. There's a mute button.

The restraint is the feature. Three gates decide whether a line gets generated at all — a
five-second window, a "was any of that worth mentioning" check, and a seven-second floor between
lines — so the rival stays a presence rather than a running narration, and you aren't billed for
silence. The same check runs on both the client and the server, so a modified client can't make
it chatty.

`ANTHROPIC_COMMENTARY_MODEL` sets the rival's model separately, since it fires far more often
than round generation.

## Rounds

Rounds are just config, so new ones are a few lines in `packages/engine/src/config.ts`:

- **Home row** — `asdfghjkl`
- **Vowels** — `aeiou`
- **Alphabet** — all 26
- **Triples** — needs three matching letters, not two
- **Sprint** — ten lives, everything faster
