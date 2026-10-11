// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IChecker, ISolution} from "./IArcLab.sol";

/// Arc Lab registry: the instructor lists challenges and enrols learners (each gets a one-time gas drip);
/// anyone submits a solution and the challenge's checker grades it on-chain.
contract LabRegistry {
    address public owner;
    /// Native USDC (18 decimals) sent to each newly enrolled learner.
    uint256 public dripWei;
    IChecker[] public challenges;
    mapping(address => bool) public enrolled;
    mapping(address => mapping(uint256 => bool)) public solved;
    uint256 private locked = 1;

    event OwnerChanged(address indexed owner);
    event DripChanged(uint256 dripWei);
    event ChallengeAdded(uint256 indexed id, IChecker checker);
    event Enrolled(address indexed learner, uint256 dripWei);
    event DripFailed(address indexed learner);
    event Submitted(address indexed learner, uint256 indexed id, address solution, bool passed, uint8 code);
    event Solved(address indexed learner, uint256 indexed id, address solution);

    error NotOwner();
    error Reentrant();
    error UnknownChallenge();
    error NotAContract();
    error NoLearnerFunction();
    error NotYourSolution();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (locked != 1) revert Reentrant();
        locked = 2;
        _;
        locked = 1;
    }

    constructor(uint256 dripWei_) {
        owner = msg.sender;
        dripWei = dripWei_;
        emit OwnerChanged(msg.sender);
        emit DripChanged(dripWei_);
    }

    /// Funds the drip.
    receive() external payable {}

    function challengeCount() external view returns (uint256) {
        return challenges.length;
    }

    function addChallenge(IChecker checker) external onlyOwner returns (uint256 id) {
        id = challenges.length;
        challenges.push(checker);
        emit ChallengeAdded(id, checker);
    }

    /// Enrols new learners and sends each the drip. A failed send (e.g. a blocklisted address, which
    /// reverts on Arc) skips that learner instead of reverting the whole batch.
    function enrol(address[] calldata learners) external payable onlyOwner {
        uint256 drip = dripWei;
        for (uint256 i; i < learners.length; ++i) {
            address learner = learners[i];
            if (enrolled[learner]) continue;
            (bool ok,) = learner.call{value: drip, gas: 50_000}("");
            if (ok) {
                enrolled[learner] = true;
                emit Enrolled(learner, drip);
            } else {
                emit DripFailed(learner);
            }
        }
    }

    function setDrip(uint256 dripWei_) external onlyOwner {
        dripWei = dripWei_;
        emit DripChanged(dripWei_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
        emit OwnerChanged(newOwner);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// Grades `solution` for challenge `id`. Failures are recorded too, with the checker's reason code.
    function submit(uint256 id, address solution, bytes calldata data)
        external
        nonReentrant
        returns (bool passed, uint8 code)
    {
        if (id >= challenges.length) revert UnknownChallenge();
        if (solution.code.length == 0) revert NotAContract();
        try ISolution(solution).learner() returns (address learner) {
            if (learner != msg.sender) revert NotYourSolution();
        } catch {
            revert NoLearnerFunction();
        }

        (passed, code) = challenges[id].check(msg.sender, solution, data);
        emit Submitted(msg.sender, id, solution, passed, code);
        if (passed && !solved[msg.sender][id]) {
            solved[msg.sender][id] = true;
            emit Solved(msg.sender, id, solution);
        }
    }
}
