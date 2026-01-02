import { sendRequest } from "./db.js";
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

    while (true) {
        let current_date = new Date().getFullYear(); //User ska kunna ändra på detta värdet genom en user-meny
    
        console.log("Please select one of the given alternatives:");
        console.log("1. Admin login");
        console.log("2. Customer login");
        console.log("3. Register user");
        console.log("4. View store-products");
        console.log("5. Search for products");
        console.log("6. Select date");
        console.log("7. View my cart");
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
                const result = await sendRequest({ request: "view_all_products"});
                if (result?.success) {
                    console.log("Products: ");
                    result.message.forEach((p) => {
                        console.log(`${p.prod_id}: ${p.name} - ${p.base_price}kr - Quantity: ${p.quantity} - Supplier: ${p.supplier} `);
                        //base_price behöver senare vara rabatterat pris. En check behöver göras /(inuti sendRequest eller här?) för att kontrollera om någon rabatt finns.
                    })
                    if (customer_logged_in) {
                        let cart = {
                            customer_id: logged_in_customer_id,
                            items: []
                        };

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

                            cart.items.push({
                                prod_id: item.prod_id,
                                name: item.name,
                                amount: item.amount,
                                unit_price: item.base_price,
                                date_added: new Date().toISOString()
                            })

                            console.log(`Added ${amount} x ${item.name} to the cart`);
                        }

                        if (cart.items.length > 0) {
                            console.log("Final cart:", cart);
                            // Här kan du skicka cart till sendRequest() för att spara i databasen
                            // await sendRequest({ request: "create_order", body: cart });
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
                }

                const result = sendRequest({ request: "search_products",  body: { choice: choice, value: value }});

            }
            break;
            case "6":
            break;
        }
    }
}

await main();