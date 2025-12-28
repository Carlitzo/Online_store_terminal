import { Client } from "jsr:@db/postgres";
import { validateBody } from "./validate.js";
import { verifyPassword } from "./hash.js";
import "jsr:@std/dotenv/load";
import { log } from "node:console";

export const client = new Client({
    hostname: Deno.env.get("PG_HOST"),
    port: Deno.env.get("PG_PORT"),
    user: Deno.env.get("PG_USER"),
    password: Deno.env.get("PG_PASSWORD"),
    database: Deno.env.get("PG_DATABASE"),
});

export async function sendRequest({request, body}) {

    await client.connect();

    if (validateBody({request: request, body: body})) {
        let result;
        switch (request) {
            case "register": {
                try {
                    console.log("registering");
                    result = await client.queryObject(
                        `SELECT online_store.registerCustomer($1::text,$2::text,$3::text,$4::text,$5::text,$6::text,$7::text,$8::text);`,
                        [
                        body.email,
                        body.password,
                        body.first_name,
                        body.last_name,
                        body.address,
                        body.city,
                        body.country,
                        body.phone
                        ]
                      );
                      console.log(result);
                      return { success: true, message: result.rows[0].registerCustomer};
                } catch (error) {
                    return { success: false, message: result };
                } finally {
                    client.end();
                }
            }
            case "admin_login": {
                try {
                    console.log("admin logging in");
                    result = await client.queryObject('SELECT * FROM online_store.app_user WHERE email = $1 AND role = $2', [body.email, 'admin']);
                    console.log(body.email);
                    console.log(result);
                    if (result.rows.length === 0)    {
                        return { success: false, message: "User not found"};
                    }
                    console.log(result);
                    const user = result.rows[0];
                    const valid = await verifyPassword(body.password, user.password_hashed);
                    if (!valid) {
                        return { success: false, message: "Incorrect password"};
                    }
                    return { success: true, message: user.first_name};
                } catch (error) {
                    console.log("There was an error");
                    return { success: false, message: error};
                } finally {
                    client.end();
                }
            }
            case "customer_login": {
                try {
                    console.log("logging in");
                    result = await client.queryObject(`SELECT * FROM online_store.app_user WHERE email = $1`, [body.email]);
                    if (result.rows.length === 0)    {
                        return { success: false, message: "User not found"};
                    }
                    console.log(result);
                    const user = result.rows[0];
                    const valid = await verifyPassword(body.password, user.password_hashed);
                    if (!valid) {
                        return { success: false, message: "Incorrect password"};
                    }
                    return { success: true, message: user};
                } catch (error) {
                    return { success: false, message: error};
                } finally {
                    client.end();
                }
            } case "view_all_products": {
                try {
                    console.log("Fetching products");
                    const result = await client.queryObject(`SELECT * FROM online_store.all_products`);
                    if (result.rows.length === 0) {
                        return { success: false, message: "No products found"};
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error};
                } finally {
                    client.end();
                }
            }
        }
    } else {
        
    }
}