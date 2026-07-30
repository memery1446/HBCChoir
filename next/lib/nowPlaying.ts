/**
 * One song at a time. Each player registers a pause callback; whoever
 * starts playing evicts the previous one.
 */
let current: (() => void) | null = null;

export function claim(pause: () => void) {
    if (current && current !== pause) current();
    current = pause;
}

export function release(pause: () => void) {
    if (current === pause) current = null;
}
