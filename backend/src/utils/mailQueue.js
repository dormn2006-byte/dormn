// A tiny in-process mail queue.
//
// Why: Brevo (like every provider) rate-limits and will start rejecting — or
// temporarily blocking the account — if a traffic spike fires hundreds of
// parallel API calls. Instead of dispatching every email the instant a request
// hits, tasks are paced through a fixed number of workers with a minimum gap
// between dispatches.
//
// Guarantees:
//   * bounded concurrency  — at most `concurrency` sends in flight
//   * paced dispatch       — at least `minIntervalMs` between send starts
//   * bounded memory       — once `maxSize` tasks are waiting, new tasks are
//                            rejected instead of piling up until the process OOMs
//   * never rejects        — a task that throws resolves to `{ ok: false }`, so
//                            fire-and-forget callers can't cause unhandled
//                            rejections (and a single bad email can't crash the app)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const positiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const createMailQueue = ({
  concurrency = 3,
  minIntervalMs = 120,
  maxSize = 5000,
  logger = console,
} = {}) => {
  const limit = positiveInt(concurrency, 3);
  const interval = Math.max(0, Number(minIntervalMs) || 0);
  const capacity = positiveInt(maxSize, 5000);

  const waiting = [];
  let active = 0;
  let nextSlotAt = 0;
  let gate = Promise.resolve();
  const stats = { queued: 0, active: 0, sent: 0, failed: 0, dropped: 0, total: 0 };

  const sync = () => {
    stats.queued = waiting.length;
    stats.active = active;
  };

  // Reservations run through a single chain so dispatch starts stay in order and
  // at least `interval` apart, even when several workers are ready at once.
  const reserveSlot = () => {
    const turn = gate.then(async () => {
      const wait = Math.max(0, nextSlotAt - Date.now());
      if (wait > 0) await sleep(wait);
      nextSlotAt = Date.now() + interval;
    });
    gate = turn.catch(() => {});
    return turn;
  };

  const run = async (item) => {
    try {
      await reserveSlot();
      const result = await item.task();
      if (result && result.ok === false) stats.failed += 1;
      else stats.sent += 1;
      item.resolve(result);
    } catch (error) {
      stats.failed += 1;
      item.resolve({ ok: false, error: error?.message || String(error) });
    } finally {
      active -= 1;
      sync();
      drain();
    }
  };

  function drain() {
    while (active < limit && waiting.length) {
      active += 1;
      sync();
      run(waiting.shift());
    }
  }

  /** Queues `task` and resolves with its result — never rejects. */
  const enqueue = (task) => {
    stats.total += 1;

    return new Promise((resolve) => {
      if (waiting.length >= capacity) {
        stats.dropped += 1;
        logger.warn?.(
          `[MailQueue] ⚠️ Queue is full (${capacity}); dropping an email task to protect the server.`
        );
        resolve({ ok: false, error: "mail_queue_full" });
        return;
      }

      waiting.push({ task, resolve });
      sync();
      drain();
    });
  };

  const snapshot = () => ({ ...stats, concurrency: limit, minIntervalMs: interval });

  /** True once every queued/in-flight task has settled. */
  const idle = () => active === 0 && waiting.length === 0;

  return { enqueue, snapshot, idle };
};
