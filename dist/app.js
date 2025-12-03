"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./app/modules/auth/passport.auth/config/passport"));
const routes_1 = __importDefault(require("./routes"));
const globalErrorHandler_1 = __importDefault(require("./app/middleware/globalErrorHandler"));
const config_1 = __importDefault(require("./config"));
const webhook_1 = __importDefault(require("./webhook"));
const app = (0, express_1.default)();
// ⚠️ CRITICAL: Webhook MUST be before body parsers to receive raw body
app.use(webhook_1.default);
// -------------------- Middleware --------------------
// Body parsers must come after webhook
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Session must come before passport
app.use((0, express_session_1.default)({
    secret: config_1.default.jwt.jwt_secret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// CORS
app.use((0, cors_1.default)({
    origin: [
        '*',
        'http://localhost:60851',
        'http://localhost:5173',
        'https://buddi-script-server.vercel.app',
        'https://buddi-script.vercel.app',
        'https://your-frontend.vercel.app',
    ],
    credentials: true,
}));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Logging disabled
// -------------------- Static Files --------------------
app.use(express_1.default.static('uploads'));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// -------------------- API Routes --------------------
app.use('/api/v1', routes_1.default);
// -------------------- Privacy Policy --------------------
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'privacy-policy.html'));
});
routes_1.default.get('/status', (req, res) => {
    try {
        // You can add more health checks here like:
        // - Database connection status
        // - Memory usage
        // - Other service dependencies
        const healthCheck = {
            success: true,
            message: 'Server is running smoothly',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV,
        };
        res.status(http_status_codes_1.StatusCodes.OK).json(healthCheck);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Server is experiencing issues',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// -------------------- Root / Live Response --------------------
app.get('/', (req, res) => {
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
app.use(globalErrorHandler_1.default);
// -------------------- 404 Handler --------------------
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Lost, are we?',
        errorMessages: [
            {
                path: req.originalUrl,
                message: "Congratulations, you've reached a completely useless API endpoint 👏",
            },
            {
                path: '/docs',
                message: 'Hint: Maybe try reading the docs next time? 📚',
            },
        ],
        roast: '404 brain cells not found. Try harder. 🧠❌',
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
