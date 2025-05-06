const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    // Chainlink VRF setup (Base network)
    const VRF_COORDINATOR = "0x..."; // Base VRF coordinator address
    const SUBSCRIPTION_ID = 0; // Your Chainlink subscription ID
    const GAS_LANE = "0x..."; // Key hash for Base
    const CALLBACK_GAS_LIMIT = 500000; // Adjust as needed

    const TandaManager = await ethers.getContractFactory("TandaManager");
    const tandaManager = await TandaManager.deploy(
        VRF_COORDINATOR,
        SUBSCRIPTION_ID,
        GAS_LANE,
        CALLBACK_GAS_LIMIT
    );

    await tandaManager.deployed();

    console.log("TandaManager deployed to:", tandaManager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });