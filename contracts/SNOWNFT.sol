// SPDX-License-Identifier: UNLICENSED



pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract SNOWNFT is ERC721Enumerable {
    using Strings for uint256;

    string public baseURI;
    string public baseExtension = ".png";
    bool public paused = false;
    bool public tradable = false;
    mapping(address => bool) public whitelisted;
    mapping(uint256 => address) public ownerOfToken;
    mapping(address => uint256) public maxMintAmountPerUser;
    mapping(address => bool) public owners;

    event Received(address, uint);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        address _owner
    ) ERC721(_name, _symbol) {
        owners[_owner] = true;
        setBaseURI(_initBaseURI);
    }

    modifier onlyAdmin() {
        require(owners[msg.sender] == true, "Caller is not in owners");
        _;
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // public
    function mint() external {
        uint256 supply = totalSupply();
        require(!paused);
        require(whitelisted[msg.sender], "User is not whitelisted");
        require(maxMintAmountPerUser[msg.sender] > 0, "Exceed maximum mint amount");
        ownerOfToken[supply + 1] = msg.sender;
        maxMintAmountPerUser[msg.sender] = maxMintAmountPerUser[msg.sender] - 1;
        _safeMint(msg.sender, supply + 1);
    }

    // bulk mint
    function bulkMint(address[] memory _users) external onlyAdmin {
        require(!paused);
        for (uint256 i = 0; i < _users.length; i++) {
            uint256 supply = totalSupply();
            require(whitelisted[_users[i]], "User is not whitelisted");
            require(maxMintAmountPerUser[_users[i]] > 0, "Exceed maximum mint amount");
            ownerOfToken[supply + 1] = _users[i];
            maxMintAmountPerUser[_users[i]] = maxMintAmountPerUser[_users[i]] - 1;
            _safeMint(_users[i], supply + 1);
        }
    }

    function _transfer(address from, address to, uint256 tokenId) internal virtual override {
        if (!tradable) {
            require(whitelisted[to], "Can't send token to any address");
            require(ownerOfToken[tokenId] == from, "invalid token owner");
        }
        ownerOfToken[tokenId] = to;
        super._transfer(from, to, tokenId);
    }

    function setTradable(bool _flag) external onlyAdmin {
        tradable = _flag;
    }

    function walletOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
                : "";
    }

    function setBaseURI(string memory _newBaseURI) public onlyAdmin {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension) public onlyAdmin {
        baseExtension = _newBaseExtension;
    }

    function pause(bool _state) public onlyAdmin {
        paused = _state;
    }

    function setWhiteListsWithMaximumAmount(
        address[] memory _users,
        uint256[] memory _maxMintAmount
    ) external onlyAdmin {
        require(_users.length == _maxMintAmount.length, "Invalid parameters");
        for (uint256 i = 0; i < _users.length; i++) {
            whitelisted[_users[i]] = true;
            maxMintAmountPerUser[_users[i]] = _maxMintAmount[i];
        }
    }

    function setWhiteListWithMaximumAmount(
        address _user,
        uint256 _maxMintAmount
    ) external onlyAdmin {
        whitelisted[_user] = true;
        maxMintAmountPerUser[_user] = _maxMintAmount;
    }

    function getMaximumAmountCanMint(address _user) public view returns (uint256) {
        return maxMintAmountPerUser[_user];
    }

    function getWhitelisted(address _user) external view returns (bool) {
        return whitelisted[_user];
    }

    function whitelistUser(address _user) external onlyAdmin {
        whitelisted[_user] = true;
    }

    function setWhiteList(address _user) internal {
        whitelisted[_user] = true;
    }

    function addOwner(address _newOwner) external onlyAdmin {
        owners[_newOwner] = true;
    }

    function removeOwner(address _ownerToRemove) external onlyAdmin {
        owners[_ownerToRemove] = false;
    }

    function removeWhitelistUser(address _user) public onlyAdmin {
        whitelisted[_user] = false;
    }
}
