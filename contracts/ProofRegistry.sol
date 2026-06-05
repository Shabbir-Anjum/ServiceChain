// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProofRegistry
/// @notice Immutable audit trail of job completion proofs.
///         Agent records a hash of the off-chain proof + status + timestamp.
contract ProofRegistry {
    address public agent;

    struct Proof {
        bytes32 dataHash;  // keccak256 of the off-chain proof payload
        string status;     // "approved" | "rejected"
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Proof) public proofs; // jobId => Proof

    event ProofRecorded(bytes32 indexed jobId, bytes32 dataHash, string status, uint256 timestamp);

    modifier onlyAgent() {
        require(msg.sender == agent, "not agent");
        _;
    }

    constructor(address _agent) {
        agent = _agent;
    }

    function recordProof(bytes32 jobId, bytes32 dataHash, string calldata status) external onlyAgent {
        require(!proofs[jobId].exists, "proof exists");
        proofs[jobId] = Proof(dataHash, status, block.timestamp, true);
        emit ProofRecorded(jobId, dataHash, status, block.timestamp);
    }

    function getProof(bytes32 jobId) external view returns (Proof memory) {
        return proofs[jobId];
    }
}
