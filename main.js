import { Console } from "node:console";
import { connectDB, sendRequest, client } from "./db.js";
import { hashPassword } from "./hash.js";
import "jsr:@std/dotenv/load";

async function userInput(message = "> ") {
    return prompt(message);
}

let admin_logged_in = false;
let customer_logged_in = false;
let logged_in_customer_id;

async function main() {
    console.log("ONLINE MUSIC STORE");
    let current_date = new Date();

    while (true) {
    
        console.log("Please select one of the given alternatives:");
        console.log("1. Admin login");
        console.log("2. Customer login");
        console.log("3. Register user");
        console.log("4. View store-products");
        console.log("5. Search for products");
        console.log("6. Select date");
        console.log("7. View my orders");
        console.log("8. Exit");
        if (admin_logged_in) {
            console.log("9. Manage discounts (admin only)");
            console.log("10. Add products (admin only)");
            console.log("11. Remove products (admin only)");
            console.log("12. Add supplier (admin only)");
            console.log("13. Remove supplier (admin only)");
            console.log("14. Manage orders");
            console.log("15. Edit quantity of product");
        }
        console.log("Select by typing the associated number.");
        //Admin-meny: Ska kunna lägga till rabatter, justera dem nuvarande rabatterna, lägga till produkter, ta bort produkter,
        //lägga till leverantörer, ta bort leverantörer. (finns fler grejer men kommer inte på)

    
        const choice = await userInput("Choose: ");
    
        switch (choice) {
            case "1": {
                let admin_email = await userInput("Please enter your admin email: ");
                let admin_password = await userInput("Please enter your admin password: ");
                console.log("sending request");
                const result = await sendRequest({request: "admin_login", body: {email: admin_email, password: admin_password}});
                if (result?.success) {
                    admin_logged_in = true;
                    console.log("You are now logged in as admin: ", result.message);
                } else {
                    console.log(result.message);
                }
            break;
            };
            case "2": {
                let customer_email = await userInput("Please enter your customer email: ");
                let customer_password = await userInput("Please enter your customer password: ");
                const result = await sendRequest({request: "customer_login", body: {email: customer_email, password: customer_password}});
                if (result?.success) {
                    customer_logged_in = true;
                    logged_in_customer_id = result.message.user_id;
                    console.log("You are now logged in as customer: ", result.message.first_name);
                } else {
                    console.log(result);
                }
            break;
            };
            case "3": {
                let register_first_name = await userInput("Please enter your first name: ");
                let register_last_name = await userInput("Please enter your last name: ");
                let register_email = await userInput("Please enter your email: ");
                let register_password = await userInput("Please enter your password: ");
                let register_phone = await userInput("Please enter your phonenumber: ");
                let register_address = await userInput("Please enter your address: ");
                let register_city = await userInput("Please enter your city of residence: ");
                let register_country = await userInput("Please enter your country of residence: ");
                const result = await sendRequest({
                    request: "register",
                    body: {
                        first_name: register_first_name,
                        last_name: register_last_name,
                        email: register_email,
                        password: await hashPassword(register_password),
                        phone: register_phone,
                        address: register_address,
                        city: register_city,
                        country: register_country
                    }
                });
                if (result?.success) {
                    console.log(result.message);
                } else {
                    console.log(result.message);
                }
            break;
            };
            case "4": {
                const result = await sendRequest({ request: "view_all_products", body: {date: current_date}});
                if (result?.success) {
                    console.log("Products: ");
                    result.message.forEach((p) => {
                        console.log(`${p.prod_id}: ${p.name} - ${p.base_price}kr - Quantity: ${p.quantity} - Supplier: ${p.supplier} - Discount ${p.percentage ?? 0}`);
                    })
                    if (customer_logged_in) {
                        let items = [];

                        while (true) {
                            let number_of_item = Number(await userInput("Please enter the number of the item you would like to purchase\n 0 to exit "));
                            if (number_of_item === 0) break;

                            let item = result.message.find(p => p.prod_id === number_of_item);
                            if (!item) {
                                console.log("Invalid product number, please try again.");
                                continue;
                            }

                            let amount = Number(await userInput("Enter amount: "));

                            while (amount > item.quantity || amount <= 0) {
                                amount = Number(await userInput("Cannot exceed available quantity or be <= 0, try again: "));
                            }

                            items.push({
                                prod_id: item.prod_id,
                                amount: amount
                            })

                            console.log(`Added ${amount} x ${item.name} to the cart`);
                        }

                        if (items.length > 0) {
                            console.log("Final cart:", items);
                            const confirm = await userInput("Would you like to pay for your order? If not, type cancel");
                            if (confirm == "cancel") {
                                break;
                            }
                            const orderResult = await sendRequest({ request: "create_order", body: {user_id: logged_in_customer_id, items: items, p_date: current_date} });
                            if (orderResult?.success) {
                                console.log("Order created with id: ", orderResult.message[0].create_order);
                            } else {
                                console.log(orderResult.message);
                            }
                        } else {
                            console.log("Cart is empty. No items to purchase.");
                        }
                    } else {
                        console.log("Please log in if you wish to purchase products.");
                    }
                } else {
                    console.log(result.message);
                }
            }
            break;
            case "5": {
                console.log("Search by:");
                console.log("1. Product name");
                console.log("2. Product code");
                console.log("3. Supplier");
                console.log("4. Price (max)");
                console.log("5. Discounted products");

                const choice = await userInput("Choose: ");

                let value;
                if (choice !== "5") {
                    value = await userInput("Enter search value: ");
                } else {
                    value = current_date;
                }

                const result = await sendRequest({ request: "search_products",  body: { choice: choice, value: value }});

                if (result?.success && choice === "5") {
                    console.log("Result of search");
                    for (let item of result.message) {
                        console.log("Product id: ", item.prod_id);
                        console.log("Name: ", item.name);
                        console.log("Base price: ", item.base_price);
                        console.log("Available quantity: ", item.quantity);
                        console.log("Supplier: ", item.supplier);
                        console.log("Discount: ", item.discount);
                        console.log("_____________________________");
                    }
                    break;
                };

                if (result?.success) {
                    console.log("Result of search");
                    for (let item of result.message) {
                        console.log("Product id: ", item.prod_id);
                        console.log("Name: ", item.name);
                        console.log("Base price: ", item.base_price);
                        console.log("Available quantity: ", item.quantity);
                        console.log("Supplier: ", item.supplier);
                        console.log("_____________________________");
                    }
                };
            }
            break;
            case "6": {
                console.log("This is the current date: ", current_date.toISOString().slice(0,10));
                console.log("Please enter the date you would like to set.");
                let year = await userInput("Start with the year please: ", "(YYYY)");
                let month = await userInput("Now the month: ", "(Month 1-12)");
                let day = await userInput("Now the day please: ", "(Day (1-31))");
                current_date = new Date(year, month - 1, day);
                console.log("Updated the date to: ", current_date.toISOString().slice(0,10));
            }
            break;
            case "7": {
                if (!logged_in_customer_id) {
                    console.log("You must log in before we can check your orders!");
                    break;
                }

                let result = await sendRequest({ request: "get_orders", body: { user_id: logged_in_customer_id }});

                if (result?.success) { 
                    console.log("Your current orders:");
                    for (let order of result.message) {
                        console.log("order_id: ", order.order_id);
                        console.log(order.created_at);
                        console.log(order.status);
                    }
                    while (true) {
                        let choice = await userInput("Would you like to view the products of any order? Please type the number of the order_id or exit if not.");
                        if (choice.toLowerCase() == "exit") {
                            break;
                        } else {
                            result = await sendRequest({ request: "get_order", body: { order_id: choice }});

                            for (let item of result.message) {
                                console.log(`
                                Product: ${item.product_name}
                                Product ID: ${item.product_id}
                                Quantity: ${item.quantity}
                                Unit price: ${item.unit_price} kr
                                Discount: ${item.discount_percentage} %
                                Total price: ${item.total_price}
                                `);
                              }
                        }
                    }
                } else {
                    console.log(result.message);
                }
            }
            break;
            case "8": {
                await client.end();
                console.log("Exiting program.");
                Deno.exit(0);
            }
            break;
            case "9": {
                if (admin_logged_in) {
                    console.log("Would you like to: ");
                    console.log("1: Create a new discount");
                    console.log("2: Add products to a set discount");
                    console.log("3: View all discounts");
                    let choice = await userInput("Please choose: ");
    
                    if (choice == "1") {
                        let discount_code = await userInput(`Please enter a discount code("BLACKFRIDAY"): `);
                        let discount_percentage = await userInput("Please enter a discount percentage: ");
                        let discount_reason = await userInput(`Please enter a discount reason("Black friday discount"): `);
                        let result = await sendRequest({ request: "create_discount", body: {
                            discount_code: discount_code,
                            discount_percentage: discount_percentage,
                            discount_reason: discount_reason
                        } });

                        if (result?.success) {
                            console.log("Discount created: ")
                            console.log("Code: ", result.message.code);
                            console.log("Percentage: ", result.message.percentage);
                            console.log("Reason: ", result.message.reason);
                        } else {
                            console.log(result.message);
                        }
                    } else if (choice == "2") {

                        let result = await sendRequest({ request: "view_all_products", body: {date: current_date}});

                        if (result?.success) {
                            console.log("Products: ");
                            result.message.forEach((p) => {
                                console.log(`${p.prod_id}: ${p.name} - ${p.base_price}kr - Quantity: ${p.quantity} - Supplier: ${p.supplier} - Discount ${p.percentage ?? 0}`);
                            })
                        };

                        let products_to_apply = await userInput("Please type the id of the products to apply discount to separated by comma.");
                        console.log("Example: 1,2,5,3");

                        products_to_apply = products_to_apply.split(",").map(id => Number(id.trim()));

                        let discounts = await sendRequest({ request: "get_discounts"});

                        if (discounts?.success) {
                            console.log("Discounts: \n")
                            for (let discount of discounts.message) {
                                console.log("Discount id: ", discount.discount_id);
                                console.log("Discount code: ", discount.code);
                                console.log("Discount percentage: ", discount.percentage);
                                console.log("Discount reason: ", discount.reason);
                                console.log("-----------------------------------")
                            };
                        };

                        let discount_to_apply = await userInput("Please type the id of the discount to apply to the selected products.");

                        let start_date = await userInput("Please enter the start_date of the discount. ('YYYY-MM-DD')");
                        let end_date = await userInput("Please enter the end_date of the discount. ('YYYY-MM-DD')");

                        let apply_discount = await sendRequest({ request: "apply_discount", body: { discount: discount_to_apply, products: products_to_apply, start_date: start_date, end_date: end_date }});

                        if (apply_discount?.success) {
                            console.log("Discount applied to products:");
                            apply_discount.message.forEach(r =>
                              console.log("Product ID:", r.product_id)
                            );
                        };
                    } else if (choice === "3") {
                        let result = await sendRequest({ request: "get_discounts" });

                        if (result?.success) {
                            console.log("Discounts: \n")
                            for (let discount of result.message) {
                                console.log("Discount id: ", discount.discount_id);
                                console.log("Discount code: ", discount.code);
                                console.log("Discount percentage: ", discount.percentage);
                                console.log("Discount reason: ", discount.reason);
                                console.log("-----------------------------------")
                            };
                        };
                    }
                } 
            }
            break;
            case "10": {
                if (admin_logged_in) {
                    let product_name = await userInput("What is the name of the product you would like to add?");
                    
                    let product_types = await sendRequest({ request: "get_product_types" });
                    if (product_types?.success) {
                        console.log("Current product types to choose from: ");
                        for (let type of product_types.message) {
                            console.log(type.name);
                        };
                    };
                    let product_type_name = await userInput("What is the name of the product type?");
                    
                    let suppliers = await sendRequest({ request: "get_suppliers" });
                    if (suppliers?.success) {
                        console.log("Current suppliers to choose from: ");
                        for (let supplier of suppliers.message) {
                            console.log(supplier.name);
                        };
                    };
                    let supplier_name = await userInput("What is the name of the supplier of this product?");

                    let base_price = await userInput("What is the base-price of the product?");
                    let quantity = await userInput("How many of these products would you like to add? Integers please");

                    let add_product = await sendRequest({ request: "add_product", body: { name: product_name, product_type: product_type_name, supplier: supplier_name, base_price: base_price, quantity: quantity }});

                    if (add_product?.success) {
                        console.log("Product created: ");
                        for (let product of add_product.message) {
                            console.log("Name: ", product.name);
                            console.log("Product type: ", product_type_name);
                            console.log("Product supplier: ", supplier_name);
                            console.log("Base price: ", product.base_price);
                            console.log("Quantity: ", product.quantity);
                        }
                    }
                }
            }
            break;
            case "11": {
                if (admin_logged_in) {
                    let products = await sendRequest({ request: "view_all_products", body: { date: current_date }});

                    if (products?.success) {
                        console.log("Products: ");
                        products.message.forEach((p) => {
                            console.log(`${p.prod_id}: ${p.name} - ${p.base_price}kr - Quantity: ${p.quantity} - Supplier: ${p.supplier} - Discount ${p.percentage ?? 0}`);
                        })
                    }

                    let product_to_remove = await userInput("Please enter the product ID of the product you wish to remove.");

                    let result = await sendRequest({ request: "remove_product", body: { prod_id: product_to_remove } });

                    if (result?.success) {
                        console.log(result.message[0].remove_product);
                    }
                }
            }
            break;
        }
    }
}

await connectDB();

await main();