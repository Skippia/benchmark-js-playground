import process from 'node:process'

import Fastify from 'fastify'
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify'

import { AbstractTransport } from '../abstract-transport'
import type { Mediator } from '../mediator'

export type FastifyContextProperties = {
  server: FastifyInstance
}

export class FastifyTransport<T extends FastifyContextProperties> extends AbstractTransport<T> {
  private port: number

  constructor(port: number, mediator: Mediator<T>) {
    super(mediator)
    this.port = port
  }

  async run(): Promise<void> {
    const fastify = Fastify({ logger: false })

    this.mediator.context = await this.initBeforeServer()

    this.mediator.context.server = fastify

    const handleRequest = this.mediator.buildHandleRequestWrapper<FastifyRequest, FastifyReply>(req => req.body)

    if (this.mediator.targetMethod === 'POST') {
      fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
        try {
          const json = JSON.parse(body as string)
          done(null, json)
        }
        catch (err) {
          (err as FastifyError).statusCode = 500
          done(err as FastifyError, undefined)
        }
      })
    }
    // @ts-expect-error impossible to describe types
    // eslint-disable-next-line ts/no-unsafe-call
    fastify[this.mediator.targetMethod.toLowerCase()](this.mediator.targetPath, (async (req, reply) => {
      try {
        const result = await handleRequest({ req, res: reply })
        reply.send(result)
      }
      catch (err) {
        reply.code(500).send(err)
      }
    }) as RouteHandlerMethod)

    fastify.listen({ port: this.port }, (err) => {
      if (err) {
        process.exit(1)
      }

      console.log(`Fastify server running on http://localhost:${this.port}`)
    })

    this.gracefulShutdown(() => this.mediator.context.server.close(),
    )
  }
}
