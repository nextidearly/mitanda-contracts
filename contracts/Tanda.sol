// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITandaManager {
    function requestRandomnessForTanda(uint256 tandaId) external;
}

contract Tanda is ReentrancyGuard {
    enum TandaState { OPEN, ACTIVE, COMPLETED }

    struct Participant {
        address payable addr;
        bool hasPaid;
        uint256 paidUntilCycle;
        bool isActive;
        uint256 payoutOrder;
    }

    uint256 public constant PENALTY_RATE = 15;
    uint256 public immutable tandaId;
    uint256 public immutable contributionAmount;
    uint256 public immutable payoutInterval;
    uint256 public immutable gracePeriod;
    uint16 public immutable participantCount;
    ITandaManager public immutable manager;

    TandaState public state;
    uint256 public startTimestamp;
    uint256 public currentCycle;
    uint256 public totalFunds;
    Participant[] public participants;
    mapping(address => uint256) public addressToParticipantIndex;

    bool public payoutOrderAssigned;
    uint256[] public payoutOrder;

    event ParticipantJoined(address participant);
    event PaymentMade(address participant, uint256 cyclesPaid);
    event PayoutSent(address recipient, uint256 amount);
    event GracePeriodEntered(address participant);
    event ParticipantRemoved(address participant);
    event TandaStarted();
    event PayoutOrderAssigned(uint256[] order);

    modifier onlyManager() {
        require(msg.sender == address(manager), "Only manager");
        _;
    }

    modifier onlyParticipant() {
        require(addressToParticipantIndex[msg.sender] != 0 || participants[0].addr == msg.sender, "Not participant");
        _;
    }

    constructor(
        uint256 _tandaId,
        uint256 _contributionAmount,
        uint256 _payoutInterval,
        uint16 _participantCount,
        uint256 _gracePeriod,
        address _manager
    ) {
        tandaId = _tandaId;
        contributionAmount = _contributionAmount;
        payoutInterval = _payoutInterval;
        participantCount = _participantCount;
        gracePeriod = _gracePeriod;
        manager = ITandaManager(_manager); 
        state = TandaState.OPEN;
    }

    function join() external payable {
        require(state == TandaState.OPEN, "Tanda not open");
        require(participants.length < participantCount, "Tanda full");
        require(msg.value == contributionAmount, "Incorrect amount");

        participants.push(Participant({
            addr: payable(msg.sender),
            hasPaid: true,
            paidUntilCycle: 1,
            isActive: true,
            payoutOrder: 0
        }));
        addressToParticipantIndex[msg.sender] = participants.length - 1;
        totalFunds += msg.value;

        emit ParticipantJoined(msg.sender);

        if (participants.length == participantCount) {
            _startTanda();
        }
    }

    function makePayment(uint256 cyclesToPay) external payable onlyParticipant {
        require(state == TandaState.ACTIVE, "Tanda not active");
        uint256 participantIndex = addressToParticipantIndex[msg.sender];
        Participant storage participant = participants[participantIndex];
        
        require(participant.isActive, "Participant inactive");
        require(cyclesToPay > 0, "Must pay at least 1 cycle");

        uint256 totalPayment = contributionAmount * cyclesToPay;
        require(msg.value == totalPayment, "Incorrect payment amount");

        participant.paidUntilCycle = currentCycle + cyclesToPay;
        participant.hasPaid = true;
        totalFunds += msg.value;

        emit PaymentMade(msg.sender, cyclesToPay);
    }

    function triggerPayout() external nonReentrant {
        require(state == TandaState.ACTIVE, "Tanda not active");
        require(block.timestamp >= startTimestamp + (currentCycle * payoutInterval), "Cycle not complete");
        require(_allParticipantsPaid(), "Not all participants paid");

        uint256 payoutIndex = currentCycle % participantCount;
        address payable recipient = participants[payoutOrder[payoutIndex]].addr;
        uint256 payoutAmount = contributionAmount * participantCount;

        require(address(this).balance >= payoutAmount, "Insufficient funds");
        currentCycle++;
        totalFunds -= payoutAmount;

        (bool success, ) = recipient.call{value: payoutAmount}("");
        require(success, "Transfer failed");

        emit PayoutSent(recipient, payoutAmount);

        if (currentCycle >= participantCount) {
            state = TandaState.COMPLETED;
        }
    }

    function enterGracePeriod(address participant) external onlyManager {
        uint256 participantIndex = addressToParticipantIndex[participant];
        Participant storage p = participants[participantIndex];
        
        require(p.isActive, "Participant inactive");
        require(!p.hasPaid && p.paidUntilCycle <= currentCycle, "Not in default");

        emit GracePeriodEntered(participant);
    }

    function payWithPenalty() external payable onlyParticipant {
        uint256 participantIndex = addressToParticipantIndex[msg.sender];
        Participant storage participant = participants[participantIndex];
        
        require(!participant.hasPaid && participant.paidUntilCycle <= currentCycle, "Not in default");
        
        uint256 penaltyAmount = (contributionAmount * PENALTY_RATE) / 100;
        uint256 totalPayment = contributionAmount + penaltyAmount;
        require(msg.value == totalPayment, "Incorrect payment amount");

        participant.hasPaid = true;
        participant.paidUntilCycle = currentCycle + 1;
        totalFunds += contributionAmount; // penalty goes to contract owner or next payout

        emit PaymentMade(msg.sender, 1);
    }

    function removeDefaultedParticipant(address participant) external onlyManager {
        uint256 participantIndex = addressToParticipantIndex[participant];
        Participant storage p = participants[participantIndex];
        
        require(p.isActive, "Participant inactive");
        require(!p.hasPaid && p.paidUntilCycle <= currentCycle, "Not in default");

        p.isActive = false;
        emit ParticipantRemoved(participant);
    }

    function assignPayoutOrder(uint256 randomSeed) external onlyManager {
        require(!payoutOrderAssigned, "Order already assigned");
        payoutOrder = new uint256[](participantCount);
        
        // Fisher-Yates shuffle algorithm
        for (uint256 i = 0; i < participantCount; i++) {
            payoutOrder[i] = i;
        }
        
        for (uint256 i = participantCount - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);
            (payoutOrder[i], payoutOrder[j]) = (payoutOrder[j], payoutOrder[i]);
        }
        
        payoutOrderAssigned = true;
        emit PayoutOrderAssigned(payoutOrder);
    }

    function _startTanda() private {
        require(state == TandaState.OPEN, "Already started");
        state = TandaState.ACTIVE;
        startTimestamp = block.timestamp;
        currentCycle = 1;
        emit TandaStarted();
        
        // Request randomness for payout order
        manager.requestRandomnessForTanda(tandaId);
    }

    function _allParticipantsPaid() private view returns (bool) {
        for (uint256 i = 0; i < participants.length; i++) {
            if (participants[i].isActive && 
                (participants[i].paidUntilCycle <= currentCycle || !participants[i].hasPaid)) {
                return false;
            }
        }
        return true;
    }

    function getParticipants() external view returns (Participant[] memory) {
        return participants;
    }

    function getPayoutOrder() external view returns (uint256[] memory) {
        return payoutOrder;
    }
}