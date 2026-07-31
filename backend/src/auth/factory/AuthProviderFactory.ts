import { AuthConfig } from "../../config/auth";
import { AuthProviderType } from "../enums/AuthProviderType";
import { IAuthProvider } from "../interfaces/IAuthProvider";
import { MockAuthProvider } from "../providers/MockAuthProvider";
import { OktaAuthProvider } from "../providers/OktaAuthProvider";

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