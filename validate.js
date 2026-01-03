export function validateBody({request, body}) {
    //switch case som kontrollerar vilken request och hur bodyn bör vara formatterad.
   switch (request) {
        case "admin_login": {
            console.log("inside admin_login validate");
            if (!body.email || !body.password) {
                return false;
            } return true;
        }
        case "customer_login": {
            console.log("inside login validate");
            if (!body.email || !body.password) {
                return false;
            } return true;
        }
        case "register": {
            console.log("inside register validate");
            if (!body.email || !body.password || !body.first_name || !body.last_name || !body.address || !body.city || !body.country || !body.phone) {
                return false;
            } return true;
        }
        case "view_all_products": {
            console.log("inside view_all_products");
            return true;
        }
        case "search_products": {
            if (!body.choice || !body.value) {
                return false;
            } return true;
        }
        case "create_order": {
            if (!body.items || !body.user_id) {
                return false;
            } return true;
        }
        case "get_orders": {
            if (!body.user_id) {
                return false;
            } return true;
        }
        case "get_order": {
            if (!body.order_id) {
                return false;
            } return true;
        }
    }
}