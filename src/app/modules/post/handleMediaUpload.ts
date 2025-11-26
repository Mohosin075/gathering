import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { S3Helper } from '../../../helpers/image/s3helper'

export const handleMediaUpload = async (req: any, res: any, next: any) => {
  try {
    const payload = req.body

    console.log('Received payload:', payload)

    // Support both stringified `data` (multipart form) and direct JSON body
    if (payload.data) {
      // If payload.data is a string (form-data with `data`), parse it
      if (typeof payload.data === 'string') {
        try {
          payload.data = JSON.parse(payload.data)
        } catch (err) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Invalid JSON in data field',
          )
        }
      }
    } else if (Object.keys(payload || {}).length === 0) {
      // empty body
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Data is required')
    } else {
      // No `data` wrapper present, use body as data directly (typical JSON requests)
      payload.data = payload
    }

    // Files - ensure field names match frontend
    const imageFiles = (req.files as any)?.image as Express.Multer.File[]
    const videoFiles = (req.files as any)?.media as Express.Multer.File[] // This should match your frontend "media" field

    console.log('Uploaded files:', {
      images: imageFiles?.length || 0,
      videos: videoFiles?.length || 0,
    })

    let mediaItems: Array<{
      url: string
      type: 'image' | 'video'
      thumbnail?: string
      duration?: number
      size?: number
      altText?: string
    }> = []

    // ===============================
    // Upload videos FIRST
    // ===============================
    if (videoFiles && videoFiles.length > 0) {
      console.log('Processing video files:', videoFiles.length)

      // For videos, we only allow one video per post (usually)
      const videoFile = videoFiles[0]

      try {
        const uploadedVideoUrls = await S3Helper.uploadMultipleVideosToS3(
          [videoFile], // Pass as array
          'videos',
        )

        console.log('Uploaded video URLs:', uploadedVideoUrls)

        if (uploadedVideoUrls.length > 0) {
          mediaItems.push({
            url: uploadedVideoUrls[0],
            type: 'video',
            size: videoFile.size,
            // Add duration extraction if available
            // duration: await getVideoDuration(videoFile),
          })
          console.log('Video uploaded successfully:', uploadedVideoUrls[0])
        }
      } catch (videoError: any) {
        console.error('Video upload failed:', videoError)
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Video upload failed: ${videoError.message}`,
        )
      }
    }

    // ===============================
    // Upload images SECOND
    // ===============================
    if (imageFiles && imageFiles.length > 0) {
      console.log('Processing image files:', imageFiles.length)

      try {
        const uploadedImageUrls = await S3Helper.uploadMultipleFilesToS3(
          imageFiles,
          'images',
        )

        uploadedImageUrls.forEach((url, index) => {
          mediaItems.push({
            url,
            type: 'image',
            size: imageFiles[index]?.size,
          })
        })
        console.log('Images uploaded successfully:', uploadedImageUrls.length)
      } catch (imageError: any) {
        console.error('Image upload failed:', imageError)
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Image upload failed: ${imageError.message}`,
        )
      }
    }

    console.log('All media items prepared:', mediaItems)

    // ===============================
    // Final body structure
    // If caller already included `media_source` in payload.data (direct JSON), use it and append uploaded items
    // Otherwise, take uploaded items as `media_source`.
    const existingMediaSource =
      payload?.data?.media_source || payload?.media_source || []
    const mergedMediaSource = [...existingMediaSource, ...mediaItems]

    req.body = {
      ...payload.data,
      ...payload,
      media_source: mergedMediaSource,
    }

    console.log('Final media items:', mediaItems)
    next()
  } catch (error) {
    console.error('❌ Error in handleMediaUpload:', error)
    next(error)
  }
}
