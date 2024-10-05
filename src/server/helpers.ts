import cluster from 'node:cluster'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { getFlagValue } from '../benchmarks/utils'
import type { THostEnvironment, TTransportTypeUnion, TUsecaseTypeUnion } from './types'
import type { ServerProcessManager } from './server-process-manager'

/**
 * @description GS for parent process
 */
export const configureCascadeMasterGracefulShutdown = (childProcessManagerRef: { value: ServerProcessManager | null }) => {
  const signals = ['SIGINT', 'SIGTERM'] as const

  signals.forEach((signal) => {
    process.on(signal, () => {
      const exitCode = signal === 'SIGTERM' ? 1 : 0

      if (childProcessManagerRef.value?.isRunning) {
        childProcessManagerRef.value?.childProcess!.on('close', () => {
          process.exit(exitCode)
        })

        childProcessManagerRef.value.stop(signal)
      }
      else {
        console.log('No child process running. Exiting parent process.')
        process.exit(exitCode)
      }
    })
  })
}

/**
 * @description GS for master process in child process
 */
export const configureCascadeChildGracefulShutdown = () => {
  const signals = ['SIGINT', 'SIGTERM'] as const

  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`Master process of server received ${signal}. Sending ${signal} to all workers (amount = ${cluster.workers?.length || 0}). `)

      // Send SIGINT to all workers
      for (const id in cluster.workers) {
        if (cluster.workers[id]) {
          cluster.workers[id].process.kill(signal)
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
