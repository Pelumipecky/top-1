/* eslint-disable */
import React, { useState } from 'react'
import { db } from "../../database/firebaseConfig";
import { doc, updateDoc, runTransaction, query, where, getDocs, collection } from "firebase/firestore";

const UnitUserSect = ({ userData, setProfileState, setUserData}) => {
  // use shared `db` instance from firebaseConfig

    const handleDetailUpdate = () => {
        const docRef = doc(db, "userlogs", userData?.id);

        updateDoc(docRef, {
            name: userData?.name,
            userName: userData?.userName,
            authStatus: "seen"
        });

        setProfileState("Users");
    };

  // Admin can add balance or bonus to a user
  const [addBalance, setAddBalance] = useState(0);
  const [addBonus, setAddBonus] = useState(0);

  const handleAddFunds = async () => {
    const ok = window.confirm(`Add $${addBalance || 0} balance and $${addBonus || 0} bonus to ${userData?.name || userData?.idnum}?`);
    if (!ok) return;

    try {
      // Determine user doc ref: prefer userData.id, fallback to query by idnum
      let userDocId = userData?.id;
      if (!userDocId) {
        const usersCol = collection(db, 'userlogs');
        const q = query(usersCol, where('idnum', '==', userData?.idnum));
        const snap = await getDocs(q);
        if (!snap.empty) userDocId = snap.docs[0].id;
      }

      if (!userDocId) throw new Error('User document not found');

      const adminData = (typeof window !== 'undefined') ? JSON.parse(localStorage.getItem('adminData') || 'null') : null;
      const modifiedBy = adminData?.id || adminData?.userName || 'admin';
      const modifiedAt = new Date().toISOString();

      await runTransaction(db, async (tx) => {
        const userRef = doc(db, 'userlogs', userDocId);
        const userSnap = await tx.get ? await tx.get(userRef) : null;
        // Some Firestore SDKs don't expose tx.get in web modular; fall back to getDocs if needed
        let current = {};
        if (userSnap && userSnap.exists && userSnap.exists()) {
          current = userSnap.data();
        } else {
          // last resort: read using getDocs
          const usersCol = collection(db, 'userlogs');
          const q = query(usersCol, where('idnum', '==', userData?.idnum));
          const snap = await getDocs(q);
          if (!snap.empty) current = snap.docs[0].data() || {};
        }

        const currentBalance = parseFloat(current.balance) || 0;
        const currentBonus = parseFloat(current.bonus) || 0;
        const deltaBalance = parseFloat(addBalance) || 0;
        const deltaBonus = parseFloat(addBonus) || 0;

        tx.update(userRef, {
          balance: currentBalance + deltaBalance,
          bonus: currentBonus + deltaBonus,
          authStatus: 'seen',
          lastModifiedBy: modifiedBy,
          lastModifiedAt: modifiedAt
        });

        // Create notification for the user
        const notificationsRef = doc(db, 'notifications', userDocId);
        tx.set(notificationsRef, {
          userId: userDocId,
          type: 'balance_update',
          title: 'Account Balance Updated',
          message: `Your account has been credited with $${deltaBalance.toLocaleString()} balance and $${deltaBonus.toLocaleString()} bonus.`,
          status: 'unseen',
          timestamp: modifiedAt
        });
      });

      // Update local state shown in form
      setUserData({
          ...userData,
          balance: (parseFloat(userData?.balance) || 0) + (parseFloat(addBalance) || 0),
          bonus: (parseFloat(userData?.bonus) || 0) + (parseFloat(addBonus) || 0)
      });
      setAddBalance(0);
      setAddBonus(0);
      setProfileState("Users");
    } catch (err) {
      console.error('Error adding funds to user (transaction):', err);
    }
  };




  return (
    <div className="profileMainCntn">
      <div className="profileEditableDisplay">
          <h2>User Details</h2>
          <div className="theFormField">
            <div className="unitInputField">
              <label htmlFor="name">Name</label>
              <input type="text" value={userData?.name} onChange={(e) => {setUserData({...userData, name: e.target.value})}}/>
            </div>
            <div className="unitInputField">
              <label htmlFor="name">UserName</label>
              <input type="text" value={userData?.userName} onChange={(e) => {setUserData({...userData, userName: e.target.value})}}/>
            </div>
            <div className="unitInputField">
              <label htmlFor="name">User Email</label>
              <input type="text" disabled value={userData?.email} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Account Cryptic Id.</label>
              <input type="text" disabled value={userData?.id} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Account Register Id.</label>
              <input type="text" disabled value={userData?.idnum} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Joined on</label>
              <input type="text" disabled value={new Date(userData?.date).toLocaleDateString("en-US", {day: "numeric", month: "short", year: "numeric", }) } />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Current Balance</label>
              <input type="text" disabled value={`$${(parseFloat(userData?.balance) || 0).toLocaleString()}`} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Current Bonus</label>
              <input type="text" disabled value={`$${(parseFloat(userData?.bonus) || 0).toLocaleString()}`} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Add Balance</label>
              <input type="number" value={addBalance} onChange={(e) => setAddBalance(e.target.value)} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Add Bonus</label>
              <input type="number" value={addBonus} onChange={(e) => setAddBonus(e.target.value)} />
            </div>
            
          </div>

      <div className="flex-align-jusc">                   
        <button type="button" onClick={handleDetailUpdate}>Update Details</button>
        <button type="button" onClick={handleAddFunds} className="activateBtn">Add Balance/Bonus</button>
      </div>
        </div>
    </div>
  )
}

export default UnitUserSect
