import { Router } from "express";
import { login, register, resendAccountActivation, resendOtp, validateEmail, validateOtp } from "../../controllers/authentication";
import rateLimit from "express-rate-limit";

const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again after a minute."
})

const authenticationRouter = Router()

/**
 * @swagger
 * /public/authentication/activate_email:
 *   get:
 *     summary: Activate user email account
 *     description: Validates email activation token and activates the user account
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: activation_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email activation token
 *         example: "a1b2c3d4e5f6g7h8"
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: "john.doe@example.com"
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "1a2b3c4d5e6f"
 *     responses:
 *       200:
 *         description: Email activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateResponse'
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing activation token or user ID."
 *       401:
 *         description: Invalid or expired activation token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid or Expired activation code"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authenticationRouter.get('/activate_email', validateEmail)

/**
 * @swagger
 * /public/authentication/validate_otp:
 *   get:
 *     summary: Validate OTP for two-factor authentication
 *     description: Validates the OTP sent to user's email and returns JWT token
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: otp
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *         description: 6-digit OTP code
 *         example: "123456"
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username or email address
 *         example: "john.doe@example.com"
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "1a2b3c4d5e6f"
 *     responses:
 *       200:
 *         description: OTP validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateResponse'
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing otp or user ID or email"
 *       401:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid or Expired activation code"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authenticationRouter.get('/validate_otp', validateOtp)

/**
 * @swagger
 * /public/authentication/resend_otp:
 *   get:
 *     summary: Resend OTP to user's email
 *     description: Generates and sends a new OTP to the specified email address
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: "OTP sent"
 *       400:
 *         description: Missing email parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing email"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authenticationRouter.get('/resend_otp', resendOtp)

/**
 * @swagger
 * /public/authentication/resend_account_activation:
 *   get:
 *     summary: Resend account activation email
 *     description: Generates and sends a new account activation email to the user
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *         example: "john.doe@example.com"
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "1a2b3c4d5e6f"
 *     responses:
 *       200:
 *         description: Activation email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: "Account activation email sent"
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing email or user ID"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authenticationRouter.get('/resend_account_activation', resendAccountActivation)

/**
 * @swagger
 * /public/authentication/login:
 *   post:
 *     summary: User login
 *     description: |
 *       Authenticates user credentials and returns JWT token or initiates OTP verification.
 *       
 *       **Flow:**
 *       1. If credentials are valid and account is enabled - Returns JWT token directly (if existing token is valid) OR sends OTP and returns user_id (if token expired/missing)
 *       2. If account is not enabled - sends activation email
 *       3. If credentials are invalid - returns error
 *       
 *       **Rate Limited:** 5 attempts per minute per IP
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful - JWT token returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       489:
 *         description: OTP verification required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPRequiredResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid password"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User not found"
 *       423:
 *         description: Account not enabled - activation email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Account not enabled please check email"
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Too many login attempts from this IP, please try again after a minute."
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authenticationRouter.post('/login', loginRateLimiter, login);

/**
 * @swagger
 * /public/authentication/register:
 *   post:
 *     summary: User registration
 *     description: |
 *       Creates a new user account and sends activation email.
 *       
 *       **Process:**
 *       1. Validates input data
 *       2. Checks if email already exists
 *       3. Hashes password
 *       4. Creates user account (disabled by default)
 *       5. Sends activation email
 *       
 *       **Note:** Account must be activated via email before login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             user_registration:
 *               summary: Standard user registration
 *               value:
 *                 username: "johndoe"
 *                 email: "john.doe@example.com"
 *                 password: "SecurePass123!"
 *             admin_registration:
 *               summary: Admin registration (if role specified)
 *               value:
 *                 username: "admin"
 *                 email: "admin@example.com"
 *                 password: "AdminPass123!"
 *                 role: "ADMIN"
 *     responses:
 *       200:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: "Account created successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email address is already in use."
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authenticationRouter.post('/register', register)

export default authenticationRouter;