// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IUsdc {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// Arc Lab starter for "Books that balance". It compiles, deploys, and fails the checker on purpose.
/// Deploy it with your own address as `learner_`, submit it, read why it fails, fix it, and submit your fix.
contract StarterVault {
    IUsdc constant USDC = IUsdc(0x3600000000000000000000000000000000000000); // Arc USDC, 6 decimals

    address public learner;
    uint256 public deposited; // native units, 18 decimals

    constructor(address learner_) {
        learner = learner_;
    }

    function deposit() external payable {
        deposited += msg.value;
    }

    /// Everything the vault holds, in native units (18 decimals).
    function totalAssets() external view returns (uint256) {
        return deposited;
    }

    /// Pays everything the vault holds to `to`.
    function withdrawAll(address payable to) external {
        deposited = 0;
        require(USDC.transfer(to, USDC.balanceOf(address(this))), "transfer failed");
    }
}
