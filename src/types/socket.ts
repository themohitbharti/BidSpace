import { Socket } from "socket.io";
import { UserDocument } from "../models/user.models";

declare module "socket.io" {
  interface Socket {
    userId?: string;
    user?: UserDocument;
  }
}

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: UserDocument;
}
