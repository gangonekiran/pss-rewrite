import { Session } from "./Session.js";

export interface LoginResponse {
    success:boolean;
    message:string;
    session?:Session;
}