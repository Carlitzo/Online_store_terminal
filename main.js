import { sendRequest } from "./db.js";
import { hashPassword } from "./hash.js";

async function userInput(message = "> ") {
    return prompt(message);
}

async function main() {

    while (true) {
        let current_date = new Date().getFullYear(); //User ska kunna ändra på detta värdet genom en user-meny
    
        console.clear();
        console.log("ONLINE STORE");
        console.log("Please select one of the given alternatives:");
        console.log("1. Admin login");
        console.log("2. Customer login");
        console.log("3. Register");
        console.log("4. View store-products");
        console.log("5. Select date");
        console.log("6. Exit");
    
        const choice = await userInput("Choose: ");
    
        switch (choice) {
            case "1":
                let admin_username = await userInput("Please enter your admin username: ");
                let admin_password = await userInput("Please enter your admin password: ");
                await sendRequest({request: "login", body: {username: admin_username, password: admin_password}});
            break;
            case "2":
                let customer_username = await userInput("Please enter your customer username: ");
                let customer_password = await userInput("Please enter your customer password: ");
                await sendRequest({request: "login", body: {username: customer_username, password: customer_password}});
            break;
            case "3":
                let register_first_name = await userInput("Please enter your first name: ");
                let register_last_name = await userInput("Please enter your last name: ");
                let register_email = await userInput("Please enter your email: ");
                let register_password = await userInput("Please enter your password: ");
                let register_phone = await userInput("Please enter your phonenumber: ");
                let register_address = await userInput("Please enter your address: ");
                let register_city = await userInput("Please enter your city of residence: ");
                let register_country = await userInput("Please enter your country of residence: ");
                await sendRequest({
                    request: "register",
                    body: {
                        f_name: register_first_name,
                        l_name: register_last_name,
                        email: register_email,
                        password: await hashPassword(register_password), //Skapa funktionen hashPassword
                        phone: register_phone,
                        address: register_address,
                        city: register_city,
                        country: register_country
                    }
                });
            break;
            case "4":
            break;
            case "5":
            break;
            case "6":
            break;
        }
    }
}

await main();
