import User from "../models/User.js";
import asyncHandler from "../middleware/async.js";
import ErrorResponse from "../utils/errorResponse.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this route`,
        401
      )
    );
  }

  const users = await User.find().select("-password");

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this route`,
        401
      )
    );
  }

  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
