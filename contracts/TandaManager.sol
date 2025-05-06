// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Tanda.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract TandaManager is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    uint64 private immutable subscriptionId;
    bytes32 private immutable gasLane;
    uint32 private immutable callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    mapping(uint256 => address) public tandaIdToAddress;
    mapping(uint256 => uint256) public vrfRequestIdToTandaId;
    uint256 public nextTandaId;

    event TandaCreated(uint256 tandaId, address tandaAddress);

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _gasLane,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        gasLane = _gasLane;
        callbackGasLimit = _callbackGasLimit;
    }

    function createTanda(
        uint256 _contributionAmount,
        uint256 _payoutInterval,
        uint16 _participantCount,
        uint256 _gracePeriod
    ) external returns (uint256) {
        uint256 tandaId = nextTandaId++;
        Tanda tanda = new Tanda(
            tandaId,
            _contributionAmount,
            _payoutInterval,
            _participantCount,
            _gracePeriod,
            address(this)
        );
        tandaIdToAddress[tandaId] = address(tanda);
        emit TandaCreated(tandaId, address(tanda));
        return tandaId;
    }

    function requestRandomnessForTanda(uint256 tandaId) external {
        require(msg.sender == tandaIdToAddress[tandaId], "Only Tanda can request");
        uint256 requestId = vrfCoordinator.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        vrfRequestIdToTandaId[requestId] = tandaId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 tandaId = vrfRequestIdToTandaId[requestId];
        Tanda tanda = Tanda(tandaIdToAddress[tandaId]);
        tanda.assignPayoutOrder(randomWords[0]);
    }
}