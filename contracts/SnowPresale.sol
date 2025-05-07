// SPDX-License-Identifier: UNLICENSED



pragma solidity ^0.8.15;

import "./SNOWNFT.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface ISNOWNFT {
    function walletOfOwner(address _owner) external view returns (uint256[] memory);
}

contract SNOWPresale is IERC721Receiver, ReentrancyGuard {
    // using PriceConverter for uint256;

    SNOWNFT public SNOWNFT_CONTRACT;
    IERC20 public SNOW; // mainnet to be adjusted
    address public NFT;
    address public owner;

    mapping(address => uint256) public user_deposits;
    mapping(address => uint256) public user_withdraw_amount;
    mapping(address => uint256) public user_withdraw_timestamp;
    mapping(address => uint256) public SNOWOwned;
    mapping(address => uint256) public NFTs_per_user;

    uint256 public finishedTimestamp;
    uint256 public total_deposited;
    uint256[] public soldedNFTs;

    uint256 public NFTPrice = 0.3 * 10 ** 18;
    uint256 public vestingPeriod = 20 days;
    uint256 public presalePriceOfToken = 4;
    uint256 public MAX_AMOUNT = 250 * 1e18;
    uint256 public rate = 5;

    bool public enabled = true;
    bool public sale_finalized = false;

    event Received(address, uint);
    // CUSTOM ERRORS

    error SaleIsNotActive();
    error ZeroAddress();
    error SaleIsNotFinalizedYet();

    constructor(address _snow, address _NFT) {
        SNOW = IERC20(_snow);
        owner = msg.sender;
        SNOWNFT_CONTRACT = SNOWNFT(_NFT);
        NFT = _NFT;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the Owner!");
        _;
    }

    function onERC721Received(
        address operator,
        address from,
        uint tokenId,
        bytes calldata
    ) external returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function getUserDeposits(address user) public view returns (uint256) {
        return user_deposits[user];
    }

    function getSNOWOwned(address user) public view returns (uint256) {
        return SNOWOwned[user];
    }

    function getClaimedAmount(address user) public view returns (uint256) {
        return user_withdraw_amount[user];
    }

    function getTotalRaised() external view returns (uint256) {
        return total_deposited;
    }

    function buyNFT(uint256 _NFTID) public payable nonReentrant {
        if (!enabled || sale_finalized) revert SaleIsNotActive();
        require(msg.value >= NFTPrice, "Not enough Ether provided.");
        require(NFTs_per_user[msg.sender] == 0, "Exceed max per user NFT amount");
        SNOWNFT_CONTRACT.whitelistUser(msg.sender);
        IERC721(NFT).safeTransferFrom(address(this), msg.sender, _NFTID);
        NFTs_per_user[msg.sender] = NFTs_per_user[msg.sender] + 1;
    }

    function buySNOW() public payable nonReentrant {
        if (!enabled || sale_finalized) revert SaleIsNotActive();
        // require(
        //     SNOWOwned[msg.sender] + (msg.value.getConversionRate() * 100) / presalePriceOfToken <=
        //         MAX_AMOUNT,
        //     "Exceed Max Amount"
        // );
        user_deposits[msg.sender] += msg.value;
        // SNOWOwned[msg.sender] += (msg.value.getConversionRate() * 100) / presalePriceOfToken;
        total_deposited += msg.value;
    }

    function withdrawSNOW() external nonReentrant {
        if (!sale_finalized) revert SaleIsNotFinalizedYet();

        uint256 total_to_send = SNOWOwned[msg.sender];
        require(total_to_send > 0, "Insufficient SNOW owned by user");

        if (user_withdraw_timestamp[msg.sender] < finishedTimestamp) {
            user_withdraw_timestamp[msg.sender] = finishedTimestamp;
        }

        require(
            SNOWOwned[msg.sender] > user_withdraw_amount[msg.sender],
            "you already claimed all tokens"
        );

        require(
            block.timestamp - user_withdraw_timestamp[msg.sender] >= 1 minutes,
            "You cannot withdraw SNOW token yet"
        );

        uint256 availableAmount = (SNOWOwned[msg.sender] * 5) / 100;
        uint256 contractBalance = SNOW.balanceOf(address(this));

        require(contractBalance >= availableAmount, "Insufficient contract balance");

        user_withdraw_timestamp[msg.sender] = block.timestamp;
        user_withdraw_amount[msg.sender] += availableAmount;
        SNOW.transfer(msg.sender, availableAmount);
    }

    function depositNFTs(uint256 _amount) public onlyOwner {
        uint256[] memory tokenIds = ISNOWNFT(NFT).walletOfOwner(msg.sender);

        require(tokenIds.length >= _amount, "Invalid token amount");
        if (tokenIds.length > 0) {
            for (uint256 i = 0; i < _amount; i++) {
                IERC721(NFT).safeTransferFrom(msg.sender, address(this), tokenIds[i]);
            }
        }
    }

    function setEnabled(bool _enabled) external onlyOwner {
        enabled = _enabled;
    }

    function finalizeSale() external onlyOwner {
        sale_finalized = true;
        finishedTimestamp = block.timestamp;
    }

    function changeOwner(address _address) external onlyOwner {
        if (_address == address(0)) revert ZeroAddress();
        owner = _address;
    }

    function setSNOWAddress(IERC20 _SNOW) public onlyOwner {
        SNOW = _SNOW;
    }

    function setPrice(uint256 _newPrice) public onlyOwner {
        presalePriceOfToken = _newPrice;
    }

    function setRate(uint256 _rate) public onlyOwner {
        rate = _rate;
    }

    function setNFT(address _NFT) public onlyOwner {
        NFT = _NFT;
    }

    function setNFTPrice(uint256 _NFTPrice) public onlyOwner {
        NFTPrice = _NFTPrice;
    }

    function setfinalizeSale() public onlyOwner {
        sale_finalized = !sale_finalized;
    }

    function withdrawNFTs() public onlyOwner {
        uint256[] memory tokenIds = ISNOWNFT(NFT).walletOfOwner(address(this));
        require(tokenIds.length > 0, "no NFTs");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            IERC721(NFT).safeTransferFrom(address(this), msg.sender, tokenIds[i]);
        }
    }

    function withdraw() external onlyOwner {
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function withdrawExtraToken(address _token) external onlyOwner {
        IERC20(_token).transfer(owner, IERC20(_token).balanceOf(address(this)));
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
