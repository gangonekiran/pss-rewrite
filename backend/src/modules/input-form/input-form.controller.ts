import type {Request,Response} from "express";
import * as service from "./input-form.service";
import type {FormName} from "./input-form.types";
const f=(r:Request)=>r.params.form as FormName; const c=(r:Request)=>Number(r.params.childId); const id=(r:Request)=>Number(r.params.id);
export const getByChildId=async(r:Request,s:Response)=>s.json(await service.getByChildId(f(r),c(r)));
export const getOne=async(r:Request,s:Response)=>s.json(await service.getOne(f(r),c(r),id(r)));
export const create=async(r:Request,s:Response)=>s.status(201).json(await service.create(f(r),c(r),r.body??{}));
export const update=async(r:Request,s:Response)=>s.json(await service.update(f(r),c(r),id(r),r.body??{}));
export const remove=async(r:Request,s:Response)=>s.json(await service.remove(f(r),c(r),id(r)));
