/** Retry reads once before surfacing a connection problem. Never replay writes. */
export async function retryRead<T>(read: () => Promise<T>, current: () => boolean = () => true): Promise<T> {
  try { return await read(); }
  catch (firstFailure) {
    await new Promise(resolve => setTimeout(resolve, 900));
    if (!current()) throw firstFailure;
    return read();
  }
}
