import { startEntrypoint } from '../server'
import type { ServerProcessManager } from '../server/utils/server-process-manager'
import { usecaseMap } from '../server/utils/types'
import type { TDefaultSettings, TRuntimeSettings } from '../server/utils/types'

import { startBenchmark } from './benchmark'
import { updateBenchmarkInfo } from './utils/file'

export const runScript = async (
  defaultSettings: TDefaultSettings,
  operation: TRuntimeSettings,
  pathToLastSnapshotFile: string,
  currentChildProcessManagerRef: { value: ServerProcessManager | null },

): Promise<void> => {
  // 1. Run server & and hold reference to the actual child process
  currentChildProcessManagerRef.value = await startEntrypoint({
    cores: operation.cores,
    transport: operation.transport,
    usecase: operation.usecase,
  })

  // Track down if child process was killed
  const childProcessWasClosed = new Promise<void>((resolve) => {
    currentChildProcessManagerRef.value?.on('close', _code => resolve())
  })

  // 2. Run benchmark & collect data
  const benchmarkResult = await startBenchmark({
    connections: defaultSettings.connections,
    pipelining: defaultSettings.pipelining,
    workers: defaultSettings.workers,
    duration: defaultSettings.duration,
    usecaseConfig: usecaseMap[operation.usecase],
    transport: operation.transport,
    usecase: operation.usecase,
  })

  // 3. Save benchmark data on disk
  await updateBenchmarkInfo(pathToLastSnapshotFile, benchmarkResult)

  // 4. Stop server
  currentChildProcessManagerRef.value.stop('SIGTERM')

  // 5. Server process was terminated
  await childProcessWasClosed
}
