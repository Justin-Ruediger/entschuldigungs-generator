var database;
const password = require("./password");
module.exports = function (_database) {

    database = _database;
    module = {register, userExists, login};
    return module;
}
//register function
async function register(name, address, city, email, psw) {
    if (await userExists(email)) {
        return false;
    }
    try {
        var hash = await password.getHash(psw);
        database.query("INSERT INTO `users`(`name`, `address`, `city`, `email`, `password`) VALUES (?, ?, ?, ?, ?)", [name, address, city, email, hash]);
        console.log("User registered");
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}
async function userExists(email) {
    var result = await database.query("SELECT id FROM users WHERE email = ?", [email]);
    var userExists = result && result.length > 0;
    return userExists;
}
async function login(email, psw) {
    var result = await database.query("SELECT `password`, `id` FROM `users` WHERE email = ?", [email]);
    if (!result || !(result.length > 0)) {
        return false;
    }
    var userhash = result[0]["password"];
    console.log(result);
    var login = await password.compare(psw, userhash);
    return login ? result[0]["id"] : false;
}
