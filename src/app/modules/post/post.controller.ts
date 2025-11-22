import { Request, Response } from 'express'
import { PostServices } from './post.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { postFilterables } from './post.constants'
import { paginationFields } from '../../../interfaces/pagination'
import { MediaItem } from './post.interface'

const createPost = catchAsync(async (req: Request, res: Response) => {
  const { images, media, ...postData } = req.body

  const mediaItems: MediaItem[] = []

  if (Array.isArray(images)) {
    mediaItems.push(
      ...images.map((file: any) => ({
        url: file.url,
        type: 'image' as 'image',
        size: file.size,
      })),
    )
  }

  if (Array.isArray(media)) {
    mediaItems.push(
      ...media.map((file: any) => ({
        url: file.url,
        type: 'video' as 'video',
        size: file.size,
        duration: file.duration,
      })),
    )
  }

  postData.media_source = mediaItems

  const result = await PostServices.createPost(req.user!, postData)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Post created successfully',
    data: result,
  })
})

const updatePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const postData = req.body

  const result = await PostServices.updatePost(id, postData)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post updated successfully',
    data: result,
  })
})

const getSinglePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await PostServices.getSinglePost(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post retrieved successfully',
    data: result,
  })
})

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, postFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await PostServices.getAllPosts(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Posts retrieved successfully',
    data: result,
  })
})
const getMyPosts = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, postFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await PostServices.getMyPosts(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Posts retrieved successfully',
    data: result,
  })
})

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await PostServices.deletePost(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Post deleted successfully',
    data: result,
  })
})

export const PostController = {
  createPost,
  updatePost,
  getSinglePost,
  getAllPosts,
  getMyPosts,
  deletePost,
}
