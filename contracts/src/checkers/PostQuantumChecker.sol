// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IChecker} from "../IArcLab.sol";

/// Arc's SLH-DSA-SHA2-128s verifier precompile (circlefin/arc-node contracts/src/pq/IPQ.sol).
interface IPQ {
    function verifySlhDsaSha2128s(bytes calldata vk, bytes calldata message, bytes calldata sig)
        external
        view
        returns (bool);
}

/// What a solution to "Post-quantum signature" implements.
interface ISigVerifier {
    function verify(bytes calldata vk, bytes calldata message, bytes calldata sig) external view returns (bool);
}

/// Challenge: "Post-quantum signature".
/// The learner signs `message(learner)` with their own SLH-DSA-SHA2-128s key and deploys a contract that
/// verifies signatures through Arc's precompile. `data` is abi.encode(bytes vk, bytes sig).
/// The solution must accept the learner's valid signature and reject (return false or revert) a tampered copy.
contract PostQuantumChecker is IChecker {
    IPQ public constant PQ = IPQ(0x1800000000000000000000000000000000000004);
    uint256 public constant VK_BYTES = 32;
    uint256 public constant SIG_BYTES = 7856;

    uint8 public constant OK = 0;
    uint8 public constant BAD_INPUT = 1;
    uint8 public constant BAD_SIGNATURE = 2;
    uint8 public constant REJECTED_VALID = 3;
    uint8 public constant ACCEPTED_TAMPERED = 4;

    function name() external pure returns (string memory) {
        return "Post-quantum signature";
    }

    /// The exact bytes the learner signs.
    function message(address learner) public view returns (bytes memory) {
        return abi.encodePacked("Arc Lab post-quantum challenge", block.chainid, address(this), learner);
    }

    function check(address learner, address solution, bytes calldata data) external view returns (bool, uint8) {
        (bytes memory vk, bytes memory sig) = abi.decode(data, (bytes, bytes));
        if (vk.length != VK_BYTES || sig.length != SIG_BYTES) return (false, BAD_INPUT);
        bytes memory m = message(learner);
        if (!PQ.verifySlhDsaSha2128s(vk, m, sig)) return (false, BAD_SIGNATURE);

        try ISigVerifier(solution).verify(vk, m, sig) returns (bool ok) {
            if (!ok) return (false, REJECTED_VALID);
        } catch {
            return (false, REJECTED_VALID);
        }

        sig[SIG_BYTES / 2] ^= 0x01;
        try ISigVerifier(solution).verify(vk, m, sig) returns (bool ok) {
            if (ok) return (false, ACCEPTED_TAMPERED);
        } catch {}
        return (true, OK);
    }
}
