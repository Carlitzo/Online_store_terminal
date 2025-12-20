import { Pool } from "jsr:@db/postgres";
import { validateBody } from "./validate.js";

export const pool = new Pool({
    hostname: 'localhost',
    port: 55432,
    user: 'ao7026',
    password: 'j678xg27',
    database: 'ao7026',
}, 10)

export async function initDatabase() {
    // flytta detta till en egen fil
}

export async function sendRequest({request, body}) {

    const client = await pool.connect();

    if (validateBody({request: request, body: body})) {
        switch (request) {
            case "register":
                // client.queryObject(`INSERT ${user} INTO online_store.app_user`);
                try {
                    await client.queryObject(
                        `SELECT registerCustomer($1,$2,$3,$4,$5,$6,$7);`,
                        body.f_name,
                        body.l_name,
                        body.email,
                        body.password,
                        body.phone,
                        body.address,
                        body.city
                      );                      
                } catch (error) {
                    console.log("There seems to have been some error registering you, make sure you entered properly filled information", error);
                } finally {
                    client.release();
                }
                break;
            case "login":
                break;
        }
    } else {
        
    }
}