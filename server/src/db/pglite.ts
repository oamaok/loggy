import assert from 'node:assert'
import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { z } from 'zod/v4'
import { PGlite, PGliteInterface, Transaction } from '@electric-sql/pglite'
import { SQLStatement } from 'sql-template-strings'

const db = new PGlite(path.resolve(__dirname, './dev-pgdata'))
const transactionStorage = new AsyncLocalStorage<Transaction>()

const usingCurrentClient = async <T>(
  fn: (client: Pick<PGliteInterface, 'query' | 'exec'>) => Promise<T>
): Promise<Awaited<T>> => {
  const transactionClient = transactionStorage.getStore()
  if (transactionClient) {
    return await fn(transactionClient)
  } else {
    return await fn(db)
  }
}

export const queryMany = <T extends object>(
  statement: SQLStatement,
  validator: z.ZodType<T>
): Promise<T[]> =>
  usingCurrentClient(async (client) => {
    const { rows } = await client.query(statement.text, statement.values)
    return z.array(validator).parse(rows)
  })

export const queryOne = <T>(
  statement: SQLStatement,
  validator: z.ZodType<T>
): Promise<T> =>
  usingCurrentClient(async (client) => {
    const { rows } = await client.query<T>(statement.text, statement.values)
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
    const { rows } = await client.query<T>(statement.text, statement.values)
    const [row] = rows

    assert(rows.length === 0 || rows.length === 1)

    return row ? validator.parse(row) : null
  })

export const query = (statement: SQLStatement | string): Promise<void> =>
  usingCurrentClient(async (client) => {
    if (typeof statement === 'string') {
      await client.exec(statement)
    } else {
      await client.query(statement.text, statement.values)
    }
  })

export const transact = async <T>(
  transaction: () => Promise<T>
): Promise<T> => {
  const transactionClient = transactionStorage.getStore()
  if (transactionClient) {
    return transaction()
  }

  return db.transaction((tx) => transactionStorage.run(tx, transaction))
}
