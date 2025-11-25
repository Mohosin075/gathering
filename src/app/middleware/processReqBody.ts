import { Request, Response, NextFunction } from 'express'
import multer, { FileFilterCallback } from 'multer'
import ApiError from '../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { getVideoDurationInSeconds } from 'get-video-duration'

type IFolderName = 'images' | 'media' | 'documents'
interface ProcessedFiles {
  [key: string]: any
}

// Define upload configuration with maxCount
const uploadFields = [
  { name: 'images', maxCount: 5 },
  { name: 'media', maxCount: 3 },
  { name: 'documents', maxCount: 3 },
] as const

export const fileAndBodyProcessorUsingDiskStorage = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folderPath = path.join(uploadsDir, file.fieldname)
      if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath, { recursive: true })
      cb(null, folderPath)
    },
    filename: (req, file, cb) => {
      const extension =
        path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
      cb(null, filename)
    },
  })

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    try {
      const allowedTypes = {
        images: ['image/jpeg', 'image/png', 'image/jpg'],
        media: ['video/mp4', 'audio/mpeg'],
        documents: ['application/pdf'],
      }
      const fieldType = file.fieldname as IFolderName
      if (!allowedTypes[fieldType]?.includes(file.mimetype)) {
        return cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            `Invalid file type for ${file.fieldname}`,
          ),
        )
      }
      cb(null, true)
    } catch (err) {
      cb(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'File validation failed',
        ),
      )
    }
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  }).fields(uploadFields)

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async error => {
      if (error) return next(error)

      try {
        if (req.body?.data) req.body = JSON.parse(req.body.data)

        if (req.files) {
          const processedFiles: ProcessedFiles = {}
          const fieldsConfig = new Map(
            uploadFields.map(f => [f.name, f.maxCount]),
          )

          for (const [fieldName, files] of Object.entries(req.files)) {
            const maxCount = fieldsConfig.get(fieldName as IFolderName) ?? 1
            const fileArray = files as Express.Multer.File[]
            const paths: any[] = []

            for (const file of fileArray) {
              const filePath = `/${fieldName}/${file.filename}`

              // Optimize images
              if (
                fieldName === 'images' &&
                file.mimetype.startsWith('image/')
              ) {
                try {
                  const fullPath = path.join(
                    uploadsDir,
                    fieldName,
                    file.filename,
                  )
                  let sharpInstance = sharp(fullPath).resize(800)

                  if (file.mimetype === 'image/png')
                    sharpInstance = sharpInstance.png({ quality: 80 })
                  else sharpInstance = sharpInstance.jpeg({ quality: 80 })

                  await sharpInstance.toFile(fullPath + '.optimized')
                  fs.unlinkSync(fullPath)
                  fs.renameSync(fullPath + '.optimized', fullPath)
                } catch (err) {
                  console.error('Image optimization failed:', err)
                }
              }

              // Handle video duration
              let duration: number | undefined = undefined
              if (file.mimetype.startsWith('video/')) {
                try {
                  duration = await getVideoDurationInSeconds(file.path)
                } catch (err) {
                  console.error('Video duration extraction failed:', err)
                }
              }

              // File info with extracted duration for videos
              const fileInfo = {
                url: filePath,
                size: file.size,
                type: file.mimetype.startsWith('image')
                  ? 'image'
                  : file.mimetype.startsWith('video')
                    ? 'video'
                    : 'document',
                duration,
              }

              paths.push(fileInfo)
            }

            processedFiles[fieldName] = maxCount > 1 ? paths : paths[0]
          }

          req.body = { ...req.body, ...processedFiles }
        }

        next()
      } catch (err) {
        next(err)
      }
    })
  }
}
