export function wait(delay: number): Promise<void> {
    return new Promise((r) => setTimeout(r, delay));
}