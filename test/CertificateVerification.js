const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateVerification", function () {
  let contract, admin, other;
  const hash = ethers.sha256(ethers.toUtf8Bytes("certificate-data"));
  const fakeHash = ethers.sha256(ethers.toUtf8Bytes("fake-data"));

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateVerification");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("admin certificate issue kar sakta hai aur verify hota hai", async function () {
    await contract.issueCertificate("CERT001", "Rahul", "B.Tech CSE", hash);
    expect(await contract.verifyCertificate("CERT001", hash)).to.equal(true);
  });

  it("galat hash par verify fail hota hai", async function () {
    await contract.issueCertificate("CERT001", "Rahul", "B.Tech CSE", hash);
    expect(await contract.verifyCertificate("CERT001", fakeHash)).to.equal(false);
  });

  it("non-admin certificate issue nahi kar sakta", async function () {
    await expect(
      contract.connect(other).issueCertificate("CERT002", "Amit", "MBA", hash)
    ).to.be.revertedWith("Only admin allowed");
  });

  it("duplicate ID allowed nahi hai", async function () {
    await contract.issueCertificate("CERT001", "Rahul", "B.Tech CSE", hash);
    await expect(
      contract.issueCertificate("CERT001", "Rahul", "B.Tech CSE", hash)
    ).to.be.revertedWith("Certificate ID already exists");
  });

  it("revoke karne ke baad verify fail hota hai", async function () {
    await contract.issueCertificate("CERT001", "Rahul", "B.Tech CSE", hash);
    await contract.revokeCertificate("CERT001");
    expect(await contract.verifyCertificate("CERT001", hash)).to.equal(false);
  });
});