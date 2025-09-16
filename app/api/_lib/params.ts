// app/api/_lib/params.ts
export type RouteCtx<T> = { params: T } | { params: Promise<T> }

export async function unwrapParams<T>(ctx: RouteCtx<T>): Promise<T> {
  const p: any = (ctx as any).params
  return typeof p?.then === 'function' ? await p : p
}
