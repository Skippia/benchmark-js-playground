import type { TTransportTypeUnion } from '@shared/types'

type TContext<T extends Record<string, unknown> = {}> = Record<string, unknown> & T

type THooks = {
  onInit?: (callbacks?: TFunction[]) => Promise<TContext> | TContext
  onRequest?: <TReq>(req: TReq) => Promise<void>
  onFinish?: <TRes>(res: TRes) => Promise<void>
  onClose: () => Promise<void> | void
}

type TFunction = (...args: any[]) => unknown
type TRunFn = (_payload?: unknown, _context?: TContext) => Promise<unknown>

 type TUsecaseBuilder = {
   hooks: THooks
   run: TRunFn
 }

type TMediatorProperties = {
  transport: TTransportTypeUnion
  targetMethod: 'GET' | 'POST'
  targetPath: string
  hooks: THooks
  run: TRunFn
}

export type {
  TContext,
  TFunction,
  THooks,
  TMediatorProperties,
  TRunFn,
  TUsecaseBuilder,
}
