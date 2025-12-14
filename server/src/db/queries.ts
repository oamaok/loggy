import assert from 'node:assert'
import { z } from 'zod'
import sql from 'sql-template-strings'
import * as db from './core'
import { ImageAttachment, LogEntry } from '../../../common/types'

export const createPerson = (email: string, password: string) =>
  db.queryOne(
    sql`
      insert into person (email, password)
      values (${email}, crypt(${password}, gen_salt('sha256crypt')))
      returning id, email
    `,
    z.object({ id: z.number(), email: z.email() })
  )

export const loginPerson = (email: string, password: string) =>
  db.queryOneOrNone(
    sql`
      select id, email from person
      where
        email = ${email} and
        password = crypt(${password}, password)
    `,
    z.object({ email: z.email(), id: z.number() })
  )

export const getPersonById = (id: number) =>
  db.queryOneOrNone(
    sql`
      select id, email
      from person
      where id = ${id}
    `,
    z.object({ id: z.number(), email: z.email() })
  )

export const getPersonByEmail = (email: string) =>
  db.queryOneOrNone(
    sql`
      select id, email
      from person
      where email = ${email}
    `,
    z.object({ id: z.number(), email: z.email() })
  )

export const createLogEntry = async (
  personId: number,
  entry: Pick<LogEntry, 'textContent' | 'longitude' | 'latitude'>
): Promise<LogEntry> => {
  const dbEntry = await db.queryOne(
    sql`
    insert into log_entry (person_id, text_content, longitude, latitude)
    values (${personId}, ${entry.textContent}, ${entry.longitude}, ${entry.latitude})
    returning
      id,
      created_at as "createdAt",
      text_content as "textContent",
      longitude,
      latitude
  `,
    z.object({
      id: z.number(),
      createdAt: z.coerce.string(),
      textContent: z.string(),
      longitude: z.number(),
      latitude: z.number(),
    })
  )

  return {
    ...dbEntry,
    imageAttachments: [],
  }
}

export const createImageAttachment = async (
  logEntryId: number
): Promise<ImageAttachment> => {
  const dbEntry = await db.queryOne(
    sql`
      insert into image_attachment (log_entry_id)
      values (${logEntryId})
      returning
        id
      `,
    z.object({ id: z.string() })
  )

  return {
    id: dbEntry.id,
    versions: [],
  }
}

export const getImage = (attachmentId: string, width: number) =>
  db.queryOneOrNone(
    sql`
    select
      mime_type as "mimeType",
      data
    from image
    where attachment_id = ${attachmentId} and width = ${width}
  `,
    z.object({
      mimeType: z.string(),
      data: z.instanceof(Buffer),
    })
  )

export const createImage = ({
  attachmentId,
  mimeType,
  width,
  height,
  data,
}: {
  attachmentId: string
  mimeType: string
  width: number
  height: number
  data: Buffer
}) =>
  db.query(sql`
    insert into image (attachment_id, mime_type, width, height, data)
    values (${attachmentId}, ${mimeType}, ${width}, ${height}, ${data})
  `)

export const getLogEntriesByPerson = async (
  personId: number
): Promise<LogEntry[]> => {
  const dbEntries = await db.queryMany(
    sql`
      select
        log_entry.id as "id",
        log_entry.created_at as  "createdAt",
        log_entry.text_content as "textContent",
        log_entry.longitude,
        log_entry.latitude,

        image_attachment.id as "imageAttachmentId",

        image.mime_type as "imageMimeType",
        image.width as "imageWidth",
        image.height as "imageHeight"
      from
        log_entry
      left join image_attachment
        on image_attachment.log_entry_id = log_entry.id
      left join image
        on image.attachment_id = image_attachment.id
      where
        log_entry.person_id = ${personId}
      order by
        log_entry.created_at desc
    `,
    z.object({
      id: z.number(),
      createdAt: z.coerce.string(),
      textContent: z.string(),
      longitude: z.number(),
      latitude: z.number(),

      imageAttachmentId: z.string().nullable(),

      imageMimeType: z.string().nullable(),
      imageWidth: z.number().nullable(),
      imageHeight: z.number().nullable(),
    })
  )

  const logEntries: Map<number, LogEntry> = new Map()
  const imageAttachments: Map<string, ImageAttachment> = new Map()

  for (const dbEntry of dbEntries) {
    let logEntry = logEntries.get(dbEntry.id)
    if (!logEntry) {
      logEntry = {
        id: dbEntry.id,
        createdAt: dbEntry.createdAt,
        textContent: dbEntry.textContent,
        longitude: dbEntry.longitude,
        latitude: dbEntry.latitude,
        imageAttachments: [],
      }
      logEntries.set(dbEntry.id, logEntry)
    }

    if (dbEntry.imageAttachmentId) {
      assert(dbEntry.imageMimeType)
      assert(dbEntry.imageWidth)
      assert(dbEntry.imageHeight)

      let imageAttachment = imageAttachments.get(dbEntry.imageAttachmentId)
      if (!imageAttachment) {
        imageAttachment = {
          id: dbEntry.imageAttachmentId,
          versions: [],
        }

        logEntry.imageAttachments.push(imageAttachment)
        imageAttachments.set(dbEntry.imageAttachmentId, imageAttachment)
      }

      imageAttachment.versions.push({
        mimeType: dbEntry.imageMimeType,
        width: dbEntry.imageWidth,
        height: dbEntry.imageHeight,
      })
    }
  }

  return Array.from(logEntries.values())
}
