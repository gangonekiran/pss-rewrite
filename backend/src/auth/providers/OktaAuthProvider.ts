import { IAuthProvider } from "../interfaces/IAuthProvider";
import { LoginRequest } from "../models/LoginRequest";
import { LoginResponse } from "../models/LoginResponse";
import { Session } from "../models/Session";

export class OktaAuthProvider implements IAuthProvider {

    async login(request: LoginRequest): Promise<LoginResponse> {

        throw new Error("Okta Provider is not implemented yet.");

    }

    async logout(): Promise<void> {

        return;

    }

    async getSession(): Promise<Session | null> {

        return null;

    }

    async refreshToken(): Promise<Session | null> {

        return null;

    }

}