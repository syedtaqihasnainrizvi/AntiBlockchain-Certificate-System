import { useState } from "react";
import { BrowserProvider, JsonRpcProvider, Contract } from "ethers";
import artifact from "./contracts/CertificateVerification.json";
import "./App.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// File ka SHA-256 hash nikalta hai (bytes32 format me)
async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return (
    "0x" +
    Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// Issue ke liye: MetaMask wallet se jura contract (transaction sign karta hai)
async function getContract() {
  if (!window.ethereum) throw new Error("MetaMask install karo");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, artifact.abi, signer);
}

// Verify ke liye: bina wallet ke, sirf padhne wala contract
function getReadContract() {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  return new Contract(CONTRACT_ADDRESS, artifact.abi, provider);
}

const errMsg = (e) => e.reason || e.shortMessage || e.message;

function App() {
  const [tab, setTab] = useState("verify");
  const [account, setAccount] = useState("");

  async function connectWallet() {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } catch (e) {
      alert("Wallet connect nahi hua: " + errMsg(e));
    }
  }

  return (
    <div className="container">
      <h1>🎓 Blockchain Certificate Verification</h1>

      <div className="wallet">
        {account ? (
          <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
        ) : (
          <button onClick={connectWallet}>Connect MetaMask (Admin only)</button>
        )}
      </div>

      <div className="tabs">
        <button className={tab === "verify" ? "active" : ""} onClick={() => setTab("verify")}>
          Verify Certificate
        </button>
        <button className={tab === "issue" ? "active" : ""} onClick={() => setTab("issue")}>
          Issue Certificate (Admin)
        </button>
      </div>

      {tab === "verify" ? <Verify /> : <Issue account={account} />}
    </div>
  );
}

function Issue({ account }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function handleIssue() {
    if (!account) return setStatus("❌ Pehle MetaMask connect karo");
    if (!id || !name || !course || !file)
      return setStatus("❌ Saari details aur file do");
    try {
      setStatus("⏳ Hash bana raha hu...");
      const hash = await hashFile(file);
      const contract = await getContract();
      setStatus("⏳ MetaMask me transaction confirm karo...");
      const tx = await contract.issueCertificate(id, name, course, hash);
      await tx.wait();
      setStatus("✅ Certificate issue ho gaya!\nHash: " + hash);
    } catch (e) {
      setStatus("❌ " + errMsg(e));
    }
  }

  return (
    <div className="card">
      <h2>Certificate Issue karo</h2>
      <input placeholder="Certificate ID (jaise CERT001)" value={id} onChange={(e) => setId(e.target.value)} />
      <input placeholder="Student ka naam" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Course (jaise B.Tech CSE)" value={course} onChange={(e) => setCourse(e.target.value)} />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleIssue}>Issue Certificate</button>
      {status && <pre className="status">{status}</pre>}
    </div>
  );
}

function Verify() {
  const [id, setId] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  async function handleVerify() {
    if (!id || !file) return setStatus("❌ Certificate ID aur file do");
    try {
      setStatus("⏳ Verify ho raha hai...");
      const hash = await hashFile(file);
      const contract = getReadContract();
      const valid = await contract.verifyCertificate(id, hash);
      if (valid) {
        const [name, course, issuedOn] = await contract.getCertificate(id);
        const date = new Date(Number(issuedOn) * 1000).toLocaleDateString();
        setStatus(`✅ VALID Certificate\nStudent: ${name}\nCourse: ${course}\nIssued on: ${date}`);
      } else {
        setStatus("❌ FAKE / Invalid / Revoked certificate");
      }
    } catch (e) {
      setStatus("❌ " + errMsg(e));
    }
  }

  return (
    <div className="card">
      <h2>Certificate Verify karo</h2>
      <input placeholder="Certificate ID" value={id} onChange={(e) => setId(e.target.value)} />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleVerify}>Verify</button>
      {status && <pre className="status">{status}</pre>}
    </div>
  );
}

export default App;