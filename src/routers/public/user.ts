import { Router } from "express";
import { getUserById } from "../../controllers/user";

const userRouter = Router();

/**
 * @swagger
 * /public/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: |
 *       Retrieves user information by their unique identifier.
 *       
 *       **Note:** This endpoint is currently public but may require authentication in future versions.
 *       Consider implementing proper authorization checks based on user roles.
 *     tags: [Users]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique user identifier
 *         example: "1a2b3c4d5e6f"
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: "User retrieved successfully"
 *               data:
 *                 id: "1a2b3c4d5e6f"
 *                 username: "johndoe"
 *                 email: "john.doe@example.com"
 *                 gender: "male"
 *                 dob: "2000-01-01"
 *                 coins: 100
 *                 createdAt: "2024-01-01T12:00:00Z"
 *                 updatedAt: "2024-01-01T12:00:00Z"
 *       400:
 *         description: User ID is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Bad Request"
 *               message: "User ID is required"
 *               statusCode: 400
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Not Found"
 *               message: "User not found."
 *               statusCode: 404
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
userRouter.get('/:id', getUserById);

export default userRouter;