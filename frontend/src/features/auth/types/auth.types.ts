export interface LoginRequest{username:string;password:string;rememberMe:boolean;}
export interface User{id:number;username:string;fullName:string;role:string;}
export interface LoginResponse{success:boolean;user:User;accessToken:string;}
