import { Client } from "jsr:@db/postgres";
import { validateBody } from "./validate.js";
import { verifyPassword } from "./hash.js";
import "jsr:@std/dotenv/load";

export const client = new Client({
    hostname: Deno.env.get("PG_HOST"),
    port: Deno.env.get("PG_PORT"),
    user: Deno.env.get("PG_USER"),
    password: Deno.env.get("PG_PASSWORD"),
    database: Deno.env.get("PG_DATABASE"),
});

export async function connectDB() {
    await client.connect();
}

export async function sendRequest({request, body}) {

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
                }
            } case "view_all_products": {
                try {
                    console.log("Fetching products");
                    result = await client.queryObject(`SELECT * FROM online_store.all_products`);
                    if (result.rows.length === 0) {
                        return { success: false, message: "No products found"};
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error};
                } finally {
                }
            } case "search_products": {
                try {
                    console.log("searching for products");
                    switch(body.choice) {
                        case "1": {
                            result = await client.queryObject(`SELECT online_store.products_by_name($1::text)`, [body.value]);
                            break;
                        }
                        case "2": {
                            result = await client.queryObject(`SELECT online_store.products_by_code($1::int)`, [Number(body.value)]);
                            break;
                        }
                        case "3": {
                            result = await client.queryObject(`SELECT online_store.products_by_supplier($1::text)`, [body.value]);
                            break;
                        }
                        case "4": {
                            result = await client.queryObject(`SELECT online_store.products_by_price($1::int)`, [Number(body.value)]);
                            break;
                        }
                        case "5": {
                            result = await client.queryObject(``);
                            break;
                        }
                    }

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result found"};
                    }
                    return { success: true, message: result.rows};
                } catch (error) {
                    return { success: false, message: error};
                } finally {
                }
            } case "create_order": {
                try {
                    console.log("creating order");
                    result = await client.queryObject(`SELECT online_store.create_order($1::int, $2::jsonb)`, [Number(body.user_id), JSON.stringify(body.items)]);
    
                    console.log(result);
                    if (result.rows.length === 0) {
                        return { success: false, message: "Something went wrong, no order created" };
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    console.log(error);
                    return { success: false, message: error };
                } finally {
                }
            } case "get_orders": {
                try {
                    console.log("getting orders");
                    
                    result = await client.queryObject(`SELECT * from online_store.customer_order WHERE user_id = $1`, [Number(body.user_id)]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No orders found" };
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    console.log(error);
                    return { success: false, message: error };
                } finally {
                }
            } case "get_order": {
                try {
                    console.log("getting order");

                    result = await client.queryObject(`SELECT online_store.get_order_items($1::int)`, [Number(body.order_id)]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No orders found" };
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    console.log(error);
                    return { success: false, message: error};
                } finally {
                }
            }
        }
    } else {
        
    }
}