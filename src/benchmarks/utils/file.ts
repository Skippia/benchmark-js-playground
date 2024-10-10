import fs from 'node:fs/promises'
import path from 'node:path'

import type { TDefaultSettings, TFileInput, TResultBenchmark, TSnapshotOnDisk } from './types'

const checkIsFileExists = async (pathLike: string): Promise<boolean> => {
  try {
    await fs.stat(pathLike)
    return true
  }
  catch {
    return false
  }
}

const getLastSnapshotNameOnDisk = async (): Promise<string> => {
  let snapshotVersion = 1
  let pathToStorage: string

  while (true) {
    pathToStorage = path.resolve(`benchmarks-data/benchmark-${snapshotVersion}.json`)

    const isSnapshotAlreadyExists = await checkIsFileExists(pathToStorage)

    if (!isSnapshotAlreadyExists) {
      break
    }

    snapshotVersion++
  }

  return pathToStorage
}

const saveFileOnDisk = async ({ fileContent, pathToStorage }: TFileInput): Promise<void> =>
  await fs.writeFile(pathToStorage, JSON.stringify(fileContent), 'utf-8')

const prepareToBenchmarkFileOnDisk = async (benchmarkConfig: TDefaultSettings,
): Promise<string> => {
  const pathToStorage = await getLastSnapshotNameOnDisk()

  await saveFileOnDisk({ fileContent: {
    benchmarkConfig,
    benchmarks: [],
  }, pathToStorage })

  return pathToStorage
}

const updateBenchmarkInfo = async (pathToStorage: string, result: TResultBenchmark): Promise<void> => {
  const fileContent = JSON.parse(await fs.readFile(pathToStorage, 'utf8')) as TSnapshotOnDisk
  fileContent.benchmarks.push(result)
  await saveFileOnDisk({ fileContent, pathToStorage })
}

export { prepareToBenchmarkFileOnDisk, updateBenchmarkInfo }
