import * as repo from "./input-form.repository";
import type { FormName, InputFormRecord } from "./input-form.types";
function validate(childId:number,id?:number){if(!Number.isInteger(childId)||childId<=0)throw Object.assign(new Error("Invalid ChildID"),{status:400});if(id!==undefined&&(!Number.isInteger(id)||id<=0))throw Object.assign(new Error("Invalid form ID"),{status:400});}
export const getByChildId=(f:FormName,c:number)=>{validate(c);return repo.findByChildId(f,c)};
export const getOne=async(f:FormName,c:number,id:number)=>{validate(c,id);const r=await repo.findOne(f,c,id);if(!r)throw Object.assign(new Error("Form record not found"),{status:404});return r};
export const create=(f:FormName,c:number,p:InputFormRecord)=>{validate(c);return repo.insert(f,c,p)};
export const update=async(f:FormName,c:number,id:number,p:InputFormRecord)=>{validate(c,id);const r=await repo.update(f,c,id,p);if(!r)throw Object.assign(new Error("Form record not found"),{status:404});return r};
export const remove=async(f:FormName,c:number,id:number)=>{validate(c,id);if(!await repo.remove(f,c,id))throw Object.assign(new Error("Form record not found"),{status:404});return {deleted:true};};
