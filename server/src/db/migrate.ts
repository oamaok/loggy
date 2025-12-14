import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { z } from 'zod/v4'
import * as db from './core'
import logger from '../logger'
import sql from 'sql-template-strings'

const getMigrationVersion = (filename: string) =>
  parseInt(filename.split('-')[0]!)

const migrationsDir = path.resolve(__dirname, './migrations')

const migrate = () =>
  db.transact(async () => {
    await db.query(
      sql`CREATE TABLE IF NOT EXISTS version (version INTEGER PRIMARY KEY DEFAULT 0)`
    )
    {
      const res = await db.queryOneOrNone(
        sql`SELECT COUNT(*)::INTEGER AS count FROM version`,
        z.object({
          count: z.number(),
        })
      )

      if (res?.count === 0) {
        await db.query(sql`INSERT INTO version (version) VALUES (0)`)
      }
    }

    const { version } = await db.queryOne(
      sql`SELECT version FROM version`,
      z.object({
        version: z.number(),
      })
    )

    const migrationFiles = await fs.readdir(migrationsDir)

    const applicableMigrations = migrationFiles
      .filter((filename) => getMigrationVersion(filename) > version)
      .sort()

    if (applicableMigrations.length === 0) {
      logger.info('No migrations to run.')
      return
    }

    for (const migrationFile of applicableMigrations) {
      const migration = (
        await fs.readFile(path.join(migrationsDir, migrationFile))
      ).toString()

      logger.info('Running migration %s:\n\n%s\n\n', migrationFile, migration)

      await db.query(migration)
      await db.query(
        sql`UPDATE version SET version = ${getMigrationVersion(migrationFile)}`
      )
    }
  })

export default migrate
