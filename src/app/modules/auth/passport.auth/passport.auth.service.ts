import { USER_STATUS } from '../../../../enum/user'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../../errors/ApiError'
import { User } from '../../user/user.model'

import { IUser } from '../../user/user.interface'
import { AuthHelper } from '../auth.helper'
import { IAuthResponse } from '../auth.interface'
import { authResponse } from '../common'

const socialConflictError = () =>
  new ApiError(
    StatusCodes.CONFLICT,
    'An account with this email already exists with another sign-in method.',
  )

const assertCanBindSocialProvider = (
  user: { provider?: string; appId?: string },
  provider: 'google' | 'apple',
  sub: string,
) => {
  if (user.provider && user.provider !== provider) {
    throw socialConflictError()
  }
  if (user.appId && user.appId !== sub) {
    throw socialConflictError()
  }
}

const assertSocialLoginAllowed = (user: {
  status: USER_STATUS
  authentication?: { restrictionLeftAt?: Date | null }
}) => {
  if (user.status !== USER_STATUS.INACTIVE) return

  const restrictionLeftAt = user.authentication?.restrictionLeftAt
  if (restrictionLeftAt && new Date(restrictionLeftAt) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(restrictionLeftAt).getTime() - Date.now()) / 60000,
    )
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      `You are restricted to login for ${remainingMinutes} minutes`,
    )
  }
}

const handleGoogleLogin = async (
  payload: IUser & { profile: any },
): Promise<IAuthResponse> => {
  const { emails, photos, displayName, id } = payload.profile || {}
  const emailValue = emails?.[0]?.value
  if (!emailValue) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Google account did not return an email address',
    )
  }
  if (!id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Google account did not return a user id',
    )
  }

  const email = emailValue.toLowerCase().trim()
  const profileImage =
    photos?.[0]?.value || '/images/1767048629458-l94gk7.jpg'
  const resolvedName = displayName || email.split('@')[0]

  let user = await User.findOne({
    appId: id,
    status: { $nin: [USER_STATUS.DELETED] },
  })

  if (!user) {
    user = await User.findOne({
      email,
      status: { $nin: [USER_STATUS.DELETED] },
    })
  }

  if (!user) {
    const deletedUser = await User.findOne({
      status: USER_STATUS.DELETED,
      $or: [{ appId: id }, { email }],
    })

    if (deletedUser) {
      user = await User.findByIdAndUpdate(
        deletedUser._id,
        {
          $set: {
            status: USER_STATUS.ACTIVE,
            provider: 'google',
            appId: id,
            email,
            name: resolvedName,
            profile: profileImage,
            verified: true,
            'authentication.restrictionLeftAt': null,
            'authentication.wrongLoginAttempts': 0,
          },
        },
        { new: true },
      )
    }
  }

  if (user) {
    assertSocialLoginAllowed(user)
    assertCanBindSocialProvider(user, 'google', id)

    user = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          appId: id,
          provider: 'google',
          verified: true,
          status: USER_STATUS.ACTIVE,
          'authentication.restrictionLeftAt': null,
          'authentication.wrongLoginAttempts': 0,
        },
      },
      { new: true },
    )

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const tokens = AuthHelper.createToken(
      user._id,
      user.role,
      user.name,
      user.email,
    )
    return authResponse(
      StatusCodes.OK,
      `Welcome ${user.name} to our platform.`,
      user.role,
      tokens.accessToken,
      tokens.refreshToken,
    )
  }

  const session = await User.startSession()
  session.startTransaction()

  try {
    const created = await User.create(
      [
        {
          email,
          profile: profileImage,
          name: resolvedName,
          verified: true,
          status: USER_STATUS.ACTIVE,
          appId: id,
          provider: 'google',
          role: payload.role,
          password: crypto.randomUUID(),
        },
      ],
      { session },
    )

    if (!created?.[0]) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user')
    }

    const tokens = AuthHelper.createToken(
      created[0]._id,
      created[0].role,
      created[0].name,
      created[0].email,
    )

    await session.commitTransaction()

    return authResponse(
      StatusCodes.OK,
      `Welcome ${created[0].name} to our platform.`,
      created[0].role,
      tokens.accessToken,
      tokens.refreshToken,
    )
  } catch (error: any) {
    await session.abortTransaction()
    if (error instanceof ApiError) throw error
    if (error?.code === 11000) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'An account with this email already exists.',
      )
    }
    throw error
  } finally {
    session.endSession()
  }
}

export const PassportAuthServices = {
  handleGoogleLogin,
}
