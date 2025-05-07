import { ethers } from "hardhat";
const utils = require("../scripts/utils");

import { config } from "./config";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("deployer address:", deployer.address);
    const factory = await ethers.getContractAt("PancakeFactory", config.factory);
    const token = await ethers.getContractAt("SnowToken", config.snow);

    const masterChef = await utils.deployAndVerify("MasterChef", [
        token.address,
        config.feeAddress, //dev address
        config.feeAddress, //fee address
        config.zap,
        config.startTime,
    ]);
    // await token.transferOwnership(masterChef.address);
    const snowwethPair = await factory.getPair(config.weth, token.address);
    const wethUSDCPair = await factory.getPair(config.usdc, config.weth);

    // adding new pool
    console.log("adding new pool...");
    await masterChef.add(850, snowwethPair, 100, false, false);
    await masterChef.add(0, wethUSDCPair, 1000, false, false);
    await masterChef.add(150, config.snow, 300, false, false);
    await masterChef.add(0, config.weth, 300, false, false);
    await masterChef.add(0, config.nft, 0, false, true);

    console.log("done");

    console.log({
        token: token.address,
        masterChef: masterChef.address,
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
