// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// Sample learner solutions: one correct and several typical mistakes per challenge.

import {VaultChecker} from "../src/checkers/VaultChecker.sol";

interface IUsdc {
    function transfer(address to, uint256 units) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

interface IPqPrecompile {
    function verifySlhDsaSha2128s(bytes calldata, bytes calldata, bytes calldata) external view returns (bool);
}

abstract contract Owned {
    address public learner;

    constructor(address learner_) {
        learner = learner_;
    }
}

/// Correct: reads its real native balance and sends all of it natively.
contract GoodVault is Owned {
    constructor(address l) Owned(l) {}

    function deposit() external payable {}

    function totalAssets() external view returns (uint256) {
        return address(this).balance;
    }

    function withdrawAll(address payable to) external {
        (bool ok,) = to.call{value: address(this).balance}("");
        require(ok);
    }
}

/// Mistake: keeps its own ledger, so it misses value that arrives by ERC-20 transfer.
contract LedgerVault is Owned {
    uint256 public deposited;

    constructor(address l) Owned(l) {}

    function deposit() external payable {
        deposited += msg.value;
    }

    function totalAssets() external view returns (uint256) {
        return deposited;
    }

    function withdrawAll(address payable to) external {
        (bool ok,) = to.call{value: address(this).balance}("");
        require(ok);
        deposited = 0;
    }
}

/// Mistake: pays out through the 6-decimal ERC-20 view, leaving sub-unit dust behind.
contract TokenSweepVault is Owned {
    IUsdc constant USDC = IUsdc(0x3600000000000000000000000000000000000000);

    constructor(address l) Owned(l) {}

    function deposit() external payable {}

    function totalAssets() external view returns (uint256) {
        return address(this).balance;
    }

    function withdrawAll(address payable to) external {
        require(USDC.transfer(to, USDC.balanceOf(address(this))));
    }
}

/// Mistake: deposit is not payable.
contract NoDepositVault is Owned {
    constructor(address l) Owned(l) {}

    function deposit() external {}

    function totalAssets() external view returns (uint256) {
        return address(this).balance;
    }

    function withdrawAll(address payable) external {}
}

/// Attack: tries to forge the checker's internal "passed" result.
contract ForgingVault is Owned {
    constructor(address l) Owned(l) {}

    function deposit() external payable {
        revert VaultChecker.Result(true, 0);
    }

    function totalAssets() external pure returns (uint256) {
        revert VaultChecker.Result(true, 0);
    }

    function withdrawAll(address payable) external pure {
        revert VaultChecker.Result(true, 0);
    }
}

/// Correct: forwards to Arc's precompile.
contract GoodVerifier is Owned {
    IPqPrecompile constant PQ = IPqPrecompile(0x1800000000000000000000000000000000000004);

    constructor(address l) Owned(l) {}

    function verify(bytes calldata vk, bytes calldata m, bytes calldata sig) external view returns (bool) {
        return PQ.verifySlhDsaSha2128s(vk, m, sig);
    }
}

/// Correct variant: reverts instead of returning false.
contract StrictVerifier is Owned {
    IPqPrecompile constant PQ = IPqPrecompile(0x1800000000000000000000000000000000000004);

    constructor(address l) Owned(l) {}

    function verify(bytes calldata vk, bytes calldata m, bytes calldata sig) external view returns (bool) {
        require(PQ.verifySlhDsaSha2128s(vk, m, sig), "invalid");
        return true;
    }
}

/// Mistake: accepts anything.
contract YesVerifier is Owned {
    constructor(address l) Owned(l) {}

    function verify(bytes calldata, bytes calldata, bytes calldata) external pure returns (bool) {
        return true;
    }
}

/// Mistake: checks only the shape of the input.
contract LengthVerifier is Owned {
    constructor(address l) Owned(l) {}

    function verify(bytes calldata vk, bytes calldata, bytes calldata sig) external pure returns (bool) {
        return vk.length == 32 && sig.length == 7856;
    }
}

/// No `learner()` function.
contract Anonymous {
    function deposit() external payable {}
}
