import { IAuthProvider } from "../interfaces/IAuthProvider.js";
import { LoginRequest } from "../models/LoginRequest.js";
import { LoginResponse } from "../models/LoginResponse.js";
import { Session } from "../models/Session.js";
import { SessionService } from "../services/SessionService.js";
import { MockUsers } from "./mock-users.js";

export class MockAuthProvider implements IAuthProvider {

    constructor(
        private readonly sessionService = new SessionService()
    ) {}

    async login(
        _request: LoginRequest
    ): Promise<LoginResponse> {

        if (!_request.username?.trim()) {

            return {

                success: false,

                message: "Username is required"

            };

        }

        const user =
            this.authenticate(_request.username);

        if (!user) {

            return {

                success: false,

                message: "Invalid Username"

            };

        }

        const session =
            await this.sessionService.createSession(user);

        return {

            success: true,

            message: "Login Successful",

            session

        };

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

    /**
     * Mock Authentication
     */
    private authenticate(username: string) {

        return MockUsers.find(

            user => user.username === username

        );

    }

}