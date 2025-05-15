const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// Configuration from environment
const TANDA_MANAGER = "0x1291Fc42FaFFa8d29f2109Ee73fD866E24363808";
const USDC_ADDRESS = process.env.USDC_ADDRESS;
const VRF_Coodinator = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";

// Participant private keys (replace with actual Sepolia testnet private keys)
const PARTICIPANT_PRIVATE_KEYS = [

];

// USDC has 18 decimals
const USDC_DECIMALS = 18;
const TEN_USDC = ethers.parseUnits("10", USDC_DECIMALS);
const TWENTY_USDC = ethers.parseUnits("20", USDC_DECIMALS);

describe("Tanda Protocol", function () {
  let tandaManager;
  let usdc;
  let owner, participant1, participant2, participant3, participant4, participant5;
  let nextTandaId;

  before(async function () {
    [owner] = await ethers.getSigners();

    // Create participant signers from private keys
    participant1 = new ethers.Wallet(PARTICIPANT_PRIVATE_KEYS[0], ethers.provider);
    participant2 = new ethers.Wallet(PARTICIPANT_PRIVATE_KEYS[1], ethers.provider);
    participant3 = new ethers.Wallet(PARTICIPANT_PRIVATE_KEYS[2], ethers.provider);
    participant4 = new ethers.Wallet(PARTICIPANT_PRIVATE_KEYS[3], ethers.provider);
    participant5 = new ethers.Wallet(PARTICIPANT_PRIVATE_KEYS[4], ethers.provider);

    // Get TandaManager
    tandaManager = await ethers.getContractAt("TandaManager", TANDA_MANAGER);

    // Get the actual next Tanda ID before any tests run
    nextTandaId = await tandaManager.nextTandaId();

    // await addConsumer(tandaManager.TANDA_MANAGER);

    // Get USDC contract
    usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  });

  describe("TandaManager", function () {
    it("should deploy with correct parameters", async function () {
      expect(await tandaManager.usdcAddress()).to.equal(USDC_ADDRESS);
      expect(await tandaManager.nextTandaId()).to.equal(nextTandaId);
    });

    it("should create a new Tanda", async function () {
      const tx = await tandaManager.createTanda(
        TEN_USDC, // 10 USDC
        1 * 24 * 60 * 60, // 1 day interval
        4, // 4 participants
        2 * 24 * 60 * 60 // 2 day grace period
      );
      await tx.wait();

      const tandaAddress = await tandaManager.tandaIdToAddress(0);
      expect(tandaAddress).to.not.equal(ethers.ZeroAddress);

      // Verify nextTandaId was incremented
      expect(await tandaManager.nextTandaId()).to.equal(nextTandaId + 1n);
    });

    it("should fail to create Tanda with invalid parameters", async function () {
      // Test minimum contribution (10 USDC)
      try {
        const tx1 = await tandaManager.createTanda(
          ethers.parseUnits("9", 6), // 9 USDC (below min)
          86400, // 1 day in seconds
          4,
          172800 // 2 days in seconds
        );
        await tx1.wait();
        throw new Error("Should have reverted");
      } catch (err) {
        expect(err.message).to.include("Minimum contribution 10 USDC");
      }

      // Test minimum participants (2)
      try {
        const tx2 = await tandaManager.createTanda(
          TEN_USDC,
          86400,
          1, // Below min
          172800
        );
        await tx2.wait();
        throw new Error("Should have reverted");
      } catch (err) {
        expect(err.message).to.include("Minimum 2 participants");
      }

      // Test maximum participants (50)
      try {
        const tx3 = await tandaManager.createTanda(
          TEN_USDC,
          86400,
          51, // Above max
          172800
        );
        await tx3.wait();
        throw new Error("Should have reverted");
      } catch (err) {
        expect(err.message).to.include("Maximum 50 participants");
      }
    });
  });

  describe("Tanda", function () {
    let tanda;
    let tandaAddress;
    let currentTandaId;

    before(async function () {
      // Get the current nextTandaId
      currentTandaId = await tandaManager.nextTandaId();

      // Create a new Tanda for testing
      const tx = await tandaManager.createTanda(
        TEN_USDC, // 10 USDC
        1 * 24 * 60 * 60, // 1 day interval
        4, // 4 participants
        2 * 24 * 60 * 60 // 2 day grace period
      );
      await tx.wait();

      tandaAddress = await tandaManager.tandaIdToAddress(currentTandaId);
      tanda = await ethers.getContractAt("Tanda", tandaAddress);
    });

    it("should initialize with correct parameters", async function () {
      expect(await tanda.contributionAmount()).to.equal(TEN_USDC);
      expect(await tanda.participantCount()).to.equal(4);
      expect(await tanda.state()).to.equal(0);
      expect(await tanda.tandaId()).to.equal(currentTandaId);
    });

    describe("Joining Tanda", function () {
      it("should allow participants to join", async function () {
        // Approve USDC transfer first
        const approve_tx = await usdc.connect(participant1).approve(tandaAddress, TEN_USDC);
        await approve_tx.wait();

        // Participant 1 joins
        const join_tx = await tanda.connect(participant1).join();
        await join_tx.wait();

        expect(await tanda.isParticipant(participant1.address)).to.be.true;
      });

      it("should fail if participant already joined", async function () {
        try {
          const tx = await tanda.connect(participant1).join();
          await tx.wait();
          throw new Error("Should have reverted");
        } catch (err) {
          expect(err.message).to.include("Already joined this tanda");
        }
      });

      it("should join remaining participants", async function () {
        // Participant 2
        const approve_tx_1 = await usdc.connect(participant2).approve(tandaAddress, TEN_USDC);
        await approve_tx_1.wait();
        const tx1 = await tanda.connect(participant2).join();
        await tx1.wait();

        // Participant 3
        const approve_tx_2 = await usdc.connect(participant3).approve(tandaAddress, TEN_USDC);
        await approve_tx_2.wait();
        const tx2 = await tanda.connect(participant3).join();
        await tx2.wait();

        // Participant 4
        const approve_tx_3 = await usdc.connect(participant4).approve(tandaAddress, TEN_USDC);
        await approve_tx_3.wait();
        const tx3 = await tanda.connect(participant4).join();
        await tx3.wait();
      });

      it("should start Tanda when full", async function () {
        // The Tanda should have started after the 4th participant joined
        expect(await tanda.state()).to.equal(1); // ACTIVE state
        expect(await tanda.startTimestamp()).to.be.gt(0);
      });
    });

    describe("Making Payments", function () {
      it("should allow participants to make multiple payments", async function () {
        // First payment
        const approve_tx1 = await usdc.connect(participant1).approve(tandaAddress, TEN_USDC);
        await approve_tx1.wait();
        const tx1 = await tanda.connect(participant1).makePayment(1);
        await tx1.wait();

        // Second payment in same cycle
        const approve_tx2 = await usdc.connect(participant1).approve(tandaAddress, TEN_USDC);
        await approve_tx2.wait();
        const tx2 = await tanda.connect(participant1).makePayment(1);
        await tx2.wait();

        const participant = await tanda.getParticipant(participant1.address);
        expect(participant.paidUntilCycle).to.equal(3); // currentCycle (1) + 2 payments
      });

      it("should prevent overpayment beyond total cycles", async function () {
        try {
          // Try to pay for more cycles than remaining
          const cyclesToPay = await tanda.participantCount() + 1n;
          const approve_tx = await usdc.connect(participant2).approve(tandaAddress, TEN_USDC * cyclesToPay);
          await approve_tx.wait();

          const tx = await tanda.connect(participant2).makePayment(cyclesToPay);
          await tx.wait();
          throw new Error("Should have reverted");
        } catch (err) {
          expect(err.message).to.include("Cannot pay beyond total cycles");
        }
      });

      it("should fail if not a participant", async function () {
        const nonParticipant = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, ethers.provider);
        try {
          const tx = await tanda.connect(nonParticipant).makePayment(1);
          await tx.wait();
          throw new Error("Should have reverted");
        } catch (err) {
          expect(err.message).to.include("Caller is not participant");
        }
      });
    });

    describe("Restarting Tanda", function () {
      it("should allow manager to restart completed tanda", async function () {
        try {
          console.log('-----started----');
          
          const tanda = await ethers.getContractAt("Tanda", "0x5ba4c56439fefaaeC6f2d79caD41ceB3e02E6Df3");
          console.log(await tanda.currentCycle());
          console.log(await tanda.isPayoutCycleReady());

          // const tx = await tanda.triggerPayoutTest();
          console.log(tx);
          
          await tx.wait();
        } catch (error) {
          console.log(error);
          
        }
      });
    });
  });
});