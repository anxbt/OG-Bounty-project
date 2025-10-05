// contracts/INFT.sol
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
    
    address public oracle;
    uint256 private _nextTokenId = 1;
    
    // Events
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash);
    event UsageAuthorized(uint256 indexed tokenId, address indexed executor);
    
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
}