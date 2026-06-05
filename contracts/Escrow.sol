// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Escrow
/// @notice Holds client STT for a job. Only the agent can release/refund.
///         Client deposits -> agent releases to worker on verified completion,
///         or refunds the client if the job fails.
contract Escrow {
    address public agent; // the AI agent wallet — sole authority to settle

    enum State { None, Funded, Released, Refunded }

    struct Job {
        address client;
        address worker;
        uint256 amount;
        State state;
    }

    mapping(bytes32 => Job) public jobs; // jobId => Job

    event Deposited(bytes32 indexed jobId, address indexed client, address indexed worker, uint256 amount);
    event Released(bytes32 indexed jobId, address indexed worker, uint256 amount);
    event Refunded(bytes32 indexed jobId, address indexed client, uint256 amount);

    modifier onlyAgent() {
        require(msg.sender == agent, "not agent");
        _;
    }

    constructor(address _agent) {
        agent = _agent;
    }

    /// @notice Client funds a job. jobId is a unique bytes32 (e.g. keccak of uuid).
    function deposit(bytes32 jobId, address worker) external payable {
        require(jobs[jobId].state == State.None, "job exists");
        require(msg.value > 0, "no value");
        jobs[jobId] = Job(msg.sender, worker, msg.value, State.Funded);
        emit Deposited(jobId, msg.sender, worker, msg.value);
    }

    /// @notice Agent releases escrow to the worker after verified completion.
    function release(bytes32 jobId) external onlyAgent {
        Job storage j = jobs[jobId];
        require(j.state == State.Funded, "not funded");
        j.state = State.Released;
        (bool ok, ) = j.worker.call{value: j.amount}("");
        require(ok, "transfer failed");
        emit Released(jobId, j.worker, j.amount);
    }

    /// @notice Agent refunds the client if the job fails verification.
    function refund(bytes32 jobId) external onlyAgent {
        Job storage j = jobs[jobId];
        require(j.state == State.Funded, "not funded");
        j.state = State.Refunded;
        (bool ok, ) = j.client.call{value: j.amount}("");
        require(ok, "transfer failed");
        emit Refunded(jobId, j.client, j.amount);
    }

    function getJob(bytes32 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }
}
