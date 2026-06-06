// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Somnia Agentic L1 — platform interface (from docs.somnia.network/agents).
// Lets a contract invoke consensus-validated agents (e.g. the LLM Inference Agent)
// and receive results via a handleResponse() callback.

enum ConsensusType { Majority, Threshold }

enum ResponseStatus {
    None,     // 0 uninitialized
    Pending,  // 1 awaiting responses
    Success,  // 2 consensus reached
    Failed,   // 3 validators reported failure
    TimedOut  // 4 timed out
}

struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

struct Request {
    uint256 id;
    address requester;
    address callbackAddress;
    bytes4 callbackSelector;
    address[] subcommittee;
    Response[] responses;
    uint256 responseCount;
    uint256 failureCount;
    uint256 threshold;
    uint256 createdAt;
    uint256 deadline;
    ResponseStatus status;
    ConsensusType consensusType;
    uint256 remainingBudget;
    uint256 perAgentBudget;
}

interface IAgentRequester {
    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    function getRequest(uint256 requestId) external view returns (Request memory);
    function getRequestDeposit() external view returns (uint256);
}

// The LLM Inference Agent's inferString — its selector is used to encode the payload.
// signature: inferString(string prompt, string system, bool chainOfThought, string[] allowedValues)
interface ILlmInferenceAgent {
    function inferString(
        string calldata prompt,
        string calldata system,
        bool chainOfThought,
        string[] calldata allowedValues
    ) external returns (string memory response);
}
