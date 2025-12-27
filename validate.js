export function validateBody({request, body}) {
    //switch case som kontrollerar vilken request och hur bodyn bör vara formatterad.
   switch (request) {
        case "login": {
            console.log("inside login validate");
            if (!body.email || !body.password) {
                return false;
            } return true;
        }
        case "register": {
            console.log("inside register validate");
            if (!body.email || !body.password || !body.f_name || !body.l_name || !body.address || !body.city || !body.country || !body.phone) {
                return false;
            } return true;
        }
    }
}