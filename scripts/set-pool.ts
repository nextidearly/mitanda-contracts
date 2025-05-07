import { ethers } from "hardhat";

const utils = require("./utils");

const config = {
    factory: "0x3E84D913803b02A4a7f027165E8cA42C14C0FdE7",
    router: "0x8c1A3cF8f83074169FE5D7aD50B978e1cD6b37c7",
    startTime: 1694535990, //Date and time (GMT): Thursday, September 7, 2023 2:22:25 PM
    devAddress: "0xAE02196968A374A2d1281eD082F7A66b510FA8aD",
    feeAddress: "0xAE02196968A374A2d1281eD082F7A66b510FA8aD",
    masterChefAddress: "0x182008d5e9A470141f4C72720D2E203D6d87372c",
    snow: "0x32D758d16Eef72fF7447b9Dd94304A2b222cd77f",
    usdc: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    weth: "0x4200000000000000000000000000000000000006",
    dai: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    mim: "0x4A3A6Dd60A34bB2Aba60D73B4C88315E9CeB6A3D",
    alb: "0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4",
    sushi: "0x81aB7E0D570b01411fcC4afd3D50eC8C241cb74b",
    uni: "0x1dd2d631c92b1aCdFCDd51A0F7145A50130050C4",
};
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const masterChef = await ethers.getContractAt("SnowMasterChef", config.masterChefAddress);

    // const pool = utils.getPoolConfigByName("snow");
    await setPool(
        masterChef,
        {
            pid: 3,
            allocation: 800,
            depositFee: 200,
            withDepositDiscount: false,
        },
        true
    );

    console.log("done");
}

async function setPool(masterChef: any, poolConfig: any, withUpdate = false) {
    console.log(`setting pool ${poolConfig.name}`);
    await masterChef.set(
        poolConfig.pid,
        poolConfig.allocation,
        poolConfig.depositFee,
        withUpdate,
        poolConfig.withDepositDiscount
    );
    console.log(`pool set\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
