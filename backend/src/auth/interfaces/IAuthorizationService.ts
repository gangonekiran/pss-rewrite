export interface IAuthorizationService {

    hasRole(role:string):boolean;

    hasPermission(permission:string):boolean;

}