import { getPool, sql } from "../../config/database";
import { Client } from "./client.types";

/**
 * Get All Clients
 */
export async function getAllClients() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT *
    FROM stblPeople
    ORDER BY LastName, FirstName
  `);

  return result.recordset;
}

/**
 * Get Client By ChildID
 */
export async function getClientById(id: number) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("ChildID", sql.Int, id)
    .query(`
      SELECT *
      FROM stblPeople
      WHERE ChildID = @ChildID
    `);

  return result.recordset[0];
}

/**
 * Create Client
 */
export async function createClient(client: Client) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("Region", sql.VarChar(50), client.region ?? null)
    .input("LastName", sql.VarChar(100), client.lastName)
    .input("FirstName", sql.VarChar(100), client.firstName)
    .input("SS", sql.VarChar(11), client.ss ?? null)
    .input("SSTemp", sql.Bit, client.ssTemp ?? false)
    .input("DOB", sql.Date, client.dob ?? null)
    .input("Gender", sql.Char(1), client.gender ?? null)
    .input("Notes", sql.NVarChar(sql.MAX), client.notes ?? null)
    .input("InsertUser", sql.VarChar(100), client.insertUser ?? "SYSTEM")
    .input(
      "NonEarlyIntervention",
      sql.Bit,
      client.nonEarlyIntervention ?? false
    )
    .query(`
      DECLARE @NextChildID INT;

      SELECT @NextChildID = ISNULL(MAX(ChildID),0) + 1
      FROM stblPeople;

      INSERT INTO stblPeople
      (
          ChildID,
          Region,
          LastName,
          FirstName,
          SS,
          SSTemp,
          DOB,
          Gender,
          Notes,
          InsertUser,
          NonEarlyIntervention
      )
      VALUES
      (
          @NextChildID,
          @Region,
          @LastName,
          @FirstName,
          @SS,
          @SSTemp,
          @DOB,
          @Gender,
          @Notes,
          @InsertUser,
          @NonEarlyIntervention
      );

      SELECT *
      FROM stblPeople
      WHERE ChildID = @NextChildID;
    `);

  return result.recordset[0];
}

/**
 * Update Client
 */
export async function updateClient(
  id: number,
  client: Client
) {
  const pool = await getPool();

  await pool
    .request()
    .input("ChildID", sql.Int, id)
    .input("Region", sql.VarChar(50), client.region ?? null)
    .input("LastName", sql.VarChar(100), client.lastName)
    .input("FirstName", sql.VarChar(100), client.firstName)
    .input("SS", sql.VarChar(11), client.ss ?? null)
    .input("SSTemp", sql.Bit, client.ssTemp ?? false)
    .input("DOB", sql.Date, client.dob ?? null)
    .input("Gender", sql.Char(1), client.gender ?? null)
    .input("Notes", sql.NVarChar(sql.MAX), client.notes ?? null)
    .input(
      "LastUpdateUser",
      sql.VarChar(100),
      client.lastUpdateUser ?? null
    )
    .input(
      "NonEarlyIntervention",
      sql.Bit,
      client.nonEarlyIntervention ?? false
    )
    .query(`
      UPDATE stblPeople
      SET
          Region = @Region,
          LastName = @LastName,
          FirstName = @FirstName,
          SS = @SS,
          SSTemp = @SSTemp,
          DOB = @DOB,
          Gender = @Gender,
          Notes = @Notes,
          LastUpdateDate = GETDATE(),
          LastUpdateUser = @LastUpdateUser,
          NonEarlyIntervention = @NonEarlyIntervention
      WHERE ChildID = @ChildID
    `);
}

/**
 * Delete Client
 */
export async function deleteClient(id: number) {
  const pool = await getPool();

  await pool
    .request()
    .input("ChildID", sql.Int, id)
    .query(`
      DELETE FROM stblPeople
      WHERE ChildID = @ChildID
    `);
}

/**
 * Search By Last Name
 */
export async function searchLastName(search: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("search", sql.VarChar(100), `%${search}%`)
    .query(`
      SELECT TOP 20
          ChildID,
          LastName,
          FirstName
      FROM stblPeople
      WHERE LastName LIKE @search
      ORDER BY LastName, FirstName
    `);

  return result.recordset;
}

/**
 * Search By First Name
 */
export async function searchFirstName(search: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("search", sql.VarChar(100), `%${search}%`)
    .query(`
      SELECT TOP 20
          ChildID,
          FirstName,
          LastName
      FROM stblPeople
      WHERE FirstName LIKE @search
      ORDER BY FirstName, LastName
    `);

  return result.recordset;
}

/**
 * Search By SSN
 */
export async function searchSSN(search: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("search", sql.VarChar(20), `%${search}%`)
    .query(`
      SELECT TOP 20
          ChildID,
          SS,
          FirstName,
          LastName
      FROM stblPeople
      WHERE SS LIKE @search
      ORDER BY LastName, FirstName
    `);

  return result.recordset;
}