import { ethers } from "hardhat";

const config = require("../../config.js");
const utils = require("../utils");

const createPair = async (factory: any, token0: any, token1: any) => {
    const tx = await factory.createPair(token0.address, token1.address);
    const mined = await tx.wait();
    const event = mined.events?.find((e: any) => e.event === "PairCreated");
    const pairAddress = event?.args?.pair;
    return pairAddress
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const factory = await utils.deployAndVerify("PancakeFactory", [deployer.address]);
    const router = await utils.deployAndVerify("PancakeRouter", [factory.address, config.testnet.weth]);

    const token = await utils.deployAndVerify("LodgeToken", [router.address, deployer.address]);

    const masterChef = await utils.deployAndVerify("LodgeMasterChef", [
        token.address,
        deployer.address,
        deployer.address,
        ethers.utils.parseUnits("1", 18),
        1692162392, //Wed Aug 16 2023 05:06:32 GMT+0000
    ]);
    await token.mint(deployer.address, ethers.utils.parseUnits("1000000", 18));
    await token.transferOwnership(masterChef.address);

    const usdc = await utils.deployAndVerify("MockToken", ["USDC", "USDC"]);
    const sushi = await utils.deployAndVerify("MockToken", ["SUSHI", "SUSHI"]);
    // const weth = await ethers.getContractAt("WETH9", config.testnet.weth);
    const weth = await utils.deployAndVerify("WETH9");
    usdc.mint(deployer.address, ethers.utils.parseUnits("1000", 18));
    // weth.mint(deployer.address, ethers.utils.parseUnits("1000", 18));

    await masterChef.add(550, token.address, 100, false, false);
    await masterChef.add(250, usdc.address, 300, false, false);
    await masterChef.add(200, weth.address, 300, false, false);

    //add lp
    const lfgWethPairAddress = await createPair(factory, token, weth);
    console.log("pairAddress token/weth", lfgWethPairAddress);

    const usdcWethPairAddress = await createPair(factory, usdc, weth);
    const sushiWethPairAddress = await createPair(factory, sushi, weth);

    await masterChef.add(500, lfgWethPairAddress, 100, false, false);
    await masterChef.add(250, usdcWethPairAddress, 300, false, false);
    await masterChef.add(250, sushiWethPairAddress, 300, false, false);

    const deployed = {
        factory: factory.address,
        router: router.address,
        token: token.address,
        masterChef: masterChef.address,
        usdc: usdc.address,
        weth: weth.address,
        sushi: sushi.address,
        lfgWethLp: lfgWethPairAddress,
        sushiWethLp: sushiWethPairAddress,
        usdcWethPairAddress: usdcWethPairAddress
    };

    console.dir(deployed, { depth: null });

    console.log("done");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
