import { AuthUser } from "../models/AuthUser";
import { Role } from "../enums/Role";

export class AuthorizationService {

    hasRole(user: AuthUser, role: Role): boolean {

        return user.roles.includes(role);

    }

    hasAnyRole(user: AuthUser, roles: Role[]): boolean {

        return roles.some(role => user.roles.includes(role));

    }

    hasPermission(user: AuthUser, permission: string): boolean {

        return user.permissions.includes("*") ||
               user.permissions.includes(permission);

    }

}