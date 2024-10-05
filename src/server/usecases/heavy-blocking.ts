import type { TContext, THooks } from '../misc/types'

function heavyBlockingTask() {
  let sum = 0

  for (let i = 0; i < 1e8; i++) {
    sum += i
  }

  return sum
}

export const hooks: THooks = {
  async onInit(callbacks?: Function[]): Promise<TContext> {
    const context = {}
    console.log('[Hook][onInit]: Initializing context...')

    callbacks?.forEach(c => c())

    return context
  },
  // async onRequest(_req: Request): Promise<void> {
  //   console.log('[Hook][onRequest]: Request received...')
  // },

  // async onFinish(_res: Response): Promise<void> {
  //   console.log('[Hook][onFinish]: Finishing response...')
  // },

  async onClose(): Promise<void> {
    console.log('[Hook][onClose]: Close server...')
  },
}

export async function run(
  _payload: unknown,
  _context: TContext,
): Promise<unknown> {
  return heavyBlockingTask()
}
