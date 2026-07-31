import { AuthUser } from "../models/AuthUser";
import { Role } from "../enums/Role";

export const MockUsers: AuthUser[] = [

    {
        id: "1",
        username: "admin",
        email: "admin@cis.local",
        firstName: "System",
        lastName: "Admin",
        roles: [Role.ADMIN],
        permissions: ["*"],
        isAuthenticated: true
    },

    {
        id: "2",
        username: "worker",
        email: "worker@cis.local",
        firstName: "Case",
        lastName: "Worker",
        roles: [Role.CASE_WORKER],
        permissions: ["CASE_READ", "CASE_UPDATE"],
        isAuthenticated: true
    },

    {
        id: "3",
        username: "readonly",
        email: "readonly@cis.local",
        firstName: "Read",
        lastName: "Only",
        roles: [Role.READ_ONLY],
        permissions: ["CASE_READ"],
        isAuthenticated: true
    }

];