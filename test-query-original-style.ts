
import { mysqlPool } from "./server/simpledfe/mysql-config";

async function testQueryOriginalStyle() {
  try {
    const limit = "10";
    const offset = 0;
    const searchCondition = "";
    const searchParams: any[] = [];
    const sortBy = "company_id";
    const sortOrder = "asc";

    const dataQuery = `
      SELECT 
        company_id,
        company_name,
        company_fantasy,
        company_cpf_cnpj,
        company_email,
        company_city,
        company_uf
      FROM company 
      ${searchCondition}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    console.log("Executing query with LIMIT ? OFFSET ? and String params...");
    const [companies] = await mysqlPool.execute(dataQuery, [
      ...searchParams,
      String(parseInt(limit)),
      String(offset)
    ]) as any;

    console.log("Success! Found companies:", companies.length);
    if (companies.length > 0) {
      console.log("First company:", companies[0]);
    }

  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    process.exit();
  }
}

testQueryOriginalStyle();
