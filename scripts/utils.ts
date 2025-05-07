import { ethers, network, run } from "hardhat";
const config = require("../config.js");

export async function deployAndVerify(
    contractName: string,
    args: any[] = [],
    confirmations = 2
): Contract {
    const Contract = await ethers.getContractFactory(contractName);

    console.log("Deploying Contact...");
    const contract = await Contract.deploy(...args);
    console.log(`${contractName} deployed to: ${contract.address}`);
    console.log('network name:', network.name);
    await contract.deployed();
    console.log('done')

    const networkName = network.name;
    console.log("Network:", networkName);
    if (networkName != "hardhat") {
        console.log("Verifying contract...");

        console.log(`waiting for ${confirmations} confirmations before verification`);
        await contract.deployTransaction.wait(confirmations);

        try {
            await run("verify:verify", {
                address: contract.address,
                constructorArguments: args,
            });
            console.log("Contract is Verified");
        } catch (error: any) {
            console.log("Failed in plugin", error.pluginName);
            console.log("Error name", error.name);
            console.log("Error message", error.message);
        }
    }
    console.log(`successfully deployed ${contractName}\n\n\n`);
    return contract;
}


export async function verify(address: string, args: Array<any> = []) {
    const networkName = network.name;

    if (networkName != "hardhat") {
        console.log("Verifying contract...");

        try {
            await run("verify:verify", {
                address: address,
                constructorArguments: args,
            });
            console.log("Contract is Verified");
        } catch (error: any) {
            console.log("Failed in plugin", error.pluginName);
            console.log("Error name", error.name);
            console.log("Error message", error.message);
        }
    }
}

export async function attach(contractName: string, address: string) {
    const Contract = await ethers.getContractFactory(contractName);
    return Contract.attach(address);
}

export function getPoolConfigByName(name: string): any {
    const { pools } = config.masterChefParams;
    for (let pool of pools) {
        if (pool.name === name) {
            return pool;
        }
    }
    throw Error(`Pool with name ${name} not found`);
}
