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

  console.log("Creating client:", client);

  const request = pool.request();

  request.input(
    "Region",
    sql.VarChar(50),
    client.region ? String(client.region) : null,
  );

  request.input(
    "LastName",
    sql.VarChar(100),
    client.lastName ? String(client.lastName) : null,
  );

  request.input(
    "FirstName",
    sql.VarChar(100),
    client.firstName ? String(client.firstName) : null,
  );

  request.input("SS", sql.VarChar(20), client.ss ? String(client.ss) : null);

  request.input("SSTemp", sql.Bit, client.ssTemp === true);

  request.input(
    "DOB",
    sql.VarChar(10),
    client.dob && String(client.dob).trim() !== ""
      ? String(client.dob).trim()
      : null,
  );

  request.input(
    "Gender",
    sql.VarChar(1),
    client.gender && String(client.gender).trim() !== ""
      ? String(client.gender).trim().substring(0, 1)
      : null,
  );

  request.input(
    "Notes",
    sql.VarChar(4000),
    client.notes && String(client.notes).trim() !== ""
      ? String(client.notes)
      : null,
  );

  request.input(
    "InsertUser",
    sql.VarChar(100),
    client.insertUser && String(client.insertUser).trim() !== ""
      ? String(client.insertUser)
      : "SYSTEM",
  );

  request.input(
    "NonEarlyIntervention",
    sql.Bit,
    client.nonEarlyIntervention === true,
  );

  const result = await request.query(`
    DECLARE @NextChildID INT;

    SELECT @NextChildID =
      ISNULL(MAX(ChildID), 0) + 1
    FROM dbo.stblPeople;

    INSERT INTO dbo.stblPeople
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
      CONVERT(date, @DOB, 23),
      @Gender,
      @Notes,
      @InsertUser,
      @NonEarlyIntervention
    );

    SELECT *
    FROM dbo.stblPeople
    WHERE ChildID = @NextChildID;
  `);

  return result.recordset[0];
}

/**
 * Update Client
 */
export async function updateClient(id: number, client: Client) {
  const pool = await getPool();

  console.log("Updating client:", id, client);

  // Support both camelCase and database-style PascalCase fields.
  const region = client.region ?? (client as any).Region;
  const lastName = client.lastName ?? (client as any).LastName;
  const firstName = client.firstName ?? (client as any).FirstName;
  const ss = client.ss ?? (client as any).SS;
  const ssTemp = client.ssTemp ?? (client as any).SSTemp;
  const dob = client.dob ?? (client as any).DOB;
  const gender = client.gender ?? (client as any).Gender;
  const notes = client.notes ?? (client as any).Notes;
  const lastUpdateUser =
    client.lastUpdateUser ?? (client as any).LastUpdateUser;
  const nonEarlyIntervention =
    client.nonEarlyIntervention ?? (client as any).NonEarlyIntervention;

  if (!lastName || String(lastName).trim() === "") {
    throw Object.assign(new Error("LastName is required"), {
      status: 400,
    });
  }

  if (!firstName || String(firstName).trim() === "") {
    throw Object.assign(new Error("FirstName is required"), {
      status: 400,
    });
  }

  const request = pool
    .request()
    .input("ChildID", sql.Int, id)
    .input("Region", sql.VarChar(50), region ? String(region) : null)
    .input("LastName", sql.VarChar(100), String(lastName).trim())
    .input("FirstName", sql.VarChar(100), String(firstName).trim())
    .input("SS", sql.VarChar(20), ss ? String(ss) : null)
    .input("SSTemp", sql.Bit, ssTemp === true)
    .input(
      "DOB",
      sql.VarChar(10),
      dob && String(dob).trim() !== "" ? String(dob).trim() : null,
    )
    .input(
      "Gender",
      sql.VarChar(1),
      gender && String(gender).trim() !== ""
        ? String(gender).trim().substring(0, 1)
        : null,
    )
    .input(
      "Notes",
      sql.VarChar(4000),
      notes !== undefined && notes !== null ? String(notes) : null,
    )
    .input(
      "LastUpdateUser",
      sql.VarChar(100),
      lastUpdateUser ? String(lastUpdateUser) : "SYSTEM",
    )
    .input("NonEarlyIntervention", sql.Bit, nonEarlyIntervention === true);

  await request.query(`
    UPDATE dbo.stblPeople
    SET
      Region = @Region,
      LastName = @LastName,
      FirstName = @FirstName,
      SS = @SS,
      SSTemp = @SSTemp,
      DOB = CONVERT(date, @DOB, 23),
      Gender = @Gender,
      Notes = @Notes,
      LastUpdateDate = GETDATE(),
      LastUpdateUser = @LastUpdateUser,
      NonEarlyIntervention = @NonEarlyIntervention
    WHERE ChildID = @ChildID;
  `);

  return await getClientById(id);
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

/**
 * Get service history for a client.
 *
 * Source:
 *   stblServiceGridForm
 *   Services
 *   slstServiceNames
 */
export async function getServiceHistory(childId: number, statusDate?: string) {
  const pool = await getPool();

  const request = pool.request().input("ChildID", sql.Int, childId);

  let dateFilter = "";

  if (statusDate) {
    request.input("StatusDate", sql.Date, statusDate);

    dateFilter = `
      AND sgf.FormDate <= @StatusDate
    `;
  }

  const result = await request.query(`
    SELECT
      s.ID AS ServiceID,

      sgf.FormDate AS ServiceDate,

      sn.SvcName AS ServiceName,

      s.Frequency AS Frequency,

      CASE
        WHEN s.ConsentDate IS NOT NULL
          THEN 'Yes'
        ELSE 'Pending'
      END AS Consent,

      CAST(NULL AS varchar(50)) AS CasePlan

    FROM stblServiceGridForm sgf

    INNER JOIN Services s
      ON s.ServiceGridID = sgf.ServiceGridID

    LEFT JOIN slstServiceNames sn
      ON sn.SvcCode = s.SvcCode

    WHERE sgf.ChildID = @ChildID

      ${dateFilter}

    ORDER BY
      sgf.FormDate DESC,
      s.ID DESC
  `);

  return result.recordset.map((row) => ({
    id: row.ServiceID,
    date: row.ServiceDate,
    serviceName: row.ServiceName ?? "",
    frequency: row.Frequency ?? "",
    consent: row.Consent ?? "Pending",
    casePlan: row.CasePlan ?? "",
  }));
}
