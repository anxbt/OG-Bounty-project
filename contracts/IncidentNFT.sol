// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract IncidentNFT is ERC721, Ownable {
    enum Severity { Info, Warning, Critical }

    struct Incident {
        string incidentId; // external id or UUID
        bytes32 logHash;   // keccak256 of raw logs stored off-chain
        uint8 severity;    // Severity enum encoded as uint8
        uint64 timestamp;  // block timestamp at mint
    }

    // tokenId => incident
    mapping(uint256 => Incident) private _incidents;
    // tokenId => tokenURI
    mapping(uint256 => string) private _tokenURIs;
    // Prevent duplicate incidentId if desired (hash of string)
    mapping(bytes32 => bool) private _incidentIdUsed;

    uint256 private _nextId = 1;

    event IncidentMinted(
        uint256 indexed tokenId,
        string incidentId,
        bytes32 logHash,
        uint8 severity,
        string tokenURI,
        uint64 timestamp
    );

    event IncidentBurned(uint256 indexed tokenId);

    constructor() ERC721("iSentinel Incident", "iSNTL") Ownable(msg.sender) {}

    function mintIncident(
        address to,
        string calldata incidentId,
        bytes32 logHash,
        uint8 severity,
        string calldata tokenURI_
    ) external onlyOwner returns (uint256 tokenId) {
        require(severity <= uint8(Severity.Critical), "bad severity");
        bytes32 idHash = keccak256(bytes(incidentId));
        require(!_incidentIdUsed[idHash], "incidentId used");

        tokenId = _nextId++;
    _safeMint(to, tokenId);
    _tokenURIs[tokenId] = tokenURI_;

        _incidents[tokenId] = Incident({
            incidentId: incidentId,
            logHash: logHash,
            severity: severity,
            timestamp: uint64(block.timestamp)
        });
        _incidentIdUsed[idHash] = true;

        emit IncidentMinted(
            tokenId,
            incidentId,
            logHash,
            severity,
            tokenURI_,
            uint64(block.timestamp)
        );
    }

    // Testnet-only cleanup. In prod, consider removing or timelocking.
    function burnIncident(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
        emit IncidentBurned(tokenId);
    }

    function getIncident(uint256 tokenId) external view returns (Incident memory, string memory) {
        return (_incidents[tokenId], tokenURI(tokenId));
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Note: For testnet burn cleanup, URIs are left as-is. Storage can be reclaimed off-chain via pruning.
}
