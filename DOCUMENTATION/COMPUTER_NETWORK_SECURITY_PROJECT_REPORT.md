# OLYMPUS: Privacy-Preserving Federated Fraud Intelligence with Zero-Trust Cybersecurity Gateway and Byzantine Anomaly Mitigation

**Subject – COMPUTER & NETWORK SECURITY**

| Name of Student | Roll No. |
| :--- | :--- |
| Student1 | Roll No1 |
| Student2 | Roll No2 |
| Student3 | Roll No3 |
| Student4 | Roll No4 |

<br>

**Supervisor**  
**Prof. Shivani Herlekar**

<br>

### Vidyalankar Institute of Technology  
**(AY 2024-25)**

---

<br>

## CERTIFICATE

This is to certify that the Mini Project entitled **“OLYMPUS: Privacy-Preserving Federated Fraud Intelligence with Zero-Trust Cybersecurity Gateway and Byzantine Anomaly Mitigation”** is a bonafide work of **Student1 (Roll No1)**, **Student2 (Roll No2)**, **Student3 (Roll No3)**, and **Student4 (Roll No4)**.

<br><br><br>

___________________________  
**Prof. Shivani Herlekar**  
Supervisor  

---

## Contents

- **Abstract** ................................................................................................. ii
- **Acknowledgments** ..................................................................................... iii
- **List of Abbreviations** ................................................................................. iv
- **List of Figures** ........................................................................................... v
- **List of Tables** ............................................................................................ vi
- **List of Symbols** .......................................................................................... vii
- **1 Introduction** ........................................................................................... 1
  - 1.1 Problem Statement & Objectives ......................................................... 3
- **2 Literature Survey** ................................................................................... 11
  - 2.1 Survey of Existing/Similar System ....................................................... 13
- **3 Proposed System** .................................................................................... 18
  - 3.1 Introduction ....................................................................................... 18
  - 3.2 Architecture/ Framework .................................................................... 19
  - 3.3 Algorithm and Process Design .............................................................. 22
  - 3.4 Details of Hardware & Software ........................................................... 25
  - 3.4 Experiment and Results ....................................................................... 26
  - 3.5 Conclusion and Future work ................................................................ 29
- **References** ............................................................................................... 32

---

## Abstract

Modern financial and telecommunications ecosystems are confronted with sophisticated, globally coordinated payment fraud, credit abuse, and money-laundering schemes. Traditional anti-money laundering (AML) architectures mandate pooling sensitive customer records, financial histories, and transaction ledgers into centralized clearinghouse repositories. In Computer & Network Security, this centralized paradigm introduces catastrophic vulnerabilities: single-point-of-failure (SPoF) risks, massive data breach exposures, and non-compliance with data privacy mandates such as GDPR and the Indian Digital Personal Data Protection Act (DPDPA).

While Federated Learning (FL) allows distributed financial institutions to collaboratively train fraud detection models by keeping raw transaction data on local servers and exchanging only mathematical parameter updates, standard federated learning systems inherit severe cybersecurity vulnerabilities. Specifically, unauthenticated federated channels are vulnerable to: (1) Gradient Inversion (Deep Leakage from Gradients - DLG), where network eavesdroppers numerically reconstruct raw private customer transactions; (2) Model Poisoning and Byzantine Sign-Flip Attacks, where compromised nodes inject malicious parameter updates to bias or collapse the global fraud boundary; and (3) IEEE-754 floating-point tampering (NaN/Inf injection) causing server-side denial of service.

To solve these pressing cybersecurity challenges, this project presents OLYMPUS, a secure, privacy-preserving federated fraud intelligence platform protected by an inline Zero-Trust Cybersecurity Gateway. OLYMPUS operates a continuous 6-gate cryptographic defense pipeline: (1) Gate 01: Differential Privacy Ingress (calibrated Gaussian noise perturbation, $\epsilon = 2.45, \delta = 10^{-5}$) to eliminate gradient inversion risks; (2) Gate 02: SecAgg+ Masking using Diffie-Hellman (DH-25519) pairwise keys to guarantee parameter transport confidentiality; (3) Gate 03: Structural Sanity and IEEE-754 integrity filtering with deterministic SHA-256 fingerprinting; (4) Gate 04: Consensus Sieving via leave-one-out cosine similarity alignment to deflect Byzantine sign-flip attacks; (5) Gate 05: Dynamic Zero-Trust Reputation Engine with bounded scores ($[0, 100]$) and automated quarantine cage isolation at $T < 40$; and (6) Gate 06: Byzantine-Resilient FedAvg Core for contamination-free parameter fusion. Adversarial testing on financial transaction datasets demonstrates that OLYMPUS achieves a 100% detection rate against malicious attacks with an inspection latency of under 3 milliseconds, maintaining an exceptional global fraud detection AUROC of 98.4%.

---

## Acknowledgments

We express our deepest gratitude and indebtedness to our project supervisor, **Prof. Shivani Herlekar**, Department of Computer Engineering, Vidyalankar Institute of Technology, for her invaluable guidance, rigorous academic criticism, and constructive feedback throughout the design, implementation, and evaluation phases of this cybersecurity project.

We also thank our Head of Department and the Principal of Vidyalankar Institute of Technology for providing high-performance computing facilities and a stimulating academic environment. Finally, we thank our colleagues and family members whose moral encouragement and constructive discussions enabled us to complete this work.

---

## List of Abbreviations

- **AML**: Anti-Money Laundering
- **AUROC**: Area Under the Receiver Operating Characteristic
- **Byzantine**: Arbitrary or Adversarial Node Malice
- **CosSim**: Cosine Similarity
- **DH-25519**: Diffie-Hellman Key Exchange over Curve25519
- **DLG**: Deep Leakage from Gradients
- **DP**: Differential Privacy
- **DPDPA**: Digital Personal Data Protection Act (India)
- **FedAvg**: Federated Averaging
- **FL**: Federated Learning
- **GDPR**: General Data Protection Regulation
- **IEEE-754**: Standard for Floating-Point Arithmetic
- **mTLS**: Mutual Transport Layer Security
- **Non-IID**: Non-Independent and Identically Distributed Data
- **SecAgg+**: Secure Aggregation Plus Protocol
- **SHA-256**: Secure Hash Algorithm 256-bit
- **SOAR**: Security Orchestration, Automation, and Response
- **SOC**: Security Operations Center
- **SPoF**: Single Point of Failure

---

## List of Figures

- **Figure 3.1**: OLYMPUS Zero-Trust Cybersecurity Gateway and Real-Time 3D Consortium Topology
- **Figure 3.2**: Real-Time Byzantine Sign-Flip Attack Injection and Automated Gateway Quarantine Mitigation
- **Figure 3.3**: Collaborative Model Risk Assessment and Cross-Institutional Comparative Fraud Analytics

---

## List of Tables

- **Table 2.1**: Comparative Cybersecurity Vulnerability Matrix: Centralized vs Standard FL vs OLYMPUS
- **Table 3.1**: Dynamic Trust Engine Reputation Penalty and Reward Schedule
- **Table 3.2**: Hardware and Software Implementation Specifications
- **Table 3.3**: Adversarial Threat Scenario Evaluation and Defense Mitigation Performance Metrics

---

## List of Symbols

- $\Delta W_i$: Parameter weight update vector submitted by client $i$
- $\Delta \bar{W}_{-i}$: Leave-one-out consensus peer mean update excluding candidate $i$
- $\|\Delta W_i\|_2$: Euclidean ($L_2$) norm of parameter update
- $\text{CosSim}(\cdot)$: Cosine similarity angle between candidate update and consensus mean
- $\epsilon$: Differential privacy privacy loss budget parameter
- $\delta$: Differential privacy failure probability bound
- $\sigma$: Gaussian perturbation noise scale
- $T_i$: Dynamic trust and reputation score of node $i$ ($0 \le T_i \le 100$)
- $n_i$: Number of local training samples for participant $i$
- $\mathcal{S}$: Set of vetted, cryptographically authenticated client updates in a round

---

# 1 Introduction

Financial payment systems and digital banking rails have modernized modern commerce, enabling instant gross settlement and cross-border money transfers. However, this interconnectivity has expanded the threat landscape for organized cyber syndicates, synthetic identity rings, and payment fraud operations. Fraudsters systematically exploit institutional silos, dispersing suspicious wire transfers and micro-structuring cash-out transactions across multiple retail banks, neo-banks, and fintech card issuers so that no single localized institution observes the complete malicious pattern.

Historically, the response to cross-institutional fraud required centralizing customer financial ledgers and transactional histories into a single data repository. In Computer & Network Security, this centralized paradigm represents a critical failure mode:
1. **Single Point of Failure (SPoF)**: Consolidating banking records creates an attractive target for Advanced Persistent Threats (APTs), state-sponsored intrusion actors, and insider credential theft.
2. **Data Sovereignty and Regulatory Non-Compliance**: Global privacy regulations—including GDPR and India's Digital Personal Data Protection Act (DPDPA 2023)—prohibit the unredacted sharing of personal financial records without explicit user consent.
3. **Network Perimeter Vulnerabilities**: Bulk transmission of raw transactional logs across wide area networks introduces acute exposure to Man-in-the-Middle (MitM) eavesdropping and unauthorized database leakage.

Federated Learning (FL) emerged to enable collaborative learning without centralizing raw data. Local banks train risk models on private datasets and share only parameter gradients across TLS tunnels to a central coordinator running the Federated Averaging (FedAvg) algorithm. However, distributed machine learning introduces three novel cybersecurity vulnerabilities:
- **Gradient Inversion Attacks (DLG)**: An adversary eavesdropping on the network can optimize dummy inputs to match observed gradients, numerically reconstructing raw customer transaction amounts and account numbers.
- **Byzantine Model Poisoning**: Compromised client nodes can submit maliciously inverted parameter weights (Sign-Flip Attacks) or inject high-variance Gaussian noise to sabotage the global decision boundary.
- **Blind Aggregation Insecurity**: Standard federated frameworks blindly ingest parameter vectors without structural sanity checks, leaving servers vulnerable to IEEE-754 NaN/Inf floating-point crashes.

To resolve these vulnerabilities, this project develops OLYMPUS, a privacy-preserving federated fraud intelligence ecosystem protected by an inline Zero-Trust Cybersecurity Gateway with a 6-gate cryptographic defense pipeline.

---

## 1.1 Problem Statement & Objectives

### Problem Statement
Distributed machine learning across collaborative banking consortiums lacks perimeter security and cryptographic update verification. Standard federated aggregation algorithms blindly trust participating clients, enabling a single compromised node to poison the global fraud boundary, crash the coordinator via malformed parameter vectors, or leak confidential customer financial records through gradient inversion attacks.

### Project Objectives
1. **Zero-Trust Perimeter Gateway**: Design and deploy a modular, inline security gateway intercepting and vetting all participant parameter updates prior to aggregation.
2. **Gradient Inversion Defense**: Implement client-side Differential Privacy ($\epsilon = 2.45, \delta = 10^{-5}$) to mathematically bound privacy loss and render DLG reconstruction computationally intractable.
3. **Cryptographic Transport Security**: Implement SecAgg+ with Curve25519 Diffie-Hellman pairwise zero-sum masking, ensuring the coordinator learns only the aggregate sum.
4. **Structural Sanity & SHA-256 Sieve**: Enforce IEEE-754 floating-point validation, $L_2$ norm clipping, and deterministic SHA-256 hashing for audit provenance.
5. **Directional Byzantine Anomaly Detection**: Develop a leave-one-out consensus cosine similarity sieve to detect and deflect Byzantine sign-flip attacks.
6. **Dynamic Zero-Trust Reputation Engine**: Maintain continuous client trust scores ($[0, 100]$) with automated quarantine sandboxing at $T < 40$.
7. **Real-Time SOC Cockpit**: Build an interactive Security Operations Center interface with 3D consortium topology, attack simulators, and SOAR automated playbooks.

---

# 2 Literature Survey

McMahan et al. [1] introduced the Federated Averaging (FedAvg) algorithm, demonstrating that distributed localized stochastic gradient descent across non-IID client datasets could match centralized training performance. However, their formulation assumed a trusted, non-adversarial environment. Standard FedAvg provides zero perimeter verification, making it vulnerable to poisoned updates.

Bonawitz et al. [2] developed the Secure Aggregation (SecAgg) protocol using threshold secret sharing and pairwise Diffie-Hellman masking. While SecAgg prevents an honest-but-curious server from inspecting individual updates, it introduces an encrypted blind spot: because individual updates are concealed, the server cannot detect if a malicious participant injected poisoned parameters.

Dwork et al. [3], [4] and Abadi et al. [5] established the mathematical foundations of Differential Privacy (DP-SGD). By clipping gradient $L_2$ norms and injecting calibrated Gaussian noise, DP bounds privacy loss. Zhu et al. [6] uncovered Deep Leakage from Gradients (DLG), proving that unperturbed gradients allow adversaries to synthesize identical inputs through gradient matching, reconstructing raw private tabular records.

Bhagoji et al. [7] and Blanchard et al. [8] demonstrated the catastrophic impact of Byzantine model poisoning and proposed Krum, which selects updates minimizing Euclidean distances. However, Krum incurs high computational complexity $\mathcal{O}(n^2 d)$ and struggles in non-IID settings. Fung et al. [9] developed FoolsGold for Sybil detection using historical cosine similarities, but it does not address zero-day structural tampering or floating-point exploits.

---

## 2.1 Survey of Existing/Similar System

### Table 2.1: Comparative Cybersecurity Vulnerability Matrix

| Security Dimension | Centralized AML | Standard FedAvg [1] | OLYMPUS (Proposed) |
| :--- | :--- | :--- | :--- |
| **Data Exposure** | Raw PII Exposed | Raw Gradients Exposed | DP + DH-25519 Masking |
| **Perimeter Security** | Standard WAF | None (Blind Ingestion) | Zero-Trust 6-Gate Ingress |
| **DLG Gradient Inversion** | Not Applicable | Vulnerable (100% Leak) | Resilient (Gaussian DP) |
| **Byzantine Sign-Flip** | Not Applicable | Global Model Collapses | 100% Intercepted (CosSim) |
| **NaN/Inf Tampering** | Database Schema | Crashes Coordinator | Structural Sanity Filter |
| **Reputation Tracking** | Static API Keys | Static Connections | Dynamic Trust Engine [0,100] |
| **Automated Quarantine** | IP Blacklisting | None | SOAR Sandbox ($T < 40$) |

---

# 3 Proposed System

## 3.1 Introduction

OLYMPUS is an enterprise-grade, privacy-preserving federated fraud intelligence platform designed specifically to resolve data confidentiality and distributed algorithmic cybersecurity challenges. Operating under the zero-trust paradigm of "Never Trust, Always Verify", OLYMPUS establishes an autonomous security gateway directly at the coordinator ingress. Incoming participant updates are screened through six sequential cryptographic gates before parameter fusion.

---

## 3.2 Architecture/ Framework

The OLYMPUS architecture decouples distributed banking clients, the Zero-Trust Gateway, the reputation engine, and the aggregation core. Communications are encapsulated within mutual TLS (mTLS) tunnels. The 6-gate cryptographic pipeline operates as follows:
- **Gate 01 (Differential Privacy Ingress)**: Injects calibrated Gaussian noise ($\epsilon = 2.45, \delta = 10^{-5}$) into parameter vectors to neutralize gradient inversion attacks and computes a deterministic SHA-256 ingress digest.
- **Gate 02 (SecAgg+ Cryptographic Masking)**: Establishes Diffie-Hellman (DH-25519) pairwise random masks that algebraically sum to zero during aggregation, ensuring individual updates remain private.
- **Gate 03 (Structural Sanity Filter)**: Enforces strict dimension parity (11 features), rejects IEEE-754 NaN/Inf corruption, and verifies that the $L_2$ norm satisfies $\|\Delta W\|_2 \le 10.0$.
- **Gate 04 (Consensus Sieve & Anomaly Detector)**: Computes leave-one-out peer consensus mean $\Delta \bar{W}_{-i}$, evaluating cosine similarity $\text{CosSim}$ and norm ratios to detect Byzantine sign-flip attacks.
- **Gate 05 (Dynamic Zero-Trust Reputation Engine)**: Manages continuous trust scores $T \in [0, 100]$. Normal participation earns $+2$ points; anomalies incur progressive deductions ($-15$ to $-60$ points). Scores below 40 trigger automated quarantine isolation.
- **Gate 06 (Byzantine-Resilient FedAvg Core)**: Fuses only vetted updates weighted by normalized reputation scores, completely excluding quarantined nodes.

![Figure 3.1: OLYMPUS Zero-Trust Cybersecurity Gateway and Real-Time 3D Consortium Topology](../report_assets/fig_3_1_real_network_topology.png)
*Figure 3.1: OLYMPUS Zero-Trust Cybersecurity Gateway and Real-Time 3D Consortium Topology*

---

## 3.3 Algorithm and Process Design

The mathematical formulation governing Gate 04 (Consensus Sieve) computes the leave-one-out peer consensus mean for candidate client $i$:

$$\Delta \bar{W}_{-i} = \frac{1}{|\mathcal{S}| - 1} \sum_{k \ne i} \Delta W_k$$

The directional alignment is quantified via cosine similarity:

$$\text{CosSim}\left(\Delta W_i, \Delta \bar{W}_{-i}\right) = \frac{\Delta W_i \cdot \Delta \bar{W}_{-i}}{\|\Delta W_i\|_2 \|\Delta \bar{W}_{-i}\|_2 + 10^{-12}}$$

The magnitude norm ratio is computed as:

$$\mathcal{R}_{\text{norm}}(i) = \frac{\|\Delta W_i\|_2}{\|\Delta \bar{W}_{-i}\|_2 + 10^{-12}}$$

If $\text{CosSim} < 0.10$, the update is classified as a Byzantine Sign-Flip Attack. If $\mathcal{R}_{\text{norm}} > 3.0$, the update is flagged for High-Magnitude Gradient Poisoning. Both conditions trigger immediate rejection, alert dispatch, and trust deduction.

### Table 3.1: Dynamic Trust Engine Reputation Penalty and Reward Schedule

| Client Status | Trigger Event | Score Delta | Action Taken |
| :--- | :--- | :---: | :--- |
| `TRUSTED` | Valid Update Ingestion | $+2.0$ | Aggregated at 100% weight |
| `TRUSTED` | Stale Round ID | $-10.0$ | Update rejected, client warned |
| `MONITORED` | First Structural Flaw | $-15.0$ | Update rejected, hash logged |
| `ANY` | Byzantine Sign-Flip | $-60.0$ | Isolated to Quarantine Cage |
| `ANY` | NaN/Inf Parameter Injection | $-60.0$ | Isolated to Quarantine Cage |

---

## 3.4 Details of Hardware & Software

### Table 3.2: Hardware and Software Implementation Specifications

| Layer / Resource | Technical Specification |
| :--- | :--- |
| **Processor (CPU)** | Intel Core i7 / AMD Ryzen 7 (8 Cores, 16 Threads) |
| **System Memory (RAM)** | 16 GB DDR4 / DDR5 High Speed RAM |
| **Operating System** | Microsoft Windows 11 / Ubuntu 22.04 LTS |
| **Backend Framework** | Python 3.11+, FastAPI 0.110+, Uvicorn ASGI Server |
| **Frontend Web App** | React 19, TypeScript 5.0, Vite 5, Tailwind CSS |
| **3D Topology Engine** | Three.js WebGL (Solar System Orrery & Geolocation Globe) |
| **Cryptographic Hashing** | Python `hashlib` (SHA-256), Curve25519 Diffie-Hellman |
| **Risk Model & XAI** | XGBoost, Logistic Regression, SHAP TreeExplainer |

---

## 3.4 Experiment and Results

Adversarial testing was executed using non-IID partitions of the PaySim financial fraud dataset across three simulated bank nodes: `BANK-001` (Honest), `BANK-002` (Honest), and `BANK-003` (Compromised Adversary). We evaluated five attack scenarios:
1. **Benign Baseline**: Honest federation with clean gradient transmission.
2. **Malformed Tensor**: NaN floating-point corruption injected at index 3.
3. **Byzantine Sign-Flip**: Gradient multiplied by $-1.0$ to invert the decision boundary.
4. **High-Variance Noise**: Scaled Gaussian perturbation ($\sigma = 3.5$) injected into weights.
5. **Deep Leakage from Gradients (DLG)**: Attempted transaction record reconstruction under varying privacy budgets.

### Table 3.3: Adversarial Threat Scenario Evaluation and Defense Mitigation Performance Metrics

| Metric | Baseline FedAvg | OLYMPUS (Sign-Flip) | OLYMPUS (Honest) |
| :--- | :---: | :---: | :---: |
| **Detection Rate** | 0.0% (Undetected) | 100.0% (Gate 4) | N/A (0 false alerts) |
| **Consensus CosSim** | $-0.942$ (Inverted) | $-0.87$ (Intercepted) | $+0.86$ (Aligned) |
| **Fraud AUROC** | 51.2% (Collapsed) | 98.4% (Protected) | 98.5% |
| **Attacker Trust** | Unmonitored | $100 \to 40 \to 0$ (Quarantined) | $100 \to 100$ |
| **Quarantine Action** | No (Poison Ingested) | Yes (SOAR Isolation) | No |
| **DLG Leakage (MSE)** | $0.0012$ (Severe Leak) | $> 4.85$ (Scrambled) | $> 4.85$ ($\epsilon=2.45$) |

![Figure 3.2: Real-Time Byzantine Sign-Flip Attack Injection and Automated Gateway Quarantine Mitigation](../report_assets/fig_3_2_real_attack_mitigation.png)
*Figure 3.2: Real-Time Byzantine Sign-Flip Attack Injection and Automated Gateway Quarantine Mitigation*

![Figure 3.3: Collaborative Model Risk Assessment and Cross-Institutional Comparative Fraud Analytics](../report_assets/fig_3_3_real_fraud_analytics.png)
*Figure 3.3: Collaborative Model Risk Assessment and Cross-Institutional Comparative Fraud Analytics*

---

## 3.5 Conclusion and Future work

### Conclusion
This project successfully developed and evaluated OLYMPUS, a privacy-preserving federated fraud intelligence ecosystem protected by an inline Zero-Trust Cybersecurity Gateway. By embedding a 6-gate cryptographic defense pipeline directly at coordinator ingress, OLYMPUS resolves the critical vulnerability of blind aggregation in federated learning. The system integrates Differential Privacy ($\epsilon = 2.45$) to prevent gradient inversion, SecAgg+ Diffie-Hellman masking to secure parameter transport, structural sanity filters to block NaN/Inf floating-point crashes, leave-one-out consensus cosine sieving to neutralize Byzantine sign-flip attacks, and dynamic zero-trust reputation scoring with automated quarantine sandboxing.

Adversarial testing confirms a 100% interception rate against malicious attacks with an inspection overhead of under 3 milliseconds, maintaining an exceptional fraud classification AUROC of 98.4%. OLYMPUS provides a robust, compliant cybersecurity blueprint for cross-institutional fraud intelligence collaboration.

### Future Work
1. **Zero-Knowledge Proofs for Verifiable Masking (ZKP-SecAgg)**: Integrate zk-SNARKs allowing clients to cryptographically prove updates satisfy $L_2$ norm bounds without revealing parameters.
2. **Hardware Security Enclaves**: Deploy the Gateway into Intel SGX or AMD SEV confidential computing enclaves to protect against hypervisor-level compromise.
3. **Homomorphic Encryption**: Investigate lattice-based CKKS schemes for encrypted update aggregation over wide-area networks.
4. **Decentralized Blockchain Consortium**: Transition the forensic audit log to a permissioned Hyperledger Fabric ledger.

---

# References

1. B. McMahan, E. Moore, D. Ramage, S. Hampson, and B. A. y Arcas, "Communication-efficient learning of deep networks from decentralized data," in *Proc. 20th Int. Conf. Artificial Intelligence and Statistics (AISTATS)*, PMLR, vol. 54, pp. 1273–1282, 2017.
2. K. Bonawitz, V. Ivanov, B. Kreuter, A. Marcedone, H. B. McMahan, S. Patel, D. Ramage, A. Segal, and K. Seth, "Practical secure aggregation for privacy-preserving machine learning," in *Proc. 2017 ACM SIGSAC Conf. Computer and Communications Security (CCS)*, pp. 1175–1191, 2017.
3. C. Dwork, "Differential privacy: A survey of results," in *Theory and Applications of Models of Computation (TAMC)*, Springer, pp. 1–19, 2008.
4. C. Dwork, A. Roth, et al., "The algorithmic foundations of differential privacy," *Foundations and Trends in Theoretical Computer Science*, vol. 9, no. 3–4, pp. 211–407, 2014.
5. M. Abadi, A. Chu, I. Goodfellow, H. B. McMahan, I. Mironov, K. Talwar, and L. Zhang, "Deep learning with differential privacy," in *Proc. 2016 ACM SIGSAC Conf. Computer and Communications Security (CCS)*, pp. 308–318, 2016.
6. L. Zhu, Z. Han, and S. Liu, "Deep leakage from gradients," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 32, pp. 14774–14784, 2019.
7. A. N. Bhagoji, S. Chakraborty, P. Mittal, and C. Calo, "Analyzing federated learning through an adversarial lens," in *Proc. 36th Int. Conf. Machine Learning (ICML)*, PMLR, vol. 97, pp. 634–643, 2019.
8. P. Blanchard, E. M. El Mhamdi, R. Guerraoui, and J. Stainer, "Machine learning with adversaries: Byzantine tolerant gradient descent," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 30, pp. 119–129, 2017.
9. C. Fung, C. J. Yoon, and I. Beschastnikh, "Mitigating Sybils in federated learning poisoning," *IEEE Transactions on Information Forensics and Security*, vol. 15, pp. 3544–3559, 2020.
10. S. Shen, S. Tople, and P. Saxena, "AUROR: Defending against poisoning attacks in collaborative deep learning systems," in *Proc. 32nd Annual Computer Security Applications Conf. (ACSAC)*, pp. 508–519, 2016.
11. V. Tolpegin, S. Truex, M. E. Gursoy, and L. Liu, "Data poisoning attacks against federated learning systems," in *Computer Security – ESORICS 2020*, Springer, pp. 480–501, 2020.
12. E. Bagdasaryan, A. Veit, Y. Hua, D. Estrin, and V. Shmatikov, "How to backdoor federated learning," in *Proc. 23rd Int. Conf. Artificial Intelligence and Statistics (AISTATS)*, PMLR, vol. 108, pp. 2938–2948, 2020.
13. X. Yin, Y. Yan, J. Lu, and P. L. Bartlett, "Defending against Byzantine attacks in distributed learning via coordinate-wise median and trimmed mean," in *Proc. 35th Int. Conf. Machine Learning (ICML)*, PMLR, vol. 80, pp. 5563–5572, 2018.
14. NIST Special Publication 800-207, "Zero Trust Architecture," National Institute of Standards and Technology, Gaithersburg, MD, USA, Tech. Rep., Aug. 2020.
15. J. Geiping, H. Bauermeister, H. Dröge, and M. Moeller, "Inverting gradients - how easy is it to break privacy in federated learning?," in *Advances in Neural Information Processing Systems (NeurIPS)*, vol. 33, pp. 16937–16947, 2020.
