import React from 'react'
import { supabaseDb } from "../../database/supabaseUtils";

const UnitInvestSect = ({ setInvestData, setProfileState, investData, currentUser }) => {
  const notificationPush = {
    message: `Your $${investData?.capital} ${investData?.plan} investment plan has been activated`,
    idnum: investData.idnum,
    status: "unseen"
  };

  const handleDetailUpdate = async () => {
    try {
      await supabaseDb.updateInvestment(investData?.id, {
        roi: investData?.roi,
        authStatus: "seen"
      });
      setProfileState("Investments");
    } catch (error) {
      console.error("Error updating investment details:", error);
    }
  };

  const handleActiveInvestment = async () => {
    const ok = window.confirm(`Activate investment ${investData?.id} for ${investData?.idnum}? This will credit the user's balance.`);
    if (!ok) return;

    try {
      const approvedBy = currentUser?.id || currentUser?.userName || 'admin';

      await supabaseDb.activateInvestment(investData?.id, {
        approvedBy,
        capital: parseFloat(investData?.capital) || 0,
        roi: parseFloat(investData?.roi) || 0,
        bonus: parseFloat(investData?.bonus) || 0,
        idnum: investData?.idnum,
        creditBonus: false
      });

      await supabaseDb.createNotification(notificationPush);
      setProfileState("Investments");
    } catch (err) {
      console.error('Error activating investment:', err);
      try { await supabaseDb.createNotification(notificationPush); } catch(e){}
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
