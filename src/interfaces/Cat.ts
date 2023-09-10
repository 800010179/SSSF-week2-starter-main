// TODO: cat interface
import {Point} from 'geojson';
import {Document, Types} from 'mongoose';

interface Cat extends Document {
  cat_name: string;
  weight: number;
  filename: string;
  birthdate: Date;
  location: Point;
  owner: Types.ObjectId;
}

export {Cat};
