import { ethers } from "hardhat";
import { expect } from "chai";

describe("LodgeToken", function() {
    let token, factory, weth;
    let owner, dev;

    beforeEach(async function() {
        [owner, dev] = await ethers.getSigners();
        const Weth = await ethers.getContractFactory("WETH9")
        weth = await Weth.deploy()

        const Factory = await ethers.getContractFactory("PancakeFactory");
        factory = await Factory.deploy(owner.address);
        const Router = await ethers.getContractFactory("PancakeRouter");
        const router = await Router.deploy(factory.address, weth.address);

        const LfgToken = await ethers.getContractFactory("LodgeToken");
        token = await LfgToken.deploy(router.address, dev.address);
        await token.mint(owner.address, ethers.utils.parseEther("100"))
    })

    
    it("should take sell tax", async function() {
        const pair = await factory.getPair(token.address, weth.address)
        expect(await token.isPair(pair)).equal(true, "pair is not set")

        const amount = ethers.utils.parseEther("100")
        await token.transfer(pair, amount)

        const pairBalance = await token.balanceOf(pair)
        expect(pairBalance).to.eq(ethers.utils.parseEther("94"))

        const devBalance = await token.balanceOf(dev.address)
        expect(devBalance).to.eq(ethers.utils.parseEther("6"))

    })
})