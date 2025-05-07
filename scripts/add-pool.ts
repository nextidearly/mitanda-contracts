import { ethers } from "hardhat";

const config = require("../config.js");

const masterChefAddress = config.masterChefAddress;

async function addPool(masterChef, poolConfig, withUpdate = false) {
    console.log(`adding pool for ${poolConfig.name}`);
    await masterChef.add(
        poolConfig.allocation,
        poolConfig.address,
        poolConfig.depositFee,
        withUpdate,
        poolConfig.withDepositDiscount
    );
    console.log(`pool ${poolConfig.address} added\n`);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const MasterChef = await ethers.getContractFactory("LodgeMasterChef");
    const masterChef = await MasterChef.attach(masterChefAddress);

    const pools = config.masterChefParams.pools;
    for (let pool of pools) {
        await addPool(masterChef, pool);
    }

    console.log("done");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
