import { serve } from 'bun'
import type { Server } from 'bun'

import { AbstractTransport } from '../abstract-transport'
import type { Mediator } from '../mediator'

export type BunContextProperties = {
  server: Server
}

export class BunTransport<T extends BunContextProperties> extends AbstractTransport<T> {
  private port: number

  constructor(port: number, mediator: Mediator<T>) {
    super(mediator)
    this.port = port
  }

  async run(): Promise<void> {
    this.mediator.context = await this.initBeforeServer()

    const handleRequest = this.mediator.buildHandleRequestWrapper<Request, Response>(req => req.json())

    this.mediator.context.server = serve({
      port: this.port,
      fetch: async (req: Request) => {
        const url = new URL(req.url)
        const method = req.method

        if (this.mediator.targetMethod === method && this.mediator.targetPath === url.pathname) {
          const result = await handleRequest({ req })

          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
        throw new Error('Endpoint not found')
      },
    })

    console.log(`Bun server running on http://localhost:${this.port}`)

    this.gracefulShutdown(() => this.mediator.context.server.stop())
  }
}
