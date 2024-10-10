import type { second, TTransportTypeUnion, TUsecaseConfig, TUsecaseTypeUnion } from '@shared/types'

type TBenchmarkSettingsCLI = Omit<TDefaultSettings, 'cores' | 'delayBeforeRunning'>
  & { usecaseConfig: TUsecaseConfig } & Partial<Pick<TResultBenchmark, 'transport' | 'usecase'>>

type TBenchmarkSettingsProgrammatically = TBenchmarkSettingsCLI
  & Pick<TResultBenchmark, 'transport' | 'usecase'>

type TResultBenchmark = {
  transport?: TTransportTypeUnion
  usecase?: TUsecaseTypeUnion
  critical_errors: unknown
  errors: number
  timeouts: number
  latency: {
    average: number
    min: number
    max: number
    p75: number
    p90: number
    p99: number
  }
  requests: {
    totalAmount: number
    average: number
    min: number
    max: number
    p75: number
    p90: number
    p99: number
  }
}

type TAutomateConfig = {
  defaultSettings: Required<TDefaultSettings>
  runtimeSettings: {
    usecases: readonly TUsecaseTypeUnion[]
    transports: readonly TTransportTypeUnion[]
    cores: ('max' | number)[]
  }
}

type TSnapshotOnDisk = {
  benchmarkConfig: TDefaultSettings
  benchmarks: TResultBenchmark[]
}

type TDefaultSettings = {
  delayBeforeRunning: second
  connections: number
  pipelining: number
  workers: number
  duration: second
}

type TFileInput = { pathToStorage: string, fileContent: Partial<TSnapshotOnDisk> }

export type {
  TAutomateConfig,
  TBenchmarkSettingsCLI,
  TBenchmarkSettingsProgrammatically,
  TDefaultSettings,
  TFileInput,
  TResultBenchmark,
  TSnapshotOnDisk,
}
