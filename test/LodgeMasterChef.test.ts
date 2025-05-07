import { BigNumber } from "ethers";
import { ethers, tracer } from "hardhat";
import { expect } from "chai";
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import { EnvResult } from "./types";

const { parseUnits } = ethers.utils;

describe("MasterChef test", function () {
    async function prepareEnv(): Promise<EnvResult> {
        const [owner, alice, bob, dev, partner] = await ethers.getSigners();



        const MockToken = await ethers.getContractFactory("MockToken");
        const mim = await MockToken.deploy("mim", "mim");
        const weth = await MockToken.deploy("WETH", "WETH");
        mim.mint(alice.address, ethers.utils.parseUnits("1000", 18));
        weth.mint(alice.address, ethers.utils.parseUnits("1000", 18));

        mim.mint(bob.address, ethers.utils.parseUnits("1000", 18));
        weth.mint(bob.address, ethers.utils.parseUnits("1000", 18));

        mim.mint(partner.address, ethers.utils.parseUnits("1000", 18));
        weth.mint(partner.address, ethers.utils.parseUnits("1000", 18));

        const Factory = await ethers.getContractFactory("PancakeFactory");
        const factory = await Factory.deploy(owner.address);
        const Router = await ethers.getContractFactory("PancakeRouter");
        const router = await Router.deploy(factory.address, weth.address);

        const LfgToken = await ethers.getContractFactory("LodgeToken");
        const lodgeToken = await LfgToken.deploy(router.address, dev.address);

        const MasterChef = await ethers.getContractFactory("LodgeMasterChef");

        const currentBlock = await ethers.provider.getBlockNumber();
        const currentTime = (await ethers.provider.getBlock(currentBlock)).timestamp;

        const masterChef = await MasterChef.deploy(
            lodgeToken.address,
            dev.address,
            dev.address,
            "1000000",
            currentTime + 60
        );

        await lodgeToken.transferOwnership(masterChef.address);

        await masterChef.add(1000, mim.address, 400, false, true);
        await masterChef.add(500, weth.address, 400, false, false);

        await masterChef.setPartner(partner.address, true);

        return {
            masterChef,
            lodgeToken,
            owner,
            alice,
            bob,
            dev,
            weth,
            mim,
            partner,
            router
        };
    }

    it("should take fee on deposit", async () => {
        const { masterChef, alice, mim } = await loadFixture(prepareEnv);
        const amount = ethers.utils.parseUnits("1000", 18);
        await mim.connect(alice).approve(masterChef.address, amount);
        await masterChef.connect(alice).deposit(0, amount, 0, []);

        const aliceInfo = await masterChef.userInfo(0, alice.address);
        expect(aliceInfo.amount).equal(parseUnits("960", 18));
    });

    it("should correctly work with zero deposit fee", async () => {
        const { masterChef, alice, mim } = await loadFixture(prepareEnv);
        await masterChef.set(0, 1000, 0, true, true);

        const amount = ethers.utils.parseUnits("1000", 18);
        await mim.connect(alice).approve(masterChef.address, amount);
        await masterChef.connect(alice).deposit(0, amount, 0, []);

        const aliceInfo = await masterChef.userInfo(0, alice.address);
        expect(aliceInfo.amount).equal(parseUnits("1000", 18));
    });

    describe("whitelist", () => {
        it("should take discounted fee on deposit from whitelist", async () => {
            const { masterChef, alice, bob, mim } = await loadFixture(prepareEnv);
            const merkleTree = StandardMerkleTree.of([[alice.address], [bob.address]], ["address"]);
            await masterChef.setWhitelistMerkleRoot(merkleTree.root);
            const proof = merkleTree.getProof([alice.address]);
            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(alice).approve(masterChef.address, amount);
            await masterChef.connect(alice).deposit(0, amount, 0, proof);
            const aliceInfo = await masterChef.userInfo(0, alice.address);
            expect(aliceInfo.amount).equal(parseUnits("980", 18));
        });

        it("should make discount after project launch", async () => {
            const { masterChef, alice, bob, mim } = await loadFixture(prepareEnv);
            const merkleTree = StandardMerkleTree.of([[alice.address], [bob.address]], ["address"]);
            await masterChef.setWhitelistMerkleRoot(merkleTree.root);
            const proof = merkleTree.getProof([alice.address]);
            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(alice).approve(masterChef.address, amount);
            const launchTime = await masterChef.startTime();
            await time.increase(86400);
            await masterChef.connect(alice).deposit(0, amount, 0, proof);
            const aliceInfo = await masterChef.userInfo(0, alice.address);
            expect(aliceInfo.amount).equal(parseUnits("980", 18));
        });
    });

    describe("lockups", () => {
        it("should fail if wrong lockup period is passed", async () => {
            const oneDay = 86400;
            const month = oneDay * 30;

            const { masterChef, alice, bob, mim } = await loadFixture(prepareEnv);

            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(alice).approve(masterChef.address, amount);
            await expect(
                masterChef.connect(alice).deposit(0, amount, month + 1, [])
            ).to.be.revertedWith("wrong lock period");
        });

        it("should give discount with lock period", async () => {
            const oneDay = 86400;
            const month = oneDay * 30;

            const { masterChef, alice, mim } = await loadFixture(prepareEnv);

            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(alice).approve(masterChef.address, amount);
            await masterChef.connect(alice).deposit(0, amount, month, []);

            const aliceInfo = await masterChef.userInfo(0, alice.address);
            expect(aliceInfo.amount).equal(parseUnits("966", 18));
        });

        it("should not give discount on pool without discount option", async () => {
            const oneDay = 86400;
            const month = oneDay * 30;

            const { masterChef, alice, weth } = await loadFixture(prepareEnv);

            const amount = ethers.utils.parseUnits("1000", 18);
            await weth.connect(alice).approve(masterChef.address, amount);
            await masterChef.connect(alice).deposit(1, amount, month, []);

            const aliceInfo = await masterChef.userInfo(1, alice.address);
            expect(aliceInfo.amount).equal(parseUnits("960", 18));
        });

        it("sets correct unlock time on first deposit", async () => {
            const oneDay = 86400;
            const month = oneDay * 30;

            const { masterChef, alice, mim } = await loadFixture(prepareEnv);

            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(alice).approve(masterChef.address, amount);
            const tx = await masterChef.connect(alice).deposit(0, amount, month, []);
            const waitedTx = await tx.wait();
            const blockNumber = waitedTx.blockNumber;
            const miningTime = (await ethers.provider.getBlock(blockNumber)).timestamp;

            const aliceInfo = await masterChef.userInfo(0, alice.address);
            expect(aliceInfo.unlockTime).equal(miningTime + month);
        });

        it("should not allow to withdraw before unlock time and allow after", async () => {
            const oneDay = 86400;
            const month = oneDay * 30;

            const { masterChef, alice, mim } = await loadFixture(prepareEnv);

            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(alice).approve(masterChef.address, amount);
            await masterChef.connect(alice).deposit(0, amount, month, []);

            await expect(
                masterChef.connect(alice).withdraw(0, parseUnits("960", 18))
            ).to.be.revertedWith("not yet");

            const aliceInfo = await masterChef.userInfo(0, alice.address);
            await time.increaseTo(aliceInfo.unlockTime);
            await expect(masterChef.connect(alice).withdraw(0, parseUnits("960", 18))).to.not
                .rejected;
        });

        it("should recalculate unlock time on subsequent deposits if deposit discount was turned off", async () => {
            const oneDay = 86400;
            const month = oneDay * 30;

            const { masterChef, alice, mim } = await loadFixture(prepareEnv);

            const amount = ethers.utils.parseUnits("100", 18);
            await mim.connect(alice).approve(masterChef.address, amount);

            await masterChef.connect(alice).deposit(0, amount, month, []);

            await masterChef.set(0, 400, 400, true, false);

            let aliceInfo = await masterChef.userInfo(0, alice.address);
            const { unlockTime } = aliceInfo;
            await mim.connect(alice).approve(masterChef.address, amount);
            await masterChef.connect(alice).deposit(0, amount, 3 * month, []);

            aliceInfo = await masterChef.userInfo(0, alice.address);
            const newUnlockTime = aliceInfo.unlockTime;
            expect(newUnlockTime).lt(unlockTime, "unlock time didn't decrease");
        });

        it("should correctly recalculate unlock time", async () => {
            const oneDay = 86400;
            const month = oneDay * 30;

            const { masterChef } = await loadFixture(prepareEnv);
            let oldAmount = parseUnits("100", 18);
            let lockTimeLeft = oneDay;
            let lockTime = month;
            let amount = parseUnits("100", 18);
            let newLockTime = await masterChef.calculateUnlockTime(
                oldAmount,
                lockTimeLeft,
                amount,
                lockTime
            );
            expect(newLockTime).equal((oneDay + month) / 2);

            oldAmount = parseUnits("100", 18);
            lockTimeLeft = 0;
            lockTime = month;
            amount = parseUnits("100", 18);
            newLockTime = await masterChef.calculateUnlockTime(
                oldAmount,
                lockTimeLeft,
                amount,
                lockTime
            );
            expect(newLockTime).equal(month / 2);

            oldAmount = parseUnits("100", 18);
            lockTimeLeft = month;
            lockTime = 0;
            amount = parseUnits("100", 18);
            newLockTime = await masterChef.calculateUnlockTime(
                oldAmount,
                lockTimeLeft,
                amount,
                lockTime
            );
            expect(newLockTime).equal(month / 2);

            oldAmount = parseUnits("100", 18);
            lockTimeLeft = month;
            lockTime = month;
            amount = 0;
            newLockTime = await masterChef.calculateUnlockTime(
                oldAmount,
                lockTimeLeft,
                amount,
                lockTime
            );
            expect(newLockTime).equal(month);

            oldAmount = 0;
            lockTimeLeft = 30 * month;
            lockTime = month;
            amount = parseUnits("100", 18);
            newLockTime = await masterChef.calculateUnlockTime(
                oldAmount,
                lockTimeLeft,
                amount,
                lockTime
            );
            expect(newLockTime).equal(month);

            oldAmount = 0;
            lockTimeLeft = 10;
            lockTime = month;
            amount = 0;
            newLockTime = await masterChef.calculateUnlockTime(
                oldAmount,
                lockTimeLeft,
                amount,
                lockTime
            );
            expect(newLockTime).equal(0);
        });
    });

    describe("partners", () => {
        it("should not take deposit fee for a partner", async () => {
            const { masterChef, partner, mim } = await loadFixture(prepareEnv);
            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(partner).approve(masterChef.address, amount);
            await masterChef.connect(partner).deposit(0, amount, 0, []);

            const aliceInfo = await masterChef.userInfo(0, partner.address);
            expect(aliceInfo.amount).equal(parseUnits("1000", 18));
        });

        it("should take deposit fee after cancelling partnership", async () => {
            const { masterChef, partner, mim } = await loadFixture(prepareEnv);
            const amount = ethers.utils.parseUnits("1000", 18);
            await mim.connect(partner).approve(masterChef.address, amount);
            await masterChef.setPartner(partner.address, false);
            await masterChef.connect(partner).deposit(0, amount, 0, []);

            const aliceInfo = await masterChef.userInfo(0, partner.address);
            expect(aliceInfo.amount).equal(parseUnits("960", 18));
        });

        it("should check authorization on setting partner", async () => {
            const { masterChef, alice, partner } = await loadFixture(prepareEnv);
            await expect(
                masterChef.connect(alice).setPartner(partner.address, false)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
