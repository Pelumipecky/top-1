import React from 'react'
import { db } from "../../database/firebaseConfig";
import { doc, updateDoc, addDoc, collection, query, where, getDocs, runTransaction } from "firebase/firestore";

const UnitInvestSect = ({ setInvestData, setProfileState, investData, currentUser }) => {
  // use shared `db` instance from firebaseConfig
  const colRefNotif = collection(db, "notifications");

  const notificationPush = {
    message: `Your $${investData?.capital} ${investData?.plan} investment plan has been activated`,
    dateTime: new Date().toISOString(),
    idnum: investData.idnum,
    status: "unseen"
  };

  const handleDetailUpdate = () => {
    const docRef = doc(db, "investments", investData?.id);

    updateDoc(docRef, {
      roi: investData?.roi,
      authStatus: "seen"
    });

    setProfileState("Investments");
  };

  const handleActiveInvestment = async () => {
    const ok = window.confirm(`Activate investment ${investData?.id} for ${investData?.idnum}? This will credit the user's balance.`);
    if (!ok) return;

    try {
      const invRef = doc(db, "investments", investData?.id);

      // find user doc
      const usersCol = collection(db, "userlogs");
      const q = query(usersCol, where("idnum", "==", investData?.idnum));
      const userSnap = await getDocs(q);
      const userDoc = !userSnap.empty ? userSnap.docs[0] : null;

      const approvedAt = new Date().toISOString();
      const approvedBy = currentUser?.id || currentUser?.userName || 'admin';

      // transaction to update investment and user
      await runTransaction(db, async (tx) => {
        tx.update(invRef, { status: "Active", date: approvedAt, authStatus: "seen", approvedBy, approvedAt });

        if (userDoc) {
          const userRef = doc(db, "userlogs", userDoc.id);
          const udata = userDoc.data() || {};
          const currentBalance = parseFloat(udata.balance) || 0;
          const currentBonus = parseFloat(udata.bonus) || 0;
          const creditAmount = parseFloat(investData?.capital) || 0;
          const bonusAmount = parseFloat(investData?.bonus) || 0;
          tx.update(userRef, { balance: currentBalance + creditAmount, bonus: currentBonus + bonusAmount, authStatus: "seen" });
        }
      });

      // push notification
      await addDoc(colRefNotif, { ...notificationPush, dateTime: approvedAt });
      setProfileState("Investments");
    } catch (err) {
      console.error('Error activating investment and crediting user (transaction):', err);
      try { await addDoc(colRefNotif, { ...notificationPush }); } catch(e){}
      setProfileState("Investments");
    }
  };

  return (
    <div className="profileMainCntn">
      <div className="profileEditableDisplay">
          <h2>Investment Details</h2>
          <div className="theFormField">
            <div className="unitInputField">
              <label htmlFor="name">ROI</label>
              <input type="text" value={investData?.roi} onChange={(e) => {setInvestData({...investData, roi: parseInt(e.target.value !== ""? e.target.value : "0")})}}/>
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Inestment Status</label>
              <input type="text" disabled value={investData?.status} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Plan</label>
              <input type="text" disabled value={investData?.plan} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Capital</label>
              <input type="text" disabled value={investData?.capital} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Investment Cryptic Id.</label>
              <input type="text" disabled value={investData?.id} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Investment Register Id.</label>
              <input type="text" disabled value={investData?.idnum} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Duration</label>
              <input type="text" disabled value={`${investData?.duration} days`} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Payment Option</label>
              <input type="text" disabled value={investData?.paymentOption} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Date</label>
              <input type="text" disabled value={new Date(investData?.date).toLocaleDateString("en-US", {day: "numeric", month: "short", year: "numeric", }) } />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Time</label>
              <input type="text" disabled value={new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, }).format(new Date(investData?.date))} />
            </div>
            
          </div>

            <div className="flex-align-jusc">
                {
                    investData?.status === "Pending" && (
                        <button type="button" onClick={handleActiveInvestment} className='activateBtn'>Activate Investment</button>
                    )
                }
                <button type="button" onClick={handleDetailUpdate}>Update Details</button>
            </div>
        </div>
    </div>
  )
}

export default UnitInvestSect
