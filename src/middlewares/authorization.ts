import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { securityConfig } from "../configs/securityConfig";
import { RoleType } from "../models/identity";
import { tokenRepository } from "../repositories/token";

// Extend Express Request so we can attach user info
declare module "express" {
  interface Request {
    user?: {
      userId: string;
      roleId: RoleType;
      token: string;
    };
  }
}

// Middleware factory (can accept allowed roles)
export const authorize =
  (allowedRoles: RoleType[] = []) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
      }

      const token = authHeader.split(" ")[1];

      // Verify JWT signature
      const decoded = jwt.verify(token, securityConfig.jwtSecret) as JwtPayload;

      // Extract user payload
      const payload = decoded.payload as {
        userId: string;
        roleId: RoleType;
      };

      if (!payload?.userId || !payload?.roleId) {
        return res.status(403).json({ message: "Invalid token payload" });
      }

      // Check token in DB (revocation)
      const storedToken = await tokenRepository.getTokenByUserId(payload.userId);
      if (!storedToken || storedToken !== token) {
        return res.status(403).json({ message: "Token revoked or not valid" });
      }

      // Check role-based access
      if (allowedRoles.length > 0 && !allowedRoles.includes(payload.roleId)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }

      // Attach user to request
      req.user = { userId: payload.userId, roleId: payload.roleId, token };

      next();
    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
