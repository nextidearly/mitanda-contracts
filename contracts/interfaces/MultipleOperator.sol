// SPDX-License-Identifier: UNLICENSED













pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
// Part: MultipleOperator

contract MultipleOperator is Context, Ownable {
  mapping(address => bool) private _operator;

  event OperatorStatusChanged(address indexed _operator, bool _operatorStatus);

  constructor()  {
    _operator[_msgSender()] = true;
    _operator[address(this)] = true;
    emit OperatorStatusChanged(_msgSender(), true);
  }

  modifier onlyOperator() {
    require(
      _operator[msg.sender] == true,
      "operator: caller is not the operator"
    );
    _;
  }

  function isOperator() public view returns (bool) {
    return _operator[_msgSender()];
  }

  function isOperator(address _account) public view returns (bool) {
    return _operator[_account];
  }

  function setOperatorStatus(
    address _account,
    bool _operatorStatus
  ) public onlyOwner {
    _setOperatorStatus(_account, _operatorStatus);
  }

  function setOperatorStatus(
    address[] memory _accounts,
    bool _operatorStatus
  ) external onlyOperator {
    for (uint8 idx = 0; idx < _accounts.length; ++idx) {
      _setOperatorStatus(_accounts[idx], _operatorStatus);
    }
  }

  function setShareTokenWhitelistType(
    address[] memory _accounts,
    bool[] memory _operatorStatuses
  ) external onlyOperator {
    require(
      _accounts.length == _operatorStatuses.length,
      "Error: Account and OperatorStatuses lengths not equal"
    );
    for (uint8 idx = 0; idx < _accounts.length; ++idx) {
      _setOperatorStatus(_accounts[idx], _operatorStatuses[idx]);
    }
  }

  function _setOperatorStatus(address _account, bool _operatorStatus) internal {
    _operator[_account] = _operatorStatus;
    emit OperatorStatusChanged(_account, _operatorStatus);
  }
}