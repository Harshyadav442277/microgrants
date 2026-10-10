// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import {LabRegistry} from "../src/LabRegistry.sol";
import {VaultChecker} from "../src/checkers/VaultChecker.sol";
import {PostQuantumChecker} from "../src/checkers/PostQuantumChecker.sol";
import {StarterVault} from "../src/starters/StarterVault.sol";
import {StarterVerifier} from "../src/starters/StarterVerifier.sol";
import {PQ_CHECKER, PQ_LEARNER, PQ_VK, PQ_SIG} from "./PqFixture.sol";
import "./Solutions.sol";

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function prank(address sender) external;
    function createSelectFork(string calldata url, uint256 blockNumber) external returns (uint256);
    function expectRevert(bytes4 revertData) external;
    function expectRevert(bytes calldata revertData) external;
}

Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

/// Fork tests: run with Arc Foundry against Arc testnet at a pinned block, so Arc USDC and the SLH-DSA
/// precompile are the real ones. Stock Foundry would run them under Ethereum rules.
contract ArcLabTest {
    string constant ARC_TESTNET_RPC = "https://rpc.testnet.arc.io";
    uint256 constant FORK_BLOCK = 66523112;
    uint256 constant DRIP = 0.05 ether; // 0.05 USDC in native 18-decimal units

    LabRegistry registry;
    VaultChecker vaultChecker;
    PostQuantumChecker pqChecker;
    uint256 vaultId;
    uint256 pqId;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    bytes vk;
    bytes sig;

    function setUp() public {
        vm.createSelectFork(ARC_TESTNET_RPC, FORK_BLOCK);
        require(block.chainid == 5042002, "not on the Arc testnet fork");
        registry = new LabRegistry(DRIP);
        vaultChecker = new VaultChecker();
        pqChecker = new PostQuantumChecker();
        vm.deal(address(vaultChecker), 1e14);
        vaultId = registry.addChallenge(vaultChecker);
        pqId = registry.addChallenge(pqChecker);

        require(address(pqChecker) == PQ_CHECKER && alice == PQ_LEARNER, "fixture stale: node scripts/make-pq-fixture.mjs");
        vk = PQ_VK;
        sig = PQ_SIG;
    }

    receive() external payable {}

    // ---------- registry ----------

    function testOnlyOwnerAddsChallenges() public {
        vm.prank(alice);
        vm.expectRevert(LabRegistry.NotOwner.selector);
        registry.addChallenge(vaultChecker);
    }

    function testEnrolSendsDripOnce() public {
        vm.deal(address(registry), 1 ether);
        address[] memory list = new address[](2);
        list[0] = alice;
        list[1] = alice;
        registry.enrol(list);
        _eq(alice.balance, DRIP, "one drip");
        _true(registry.enrolled(alice), "enrolled");
    }

    function testEnrolSkipsRecipientThatRejectsValue() public {
        vm.deal(address(registry), 1 ether);
        address rejecting = address(new NoDepositVault(alice)); // no receive()
        address[] memory list = new address[](2);
        list[0] = rejecting;
        list[1] = bob;
        registry.enrol(list);
        _true(!registry.enrolled(rejecting), "rejecting not enrolled");
        _true(registry.enrolled(bob), "batch continued");
        _eq(bob.balance, DRIP, "bob drip");
    }

    function testSubmitRejectsUnknownChallenge() public {
        address s = address(new GoodVault(alice));
        vm.prank(alice);
        vm.expectRevert(LabRegistry.UnknownChallenge.selector);
        registry.submit(9, s, "");
    }

    function testSubmitRejectsNonContract() public {
        vm.prank(alice);
        vm.expectRevert(LabRegistry.NotAContract.selector);
        registry.submit(vaultId, bob, "");
    }

    function testSubmitRejectsSomeoneElsesSolution() public {
        address s = address(new GoodVault(alice));
        vm.prank(bob);
        vm.expectRevert(LabRegistry.NotYourSolution.selector);
        registry.submit(vaultId, s, "");
    }

    function testSubmitRejectsSolutionWithoutLearner() public {
        address s = address(new Anonymous());
        vm.prank(alice);
        vm.expectRevert(LabRegistry.NoLearnerFunction.selector);
        registry.submit(vaultId, s, "");
    }

    // ---------- Books that balance ----------

    function testGoodVaultPasses() public {
        address s = address(new GoodVault(alice));
        uint256 float = address(vaultChecker).balance;
        _expectVault(s, true, vaultChecker.OK());
        _true(registry.solved(alice, vaultId), "solved");
        _eq(address(vaultChecker).balance, float, "checker float unchanged");
        _eq(s.balance, 0, "vault untouched");
    }

    function testGoodVaultPassesAfterStrangerSendsDust() public {
        address s = address(new GoodVault(alice));
        vm.deal(s, 123);
        _expectVault(s, true, vaultChecker.OK());
        _eq(s.balance, 123, "dust untouched");
    }

    function testLedgerVaultMissesTokenCredit() public {
        _expectVault(address(new LedgerVault(alice)), false, vaultChecker.WRONG_TOTAL());
        _true(!registry.solved(alice, vaultId), "not solved");
    }

    function testTokenSweepLeavesDust() public {
        _expectVault(address(new TokenSweepVault(alice)), false, vaultChecker.LEFT_DUST());
    }

    function testNonPayableDepositFails() public {
        _expectVault(address(new NoDepositVault(alice)), false, vaultChecker.DEPOSIT_FAILED());
    }

    function testForgedResultIsNotAccepted() public {
        _expectVault(address(new ForgingVault(alice)), false, vaultChecker.DEPOSIT_FAILED());
    }

    function testStarterVaultFailsOnTheTokenCreditFirst() public {
        _expectVault(address(new StarterVault(alice)), false, vaultChecker.WRONG_TOTAL());
    }

    function testStarterVaultWithTotalFixedThenLeavesDust() public {
        // The ledger bug fixed, the ERC-20 sweep kept: the second lesson.
        _expectVault(address(new TokenSweepVault(alice)), false, vaultChecker.LEFT_DUST());
    }

    function testRunCannotBeCalledDirectly() public {
        address s = address(new GoodVault(alice));
        vm.expectRevert(abi.encodeWithSelector(VaultChecker.Result.selector, false, vaultChecker.ABORTED()));
        vaultChecker.run(s, 1e12);
    }

    // ---------- Post-quantum signature ----------

    function testGoodVerifierPasses() public {
        _expectPq(alice, address(new GoodVerifier(alice)), sig, true, pqChecker.OK());
        _true(registry.solved(alice, pqId), "solved");
    }

    function testRevertingVerifierPasses() public {
        _expectPq(alice, address(new StrictVerifier(alice)), sig, true, pqChecker.OK());
    }

    function testAcceptAllVerifierFails() public {
        _expectPq(alice, address(new YesVerifier(alice)), sig, false, pqChecker.ACCEPTED_TAMPERED());
    }

    function testLengthOnlyVerifierFails() public {
        _expectPq(alice, address(new LengthVerifier(alice)), sig, false, pqChecker.ACCEPTED_TAMPERED());
    }

    function testValidSignatureVerifiesOnPrecompile() public view {
        _true(pqChecker.PQ().verifySlhDsaSha2128s(vk, pqChecker.message(alice), sig), "fixture verifies on Arc");
    }

    function testStarterVerifierAcceptsTamperedSignature() public {
        _expectPq(alice, address(new StarterVerifier(alice)), sig, false, pqChecker.ACCEPTED_TAMPERED());
    }

    function testInvalidLearnerSignatureFails() public {
        bytes memory other = _bytes(7856, 1);
        _expectPq(alice, address(new GoodVerifier(alice)), other, false, pqChecker.BAD_SIGNATURE());
    }

    function testSignatureIsBoundToLearner() public {
        // alice's valid signature does not verify for bob's message.
        _expectPq(bob, address(new GoodVerifier(bob)), sig, false, pqChecker.BAD_SIGNATURE());
    }

    function testWrongLengthsFail() public {
        _expectPq(alice, address(new GoodVerifier(alice)), _bytes(100, 1), false, pqChecker.BAD_INPUT());
    }

    // ---------- helpers ----------

    function _expectVault(address solution, bool passed, uint8 code) internal {
        vm.prank(alice);
        (bool p, uint8 c) = registry.submit(vaultId, solution, "");
        _true(p == passed, "passed");
        _eq(c, code, "code");
    }

    function _expectPq(address learner, address solution, bytes memory s, bool passed, uint8 code) internal {
        vm.prank(learner);
        (bool p, uint8 c) = registry.submit(pqId, solution, abi.encode(vk, s));
        _true(p == passed, "passed");
        _eq(c, code, "code");
    }

    function _bytes(uint256 n, uint8 seed) internal pure returns (bytes memory b) {
        b = new bytes(n);
        for (uint256 i; i < n; ++i) {
            b[i] = bytes1(uint8(uint256(keccak256(abi.encode(seed, i)))));
        }
    }

    function _true(bool ok, string memory what) internal pure {
        require(ok, what);
    }

    function _eq(uint256 a, uint256 b, string memory what) internal pure {
        require(a == b, string.concat(what, ": got ", _str(a), ", want ", _str(b)));
    }

    function _str(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        bytes memory out;
        while (v != 0) {
            out = abi.encodePacked(bytes1(uint8(48 + (v % 10))), out);
            v /= 10;
        }
        return string(out);
    }
}
