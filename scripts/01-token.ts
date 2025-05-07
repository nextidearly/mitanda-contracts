import { ethers } from "hardhat";
const utils = require("../scripts/utils");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("deployer address:", deployer.address);
    // const factory = await ethers.getContractAt("PancakeFactory", config.factory);
    const token = await utils.deployAndVerify("BWSToken", []);

    // await token.mint(config.feeAddress, ethers.utils.parseEther("1050"));

    // const snowwethPair = await factory.getPair(config.weth, token.address);
    

    console.log({
        token: token.address,
        // snowwethPair: snowwethPair,
        // usdcWethPair: usdcWethPair,
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
