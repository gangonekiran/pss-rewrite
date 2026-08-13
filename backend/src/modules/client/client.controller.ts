import { Request, Response } from "express";
import * as s from "./client.service";
export const getAllClients = async (_: Request, res: Response) =>
  res.json(await s.getAllClients());
export const getClient = async (req: Request, res: Response) =>
  res.json(await s.getClient(Number(req.params.id)));
export const createClient = async (req: Request, res: Response) => {
  await s.createClient(req.body);
  res.status(201).json({ message: "Client created" });
};
export const updateClient = async (req: Request, res: Response) => {
  await s.updateClient(Number(req.params.id), req.body);
  res.json({ message: "Client updated" });
};
export const deleteClient = async (req: Request, res: Response) => {
  await s.deleteClient(Number(req.params.id));
  res.json({ message: "Client deleted" });
};
export const searchLastName = async (req: Request, res: Response) =>
  res.json(await s.searchLastName(String(req.query.search || "")));
export const searchFirstName = async (req: Request, res: Response) =>
  res.json(await s.searchFirstName(String(req.query.search || "")));
export const searchSSN = async (req: Request, res: Response) =>
  res.json(await s.searchSSN(String(req.query.search || "")));

export const getClientStatus = async (req: Request, res: Response) => {
  const childId = Number(req.params.id);

  if (!childId || Number.isNaN(childId)) {
    return res.status(400).json({
      message: "Invalid ChildID",
    });
  }

  const dateParam = req.query.date;

  const statusDate =
    typeof dateParam === "string" && dateParam.trim()
      ? dateParam
      : new Date().toISOString().substring(0, 10);

  const result = await s.getClientStatus(childId, statusDate);

  return res.json(result);
};
