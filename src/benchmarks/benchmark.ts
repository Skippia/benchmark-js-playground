import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'

import autocannon from 'autocannon'

import { USECASE_MAP } from '@shared/constants'
import { getFlagValue } from '@shared/helpers'
import type { TUsecaseConfig } from '@shared/types'

import { defaultBenchmarkConfig } from './benchmark-config'
import { checkIsManualMode } from './utils/helpers'
import type { TBenchmarkSettingsCLI, TBenchmarkSettingsProgrammatically, TResultBenchmark } from './utils/types'

const require = createRequire(import.meta.url)

function prepareRequests(usecaseConfig: TUsecaseConfig) {
  let requests = []

  if (usecaseConfig.method === 'POST') {
    // eslint-disable-next-line import/no-dynamic-require, ts/no-unsafe-call
    requests = require(path.resolve('benchmarks-data/users.json')).map((user: unknown) => ({
      method: 'POST',
      path: usecaseConfig.path,
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
      },
    }))
  }
  else {
    requests = [{
      method: 'GET',
      path: usecaseConfig.path,
      headers: {
        'Content-Type': 'application/json',
      },
    }]
  }

  return requests
}

function startBenchmark(
  { connections, duration, pipelining, usecaseConfig, workers, transport, usecase }: TBenchmarkSettingsCLI | TBenchmarkSettingsProgrammatically,
): Promise<TResultBenchmark> {
  return new Promise((resolve) => {
    const port = process.env.PORT
    const url = `http://localhost:${port}`
    const requests = prepareRequests(usecaseConfig)
    const instance = autocannon(
      {
        url,
        connections,
        pipelining,
        workers,
        duration,
        headers: {
          'Content-Type': 'application/json',
        },
        requests,
      },
      (err, res) => resolve({
        transport,
        usecase,
        critical_errors: err,
        errors: res.errors,
        timeouts: res.timeouts,
        latency: {
          average: res.latency.average,
          min: res.latency.min,
          max: res.latency.max,
          p75: res.latency.p75,
          p90: res.latency.p90,
          p99: res.latency.p99,
        },
        requests: {
          totalAmount: res.requests.total,
          average: res.requests.average,
          min: res.requests.min,
          max: res.requests.max,
          p75: res.requests.p75,
          p90: res.requests.p90,
          p99: res.requests.p99,
        },
      }),
    )

    autocannon.track(instance)
  })
}

// ? Run in manual mode (run from CLI is forbidden in automate mode)
const isManualMode = checkIsManualMode()

if (isManualMode) {
  const usecase = getFlagValue('u')
  const usecaseConfig = usecase in USECASE_MAP ? USECASE_MAP[usecase] : null

  if (!usecaseConfig) throw new Error('Usecase not found!')

  void startBenchmark({
    connections: Number(getFlagValue('c') || defaultBenchmarkConfig.connections),
    pipelining: Number(getFlagValue('p') || defaultBenchmarkConfig.pipelining),
    workers: Number(getFlagValue('w') || defaultBenchmarkConfig.workers),
    duration: Number(getFlagValue('d') || defaultBenchmarkConfig.duration),
    usecaseConfig,
  })
}

// Export for benchmark running in automate mode
export { startBenchmark }
