// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ISomniaAgents.sol";

/// @title AgentVerifier
/// @notice Verifies job-completion proofs using Somnia's Agentic L1 — the LLM
///         Inference Agent runs the verdict on a validator subcommittee
///         (consensus-validated, on-chain AI). The result lands in `verdict`
///         via the handleResponse() callback.
///
/// This is the "agent-native" core: instead of a server calling an off-chain
/// LLM, the contract asks Somnia's on-chain LLM agent to judge the proof, and
/// the answer is agreed by validators and written on-chain.
contract AgentVerifier {
    // Somnia testnet platform requester (docs.somnia.network/agents).
    IAgentRequester public immutable platform;
    // LLM Inference Agent id — set at deploy (from agents.somnia.network).
    uint256 public immutable llmAgentId;

    address public owner;

    // requestId -> jobId, and jobId -> the consensus verdict ("approved"/"rejected").
    mapping(uint256 => bytes32) public jobOfRequest;
    mapping(bytes32 => string) public verdict;        // final answer per job
    mapping(bytes32 => uint8) public verdictStatus;   // 0 none, 1 pending, 2 done, 3 failed

    event ProofVerificationRequested(bytes32 indexed jobId, uint256 indexed requestId);
    event ProofVerdict(bytes32 indexed jobId, string verdict);
    event ProofVerificationFailed(bytes32 indexed jobId, uint8 status);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _platform, uint256 _llmAgentId) {
        platform = IAgentRequester(_platform);
        llmAgentId = _llmAgentId;
        owner = msg.sender;
    }

    /// @notice Ask Somnia's on-chain LLM to verify a proof. Constrained to
    ///         answer exactly "approved" or "rejected" via allowedValues.
    ///         msg.value must cover the request deposit (see getDeposit()).
    function verifyProof(bytes32 jobId, string calldata jobSummary, string calldata proofText)
        external
        payable
        onlyOwner
        returns (uint256 requestId)
    {
        string memory prompt = string.concat(
            "A worker submitted proof that a service job is done.\n",
            "JOB: ", jobSummary, "\n",
            "WORKER PROOF: ", proofText, "\n",
            "Is the job plausibly completed based on the proof? ",
            "Answer with exactly one word: approved or rejected."
        );

        string[] memory allowed = new string[](2);
        allowed[0] = "approved";
        allowed[1] = "rejected";

        // Encode the LLM agent call (inferString) as the request payload.
        bytes memory payload = abi.encodeWithSelector(
            ILlmInferenceAgent.inferString.selector,
            prompt,
            "You are a strict but fair job-completion verifier.", // system
            false,                                                // chainOfThought
            allowed                                               // allowedValues
        );

        requestId = platform.createRequest{value: msg.value}(
            llmAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        jobOfRequest[requestId] = jobId;
        verdictStatus[jobId] = 1; // pending
        emit ProofVerificationRequested(jobId, requestId);
    }

    /// @notice Callback from the Somnia platform once validators reach consensus.
    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory /*details*/
    ) external {
        require(msg.sender == address(platform), "only platform");
        bytes32 jobId = jobOfRequest[requestId];

        if (status == ResponseStatus.Success && responses.length > 0) {
            // The LLM agent returns the string result in responses[0].result.
            string memory answer = abi.decode(responses[0].result, (string));
            verdict[jobId] = answer;
            verdictStatus[jobId] = 2; // done
            emit ProofVerdict(jobId, answer);
        } else {
            verdictStatus[jobId] = 3; // failed
            emit ProofVerificationFailed(jobId, uint8(status));
        }
    }

    /// @notice The msg.value to send with verifyProof().
    function getDeposit() external view returns (uint256) {
        return platform.getRequestDeposit();
    }

    function getVerdict(bytes32 jobId) external view returns (uint8 vStatus, string memory answer) {
        return (verdictStatus[jobId], verdict[jobId]);
    }
}
