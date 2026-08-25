// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DocumentRegistry {
    address public owner;

    struct Document {
        string verificationCode;
        string documentType;
        bytes32 documentHash;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => Document) private documents;
    mapping(bytes32 => bool) private registeredHashes;

    event DocumentRegistered(
        string indexed verificationCode,
        string documentType,
        bytes32 documentHash,
        uint256 registeredAt
    );

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Unauthorized registrar"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerDocument(
        string calldata verificationCode,
        string calldata documentType,
        bytes32 documentHash
    )
        external
        onlyOwner
    {
        require(
            bytes(verificationCode).length > 0,
            "Verification code wajib diisi"
        );

        require(
            documentHash != bytes32(0),
            "Document hash tidak valid"
        );

        require(
            !documents[verificationCode].exists,
            "Dokumen sudah terdaftar"
        );

        require(
            !registeredHashes[documentHash],
            "Document hash sudah terdaftar"
        );

        documents[verificationCode] = Document({
            verificationCode: verificationCode,
            documentType: documentType,
            documentHash: documentHash,
            registeredAt: block.timestamp,
            exists: true
        });

        registeredHashes[documentHash] = true;

        emit DocumentRegistered(
            verificationCode,
            documentType,
            documentHash,
            block.timestamp
        );
    }

    function verifyDocument(
        string calldata verificationCode,
        bytes32 submittedHash
    )
        external
        view
        returns (
            bool valid,
            string memory documentType,
            uint256 registeredAt
        )
    {
        Document memory document =
            documents[verificationCode];

        if (!document.exists) {
            return (false, "", 0);
        }

        bool hashMatches =
            document.documentHash == submittedHash;

        return (
            hashMatches,
            document.documentType,
            document.registeredAt
        );
    }

    function getDocument(
        string calldata verificationCode
    )
        external
        view
        returns (
            string memory,
            string memory,
            bytes32,
            uint256,
            bool
        )
    {
        Document memory document =
            documents[verificationCode];

        return (
            document.verificationCode,
            document.documentType,
            document.documentHash,
            document.registeredAt,
            document.exists
        );
    }

    function isHashRegistered(
        bytes32 documentHash
    )
        external
        view
        returns (bool)
    {
        return registeredHashes[documentHash];
    }
}