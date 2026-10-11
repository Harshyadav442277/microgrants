// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IChecker} from "../IArcLab.sol";

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
}

/// What a solution to "Books that balance" implements.
interface IVault {
    function deposit() external payable;
    /// Everything the vault holds, in native units (18 decimals).
    function totalAssets() external view returns (uint256);
    function withdrawAll(address payable to) external;
}

/// Challenge: "Books that balance".
/// On Arc, native USDC (18 decimals) and the USDC ERC-20 (6 decimals) are one balance. An ERC-20 transfer
/// credits a contract without running any of its code, and the ERC-20 view floors amounts below 10^12 wei.
/// The vault must report its true balance after such a transfer and pay out all of it, dust included.
///
/// The test runs inside a call that always reverts, so no funds move. The checker
/// needs a float of a few 10^12 wei (send it native USDC once).
contract VaultChecker is IChecker {
    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    uint256 public constant SCALE = 1e12; // wei per ERC-20 unit

    uint8 public constant OK = 0;
    uint8 public constant DEPOSIT_FAILED = 1;
    uint8 public constant WRONG_TOTAL = 2;
    uint8 public constant WITHDRAW_FAILED = 3;
    uint8 public constant LEFT_DUST = 4;
    uint8 public constant PAID_WRONG = 5;
    uint8 public constant ABORTED = 6;

    error Result(bool passed, uint8 code);

    receive() external payable {}

    function name() external pure returns (string memory) {
        return "Books that balance";
    }

    function check(address learner, address solution, bytes calldata) external returns (bool, uint8) {
        uint256 dust = uint256(keccak256(abi.encode(learner, solution, block.number))) % SCALE;
        if (dust == 0) dust = 1;
        try this.run(solution, SCALE + dust) {
            return (false, ABORTED); // unreachable: run always reverts
        } catch (bytes memory err) {
            if (err.length != 68) return (false, ABORTED);
            bytes4 selector;
            bool passed;
            uint256 code;
            assembly {
                selector := and(mload(add(err, 32)), shl(224, 0xffffffff))
                passed := mload(add(err, 36))
                code := mload(add(err, 68))
            }
            // Only `run` itself raises Result: every call into the solution is wrapped below.
            if (selector != Result.selector || code > ABORTED) return (false, ABORTED);
            return (passed, uint8(code));
        }
    }

    /// The test. Always reverts with Result so its state changes are rolled back.
    function run(address solution, uint256 amount) external {
        if (msg.sender != address(this)) revert Result(false, ABORTED);
        // Grade relative to what the vault already holds, so a stranger cannot block it by sending dust.
        uint256 start = solution.balance;
        try IVault(solution).deposit{value: amount}() {}
        catch {
            revert Result(false, DEPOSIT_FAILED);
        }
        // Credits SCALE wei to the vault without calling it.
        if (!USDC.transfer(solution, 1)) revert Result(false, ABORTED);
        uint256 expected = start + amount + SCALE;

        try IVault(solution).totalAssets() returns (uint256 total) {
            if (total != expected) revert Result(false, WRONG_TOTAL);
        } catch {
            revert Result(false, WRONG_TOTAL);
        }

        uint256 before = address(this).balance;
        try IVault(solution).withdrawAll(payable(address(this))) {}
        catch {
            revert Result(false, WITHDRAW_FAILED);
        }
        if (solution.balance != 0) revert Result(false, LEFT_DUST);
        if (address(this).balance != before + expected) revert Result(false, PAID_WRONG);
        revert Result(true, OK);
    }
}
