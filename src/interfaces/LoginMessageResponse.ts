import {UserOutput} from './User';
interface LoginMessageResponse {
  message: string;
  user: UserOutput;
  token: string;
}
export {LoginMessageResponse};
