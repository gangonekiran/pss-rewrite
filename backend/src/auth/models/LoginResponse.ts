import { Session } from "./Session";

export interface LoginResponse {
    success:boolean;
    message:string;
    session?:Session;
}