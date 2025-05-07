import { ethers } from "hardhat";

const recipient = '0x0a13e9123dcb94756f4bfecf7fa07dd026832526'

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    await deployer.sendTransaction({
        nonce: 14,
        value: ethers.utils.parseEther("0.003")
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });