const bcrypt = require('bcrypt');
const saltRounds = 10;

async function getHash(psw) {
    const hash = await bcrypt.hash(psw, saltRounds);
    return hash;
}
async function compare(psw, hash) {
    const result = await bcrypt.compare(psw, hash);
    return result;
}
module.exports = {getHash, compare}