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

                      return { success: true, message: result.rows[0]};
                } catch (error) {
                    return { success: false, message: result };
                }
            }
            case "admin_login": {
                try {
                    console.log("admin logging in");
                    result = await client.queryObject('SELECT * FROM online_store.app_user WHERE email = $1 AND role = $2', [body.email, 'admin']);

                    if (result.rows.length === 0)    {
                        return { success: false, message: "User not found"};
                    }

                    const user = result.rows[0];
                    const valid = await verifyPassword(body.password, user.password_hashed);
                    if (!valid) {
                        return { success: false, message: "Incorrect password"};
                    }
                    return { success: true, message: user.first_name};
                } catch (error) {
                    console.log("There was an error");
                    return { success: false, message: error};
                }
            }
            case "customer_login": {
                try {
                    console.log("logging in");
                    result = await client.queryObject(`SELECT * FROM online_store.app_user WHERE email = $1`, [body.email]);
                    if (result.rows.length === 0) {
                        return { success: false, message: "User not found"};
                    }

                    const user = result.rows[0];
                    const valid = await verifyPassword(body.password, user.password_hashed);
                    if (!valid) {
                        return { success: false, message: "Incorrect password"};
                    }
                    return { success: true, message: user};
                } catch (error) {
                    return { success: false, message: error};
                }
            } case "view_all_products": {
                try {
                    console.log("Fetching products");
                    result = await client.queryObject(`SELECT * FROM online_store.all_products($1::timestamp)`, [body.date.toISOString()]);
                    
                    if (result.rows.length === 0) {
                        return { success: false, message: "No products found"};
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error};
                }
            } case "search_products": {
                try {
                    console.log("searching for products");
                    switch(body.choice) {
                        case "1": {
                            result = await client.queryObject(`SELECT * FROM online_store.products_by_name($1::text)`, [body.value]);
                            break;
                        }
                        case "2": {
                            result = await client.queryObject(`SELECT * FROM online_store.products_by_code($1::int)`, [Number(body.value)]);
                            break;
                        }
                        case "3": {
                            result = await client.queryObject(`SELECT * FROM online_store.products_by_supplier($1::text)`, [body.value]);
                            break;
                        }
                        case "4": {
                            result = await client.queryObject(`SELECT * FROM online_store.products_by_price($1::int)`, [Number(body.value)]);
                            break;
                        }
                        case "5": {
                            result = await client.queryObject(`SELECT * FROM online_store.products_by_discount($1::timestamp)`, [body.value]);
                            break;
                        }
                    }

                    if (result.rows.length === 0 && body.choice === "5") {
                        return { success: false, message: "No products with discounts available."};
                    }

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result found"};
                    }
                    
                    return { success: true, message: result.rows};
                } catch (error) {
                    return { success: false, message: error};
                }
            } case "create_order": {
                try {
                    console.log("creating order");
                    result = await client.queryObject(`SELECT online_store.create_order($1::int, $2::jsonb, $3::timestamp)`, [Number(body.user_id), JSON.stringify(body.items), body.p_date.toISOString()]);
    
                    console.log(result);
                    if (result.rows.length === 0) {
                        return { success: false, message: "Something went wrong, no order created" };
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    console.log(error);
                    return { success: false, message: error };
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
                }
            } case "get_order": {
                try {
                    console.log("getting order");

                    result = await client.queryObject(`SELECT * FROM online_store.get_order_items($1)`, [Number(body.order_id)]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No orders found" };
                    }
                    return { success: true, message: result.rows };
                } catch (error) {
                    console.log(error);
                    return { success: false, message: error};
                }
            } case "create_discount": {
                try {
                    console.log("creating discount");

                    result = await client.queryObject(`INSERT INTO online_store.discount (code, percentage, reason)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (code) DO NOTHING
                        RETURNING *
                        `, [body.discount_code, Number(body.discount_percentage), body.discount_reason]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "Discount code already exists!" };
                    }

                    return { success: true, message: result.rows[0] };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "get_discounts": {
                try {
                    console.log("getting discounts");

                    result = await client.queryObject(`SELECT * FROM online_store.discount`);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No discounts found" };
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "apply_discount": {
                try {
                    console.log("applying discounts");

                    result = await client.queryObject(`
                        INSERT INTO online_store.product_discount (product_id, discount_id, start_date, end_date)
                        SELECT UNNEST($1::int[]), $2::int, $3::timestamp, $4::timestamp
                        RETURNING product_id, discount_id`, 
                        [body.products, Number(body.discount), body.start_date, body.end_date]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result"};
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "get_product_types": {
                try {
                    console.log("getting product types");
                    result = await client.queryObject(`SELECT name FROM online_store.product_type`);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result"};
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: true, message: error};
                }
            } case "get_suppliers": {
                try {
                    console.log("getting suppliers");
                    result = await client.queryObject(`SELECT name FROM online_store.supplier`);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result"};
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "add_product": {
                try {
                    console.log("adding product");

                    let typeResult = await client.queryObject(`SELECT prod_type_id FROM online_store.product_type
                                                               WHERE name = $1`, [body.product_type]);

                    if (typeResult.rows.length === 0) {
                        return { success: false, message: "No type found" };
                    }
                    typeResult = typeResult.rows[0].prod_type_id;

                    let supplierResult = await client.queryObject(`SELECT sup_id FROM online_store.supplier WHERE name = $1`,
                        [body.supplier]
                    );

                    if (supplierResult.rows.length === 0) {
                        return { success: false, message: "No supplier found" };
                    }

                    supplierResult = supplierResult.rows[0].sup_id;

                    result = await client.queryObject(`INSERT INTO online_store.product(name, prod_type_id, supplier_id, base_price, quantity)
                        VALUES($1, $2, $3, $4, $5) RETURNING *`, [body.name, typeResult, supplierResult, body.base_price, body.quantity]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result"};
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "remove_product": {
                try {
                    console.log("removing product");
                    result = await client.queryObject(`SELECT * FROM online_store.remove_product($1::int)`, [Number(body.prod_id)]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result"};
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "add_supplier": {
                try {
                    console.log("adding supplier");
                    result = await client.queryObject(`INSERT INTO online_store.supplier(name, email, phone)
                                                       VALUES ($1, $2, $3) RETURNING *`, [body.name, body.email, body.phone]);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result" };
                    }

                    return { success: true, message: result.rows[0] };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "get_all_orders": {
                try {
                    console.log("getting all orders");
                    result = await client.queryObject(`SELECT * FROM online_store.customer_order WHERE status = 'pending'`);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result" };
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "confirm_order": {
                try {
                    console.log("confirming order");
                    result = await client.queryObject(`UPDATE online_store.customer_order SET status = 'confirmed' WHERE order_id = $1
                        RETURNING order_id, status`,
                        [body.order_id]
                    );

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result"};
                    }

                    return { success: true, message: result.rows[0] };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "edit_quantity": {
                try {
                    console.log("editing quantity");

                    if (body.alter === "increase") {
                        result = await client.queryObject(`UPDATE online_store.product SET quantity = quantity + $2 WHERE prod_id = $1
                            RETURNING name, prod_id, quantity`,
                            [body.product, body.amount]
                        );
                    } else if (body.alter === "diminish") {
                        result = await client.queryObject(`UPDATE online_store.product SET quantity = quantity - $2 WHERE prod_id = $1
                            RETURNING name, prod_id, quantity`,
                            [body.product, body.amount]);
                    }

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result" };
                    }

                    return { success: true, message: result.rows[0] };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "cancel_order": {
                try {
                    console.log("cancelling order");

                    result = await client.queryObject(`SELECT * FROM online_store.cancel_order($1,$2)`,
                                                        [Number(body.order_id), Number(body.user_id)]);

                    if (!result.rows[0].success) {
                        return { success: false, message: result.rows[0].message };
                    }

                    return { success: true, message: result.rows[0].message };
                } catch (error) {
                    return { success: false, message: error };
                }
            } case "get_discount_history": {
                try {
                    console.log("getting discount history");

                    result = await client.queryObject(`SELECT * FROM online_store.get_discount_history()`);

                    if (result.rows.length === 0) {
                        return { success: false, message: "No result found" };
                    }

                    return { success: true, message: result.rows };
                } catch (error) {
                    return { success: false, message: error };
                }
            }
        }
    } else {
        
    }
}