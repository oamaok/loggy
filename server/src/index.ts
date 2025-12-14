import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert'
import express, { RequestHandler, Router, ErrorRequestHandler } from 'express'
import bodyParser from 'body-parser'
import multer from 'multer'
import { z } from 'zod'
import sharp from 'sharp'
import * as db from './db'
import { BadRequest, HttpError, NotFound, Unauthorized } from './http-error'
import config from './config'

const app = express()
const router = Router()
const upload = multer()

app.use(bodyParser.json())

app.use(
  '/static/',
  express.static(
    path.join(
      path.dirname(require.resolve('@loggy/client/package.json')),
      'build'
    )
  )
)

app.use(
  '/assets/',
  express.static(
    path.join(
      path.dirname(require.resolve('@loggy/client/package.json')),
      'assets'
    )
  )
)

const createToken = (personId: number) => {
  const time = Date.now()
  const payload = personId + ':' + time

  const hmac = crypto.createHmac('sha256', Buffer.from(config.auth.signingKey))
  hmac.update(payload)
  const hash = hmac.digest().toString('base64')
  return payload + ':' + hash
}

const verifyToken = (token: string): number | null => {
  const [personId, time, receivedHash] = token.split(':')
  if (!personId || !time || !receivedHash) {
    return null
  }

  if (config.auth.tokenTTL < Date.now() - parseInt(time)) {
    return null
  }

  const hmac = crypto.createHmac('sha256', Buffer.from(config.auth.signingKey))
  hmac.update(personId + ':' + time)
  const hash = hmac.digest().toString('base64')

  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(receivedHash))) {
    return null
  }

  return parseInt(personId)
}

const authHandler: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    next()
    return
  }

  const personId = verifyToken(authHeader)

  if (personId === null) {
    next()
    return
  }

  req.auth = { personId }
  next()
}

app.use(authHandler)

const validateBody =
  <T>(validator: z.ZodType<T>): RequestHandler<any, any, T> =>
  (req, res, next) => {
    const parseResult = validator.safeParse(req.body)

    if (!parseResult.success) {
      console.error(parseResult.error)
      throw new BadRequest()
    }

    next()
  }

const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.auth) {
    throw new Unauthorized()
  }

  next()
}

router.post(
  '/login',
  validateBody(
    z.object({
      email: z.email(),
      password: z.string().min(12).max(64),
    })
  ),
  async (req, res) => {
    const person = await db.queries.loginPerson(
      req.body.email,
      req.body.password
    )

    if (!person) {
      throw new Unauthorized()
    }

    res.json({ token: createToken(person.id) })
  }
)

router.post(
  '/create-account',
  validateBody(
    z.object({
      email: z.email(),
      password: z.string().min(12).max(64),
    })
  ),
  async (req, res) => {
    const existingPerson = await db.queries.getPersonByEmail(req.body.email)

    if (existingPerson) {
      res.status(400)
      res.json({ error: 'email-taken' })
      return
    }

    const person = await db.queries.createPerson(
      req.body.email,
      req.body.password
    )

    if (!person) {
      throw new Unauthorized()
    }

    res.json({ token: createToken(person.id) })
  }
)

router.get('/refresh-token', requireAuth, (req, res) => {
  assert(req.auth)
  res.json({ token: createToken(req.auth.personId) })
})

router.get('/whoami', requireAuth, async (req, res) => {
  assert(req.auth)

  const person = await db.queries.getPersonById(req.auth.personId)
  assert(person)

  res.json(person)
})

router.get('/log', requireAuth, async (req, res) => {
  assert(req.auth)

  res.json(await db.queries.getLogEntriesByPerson(req.auth.personId))
})

router.get('/attachment/:id/:width', async (req, res) => {
  const { id, width } = req.params

  if (!id || !width) {
    throw new BadRequest()
  }

  const attachment = await db.queries.getImage(id, parseInt(width))

  if (!attachment) {
    throw new NotFound()
  }

  res.setHeader('content-type', attachment.mimeType)
  res.write(attachment.data)
  res.end()
})

router.post(
  '/log',
  requireAuth,
  validateBody(
    z.object({
      textContent: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
  ),
  async (req, res) => {
    assert(req.auth)
    const entry = await db.queries.createLogEntry(req.auth.personId, req.body)
    res.json(entry)
  }
)

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

router.post(
  '/log/:logEntryId/attachment',
  requireAuth,
  upload.single('image'),
  async (req, res) => {
    assert(req.auth)

    const logEntryId = parseInt(req.params.logEntryId ?? '')
    const file = req.file

    if (isNaN(logEntryId) || logEntryId < 0) {
      throw new BadRequest()
    }

    if (!file) {
      throw new BadRequest()
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequest()
    }

    /*
    const createBlurHash = async () => {
      const image = originalImage.clone().resize(120)
      const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true })

      return blurhash.encode(
        new Uint8ClampedArray(data.buffer),
        info.width,
        info.height,
        4,
        4
      )
    }
    */

    const attachment = await db.transact(async () => {
      const attachment = await db.queries.createImageAttachment(logEntryId)

      const image = sharp(file.buffer)
      const originalImage = await image
        .clone()
        .webp()
        .toBuffer({ resolveWithObject: true })

      await db.queries.createImage({
        attachmentId: attachment.id,
        mimeType: 'image/webp',
        width: originalImage.info.width,
        height: originalImage.info.height,
        data: originalImage.data,
      })

      attachment.versions.push({
        mimeType: 'image/webp',
        width: originalImage.info.width,
        height: originalImage.info.height,
      })

      const SIZES = [320, 600, 800]

      for (const size of SIZES) {
        // Skip sizes if the original is smaller
        if (size > originalImage.info.width) continue

        const { info, data } = await image
          .clone()
          .resize(size)
          .webp()
          .toBuffer({ resolveWithObject: true })

        await db.queries.createImage({
          attachmentId: attachment.id,
          mimeType: 'image/webp',
          width: info.width,
          height: info.height,
          data: data,
        })

        attachment.versions.push({
          mimeType: 'image/webp',
          width: info.width,
          height: info.height,
        })
      }

      return attachment
    })

    res.json(attachment)
  }
)

router.post('/browserError', async (req, res) => {
  console.error('error from browser', req.body)
  res.end()
})

app.use('/api/', router)

app.get('*path', (req, res) => {
  res.setHeader('content-type', 'text/html')
  res.send(`
    <!doctype html>
    <html lang="en">
      <head>  
        <title>Loggy</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0&family=Funnel+Sans:wght@300" />
        <link rel="manifest" href="/assets/manifest.json">
        <link rel="stylesheet" href="/static/index.css" />
      </head>
      <body>
        <div></div>
        <script src="/static/index.js"></script>
      </body>
    </html>
  `)
})

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode)
    res.json({ error: err.name })
    return
  }

  console.error(err)

  res.status(500)
  res.json({ error: 'internal server error' })
}

app.use(errorHandler)

const main = async () => {
  await db.migrate()

  app.listen(8080, () => {
    console.log('listening. always listening.')
  })
}

main()
