/**
 * A single shared one-second ticker. Components subscribe through `useNow`
 * instead of each creating their own interval.
 */

const listeners = new Set();
let now = Math.floor(Date.now() / 1000);
let timer = null;

function tick() {
  now = Math.floor(Date.now() / 1000);
  listeners.forEach((fn) => fn());
}

export function subscribeTicker(fn) {
  listeners.add(fn);
  if (!timer) timer = setInterval(tick, 1000);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function getNow() {
  return now;
}
