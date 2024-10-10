/* eslint-disable antfu/curly */

import { cpus } from 'node:os'
import process from 'node:process'

import { ALLOWED_FLAGS, FLAG_MAP, NOT_REQUIRED_FLAGS, TRANSPORTS, USECASES } from './constants'
import type { Invert, TFlagMap } from './constants'
import type { TAllowedFlags, TRuntimeSettings, TTransportTypeUnion, TUsecaseTypeUnion } from './types'

const isPositiveNumeric = (value: string | undefined | null) => (value !== null && typeof value !== 'undefined') ? /^\d+$/.test(value) : false
const isTransport = (val: unknown): val is TTransportTypeUnion => TRANSPORTS.includes(val as TTransportTypeUnion)
const isUsecase = (val: unknown): val is TUsecaseTypeUnion => USECASES.includes(val as TUsecaseTypeUnion)
const isNotRequiredFlag = (val: unknown): val is typeof NOT_REQUIRED_FLAGS[number] => NOT_REQUIRED_FLAGS.includes(val as typeof NOT_REQUIRED_FLAGS[number])
const isAllowFlag = (val: unknown): val is TAllowedFlags => ALLOWED_FLAGS.includes(val as TAllowedFlags)

const convertCLICoresOptionToRealCores = (cores: number | 'max' | undefined): number =>
  cores === 'max'
    ? cpus().length
    : typeof cores === 'undefined'
      ? 1
      : Number(cores)

function getFlagValue<T extends keyof TFlagMap>(flag: T, argv?: string[]): TFlagMap[T] {
  const options = argv || process.argv.slice(2)
  const index = options.indexOf(`-${flag}`)
  const isFound = index !== -1

  if (!isAllowFlag(flag)) throw new Error(`Unknown flag ${flag as string} was detected!`)
  if (!isFound && !isNotRequiredFlag(flag)) throw new Error(`Flag ${flag} should have value!`)

  const foundVal = index !== -1 ? options[index + 1] : undefined

  if (flag === 'cores') return (foundVal === 'max'
    ? 'max'
    : isPositiveNumeric(foundVal)
      ? Number(foundVal)
      : undefined) as TFlagMap[T]
  if (flag === 'automate') return (isFound ? 'automate-mode' : 'manual-mode') as TFlagMap[T]

  if (flag === 't') {
    if (!isTransport(foundVal)) throw new Error(`Invalid transport: ${foundVal}`)
    return foundVal as TFlagMap[T]
  }

  if (flag === 'u') {
    if (!isUsecase(foundVal)) throw new Error(`Invalid usecase: ${foundVal}`)
    return foundVal as TFlagMap[T]
  }

  return (isPositiveNumeric(foundVal) ? Number(foundVal) : undefined) as TFlagMap[T]
}

export const keysTransformer = <T extends Record<string, unknown>, X extends { [key in keyof T]: string }>(objSource: T, mapKeys: X) =>
  Object.entries(objSource).reduce((acc, cur) => {
    const [key, value] = cur as [keyof T, T[keyof T]]
    const newKey = mapKeys[key]
    return { ...acc, [newKey]: value }
    // @ts-expect-error bug TS?...
  }, {} as { [key in X[keyof T]]: T[Invert<X>[key]] })

const getFlagValues = <T extends keyof TFlagMap>(flags: T[]) => {
  const options = process.argv.slice(2)

  const res = flags.reduce((acc, flag) =>
    ({ ...acc, [flag]: getFlagValue(flag, options) }), {} as { [key in T]: TFlagMap[key] })

  return keysTransformer(res, FLAG_MAP)
}

const getRuntimeSettings = (): TRuntimeSettings => ({
  transport: getFlagValue('t'),
  usecase: getFlagValue('u'),
  cores: convertCLICoresOptionToRealCores(getFlagValue('cores')),
})

export {
  convertCLICoresOptionToRealCores,
  getFlagValue,
  getFlagValues,
  getRuntimeSettings,
}
