const TRANSPORTS = ['node', 'bun', 'express', 'fastify', 'ws'] as const

type TUsecaseTypeUnion = typeof USECASES[number]

const USECASES = [
  'empty',
  'heavy-blocking',
  'heavy-non-blocking',
  //
  'pg-pool-create-user',
  'pg-pool-get-user',
  //
  'redis-create-user',
  'redis-get-user',
] as const

type TTransportTypeUnion = typeof TRANSPORTS[number]

type TUsecaseConfig<T extends string = string> = { method: 'GET' | 'POST', path: `/${T}` }

const USECASE_MAP: { [K in TUsecaseTypeUnion]: TUsecaseConfig<K> } = {
  'empty': {
    method: 'GET',
    path: '/empty',
  },
  'heavy-blocking': {
    method: 'GET',
    path: '/heavy-blocking',
  },
  'heavy-non-blocking': {
    method: 'GET',
    path: '/heavy-non-blocking',
  },
  // Postgres
  'pg-pool-create-user': {
    method: 'POST',
    path: '/pg-pool-create-user',
  },
  'pg-pool-get-user': {
    method: 'GET',
    path: '/pg-pool-get-user',
  },
  // Redis
  'redis-create-user': {
    method: 'POST',
    path: '/redis-create-user',
  },
  'redis-get-user': {
    method: 'GET',
    path: '/redis-get-user',
  },
} as const

const NOT_REQUIRED_FLAGS = ['c', 'd', 'w', 'p', 'cores', 'automate'] as const
const REQUIRED_FLAGS = ['u', 't'] as const

const ALLOWED_FLAGS = [...NOT_REQUIRED_FLAGS, ...REQUIRED_FLAGS] as const

type TAllowedFlags = typeof ALLOWED_FLAGS[number]

type EnsureKeysAreAllowed<T, AllowedKeys extends PropertyKey> =
  Exclude<keyof T, AllowedKeys> extends never
    ? T
    : { ERROR: 'Invalid keys detected', INVALID_KEYS: Exclude<keyof T, AllowedKeys> }

type TFlagMap = EnsureKeysAreAllowed<
  {
    cores: number | 'max' | undefined
    automate: 'automate-mode' | 'manual-mode'
    t: TTransportTypeUnion
    u: TUsecaseTypeUnion
    d: number | undefined
    p: number | undefined
    c: number | undefined
    w: number | undefined
  },
  TAllowedFlags
>

type TFlagMapInverted =
  {
    cores: number | 'max' | undefined
    automate: 'automate-mode' | 'manual-mode'
    transport: TTransportTypeUnion
    usecase: TUsecaseTypeUnion
    duration: number | undefined
    pipeline: number | undefined
    connection: number | undefined
    workers: number | undefined
  }

const FLAG_MAP = {
  cores: 'cores',
  automate: 'automate',
  d: 'duration',
  p: 'pipeline',
  c: 'connection',
  t: 'transport',
  u: 'usecase',
  w: 'workers',
} as const satisfies Record<TAllowedFlags, string>

type Invert<T extends Record<string, string>> = {
  [key in T[keyof T]]: {
    [keyInner in keyof T]: T[keyInner] extends key ? keyInner : never
  }[keyof T]
}

export { ALLOWED_FLAGS, FLAG_MAP, NOT_REQUIRED_FLAGS, REQUIRED_FLAGS, TRANSPORTS, USECASE_MAP, USECASES }
export type { Invert, TAllowedFlags, TFlagMap, TFlagMapInverted, TTransportTypeUnion, TUsecaseConfig, TUsecaseTypeUnion }
