import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { checkIsManualMode, getFlagValue, getRuntimeSettings } from '../benchmarks/utils/helpers'
import { configureCascadeMasterGracefulShutdown, runServerInChildProcess } from './helpers'
import { type THostEnvironment, type TTransportTypeUnion, type TUsecaseTypeUnion, transports, usecases } from './types'
import { ServerProcessManager } from './server-process-manager'

/**
 * @returns Ready accept to requests child server process
 */
async function startEntrypoint({
  transport,
  usecase,
  cores,
}: {
  transport: TTransportTypeUnion
  usecase: TUsecaseTypeUnion
  cores: number
}): Promise<ServerProcessManager> {
  // 1. Create wrapper around process instance (still empty)
  const childProcessManager = new ServerProcessManager(transport, usecase, cores)

  // 2. Spawn child process
  await childProcessManager.start()

  return childProcessManager
}

const isManualMode = checkIsManualMode()

// ! Run in manual mode (run from CLI is forbidden in automate mode)
if (isManualMode) {
  const { usecase, transport, cores } = getRuntimeSettings()

  if (!usecases.includes(usecase) || !transports.includes(transport)) {
    throw new Error('Transport or usecases was set incorrect way!')
  }

  startEntrypoint({ usecase, transport, cores })
}

// Export for benchmark
export { startEntrypoint }
