import process from 'node:process'
import type { TContext } from '../misc/types'
import type { Mediator } from './mediator'

export abstract class AbstractTransport<T extends Record<string, unknown> = {}> {
  constructor(readonly mediator: Mediator<T>) {}
  /**
   * @description Start app
   */
  abstract run(): void
  /**
   * @description Initialize context, run callbacks
   * before HTTP server will be initialized.
   */
  async initBeforeServer(callbacks?: Function[]): Promise<TContext<T>> {
    return (await this.mediator.runHook('onInit', [() => {
      console.log(`[${this.mediator.transport}] expects [${this.mediator.targetMethod}]: ${this.mediator.targetPath}`)
    }, ...(callbacks || [])])) as TContext<T>
  }

  /**
   * @description Invoke logic related with graceful shutdown,
   * f.e close sockets, connections etc.
   * After it HTTP server will be stopped.
   */
  gracefulShutdown(closeServerCallback: () => Promise<void> | void, callbacks?: Function[]) {
    console.log('[Hook]:', 'Configurate graceful shutdown...')

    process.on('SIGINT', async () => {
      // ('ctrl + c')
      console.log('[Hook][Child]: intercept SIGINT')

      this.mediator.runHook('onClose')
      callbacks?.forEach(c => c())
      await closeServerCallback()

      console.log('[Hook][Child]: terminate process with code', 0)
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('[Hook][Child]: intercept SIGTERM')

      this.mediator.runHook('onClose')
      callbacks?.forEach(c => c())
      await closeServerCallback()

      console.log('[Hook][Child]: terminate process with code', 1)
      process.exit(1)
    })
  }
}
