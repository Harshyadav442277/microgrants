// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {LabRegistry} from "../src/LabRegistry.sol";
import {VaultChecker} from "../src/checkers/VaultChecker.sol";
import {PostQuantumChecker} from "../src/checkers/PostQuantumChecker.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256);
    function envOr(string calldata name, uint256 defaultValue) external view returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

/// Deploys the registry and both checkers, funds the vault checker's float, lists the challenges and
/// optionally funds the drip. The deployer becomes the registry owner (instructor).
///
///   arc-forge script script/Deploy.s.sol:Deploy --rpc-url <arc rpc> --broadcast
///
/// Env: DEPLOYER_PRIVATE_KEY (required), DRIP_WEI (default 0.05 USDC), REGISTRY_FUNDING_WEI (default 0).
contract Deploy {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 constant CHECKER_FLOAT = 1e14; // 0.0001 USDC; the vault test needs a few 10^12 wei and moves none

    function run() external returns (LabRegistry registry, VaultChecker vaultChecker, PostQuantumChecker pqChecker) {
        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 drip = vm.envOr("DRIP_WEI", uint256(0.05 ether));
        uint256 funding = vm.envOr("REGISTRY_FUNDING_WEI", uint256(0));

        vm.startBroadcast(key);
        registry = new LabRegistry(drip);
        vaultChecker = new VaultChecker();
        pqChecker = new PostQuantumChecker();
        (bool ok,) = address(vaultChecker).call{value: CHECKER_FLOAT}("");
        require(ok, "float");
        registry.addChallenge(vaultChecker);
        registry.addChallenge(pqChecker);
        if (funding != 0) {
            (ok,) = address(registry).call{value: funding}("");
            require(ok, "funding");
        }
        vm.stopBroadcast();
    }
}
