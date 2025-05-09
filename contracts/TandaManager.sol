// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Tanda.sol";
import "./interface/VRFCoordinatorV2_5.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract TandaManager is VRFConsumerBaseV2 {
    VRFCoordinatorV2_5Interface private immutable vrfCoordinator;
    uint256 private immutable subscriptionId;
    bytes32 private immutable gasLane;
    uint32 private immutable callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    address public immutable usdcAddress;
    uint256 public nextTandaId;

    mapping(uint256 => address) public tandaIdToAddress;
    mapping(uint256 => uint256) public vrfRequestIdToTandaId;
    mapping(uint256 => bool) public activeTandas;

    event TandaCreated(
        uint256 indexed tandaId,
        address indexed tandaAddress,
        uint256 contributionAmount,
        uint256 payoutInterval,
        uint16 participantCount,
        uint256 gracePeriod,
        address creator
    );
    event RandomnessRequested(uint256 indexed tandaId, uint256 indexed requestId);
    event PayoutOrderAssigned(uint256 indexed tandaId);

    constructor(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _gasLane,
        uint32 _callbackGasLimit,
        address _usdcAddress
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        require(_vrfCoordinator != address(0), "Invalid VRF coordinator");
        require(_usdcAddress != address(0), "Invalid USDC address");

        vrfCoordinator = VRFCoordinatorV2_5Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        gasLane = _gasLane;
        callbackGasLimit = _callbackGasLimit;
        usdcAddress = _usdcAddress;
    }

    /**
     * @notice Create a new Tanda
     * @param _contributionAmount USDC amount each participant must contribute
     * @param _payoutInterval Time between payouts in seconds
     * @param _participantCount Number of participants needed
     * @param _gracePeriod Grace period for late payments in seconds
     * @return tandaId ID of the newly created Tanda
     */
    function createTanda(
        uint256 _contributionAmount,
        uint256 _payoutInterval,
        uint16 _participantCount,
        uint256 _gracePeriod
    ) external returns (uint256) {
        require(_contributionAmount >= 10 * 10**6, "Minimum contribution 10 USDC"); // 10 USDC (6 decimals)
        require(_payoutInterval >= 1 days, "Minimum interval 1 day");
        require(_payoutInterval <= 30 days, "Maximum interval 30 days");
        require(_participantCount >= 2, "Minimum 2 participants");
        require(_participantCount <= 50, "Maximum 50 participants");
        require(_gracePeriod >= 1 days, "Minimum grace period 1 day");
        require(_gracePeriod <= 7 days, "Maximum grace period 7 days");

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
        activeTandas[tandaId] = true;

        emit TandaCreated(
            tandaId,
            address(tanda),
            _contributionAmount,
            _payoutInterval,
            _participantCount,
            _gracePeriod,
            msg.sender
        );
        return tandaId;
    }

    /**
     * @notice Request randomness for payout order assignment
     * @dev Only callable by Tanda contracts
     * @param tandaId ID of the Tanda requesting randomness
     */
    function requestRandomnessForTanda(uint256 tandaId) external {
        require(tandaIdToAddress[tandaId] == msg.sender, "Caller is not Tanda");
        require(activeTandas[tandaId], "Tanda is not active");

        uint256 requestId = vrfCoordinator.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NUM_WORDS
        );
        vrfRequestIdToTandaId[requestId] = tandaId;

        emit RandomnessRequested(tandaId, requestId);
    }

    /**
     * @notice Callback function used by VRF Coordinator
     * @param requestId ID of the randomness request
     * @param randomWords Array of random values
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 tandaId = vrfRequestIdToTandaId[requestId];
        require(tandaIdToAddress[tandaId] != address(0), "Invalid Tanda ID");

        Tanda tanda = Tanda(tandaIdToAddress[tandaId]);
        tanda.assignPayoutOrder(randomWords[0]);

        emit PayoutOrderAssigned(tandaId);
    }

    // ==================== View Functions ====================

    /**
     * @notice Get USDC token address
     * @return USDC contract address
     */
    function getUsdcAddress() external view returns (address) {
        return usdcAddress;
    }

    /**
     * @notice Check if Tanda is active
     * @param tandaId ID of the Tanda to check
     * @return True if active, false otherwise
     */
    function isTandaActive(uint256 tandaId) external view returns (bool) {
        return activeTandas[tandaId];
    }

    /**
     * @notice Get Tanda contract address by ID
     * @param tandaId ID of the Tanda
     * @return Tanda contract address
     */
    function getTandaAddress(uint256 tandaId) external view returns (address) {
        return tandaIdToAddress[tandaId];
    }

    /**
     * @notice Get all active Tanda IDs
     * @return Array of active Tanda IDs
     */
    function getActiveTandaIds() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextTandaId; i++) {
            if (activeTandas[i]) {
                count++;
            }
        }

        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextTandaId; i++) {
            if (activeTandas[i]) {
                activeIds[index] = i;
                index++;
            }
        }
        return activeIds;
    }

    /**
     * @notice Get Tanda creation parameters
     * @param tandaId ID of the Tanda
     * @return contributionAmount USDC contribution amount
     * @return payoutInterval Payout interval in seconds
     * @return participantCount Number of participants
     * @return gracePeriod Grace period in seconds
     */
    function getTandaParameters(uint256 tandaId) external view returns (
        uint256 contributionAmount,
        uint256 payoutInterval,
        uint16 participantCount,
        uint256 gracePeriod
    ) {
        address tandaAddress = tandaIdToAddress[tandaId];
        require(tandaAddress != address(0), "Invalid Tanda ID");

        Tanda tanda = Tanda(tandaAddress);
        return (
            tanda.contributionAmount(),
            tanda.payoutInterval(),
            tanda.participantCount(),
            tanda.gracePeriod()
        );
    }
}