// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

/// A challenge grader. `check` must not keep any state change made while testing a solution.
interface IChecker {
    function name() external view returns (string memory);
    function check(address learner, address solution, bytes calldata data) external returns (bool passed, uint8 code);
}

/// Every solution names the learner it belongs to, so one learner cannot submit another's contract.
interface ISolution {
    function learner() external view returns (address);
}
