// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat
// - catPut - only owner can update cat
// - catGet - get cat by id
// - catListGet - get all cats
// - catPost - create new cat

import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import CatModel from '../models/catModel';
import UserModel from '../models/userModel';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {validationResult} from 'express-validator';
import mongoose, {Types} from 'mongoose';
import {User} from '../../interfaces/User';
import jwt from 'jsonwebtoken';
import {Cat} from '../../interfaces/Cat';
import {ObjectId} from 'mongodb';
const catGetByUser = async (
  req: Request,
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
    const user = await UserModel.findById(decodedToken._id).select(
      '-__v -password'
    );
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    const cats2 = await CatModel.find();
    console.log('cats2', cats2[0].owner);
    const ownerId = new ObjectId(decodedToken._id);
    console.log('ownerId', ownerId);
    const cats = await CatModel.find({
      owner: new mongoose.Types.ObjectId(decodedToken._id),
    });
    console.log('catuser', decodedToken);
    if (!cats || cats.length === 0) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
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
    const topRight = req.query.topRight.split(',');
    const bottomLeft = req.query.bottomLeft.split(',');
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $box: [
            [Number(bottomLeft[0]), Number(bottomLeft[1])],
            [Number(topRight[0]), Number(topRight[1])],
          ],
        },
      },
    });
    if (!cats || cats.length === 0) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catPutAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;

    const user = await UserModel.findById(decodedToken._id).select(
      '-__v -password'
    );
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    if (user.role !== 'admin') {
      next(new CustomError('User not Admin', 404));
      return;
    }
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select('-__v');
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'Cat updated',
      data: cat,
    };
    res.json(output);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catDeleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;

    const user = await UserModel.findById(decodedToken._id).select(
      '-__v -password'
    );
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    if (user.role !== 'admin') {
      next(new CustomError('User not Admin', 404));
      return;
    }
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const cat = await CatModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(output);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    const {id} = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;
    if (!Types.ObjectId.isValid(id)) {
      next(new CustomError('Invalid id', 400));
      return;
    }
    const catToGet = await CatModel.findById(id);
    if (!catToGet) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    if (decodedToken._id !== catToGet.owner.toString()) {
      next(new CustomError('Not owner of cat', 400));
      return;
    }
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const cat = await CatModel.findById(id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    if (decodedToken._id !== cat.owner.toString()) {
      next(new CustomError('Only owner can delete cat', 401));
      return;
    }
    await CatModel.findByIdAndDelete(id);
    const output: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(output);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catPut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    const {id} = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('No token provided', 401));
      return;
    }
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;
    if (!Types.ObjectId.isValid(id)) {
      next(new CustomError('Invalid id', 400));
      return;
    }
    const catToGet = await CatModel.findById(id);
    if (!catToGet) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    if (decodedToken._id !== catToGet.owner.toString()) {
      next(new CustomError('Not owner of cat', 400));
      return;
    }
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select('-__v');
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'Cat updated',
      data: cat,
    };
    res.json(output);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    const {id} = req.params;
    if (!Types.ObjectId.isValid(id)) {
      next(new CustomError('Invalid id', 400));
      return;
    }
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const cat = await CatModel.findById(id).select('-__v');
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    res.json(cat);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await CatModel.find().select('-__v');
    if (!cats || cats.length === 0) {
      next(new CustomError('No cats found', 404));
      return;
    }
    res.json(cats);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

const catPost = async (
  req: Request<{}, {}, Cat>,
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
    const decodedUser = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as User;
    console.log('catti', req.file?.path);
    console.log('dd');
    const cat = await CatModel.create({
      ...req.body,
      owner: decodedUser._id,
      filename: req.file?.path,
      location: res.locals.coords,
    });

    console.log(cat);
    const output: DBMessageResponse = {
      message: 'Cat created',
      data: cat,
    };
    res.status(200).json(output);
  } catch (err) {
    next(new CustomError('Something went wrong with the server', 500));
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
};
