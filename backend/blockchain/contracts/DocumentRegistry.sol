// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DocumentRegistry {
    struct Document {
        string verificationCode;
        string documentType;
        bytes32 documentHash;
        uint256 registeredAt;
        bool exists;
    }

    mapping(string => Document) private documents;

    event DocumentRegistered(
        string indexed verificationCode,
        string documentType,
        bytes32 documentHash,
        uint256 registeredAt
    );

    function registerDocument(
        string calldata verificationCode,
        string calldata documentType,
        bytes32 documentHash
    ) external {
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

        documents[verificationCode] = Document({
            verificationCode: verificationCode,
            documentType: documentType,
            documentHash: documentHash,
            registeredAt: block.timestamp,
            exists: true
        });

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
        Document memory document = documents[verificationCode];

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
        Document memory document = documents[verificationCode];

        return (
            document.verificationCode,
            document.documentType,
            document.documentHash,
            document.registeredAt,
            document.exists
        );
    }
}