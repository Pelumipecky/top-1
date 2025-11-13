import React, { useState, useEffect } from 'react';
import { db, storage } from '../../database/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './KYC.module.css';

export default function KYC({ currentUser }) {
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState('National ID');
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState('');
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState({ id: false, selfie: false });
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!currentUser?.id) return;
      const userRef = doc(db, 'userlogs', currentUser.id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setKycStatus(userDoc.data().kycStatus || '');
      }
    };
    fetchKycStatus();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (submitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    // Validation checks
    if (!currentUser?.id) {
      alert('User not authenticated');
      return;
    }
    
    if (!idNumber.trim()) {
      alert('Please enter ID number');
      return;
    }
    
    if (!idFile) {
      alert('Please upload your ID document');
      return;
    }
    
    if (!selfieFile) {
      alert('Please upload a selfie with your ID');
      return;
    }

    console.log('Starting KYC submission...', {
      currentUser: currentUser?.id,
      idNumber,
      idType,
      hasIdFile: !!idFile,
      hasSelfieFile: !!selfieFile
    });
    setSubmitting(true);
    
    // Add timeout protection
    const timeoutId = setTimeout(() => {
      console.error('KYC submission timeout - resetting state');
      setSubmitting(false);
      alert('Submission timeout. Please try again.');
    }, 60000); // 60 second timeout
    
    try {
      const uploaded = {};
      
      console.log('Uploading ID document...');
      setUploadStatus('Uploading ID document...');
      if (idFile) {
        const path = `kyc/${currentUser.id}/id_${Date.now()}_${idFile.name}`;
        const idRef = ref(storage, path);
        await uploadBytes(idRef, idFile);
        uploaded.idUrl = await getDownloadURL(idRef);
        console.log('ID document uploaded successfully');
      }
      
      console.log('Uploading selfie...');
      setUploadStatus('Uploading selfie...');
      if (selfieFile) {
        const path = `kyc/${currentUser.id}/selfie_${Date.now()}_${selfieFile.name}`;
        const selfieRef = ref(storage, path);
        await uploadBytes(selfieRef, selfieFile);
        uploaded.selfieUrl = await getDownloadURL(selfieRef);
        console.log('Selfie uploaded successfully');
      }

      console.log('Creating KYC record...');
      setUploadStatus('Saving to database...');
      // Create kyc record
      await addDoc(collection(db, 'kyc'), {
        userId: currentUser.id,
        idnum: currentUser.idnum || '',
        userName: currentUser.name || '',
        idType,
        idNumber: idNumber.trim(),
        idUrl: uploaded.idUrl || null,
        selfieUrl: uploaded.selfieUrl || null,
        status: 'Pending',
        submittedAt: serverTimestamp(),
      });
      console.log('KYC record created successfully');

      console.log('Updating user document...');
      // Update user doc kycStatus
      const userRef = doc(db, 'userlogs', currentUser.id);
      await updateDoc(userRef, { 
        kycStatus: 'Pending', 
        kycSubmittedAt: serverTimestamp() 
      });
      console.log('User document updated successfully');

      clearTimeout(timeoutId);
      alert('KYC submitted successfully! Your documents are now being reviewed.');
      setKycStatus('Pending');
      setStep(1);
      setIdNumber('');
      setIdFile(null);
      setSelfieFile(null);
      setUploadStatus('');
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('KYC submission error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      
      let errorMessage = 'Error submitting KYC. ';
      if (err.code === 'storage/unauthorized') {
        errorMessage += 'File upload permission denied.';
      } else if (err.code === 'permission-denied') {
        errorMessage += 'Database permission denied.';
      } else if (err.message.includes('network')) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  const renderStatus = () => {
    if (!kycStatus) return null;
    const statusClasses = {
      'Pending': styles.pending,
      'Verified': styles.verified,
      'Rejected': styles.rejected
    };
    return (
      <div className={`${styles.statusBox} ${statusClasses[kycStatus] || ''}`}>
        <h3>KYC Status: {kycStatus}</h3>
        {kycStatus === 'Rejected' && (
          <p>Your KYC was rejected. Please submit again with correct documentation.</p>
        )}
      </div>
    );
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 2));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: true }));
  };

  const handleDragOut = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (type === 'id') {
        setIdFile(file);
      } else if (type === 'selfie') {
        setSelfieFile(file);
      }
    }
  };

  return (
    <div className="investmentMainCntn">
      <div className={styles.overviewSection}>
        <h2>KYC & Verification</h2>
      </div>

      <div className={styles.kycContainer}>
        {renderStatus()}
        
        <div className={styles.stepIndicator}>
          <span className={step === 1 ? styles.active : ''} />
          <span className={step === 2 ? styles.active : ''} />
        </div>

        <form onSubmit={handleSubmit} className={styles.kycForm}>
          {step === 1 ? (
            <>
              <div className={styles.formGroup}>
                <label>ID Type</label>
                <select value={idType} onChange={(e) => setIdType(e.target.value)}>
                  <option>National ID</option>
                  <option>Passport</option>
                  <option>Driver&apos;s License</option>
                </select>
                <p className={styles.helper}>Choose the type of identification document you&apos;ll provide</p>
              </div>

              <div className={styles.formGroup}>
                <label>ID Number</label>
                <input 
                  type="text" 
                  value={idNumber} 
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter your ID number"
                />
                <p className={styles.helper}>Enter the number exactly as it appears on your ID</p>
              </div>

              <button 
                type="button" 
                className={styles.submitButton}
                onClick={nextStep}
                disabled={!idNumber || !idType}
              >
                Continue to Document Upload
              </button>
            </>
          ) : (
            <>
              <div className={styles.fileUpload}>
                <div className={styles.formGroup}>
                  <label>ID Document</label>
                  <div className={styles.fileInput}>
                    <div 
                      className={`${styles.uploadBox} ${dragActive.id ? styles.dragActive : ''}`}
                      onClick={() => document.getElementById('idFileInput').click()}
                      onDrag={handleDrag}
                      onDragStart={handleDrag}
                      onDragEnd={handleDrag}
                      onDragOver={handleDrag}
                      onDragEnter={(e) => handleDragIn(e, 'id')}
                      onDragLeave={(e) => handleDragOut(e, 'id')}
                      onDrop={(e) => handleDrop(e, 'id')}
                    >
                      <i className="icofont-upload-alt"></i>
                      <p>Drop your ID document here or click to browse</p>
                    </div>
                    <input 
                      id="idFileInput"
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => setIdFile(e.target.files[0])} 
                      style={{ display: 'none' }}
                    />
                  </div>
                  {idFile && (
                    <div className={styles.filePreview}>
                      <i className="icofont-file-alt"></i>
                      <span>{idFile.name}</span>
                    </div>
                  )}
                  <p className={styles.helper}>Upload a clear photo or scan of your ID document</p>
                </div>

                <div className={styles.formGroup}>
                  <label>Selfie with ID</label>
                  <div className={styles.fileInput}>
                    <div 
                      className={`${styles.uploadBox} ${dragActive.selfie ? styles.dragActive : ''}`}
                      onClick={() => document.getElementById('selfieFileInput').click()}
                      onDrag={handleDrag}
                      onDragStart={handleDrag}
                      onDragEnd={handleDrag}
                      onDragOver={handleDrag}
                      onDragEnter={(e) => handleDragIn(e, 'selfie')}
                      onDragLeave={(e) => handleDragOut(e, 'selfie')}
                      onDrop={(e) => handleDrop(e, 'selfie')}
                    >
                      <i className="icofont-camera"></i>
                      <p>Take a selfie holding your ID or upload one</p>
                    </div>
                    <input 
                      id="selfieFileInput"
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setSelfieFile(e.target.files[0])} 
                      style={{ display: 'none' }}
                    />
                  </div>
                  {selfieFile && (
                    <div className={styles.filePreview}>
                      <i className="icofont-file-image"></i>
                      <span>{selfieFile.name}</span>
                    </div>
                  )}
                  <p className={styles.helper}>Hold your ID next to your face in good lighting</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  className={styles.submitButton} 
                  style={{ background: '#6c757d' }}
                  onClick={prevStep}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={submitting || !idFile || !selfieFile}
                  style={{ 
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? (
                    <>
                      <i className="icofont-spinner-alt-2" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}></i>
                      {uploadStatus || 'Processing...'}
                    </>
                  ) : (
                    'Submit KYC'
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <div style={{ marginTop: 16 }}>
          <p>Current status: {currentUser?.kycStatus || 'Not submitted'}</p>
        </div>
      </div>
    </div>
  );
}
