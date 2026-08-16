export type {
  GameConfig,
  GameEvent,
  GameState,
  GameStatus,
  LetterKind,
  LetterState,
  LetterStatus,
} from "./types";

export type { Rng } from "./rng";

export {
  cloneRng,
  createRng,
  nextFloat,
  nextInt,
  nextRange,
  pickChar,
  randomSeed,
} from "./rng";

export {
  JUNK_SEED_OFFSET,
  MAX_CATCHUP_STEPS,
  MAX_PENDING_JUNK,
  STEP_MS,
  defaultConfig,
  resolveConfig,
  roundPresets,
} from "./config";

export {
  attackSizeFor,
  countMatchesOnScreen,
  createGame,
  drainEvents,
  hasClearableMatch,
  pauseGame,
  pressKey,
  queueJunk,
  scoreFor,
  step,
  stepMany,
  togglePause,
} from "./engine";
