// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from req.user. No need for database query

import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import {User} from '../../interfaces/User';
import UserModel from '../models/userModel';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {validationResult} from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }
    const user = await UserModel.findById(req.params.id).select('-password');
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    res.status(200).json(user);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserModel.find().select('-password');
    if (!users || users.length === 0) {
      next(new CustomError('No users found', 404));
      return;
    }
    res.json(users);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }
    const user = req.body;

    user.password = await bcrypt.hash(user.password, 12);
    user.role = 'user';
    const newUser = await UserModel.create(user);
    const response: DBMessageResponse = {
      message: 'User created',
      data: {
        user_name: newUser.user_name,
        email: newUser.email,
        _id: newUser._id,
      },
    };

    res.json(response);
  } catch (error) {
    next(new CustomError('User creation failed', 500));
  }
};

const userPutCurrent = async (
  req: Request<{id: string}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;
    const user = await UserModel.findById(decodedToken.id).select('-password');
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    await UserModel.findByIdAndUpdate(decodedToken.id, req.body, {
      new: true,
    }).select('-__v');
    const response: DBMessageResponse = {
      message: 'User updated',
      data: {
        user_name: user.user_name,
        email: user.email,
        _id: user._id,
      },
    };
    res.json(response);
  } catch (error) {
    next(new CustomError('User update failed', 500));
  }
};

const userDeleteCurrent = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;
    const user = await UserModel.findById(decodedToken.id).select('-password');
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    await UserModel.findByIdAndDelete(decodedToken.id);
    const response: DBMessageResponse = {
      message: 'User deleted',
      data: {
        user_name: user.user_name,
        email: user.email,
        _id: user._id,
      },
    };
    res.json(response);
  } catch (error) {
    next(new CustomError('User deletion failed', 500));
  }
};

const checkToken = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;

    //TODO: check if token is valid without database query
    if (!decodedToken) {
      next(new CustomError('Token is invalid', 401));
      return;
    }
    const response: DBMessageResponse = {
      message: 'Token is valid',
      data: {
        user_name: req.body.user_name,
        email: req.body.email,
        _id: req.body._id,
      },
    };
    res.json(response);
  } catch (error) {
    next(new CustomError('Token is invalid', 401));
  }
};

export {
  userDeleteCurrent,
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  checkToken,
};
