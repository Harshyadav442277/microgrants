// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// Arc Lab starter for "Post-quantum signature". It compiles, deploys, and fails the checker on purpose.
/// Deploy it with your own address as `learner_`, submit it with your signature, read why it fails, fix it,
/// and submit your fix. Arc verifies SLH-DSA-SHA2-128s signatures in a precompile; see the Arc docs.
contract StarterVerifier {
    address public learner;

    constructor(address learner_) {
        learner = learner_;
    }

    /// True only if `sig` is a valid SLH-DSA-SHA2-128s signature of `message` under public key `vk`.
    function verify(bytes calldata vk, bytes calldata message, bytes calldata sig) external pure returns (bool) {
        message;
        return vk.length == 32 && sig.length == 7856;
    }
}
