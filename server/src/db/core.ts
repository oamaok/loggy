import type * as pg from './pg'

let query: typeof pg.query
let queryMany: typeof pg.queryMany
let queryOne: typeof pg.queryOne
let queryOneOrNone: typeof pg.queryOneOrNone
let transact: typeof pg.transact

if (false) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pglite = require('./pglite')

  query = pglite.query
  queryMany = pglite.queryMany
  queryOne = pglite.queryOne
  queryOneOrNone = pglite.queryOneOrNone
  transact = pglite.transact
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pg = require('./pg')

  query = pg.query
  queryMany = pg.queryMany
  queryOne = pg.queryOne
  queryOneOrNone = pg.queryOneOrNone
  transact = pg.transact
}

export { query, queryMany, queryOne, queryOneOrNone, transact }
