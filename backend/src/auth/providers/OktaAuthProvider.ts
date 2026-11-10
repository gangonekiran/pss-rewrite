import { IAuthProvider } from "../interfaces/IAuthProvider.js";
import { LoginRequest } from "../models/LoginRequest.js";
import { LoginResponse } from "../models/LoginResponse.js";
import { Session } from "../models/Session.js";

export class OktaAuthProvider implements IAuthProvider {

    async login(_request: LoginRequest): Promise<LoginResponse> {
        console.log("Okta Provider login called with request:", _request);
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