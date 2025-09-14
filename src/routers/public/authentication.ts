import { Router } from "express";
import { login, register, resendAccountActivation, resendOtp, validateEmail, validateOtp } from "../../controller/authentication";
import rateLimit from "express-rate-limit";

const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again after a minute."
})

const authenticationRouter = Router()

authenticationRouter.get('/activate_email', validateEmail)
authenticationRouter.get('/validate_otp', validateOtp)
authenticationRouter.get('/resend_otp', resendOtp)
authenticationRouter.get('/resend_account_activation', resendAccountActivation)

authenticationRouter.post('/login', loginRateLimiter, login);
authenticationRouter.post('/register', register)

export default authenticationRouter;