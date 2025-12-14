import assert from 'node:assert'
import { AsyncLocalStorage } from 'node:async_hooks'
import { z } from 'zod/v4'
import pg from 'pg'
import { SQLStatement } from 'sql-template-strings'
import config from '../config'

export const pool = new pg.Pool({
  connectionString: config.database.url,
})

const transactionStorage = new AsyncLocalStorage<pg.PoolClient>()

const usingCurrentClient = async <T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<Awaited<T>> => {
  const transactionClient = transactionStorage.getStore()
  if (transactionClient) {
    return await fn(transactionClient)
  } else {
    const client = await pool.connect()
    try {
      return await fn(client)
    } finally {
      client.release()
    }
  }
}

export const queryMany = <T extends object>(
  statement: SQLStatement,
  validator: z.ZodType<T>
): Promise<T[]> =>
  usingCurrentClient(async (client) => {
    const { rows } = await client.query(statement)
    return z.array(validator).parse(rows)
  })

export const queryOne = <T>(
  statement: SQLStatement,
  validator: z.ZodType<T>
): Promise<T> =>
  usingCurrentClient(async (client) => {
    const { rows } = await client.query(statement)
    const [row] = rows

    assert(rows.length === 1)
    assert(row)

    return validator.parse(row)
  })

export const queryOneOrNone = <T>(
  statement: SQLStatement,
  validator: z.ZodType<T>
): Promise<T | null> =>
  usingCurrentClient(async (client) => {
    const { rows } = await client.query(statement)
    const [row] = rows

    assert(rows.length === 0 || rows.length === 1)

    return row ? validator.parse(row) : null
  })

export const query = (statement: SQLStatement | string): Promise<void> =>
  usingCurrentClient(async (client) => {
    await client.query(statement)
  })

export const transact = async <T>(
  transaction: () => Promise<T>
): Promise<T> => {
  const transactionClient = transactionStorage.getStore()
  if (transactionClient) {
    return transaction()
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const res = await transactionStorage.run(client, transaction)
    await client.query('COMMIT')
    return res
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
