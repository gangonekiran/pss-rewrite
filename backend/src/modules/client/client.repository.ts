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

  const result = await pool.request().input("ChildID", sql.Int, id).query(`
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
      client.nonEarlyIntervention ?? false,
    ).query(`
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
export async function updateClient(id: number, client: Client) {
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
    .input("LastUpdateUser", sql.VarChar(100), client.lastUpdateUser ?? null)
    .input(
      "NonEarlyIntervention",
      sql.Bit,
      client.nonEarlyIntervention ?? false,
    ).query(`
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

  await pool.request().input("ChildID", sql.Int, id).query(`
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
    .input("search", sql.VarChar(100), `%${search}%`).query(`
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
    .input("search", sql.VarChar(100), `%${search}%`).query(`
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
    .input("search", sql.VarChar(20), `%${search}%`).query(`
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

/**
 * Get Client Status
 */
export async function getClientStatus(childId: number, statusDate: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("StatusDate", sql.VarChar(10), statusDate).query(`
      SELECT
       /* Client Notes */
      (
        SELECT TOP 1
          Notes
        FROM stblPeople
        WHERE ChildID = @ChildID
      ) AS Notes,

        /* Latest status */
        (
          SELECT TOP 1
            x.FormType
          FROM
          (
            SELECT
              FormDate,
              FormType,
              ID AS RecordID
            FROM stblActiveForm
            WHERE ChildID = @ChildID
              AND FormDate <= CONVERT(date, @StatusDate)

            UNION ALL

            SELECT
              FormDate,
              FormType,
              ID AS RecordID
            FROM stblNoOnePlanForm
            WHERE ChildID = @ChildID
              AND FormDate <= CONVERT(date, @StatusDate)

            UNION ALL

            SELECT
              FormDate,
              FormType,
              COSCoverID AS RecordID
            FROM stblCOSCoverForm
            WHERE ChildID = @ChildID
              AND FormDate <= CONVERT(date, @StatusDate)

            UNION ALL

            SELECT
              FormDate,
              FormType,
              ID AS RecordID
            FROM stblExitForm
            WHERE ChildID = @ChildID
              AND FormDate <= CONVERT(date, @StatusDate)

            UNION ALL

            SELECT
              FormDate,
              FormType,
              ID AS RecordID
            FROM stblReferralForm
            WHERE ChildID = @ChildID
              AND FormDate <= CONVERT(date, @StatusDate)

            UNION ALL

            SELECT
              FormDate,
              FormType,
              ServiceGridID AS RecordID
            FROM stblServiceGridForm
            WHERE ChildID = @ChildID
              AND FormDate <= CONVERT(date, @StatusDate)

            UNION ALL

            SELECT
              FormDate,
              FormType,
              ID AS RecordID
            FROM stblInsuranceForm
            WHERE ChildID = @ChildID
              AND FormDate <= CONVERT(date, @StatusDate)
          ) x
          ORDER BY
            x.FormDate DESC,
            x.RecordID DESC
        ) AS Status,

        /* Referral Date */
        (
          SELECT MAX(ReferralDate)
          FROM stblActiveForm
          WHERE ChildID = @ChildID
            AND ReferralDate <= CONVERT(date, @StatusDate)
        ) AS ReferralDate,

        /* No One Plan Date */
        (
          SELECT MAX(StatusDate)
          FROM stblNoOnePlanForm
          WHERE ChildID = @ChildID
            AND StatusDate <= CONVERT(date, @StatusDate)
        ) AS NoOnePlanDate,

        /* Interim Date */
        (
          SELECT MAX(InterimDate)
          FROM stblActiveForm
          WHERE ChildID = @ChildID
            AND InterimDate <= CONVERT(date, @StatusDate)
        ) AS InterimDate,

        /* One Plan Date */
        (
          SELECT MAX(OnePlanDate)
          FROM stblCOSCoverForm
          WHERE ChildID = @ChildID
            AND OnePlanDate <= CONVERT(date, @StatusDate)
        ) AS OnePlanDate,

        /* Exit Date */
        (
          SELECT MAX(ExitDate)
          FROM stblExitForm
          WHERE ChildID = @ChildID
            AND ExitDate <= CONVERT(date, @StatusDate)
        ) AS ExitDate
    `);

  const row = result.recordset[0];

  return {
    notes: row?.Notes ?? "",
    status: row?.Status ?? null,
    referralDate: row?.ReferralDate ?? null,
    noOnePlanDate: row?.NoOnePlanDate ?? null,
    interimDate: row?.InterimDate ?? null,
    onePlanDate: row?.OnePlanDate ?? null,
    exitDate: row?.ExitDate ?? null,
  };
}
