import { getPool, sql } from "../../config/database";
import { Client } from "./client.types";

export async function getAllClients() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT *
    FROM Clients
    ORDER BY LastName, FirstName
  `);

  return result.recordset;
}

export async function getClientById(id: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT *
      FROM Clients
      WHERE Id = @id
    `);

  return result.recordset[0];
}

export async function createClient(c: Client) {
  const pool = await getPool();

  await pool
    .request()
    .input("clientNumber", sql.NVarChar, c.clientNumber)
    .input("firstName", sql.NVarChar, c.firstName)
    .input("middleName", sql.NVarChar, c.middleName ?? null)
    .input("lastName", sql.NVarChar, c.lastName)
    .input("gender", sql.Char, c.gender)
    .input("birthDate", sql.Date, c.birthDate)
    .input("ssn", sql.NVarChar, c.ssn)
    .input("region", sql.NVarChar, c.region)
    .input("nonEI", sql.Bit, c.nonEI)
    .input("status", sql.NVarChar, c.status)
    .query(`
      INSERT INTO Clients
      (
        ClientNumber,
        FirstName,
        MiddleName,
        LastName,
        Gender,
        BirthDate,
        SSN,
        Region,
        NonEI,
        Status
      )
      VALUES
      (
        @clientNumber,
        @firstName,
        @middleName,
        @lastName,
        @gender,
        @birthDate,
        @ssn,
        @region,
        @nonEI,
        @status
      )
    `);
}

export async function updateClient(id: number, c: Client) {
  const pool = await getPool();

  await pool
    .request()
    .input("id", sql.Int, id)
    .input("firstName", sql.NVarChar, c.firstName)
    .input("lastName", sql.NVarChar, c.lastName)
    .input("gender", sql.Char, c.gender)
    .query(`
      UPDATE Clients
      SET
        FirstName = @firstName,
        LastName = @lastName,
        Gender = @gender,
        UpdatedAt = GETDATE()
      WHERE Id = @id
    `);
}

export async function deleteClient(id: number) {
  const pool = await getPool();

  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Clients WHERE Id = @id");
}

export async function searchLastName(search: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .query(`
      SELECT TOP 20 Id, LastName
      FROM Clients
      WHERE LastName LIKE @search
      ORDER BY LastName
    `);

  return result.recordset;
}

export async function searchFirstName(search: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .query(`
      SELECT TOP 20 Id, FirstName
      FROM Clients
      WHERE FirstName LIKE @search
      ORDER BY FirstName
    `);

  return result.recordset;
}

export async function searchSSN(search: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .query(`
      SELECT TOP 20 Id, SSN
      FROM Clients
      WHERE SSN LIKE @search
    `);

  return result.recordset;
}