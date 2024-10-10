import type { TRuntimeSettings } from '@shared/types'

import { automateBenchmarkConfig } from './benchmark-config'
import { runScript } from './script'
import type { ServerProcessManager } from './server-process-manager'
import { prepareToBenchmarkFileOnDisk } from './utils/file'
import { buildOperations, configureCascadeMasterGracefulShutdown, logAfterBenchmark, logBeforeBenchmark, logCompleteBenchmark, sleep } from './utils/helpers'
import type { TDefaultSettings } from './utils/types'

const start = async ({ defaultSettings, operations }: { defaultSettings: TDefaultSettings, operations: TRuntimeSettings[] }) => {
  /**
   * @description Graceful shutdown callback some way must
   * hold reference to the actual child process.
   * Since brand new process is spawn in while cycle, we must use
   * one global GS callback which tracks down last spawned process.
   */
  const currentChildProcessManagerRef: { value: ServerProcessManager | null } = { value: null }

  // Set graceful shutdown
  configureCascadeMasterGracefulShutdown(currentChildProcessManagerRef)

  // Write info about default settings related with benchmark
  const pathToLastSnapshotFile = await prepareToBenchmarkFileOnDisk(defaultSettings)

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i] as TRuntimeSettings

    logBeforeBenchmark(defaultSettings, operation, i, operations.length)

    // Run main logic (server + benchmark)
    await runScript(defaultSettings, operation, pathToLastSnapshotFile, currentChildProcessManagerRef)

    if (i !== (operations.length - 1)) {
      logAfterBenchmark(defaultSettings)
      await sleep(defaultSettings.delayBeforeRunning || 10)
    }
    else {
      logCompleteBenchmark()
    }
  }
}

void start(
  {
    defaultSettings: automateBenchmarkConfig.defaultSettings,
    operations: buildOperations(automateBenchmarkConfig.runtimeSettings),
  },
)
