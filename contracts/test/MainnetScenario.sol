// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {LabRegistry} from "../src/LabRegistry.sol";
import {VaultChecker} from "../src/checkers/VaultChecker.sol";
import {PostQuantumChecker} from "../src/checkers/PostQuantumChecker.sol";
import "./Solutions.sol";

/// Never deployed. scripts/simulate-mainnet.mjs runs this constructor as an eth_call against Arc, so the
/// real USDC and precompile grade the sample solutions without sending a transaction. The constructor
/// returns its results instead of runtime code.
///
/// Creation order fixes the addresses: registry = nonce 1, VaultChecker = 2, PostQuantumChecker = 3.
/// The caller signs PostQuantumChecker.message(address(this)) for that predicted address.
contract MainnetScenario {
    struct Row {
        string solution;
        bool passed;
        uint8 code;
        uint256 gasUsed;
    }

    uint256 constant FLOAT = 1e14;

    constructor(bytes memory vk, bytes memory sig) payable {
        LabRegistry registry = new LabRegistry(0);
        VaultChecker vc = new VaultChecker();
        PostQuantumChecker pq = new PostQuantumChecker();
        (bool funded,) = address(vc).call{value: FLOAT}("");
        require(funded, "float");
        uint256 vaultId = registry.addChallenge(vc);
        uint256 pqId = registry.addChallenge(pq);

        address good = address(new GoodVault(address(this)));
        Row[] memory rows = new Row[](7);
        rows[0] = _submit(registry, vaultId, "GoodVault", good, "");
        rows[1] = _submit(registry, vaultId, "LedgerVault", address(new LedgerVault(address(this))), "");
        rows[2] = _submit(registry, vaultId, "TokenSweepVault", address(new TokenSweepVault(address(this))), "");
        bytes memory data = abi.encode(vk, sig);
        rows[3] = _submit(registry, pqId, "GoodVerifier", address(new GoodVerifier(address(this))), data);
        rows[4] = _submit(registry, pqId, "StrictVerifier", address(new StrictVerifier(address(this))), data);
        rows[5] = _submit(registry, pqId, "YesVerifier", address(new YesVerifier(address(this))), data);
        rows[6] = _submit(registry, pqId, "LengthVerifier", address(new LengthVerifier(address(this))), data);

        bytes memory out = abi.encode(
            rows,
            address(pq),
            address(vc).balance == FLOAT, // checker float intact after all vault runs
            good.balance == 0, // passing vault holds nothing afterwards
            registry.solved(address(this), vaultId),
            registry.solved(address(this), pqId)
        );
        assembly {
            return(add(out, 32), mload(out))
        }
    }

    function _submit(LabRegistry registry, uint256 id, string memory label, address solution, bytes memory data)
        private
        returns (Row memory row)
    {
        uint256 g = gasleft();
        (row.passed, row.code) = registry.submit(id, solution, data);
        row.gasUsed = g - gasleft();
        row.solution = label;
    }
}
