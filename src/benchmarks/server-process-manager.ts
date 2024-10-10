import type { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import process from 'node:process'

import type { THostEnvironment, TTransportTypeUnion, TUsecaseTypeUnion } from '@shared/types'

class ServerProcessManager {
  childProcess: ChildProcessWithoutNullStreams | null = null
  private readonly hostEnvironment: THostEnvironment

  constructor(
    private readonly transport: TTransportTypeUnion,
    private readonly usecase: TUsecaseTypeUnion,
    private readonly cores: number,
  ) {
    this.hostEnvironment = transport === 'bun' ? 'bun' : 'node'
  }

  get isRunning() {
    return Boolean(this.childProcess?.pid && !this.childProcess.killed)
  }

  start(): Promise<ChildProcessWithoutNullStreams> {
    if (this.childProcess) {
      return Promise.resolve(this.childProcess)
    }

    return new Promise((resolve) => {
      this.childProcess = spawn(this.hostEnvironment, [
        './dist/server/main.js',
        '-t',
        this.transport,
        '-u',
        this.usecase,
        '-cores',
        String(this.cores),
      ], {
        detached: true,
      })

      this.childProcess.stdout.on('data', (data: Buffer) => {
        const stdoutInfo = data.toString()

        if (!stdoutInfo.startsWith('[Hook]')) console.log(stdoutInfo)

        if (stdoutInfo.includes('server running on')) {
          resolve(this.childProcess as ChildProcessWithoutNullStreams)
        }
      })

      this.childProcess.stderr.on('data', (data: Buffer) => {
        console.error('stderr', data.toString())
      })

      this.childProcess.on('close', (code) => {
        console.log(`Child process exited with code ${code}`)
        this.childProcess = null
      })
    })
  }

  /**
   * @description Carefully stops the process
   */
  stop(signal: NodeJS.Signals) {
    if (this.isRunning) {
      const pid = (this.childProcess as ChildProcessWithoutNullStreams).pid
      console.log(`Kill child process with pid=${pid}`)
      // Kill this process
      process.kill(pid as number, signal)
    }
    else {
      console.log('No child process to stop.')
    }
  }

  on(...args: Parameters<typeof process.on>) {
    this.childProcess?.on(args[0].toString(), args[1])
  }
}

export { ServerProcessManager }
