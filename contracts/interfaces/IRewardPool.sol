// SPDX-License-Identifier: UNLICENSED














pragma solidity ^0.8.15;
// Part: IRewardPool

interface IRewardPool {
    function depositFor(uint256 _pid, uint256 _amount, address _recipient) external;
}