import { Pool } from "jsr:@db/postgres";
import { validateBody } from "./validate.js";
import { verifyPassword } from "./hash.js";

export const pool = new Pool({
    hostname: Deno.env.get("PG_HOST"),
    port: Deno.env.get("PG_PORT"),
    user: Deno.env.get("PG_USER"),
    password: Deno.env.get("PG_PASSWORD"),
    database: Deno.env.get("PG_DATABASE"),
}, 10);

export async function sendRequest({request, body}) {

    const client = await pool.connect();

    if (validateBody({request: request, body: body})) {
        let result;
        switch (request) {
            case "register": {
                try {
                    console.log("registering");
                    result = await client.queryObject(
                        `SELECT registerCustomer($1,$2,$3,$4,$5,$6,$7,$8);`,
                        body.email,
                        body.password,
                        body.f_name,
                        body.l_name,
                        body.address,
                        body.city,
                        body.country,
                        body.phone
                      );                      
                } catch (error) {
                    console.log("There seems to have been some error registering you, make sure you entered properly filled information", error);
                } finally {
                    console.log("You are now registered!", result.rows[0]);
                    client.release();
                }
                break;
            }
            case "admin_login": {
                try {

                } catch (error) {

                } finally {

                }
            break;
            }
            case "customer_login": {
                try {
                    console.log("logging in");
                    const result = await client.queryObject(`SELECT * FROM online_store.app_user WHERE email = $1`, body.email);
                    if (result.rows.length === 0)    {
                        throw new Error("Email not found")
                    }

                    console.log(result);

                    const user = result.rows[0];
                    const valid = await verifyPassword(body.password, user.password_hashed);

                    if (!valid) {
                        throw new Error("Incorrect password")
                    }

                } catch (error) {
                    console.log("Email or password incorrect, please try again", error);
                } finally {
                    console.log("You are now logged in! ", result.rows[0].f_name);
                    client.release();
                }
                break;
            } case "view_products": {
                try {
                    console.log("Fetching products");
                    //const result = await client.queryArray("SELECT * FROM PRODUCTS") typ
                } catch (error) {
                    console.log("There seems to have been some error", error);
                } finally {
                    client.release();
                }
            }
        }
    } else {
        
    }
}