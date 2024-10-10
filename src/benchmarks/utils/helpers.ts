import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import process from 'node:process'

import { convertCLICoresOptionToRealCores, getFlagValue } from '@shared/helpers'
import type { second, TRuntimeSettings } from '@shared/types'

import type { ServerProcessManager } from '../server-process-manager'

import type { TAutomateConfig, TDefaultSettings } from './types'

const sleep = (ms: second) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms * 1000)
})

const logBeforeBenchmark = (defaultSettings: TDefaultSettings, operation: TRuntimeSettings, i: number, totalAmountOperations: number) => {
  console.log('\n######################################################################################')
  console.log(`.......Run #${i + 1}/${totalAmountOperations} [${operation.usecase}] usecase on [${operation.transport}] transport during ${defaultSettings.duration}s at ${operation.cores} core(s).......`)
}
const logAfterBenchmark = (defaultSettings: TDefaultSettings) => console.log(`\n.......Benchmark has been completed. Sleep for ${defaultSettings.delayBeforeRunning}s before next test.......`)
const logCompleteBenchmark = () => console.log('`\n.......Benchmark successfully has been completed')

const buildOperations = ({
  usecases,
  transports,
  cores,
}: TAutomateConfig['runtimeSettings']) => usecases.flatMap(usecase =>
  transports.flatMap(transport =>
    cores.map(_cores => ({
      transport,
      usecase,
      cores: convertCLICoresOptionToRealCores(_cores),
    }) satisfies TRuntimeSettings),
  ),
)

/**
 * @description GS for parent process
 */
const configureCascadeMasterGracefulShutdown = (childProcessManagerRef: { value: ServerProcessManager | null }) => {
  const signals = ['SIGINT', 'SIGTERM'] as const

  signals.forEach((signal) => {
    process.on(signal, () => {
      const exitCode = signal === 'SIGTERM' ? 1 : 0

      if (childProcessManagerRef.value?.isRunning) {
        (childProcessManagerRef.value.childProcess as ChildProcessWithoutNullStreams).on('close', () => {
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

const checkIsManualMode = () => getFlagValue('automate') === 'manual-mode'

export {
  buildOperations,
  checkIsManualMode,
  configureCascadeMasterGracefulShutdown,
  logAfterBenchmark,
  logBeforeBenchmark,
  logCompleteBenchmark,
  sleep,
}
