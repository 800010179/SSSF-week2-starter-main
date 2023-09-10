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
import {Types} from 'mongoose';
import {User} from '../../interfaces/User';
import jwt from 'jsonwebtoken';
import catModel from '../models/catModel';
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
    const user = await UserModel.findById(decodedToken.id).select(
      '-__v -password'
    );
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    const cats = await CatModel.find(user.id).select('-__v');
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
    const {minLat, minLng, maxLat, maxLng} = req.body;
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat],
              ],
            ],
          },
        },
      },
    }).select('-__v');
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
    const {id} = req.params;
    const {owner} = req.body;
    if (!Types.ObjectId.isValid(id)) {
      next(new CustomError('Invalid id', 400));
      return;
    }
    if (!Types.ObjectId.isValid(owner)) {
      next(new CustomError('Invalid owner id', 400));
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
    const user = await UserModel.findById(owner);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    cat.owner = owner;
    await cat.save();
    res.json(cat);
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
    const user = await UserModel.findById(id);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    if (user.role !== 'admin') {
      next(new CustomError('Only admin can delete any users cat', 401));
      return;
    }
    const cat = await CatModel.findByIdAndDelete(id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    res.json(cat);
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
    if (!Types.ObjectId.isValid(decodedToken.id)) {
      next(new CustomError('Invalid owner id', 400));
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
    if (decodedToken.id !== cat.owner.toString()) {
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
    if (!Types.ObjectId.isValid(decodedToken.id)) {
      next(new CustomError('Invalid owner id', 400));
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

    const cat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      })
      .select('-__v');
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

const catPost = async (req: Request, res: Response, next: NextFunction) => {
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
    const cat = await catModel.create(req.body);
    const output: DBMessageResponse = {
      message: 'Cat created',
      data: cat,
    };
    res.status(201).json(output);
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
