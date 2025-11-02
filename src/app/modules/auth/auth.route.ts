import express from 'express'
import passport from 'passport'
import { PassportAuthController } from './passport.auth/passport.auth.controller'
import { CustomAuthController } from './custom.auth/custom.auth.controller'
import validateRequest from '../../middleware/validateRequest'
import { AuthValidations } from './auth.validation'
import { USER_ROLES } from '../../../enum/user'
import auth, { tempAuth } from '../../middleware/auth'
import { JwtPayload } from 'jsonwebtoken'
import { checkBusinessManage } from '../subscription/checkSubscription'
import config from '../../../config'

const router = express.Router()

router.post(
  '/signup',
  validateRequest(AuthValidations.createUserZodSchema),
  CustomAuthController.createUser,
)
router.post(
  '/admin-login',
  validateRequest(AuthValidations.loginZodSchema),
  CustomAuthController.adminLogin,
)
router.post(
  '/login',
  validateRequest(AuthValidations.loginZodSchema),
  passport.authenticate('local', { session: false }),
  PassportAuthController.login,
)

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
)

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  PassportAuthController.googleAuthCallback,
)

router.post(
  '/verify-account',
  validateRequest(AuthValidations.verifyAccountZodSchema),
  CustomAuthController.verifyAccount,
)

router.post(
  '/custom-login',
  validateRequest(AuthValidations.loginZodSchema),
  CustomAuthController.customLogin,
)

router.post(
  '/forget-password',
  validateRequest(AuthValidations.forgetPasswordZodSchema),
  CustomAuthController.forgetPassword,
)
router.post(
  '/reset-password',
  validateRequest(AuthValidations.resetPasswordZodSchema),
  CustomAuthController.resetPassword,
)

router.post(
  '/resend-otp',
  tempAuth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  validateRequest(AuthValidations.resendOtpZodSchema),
  CustomAuthController.resendOtp,
)

router.post(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  validateRequest(AuthValidations.changePasswordZodSchema),
  CustomAuthController.changePassword,
)

router.delete(
  '/delete-account',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  validateRequest(AuthValidations.deleteAccount),
  CustomAuthController.deleteAccount,
)
router.post('/refresh-token', CustomAuthController.getRefreshToken)

router.post(
  '/social-login',
  validateRequest(AuthValidations.socialLoginZodSchema),
  CustomAuthController.socialLogin,
)

router.post(
  '/logout',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  CustomAuthController.logout,
)

// -------------------- Facebook Login Routes --------------------

// 👉 Connect Facebook only
router.get(
  '/facebook',
  // auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  async (req, res, next) => {
    const user = req.user as JwtPayload

    // check how many business connected

    // if (user) {
    //   await checkBusinessManage(user)
    // }

    // flag the flow
    req.session.connectType = 'facebook'
    next()
  },
  passport.authenticate('facebook', {
    scope: [
      'email',
      'public_profile',
      'pages_show_list',
      'pages_read_engagement',
      'pages_read_user_content',
      'pages_manage_posts',
      'pages_manage_metadata',
      'pages_manage_engagement',
      'business_management',
    ],
  }),
)

// 👉 Connect Instagram (uses FB login w/ IG scopes)
router.get(
  '/instagram',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  async (req, res, next) => {
    const user = req.user as JwtPayload

    // check how many business connected

    if (user) {
      await checkBusinessManage(user)
    }
    req.session.connectType = 'instagram'
    next()
  },
  passport.authenticate('facebook', {
    scope: [
      'email',
      'public_profile',
      'pages_show_list',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'instagram_manage_comments',
      'business_management',
      'read_insights',
    ],
  }),
)

// for tiktok

// routes/social.routes.ts
router.get('/tiktok', async (req, res) => {
  console.log('hitting tiktok')
  const clientKey = config.tikok.client_id
  const redirectUri =
    'https://mill-stopped-monroe-worldwide.trycloudflare.com/tiktok/callback'
  const scopes = 'user.info.basic,video.upload,video.publish'
  const state = '68b1fd9e3a485a0f4fc4b527'
  // https://www.tiktok.com/v2/auth/authorize?client_key=sbaw91u1ke2gdjjxhi&scope=user.info.basic,video.upload&response_type=code&redirect_uri=https://mill-stopped-monroe-worldwide.trycloudflare.com/tiktok/callback&state=68b1fd9e3a485a0f4fc4b527

  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopes}&response_type=code&redirect_uri=${redirectUri}&state=${state}`

  res.redirect(url)

  // res.json({ url })
})

export const AuthRoutes = router
