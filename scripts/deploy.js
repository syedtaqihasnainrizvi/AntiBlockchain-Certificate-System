const { ethers } = require("hardhat");

async function main() {
  const Factory = await ethers.getContractFactory("CertificateVerification");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed at:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});