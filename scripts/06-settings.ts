import { ethers } from "hardhat";
const utils = require("../scripts/utils");
const { config } = require("../scripts/config");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("deployer address:", deployer.address);
    // const factory = await ethers.getContractAt("PancakeFactory", config.factory);
    const token = await ethers.getContractAt("SnowToken", config.snow);
    const zapper = await ethers.getContractAt("ZapV3", config.zap);
    const nft = await ethers.getContractAt("SNOWNFT", config.nft);
    const masterchef = await ethers.getContractAt("MasterChef", config.masterchef);
    const presale = await ethers.getContractAt("SNOWPresale", config.presale);

    // await token.mint(config.feeAddress, ethers.utils.parseEther("55000"));

    // console.log("setting zapper to whitelist...");
    // await token.setProxy(config.zap);
    // console.log("done");

    // console.log("setting lp contract to pair...");
    // await token.setPair(config.baseLp);
    // console.log("done");

    // console.log("transferring ownership to masterchef...");
    // await token.transferOwnership(config.masterchef);
    // console.log("done");

    // whitelistUser
    // console.log("setting masterchef to whitelist in nft...");
    // await nft.whitelistUser(config.masterchef);
    // console.log("done");

    // // whitelistUser
    // console.log("setting Presale to whitelist in nft...");
    // await nft.whitelistUser(config.presale);
    // console.log("done");

    // whitelistUser
    console.log("setting Presale to owner in nft...");
    await nft.addOwner(config.presale);
    console.log("done");

    // console.log("updating emission...");
    // await masterchef.updateEmissionRate("110000000000000");
    // console.log("done");

    // // setWhiteListWithMaximumAmount
    // console.log("setWhiteListWithMaximumAmount in nft...", config.feeAddress);
    // await nft.setWhiteListWithMaximumAmount(config.feeAddress, 100);
    // console.log("done");

    // console.log("mint nft...");
    // await nft.mint();
    // await nft.mint();
    // await nft.mint();
    // await nft.mint();
    // await nft.mint();
    // await nft.mint();
    // console.log("done");

    console.log("builkmint nft...");
    await nft.bulkMint([
        config.presale,
        config.presale,
        config.presale,
        config.presale,
        config.presale,
        config.presale,
        config.presale,
        config.presale,
        config.presale,
        config.presale,
        config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale, config.presale,
    ]);
    console.log("done");

    // // setWhiteListWithMaximumAmount
    // console.log("setWhiteListWithMaximumAmount in nft...", config.feeAddress);
    // await nft.setApprovalForAll(config.presale, true);
    // console.log("done");

    // console.log("builkmint nft...");
    // await presale.depositNFTs(45);
    // console.log("done");

    // console.log("transferring ownership of masterchef...");
    // await masterchef.transferOwnership(config.owner);
    // console.log("done");

    // console.log("transferring ownership of NFT...");
    // await nft.transferOwnership(config.devAddress1);
    // console.log("done");

    // console.log("updating pool info...");
    // await masterchef.set(0, 950, 100, 1698733996, true);
    // await masterchef.set(2, 50, 300, 1698733996, true);
    // console.log("done");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
