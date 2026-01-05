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
            if (!body.date) {
                return false;
            } return true;
        }
        case "search_products": {
            if (!body.choice || !body.value) {
                return false;
            } return true;
        }
        case "create_order": {
            if (!body.items || !body.user_id || !body.date) {
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
        case "create_discount": {
            if (!body.discount_code || !body.discount_percentage || !body.discount_reason) {
                return false;
            } return true;
        }
        case "get_discounts": {
            return true;
        }
        case "apply_discount": {
            if (!body.discount || !body.products || !body.start_date || !body.end_date) {
                return false;
            } return true;
        }
        case "get_product_types": {
            return true;
        }
        case "get_suppliers": {
            return true;
        }
        case "add_product": {
            if (!body.name || !body.product_type || !body.supplier || !body.base_price || !body.quantity) {
                return false;
            } return true;
        }
        case "remove_product": {
            if (!body.prod_id) {
                return false;
            } return true;
        }
    };
};