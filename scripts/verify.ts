const utils = require("./utils");
const config = require("./../config.js");

async function main() {
    await utils.verify('', [
    ])
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });