import cors from 'cors'
import express, { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import path from 'path'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import passport from './app/modules/auth/passport.auth/config/passport'
import router from './routes'
import { Morgan } from './shared/morgan'
import globalErrorHandler from './app/middleware/globalErrorHandler'
import handleStripeWebhook from './stripe/handleStripeWebhook'
import config from './config'


const app = express()

// -------------------- Stripe Webhook --------------------
app.use(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
)

// -------------------- Middleware --------------------
// Session must come before passport
app.use(
  session({
    secret: config.jwt.jwt_secret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
  }),
)

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
)

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Cookie parser
app.use(cookieParser())

// Morgan logging
app.use(Morgan.successHandler)
app.use(Morgan.errorHandler)

// -------------------- Static Files --------------------
app.use(express.static('uploads'))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))


// -------------------- API Routes --------------------

app.use('/api/v1', router)

// -------------------- Privacy Policy --------------------
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'))
})

// -------------------- Root / Live Response --------------------
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #0e0525;
      color: #ffffff;
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      text-align: center;
      overflow: hidden;
    ">
      <div style="max-width: 700px; padding: 2rem;">
        <h1 style="
          font-size: 2.4rem;
          margin-bottom: 1.2rem;
          letter-spacing: 0.5px;
          color: #00ffe0;
        ">
          🚀 Welcome to the API Server
        </h1>
        <p style="
          font-size: 1.1rem;
          line-height: 1.7;
          color: #cfcff9;
          opacity: 0.9;
        ">
          This server is up and running successfully. ✅<br><br>
          To explore available endpoints, please refer to the API documentation.<br>
          If you’re seeing this page, it means the base route <code style='color:#00ffe0;'>‘/’</code> is not intended for direct access.
        </p>
        <p style="
          margin-top: 2rem;
          font-size: 0.95rem;
          opacity: 0.6;
          color: #aaa;
        ">
          © ${new Date().getFullYear()} — All rights reserved.
        </p>
      </div>
    </div>
  `);
});





// -------------------- Global Error Handler --------------------
app.use(globalErrorHandler)

// -------------------- 404 Handler --------------------
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Lost, are we?',
    errorMessages: [
      {
        path: req.originalUrl,
        message:
          "Congratulations, you've reached a completely useless API endpoint 👏",
      },
      {
        path: '/docs',
        message: 'Hint: Maybe try reading the docs next time? 📚',
      },
    ],
    roast: '404 brain cells not found. Try harder. 🧠❌',
    timestamp: new Date().toISOString(),
  })
})

export default app
