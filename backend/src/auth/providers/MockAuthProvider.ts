import { IAuthProvider } from "../interfaces/IAuthProvider";
import { LoginRequest } from "../models/LoginRequest";
import { LoginResponse } from "../models/LoginResponse";
import { Session } from "../models/Session";
import { SessionService } from "../services/SessionService";
import { MockUsers } from "./mock-users";

export class MockAuthProvider implements IAuthProvider {

    constructor(
        private readonly sessionService = new SessionService()
    ) {}

    async login(
        request: LoginRequest
    ): Promise<LoginResponse> {

        if (!request.username?.trim()) {

            return {

                success: false,

                message: "Username is required"

            };

        }

        const user =
            this.authenticate(request.username);

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