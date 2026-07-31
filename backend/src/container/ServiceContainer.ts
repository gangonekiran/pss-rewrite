import { AuthService } from "../auth/services/AuthService";
import { TokenService } from "../auth/services/TokenService";
import { CookieService } from "../auth/services/CookieService";
import { SessionService } from "../auth/services/SessionService";
import { AuthorizationService } from "../auth/services/AuthorizationService";
import { AuthProviderFactory } from "../auth/factory/AuthProviderFactory";

export class ServiceContainer {

    private static tokenService = new TokenService();

    private static cookieService = new CookieService();

    private static sessionService =
        new SessionService();

    private static authorizationService =
        new AuthorizationService();

    private static authProvider =
        AuthProviderFactory.getProvider();

    private static authService =
        new AuthService(ServiceContainer.authProvider);

    static getAuthService() {
        return this.authService;
    }

    static getTokenService() {
        return this.tokenService;
    }

    static getCookieService() {
        return this.cookieService;
    }

    static getSessionService() {
        return this.sessionService;
    }

    static getAuthorizationService() {
        return this.authorizationService;
    }

}