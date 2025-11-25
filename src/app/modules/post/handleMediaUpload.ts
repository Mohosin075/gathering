import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { S3Helper } from '../../../helpers/image/s3helper'

export const handleMediaUpload = async (req: any, res: any, next: any) => {
  try {
    const payload = req.body

    if (!payload.data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Data is required')
    }

    // Parse JSON payload
    payload.data = JSON.parse(payload.data)

    // Files
    const imageFiles = (req.files as any)?.image as Express.Multer.File[]
    const videoFiles = (req.files as any)?.media as Express.Multer.File[]

    // Media items array following your MediaItem schema
    let mediaItems: Array<{
      url: string
      type: 'image' | 'video'
      thumbnail?: string
      duration?: number
      size?: number
      altText?: string
    }> = []

    // ===============================
    // Upload videos
    // ===============================
    if (videoFiles?.length > 0) {
      if (payload.data.contentType === 'carousel') {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Carousel posts support images only. Videos are not allowed. Please upload images instead.',
        )
      }

      const uploadedVideoUrls = await S3Helper.uploadMultipleVideosToS3(
        videoFiles,
        'videos',
      )

      if (uploadedVideoUrls.length === 0) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload video files. Please try again.',
        )
      }

      // Create video media items
      uploadedVideoUrls.forEach((url, index) => {
        mediaItems.push({
          url,
          type: 'video',
          size: videoFiles[index]?.size,
          // Note: You might want to extract duration and generate thumbnails here
          // duration: getVideoDuration(videoFiles[index]),
          // thumbnail: generateVideoThumbnail(videoFiles[index]),
        })
      })
    }

    // ===============================
    // Upload images
    // ===============================
    if (imageFiles?.length > 0) {
      const uploadedImageUrls = await S3Helper.uploadMultipleFilesToS3(
        imageFiles,
        'image',
      )

      //   console.log({uploadedImageUrls})

      if (uploadedImageUrls.length === 0) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload image files. Please try again.',
        )
      }

      // Create image media items
      uploadedImageUrls.forEach((url, index) => {
        mediaItems.push({
          url,
          type: 'image',
          size: imageFiles[index]?.size,
          // altText: payload.data.altText?.[index] // You can add altText in your payload if needed
        })
      })
    }

    // ===============================
    // Final body - structure according to your Post model
    // ===============================
    req.body = {
      ...payload.data,
      media_source: mediaItems,
    }

    next()
  } catch (error) {
    console.error('❌ Error in handleMediaUpload:', error)
    next(error)
  }
}
