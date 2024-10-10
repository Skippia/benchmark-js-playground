import { spawn } from 'node:child_process'
import cluster from 'node:cluster'
import process from 'node:process'

import type { THostEnvironment, TTransportTypeUnion, TUsecaseTypeUnion } from '@shared/types'

/**
 * @description GS for master process in child process
 */
export const configureCascadeChildGracefulShutdown = () => {
  const signals = ['SIGINT', 'SIGTERM'] as const

  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`Master process of server received ${signal}. Sending ${signal} to all workers (amount = ${(Object.keys(cluster.workers || ({} as NodeJS.Dict<Worker>))).length}). `)

      // Send SIGINT to all workers
      for (const id in cluster.workers) {
        if (cluster.workers[id]) {
          process.kill(cluster.workers[id].process.pid as number, signal)
        }
      }
    })
  })
}

export const runServerInChildProcess = (
  hostEnvironment: THostEnvironment,
  transport: TTransportTypeUnion,
  usecase: TUsecaseTypeUnion,
  cores: number,
) => {
  const childProcess = spawn(hostEnvironment, [
    './dist/server/main.js',
    '-t',
    transport,
    '-u',
    usecase,
    '-cores',
    String(cores),
  ], {
    detached: true,
  })

  console.log('Spawn new child process:', childProcess.pid)

  return childProcess
}
