// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateVerification {
    address public admin;

    struct Certificate {
        string studentName;
        string course;
        bytes32 certHash;
        uint256 issuedOn;
        bool isValid;
        bool exists;
    }

    mapping(string => Certificate) private certificates;

    event CertificateIssued(string indexed id, bytes32 certHash, uint256 issuedOn);
    event CertificateRevoked(string indexed id);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    function issueCertificate(
        string memory _id,
        string memory _name,
        string memory _course,
        bytes32 _hash
    ) public onlyAdmin {
        require(!certificates[_id].exists, "Certificate ID already exists");
        certificates[_id] = Certificate(_name, _course, _hash, block.timestamp, true, true);
        emit CertificateIssued(_id, _hash, block.timestamp);
    }

    function revokeCertificate(string memory _id) public onlyAdmin {
        require(certificates[_id].exists, "Certificate not found");
        certificates[_id].isValid = false;
        emit CertificateRevoked(_id);
    }

    function verifyCertificate(string memory _id, bytes32 _hash)
        public view returns (bool)
    {
        Certificate memory c = certificates[_id];
        return c.exists && c.isValid && c.certHash == _hash;
    }

    function getCertificate(string memory _id)
        public view returns (string memory, string memory, uint256, bool)
    {
        require(certificates[_id].exists, "Certificate not found");
        Certificate memory c = certificates[_id];
        return (c.studentName, c.course, c.issuedOn, c.isValid);
    }
}