import React, { useEffect, useState } from 'react';
import { db } from '../../database/firebaseConfig';
import { collection, query, onSnapshot, doc, serverTimestamp, runTransaction, updateDoc } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';

export default function LoansAdmin({ setProfileState, currentUser }) {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'loans'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLoans(docs.reverse());
    });

    return () => unsub();
  }, []);

  const changeStatus = async (loanId, newStatus) => {
    try {
      const loanRef = doc(db, 'loans', loanId);
      await runTransaction(db, async (transaction) => {
        const loanSnap = await transaction.get(loanRef);
        if (!loanSnap.exists()) throw new Error('Loan not found');
        const loanData = loanSnap.data();
        if (loanData.status === newStatus) return;
        transaction.update(loanRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
          approvedBy: currentUser?.id || null,
          approvedByName: currentUser?.name || 'Admin'
        });

        if (newStatus === 'Approved') {
          if (!loanData.userId) {
            throw new Error('Loan userId missing. Cannot credit user.');
          }
          const userRef = doc(db, 'userlogs', loanData.userId);
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            throw new Error('User document not found for userId: ' + loanData.userId);
          }
          const userData = userSnap.data();
          const prevBalance = parseFloat(userData.balance) || 0;
          const prevBonus = parseFloat(userData.bonus) || 0;
          const creditAmount = parseFloat(loanData.amount) || 0;
          // Add 5% bonus on loan amount
          const bonusAmount = creditAmount * 0.05;
          transaction.update(userRef, {
            balance: prevBalance + creditAmount,
            bonus: prevBonus + bonusAmount,
            lastModifiedBy: currentUser?.id || null,
            lastModifiedAt: serverTimestamp(),
          });
        }
      });

      // After successful transaction, add a notification for the user
      try {
        await addDoc(collection(db, 'notifications'), {
          idnum: loans.find(l => l.id === loanId)?.idnum || null,
          userId: loans.find(l => l.id === loanId)?.userId || null,
          title: `Loan ${newStatus}`,
          message: `Your loan request has been ${newStatus.toLowerCase()}.`,
          createdAt: serverTimestamp(),
        });
      } catch (nerr) {
        console.error('Notification error', nerr);
      }

      alert('Loan updated successfully');
    } catch (err) {
      console.error('Error updating loan status:', err);
      alert('Error updating loan status: ' + err.message);
    }
  };

  return (
    <div className="investmentMainCntn">
      <div className="overviewSection">
        <h2>All Loan Requests ({loans.length})</h2>
      </div>

      <div className="myinvestmentSection">
        {loans.length === 0 ? (
          <div className="emptyTable">
            <i className="icofont-exclamation-tringle"></i>
            <p>No loan requests.</p>
          </div>
        ) : (
          <div className="historyTable">
            <div className="investmentTablehead header">
              <div className="unitheadsect">S/N</div>
              <div className="unitheadsect">User</div>
              <div className="unitheadsect">Amount</div>
              <div className="unitheadsect">Purpose</div>
              <div className="unitheadsect">Status</div>
              <div className="unitheadsect">Requested On</div>
              <div className="unitheadsect">Actions</div>
            </div>
            {loans.map((ln, idx) => (
              <div className="investmentTablehead" key={ln.id}>
                <div className="unitheadsect">{idx + 1}</div>
                <div className="unitheadsect">{ln.userName || ln.idnum}</div>
                <div className="unitheadsect">${(ln.amount || 0).toLocaleString()}</div>
                <div className="unitheadsect">{ln.purpose || '-'}</div>
                <div className="unitheadsect">{ln.status}</div>
                <div className="unitheadsect">{ln.createdAt?.toDate ? ln.createdAt.toDate().toLocaleString() : '-'}</div>
                <div className="unitheadsect">
                  {ln.status !== 'Approved' && <button onClick={() => changeStatus(ln.id, 'Approved')}>Approve</button>}
                  {ln.status !== 'Declined' && <button onClick={() => changeStatus(ln.id, 'Declined')}>Decline</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
