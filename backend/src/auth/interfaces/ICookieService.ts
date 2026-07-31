export interface ICookieService {

    set(name:string,value:string):void;

    get(name:string):string | undefined;

    remove(name:string):void;

}