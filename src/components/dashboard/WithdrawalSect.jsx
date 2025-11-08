import {useEffect, useState} from "react";
import { db } from "../../database/firebaseConfig";
import { doc, where, collection, query, onSnapshot } from "firebase/firestore";

const WithdrawalSect = ({currentUser, setWidgetState, totalBonus, totalCapital, totalROI}) => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentOption, setPaymentOption] = useState('Bitcoin');
    const colRefWith = collection(db, "withdrawals");
    const q3 = query(colRefWith, where("idnum", "==", currentUser?.idnum));

    useEffect(() => {
      const unsubscribe = onSnapshot(q3, (snapshot) => {
        const utilNotif = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setWithdrawals(utilNotif);
      });

      return () => unsubscribe();
    }, [q3]);

  return (
    <div className='widthdrawMainSect'>
        <div className="topmostWithdraw">
            <h2>Total Balance: <span>${`${(parseFloat(currentUser?.balance || 0) + parseFloat(currentUser?.bonus || 0)).toLocaleString()}`}</span></h2>
            <div style={{display:'flex',flexDirection:'column',gap:16,width:'100%',maxWidth:400}}>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount to withdraw"
                        style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                            fontSize: '1rem'
                        }}
                    />
                    <select 
                        value={paymentOption}
                        onChange={(e) => setPaymentOption(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                            fontSize: '1rem'
                        }}
                    >
                        <option value="Bitcoin">Bitcoin</option>
                        <option value="Ethereum">Ethereum</option>
                    </select>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <button type="button" onClick={() => {
                        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
                            alert('Please enter a valid withdrawal amount');
                            return;
                        }
                        const totalBalance = parseFloat(currentUser?.balance || 0) + parseFloat(currentUser?.bonus || 0);
                        if (parseFloat(withdrawAmount) > totalBalance) {
                            alert('Withdrawal amount cannot exceed your total balance');
                            return;
                        }
                        setWidgetState({
                            state: true,
                            type: "withdraw",
                        });
                    }} style={{flex:1}}>Proceed with withdrawal</button>
                    <button type="button" onClick={() => {
                        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
                            alert('Please enter a valid withdrawal amount');
                            return;
                        }
                        const totalBalance = parseFloat(currentUser?.balance || 0) + parseFloat(currentUser?.bonus || 0);
                        if (parseFloat(withdrawAmount) > totalBalance) {
                            alert('Withdrawal amount cannot exceed your total balance');
                            return;
                        }
                        // Open chat and prefill a request for withdrawal code; also auto-send so admin receives notification
                        const pre = `Withdrawal code request:\nAmount: $${parseFloat(withdrawAmount).toLocaleString()}\nPayment Method: ${paymentOption}\nUser ID: ${currentUser?.idnum || 'unknown'}\nUsername: ${currentUser?.userName || 'unknown'}\nEmail: ${currentUser?.email || 'unknown'}`;
                        window.dispatchEvent(new CustomEvent('openChatBot', { 
                            detail: { 
                                prefillMessage: pre, 
                                highlight: 'request-withdrawal', 
                                autoSend: true 
                            } 
                        }));
                    }} style={{background:'#f9f871',color:'#000',borderRadius:6,padding:'8px 12px',border:'none',cursor:'pointer'}}>Request withdrawal code</button>
                </div>
            </div>
        </div>
        {
            withdrawals.length > 0 ? (
                <div className="historyTable">
                    <div className="investmentTablehead header">
                        <div className="unitheadsect">S/N</div>
                        <div className="unitheadsect">Transaction ID</div>
                        <div className="unitheadsect">Amount</div>
                        <div className="unitheadsect">Status</div>
                        <div className="unitheadsect">Payment Option</div>
                    </div>
                    {
                        withdrawals.map((elem, idx) => (
                            <div className="investmentTablehead" key={`${elem.idnum}-wUser${idx}`}>
                                <div className="unitheadsect">{idx + 1}</div>
                                <div className="unitheadsect">{elem?.id}</div>
                                <div className="unitheadsect">${elem?.amount}</div>
                                <div className="unitheadsect"><span style={{color: `${elem?.status === "Pending" ? "#F9F871" : "#2DC194"}`}}>{elem?.status}</span></div>
                                <div className="unitheadsect">{elem?.paymentOption}</div>
                            </div>
                        ))
                    }
                </div>

            ) : (

                <div className="emptyTable">
                    <i className="icofont-exclamation-tringle"></i>
                    <p>
                        Your withdrawal history is currently empty.{" "}
                        <button onClick={() => {setWidgetState({
                            state: true,
                            type: "withdraw",
                        })}}>Withdraw now</button>
                    </p>
                </div>
            )
        }
        <div className="widthdrawalGuides">
            <h2>Withdrawal Guidelines</h2>
            <div className="guides">
                <p>- To initiate a withdrawal, you must first request a withdrawal code from the admin. This code is required to process your withdrawal request.</p>
                <p>- Once you receive your withdrawal code, select your preferred withdrawal method and enter the amount you want to withdraw, then click &quot;Proceed&quot;.</p>
                <p>- We provide two (2) withdrawal methods (Bitcoin, Ethereum Payment).</p>
                <p>- Withdrawal codes are specific to your account and the requested amount. They cannot be reused.</p>
                <p>- Requests for withdrawals can be made at any time via this website, but will require admin approval and a valid withdrawal code.</p>
                <p>- Withdrawals are capped at the amount of funds that are currently in the account (Minimum withdrawal amount is $200).</p>
                <p>- A withdrawal processing fee is required to be paid before a withdrawal can be made.</p>
                <p>- Please contact support if you have not received your withdrawal code within 24 hours of requesting it.</p>
            </div>
        </div>
    </div>
  )
}

export default WithdrawalSect
