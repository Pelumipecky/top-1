import React, { useEffect, useState } from 'react';
import { db } from '../../database/firebaseConfig';
import { collection, query, onSnapshot, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export default function KycAdmin({ currentUser }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'kyc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(docs.reverse());
    });

    return () => unsub();
  }, []);

  const updateKyc = async (kycId, newStatus) => {
    try {
      const kycRef = doc(db, 'kyc', kycId);

      await runTransaction(db, async (tx) => {
        const k = await tx.get(kycRef);
        if (!k.exists()) throw new Error('KYC not found');
        const kdata = k.data();
        tx.update(kycRef, { status: newStatus, reviewedBy: currentUser?.id || null, reviewedByName: currentUser?.name || 'Admin', reviewedAt: serverTimestamp() });

        if (kdata.userId) {
          const userRef = doc(db, 'userlogs', kdata.userId);
          tx.update(userRef, { kycStatus: newStatus === 'Verified' ? 'Verified' : 'Rejected', kycReviewedAt: serverTimestamp(), kycReviewedBy: currentUser?.id || null });
        }
      });

      alert('KYC updated');
    } catch (err) {
      console.error('KYC update error', err);
      alert('Error updating KYC');
    }
  };

  return (
    <div className="investmentMainCntn">
      <div className="overviewSection">
        <h2>KYC Requests ({requests.length})</h2>
      </div>

      <div className="myinvestmentSection">
        {requests.length === 0 ? (
          <div className="emptyTable">
            <i className="icofont-exclamation-tringle"></i>
            <p>No KYC requests.</p>
          </div>
        ) : (
          <div className="historyTable">
            <div className="investmentTablehead header">
              <div className="unitheadsect">S/N</div>
              <div className="unitheadsect">User</div>
              <div className="unitheadsect">ID Type</div>
              <div className="unitheadsect">ID Number</div>
              <div className="unitheadsect">Status</div>
              <div className="unitheadsect">Submitted</div>
              <div className="unitheadsect">Actions</div>
            </div>
            {requests.map((r, idx) => (
              <div className="investmentTablehead" key={r.id}>
                <div className="unitheadsect">{idx + 1}</div>
                <div className="unitheadsect">{r.userName || r.userId}</div>
                <div className="unitheadsect">{r.idType}</div>
                <div className="unitheadsect">{r.idNumber}</div>
                <div className="unitheadsect">{r.status}</div>
                <div className="unitheadsect">{r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString() : '-'}</div>
                <div className="unitheadsect">
                  {r.status !== 'Verified' && <button onClick={() => updateKyc(r.id, 'Verified')}>Verify</button>}
                  {r.status !== 'Rejected' && <button onClick={() => updateKyc(r.id, 'Rejected')}>Reject</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
