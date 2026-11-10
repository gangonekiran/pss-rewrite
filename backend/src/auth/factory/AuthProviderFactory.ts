import { AuthConfig } from "../../config/auth.js";
import { AuthProviderType } from "../enums/AuthProviderType.js";
import { IAuthProvider } from "../interfaces/IAuthProvider.js";
import { MockAuthProvider } from "../providers/MockAuthProvider.js";
import { OktaAuthProvider } from "../providers/OktaAuthProvider.js";

export class AuthProviderFactory {

    static getProvider(): IAuthProvider {

        switch (AuthConfig.provider) {

            case AuthProviderType.MOCK:
                return new MockAuthProvider();

            case AuthProviderType.OKTA:
                return new OktaAuthProvider();

            default:
                throw new Error(
                    `Authentication Provider '${AuthConfig.provider}' is not supported.`
                );

        }

    }

}