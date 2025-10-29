// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IOracle {
    function verifyProof(bytes calldata proof) external view returns (bool);
}

contract INFT is ERC721, Ownable, ReentrancyGuard {
    // State variables
    mapping(uint256 => bytes32) private _metadataHashes;
    mapping(uint256 => string) private _encryptedURIs;
    mapping(uint256 => mapping(address => bytes)) private _authorizations;
    
    // VISA: Attestation structure
    struct Attestation {
        bytes32 hash;
        string uri;
        address signer;
        uint64 timestamp;
    }
    
    // VISA: Store attestations for each token
    mapping(uint256 => Attestation[]) private _attestations;
    mapping(address => bool) public authorizedAttestors;
    
    address public oracle;
    uint256 private _nextTokenId = 1;
    
    // Events
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash);
    event UsageAuthorized(uint256 indexed tokenId, address indexed executor);
    
    // VISA: Attestation events
    event IncidentAttested(
        uint256 indexed tokenId,
        bytes32 indexed hash,
        address indexed signer,
        string uri,
        uint64 timestamp
    );
    
    event AttestorAuthorized(address indexed attestor, bool authorized);
    
    constructor(
        string memory name,
        string memory symbol,
        address _oracle
    ) ERC721(name, symbol) Ownable(msg.sender) {
        oracle = _oracle;
    }
    
    function mint(
        address to,
        string calldata encryptedURI,
        bytes32 metadataHash
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        _encryptedURIs[tokenId] = encryptedURI;
        _metadataHashes[tokenId] = metadataHash;
        
        return tokenId;
    }
    
    function transfer(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external nonReentrant {
        require(ownerOf(tokenId) == from, "Not owner");
        require(IOracle(oracle).verifyProof(proof), "Invalid proof");
        
        // Update metadata access for new owner
        _updateMetadataAccess(tokenId, to, sealedKey, proof);
        
        // Transfer token ownership
        _transfer(from, to, tokenId);
        
        emit MetadataUpdated(tokenId, keccak256(sealedKey));
    }
    
    function authorizeUsage(
        uint256 tokenId,
        address executor,
        bytes calldata permissions
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _authorizations[tokenId][executor] = permissions;
        emit UsageAuthorized(tokenId, executor);
    }
    
    function _updateMetadataAccess(
        uint256 tokenId,
        address /*newOwner*/,
        bytes calldata /*sealedKey*/,
        bytes calldata proof
    ) internal {
        // For demo purposes, derive a metadata hash from the oracle proof
        // In production, decode proof with ABI and update fields accordingly
        _metadataHashes[tokenId] = keccak256(proof);
    }
    
    function getMetadataHash(uint256 tokenId) external view returns (bytes32) {
        return _metadataHashes[tokenId];
    }
    
    function getEncryptedURI(uint256 tokenId) external view returns (string memory) {
        return _encryptedURIs[tokenId];
    }
    
    // VISA: Add attestation
    function addAttestation(
        uint256 tokenId,
        bytes32 hash,
        string calldata uri
    ) external {
        // Check if token exists by checking owner is not zero address
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(authorizedAttestors[msg.sender], "Not authorized to attest");
        
        uint64 timestamp = uint64(block.timestamp);
        
        _attestations[tokenId].push(Attestation({
            hash: hash,
            uri: uri,
            signer: msg.sender,
            timestamp: timestamp
        }));
        
        emit IncidentAttested(
            tokenId,
            hash,
            msg.sender,
            uri,
            timestamp
        );
    }
    
    // VISA: Get all attestations for a token
    function getAttestations(uint256 tokenId) 
        external 
        view 
        returns (Attestation[] memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _attestations[tokenId];
    }
    
    // VISA: Authorize attestor
    function setAttestor(address attestor, bool authorized) external onlyOwner {
        authorizedAttestors[attestor] = authorized;
        emit AttestorAuthorized(attestor, authorized);
    }
}