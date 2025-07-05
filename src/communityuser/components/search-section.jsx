import React, { useState } from 'react';
import SearchBar from '../../Components/searchbar';


const mockPickupRequests = [
  { id: 1, title: 'Request A', status: '✅ Completed', date: '2025-06-12' },
  { id: 2, title: 'Request B', status: '⏳ Scheduled', date: '2025-06-14' },
  { id: 3, title: 'Request C', status: '❌ Failed', date: '2025-06-10' },
  { id: 4, title: 'Request D', status: '✅ Completed', date: '2025-06-09' },
  { id: 5, title: 'Request E', status: '✅ Completed', date: '2025-06-08' },
  { id: 6, title: 'Request F', status: '⏳ Scheduled', date: '2025-06-07' },
  { id: 7, title: 'Request G', status: '❌ Failed', date: '2025-06-06' }
];

const Activity = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button className="pickup-icon-btn" onClick={() => { setShowModal(true); window.scrollTo(0, 50), document.body.style.scrollBehavior = 'smooth'; }}>
        <p>🚚</p> <p>Pickup Activity </p>
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowModal(false)}>✖</button>
            <h2>Pickup Requests</h2>
            <SearchBar placeholder="Search Pickup Requests..." onChange={(e) => console.log(e.target.value)} />
            <div className="pickup-grid scrollable">
              {mockPickupRequests.map(req => (
                <div key={req.id} className="pickup-card">
                  <h4>{req.title}</h4>
                  <p>Status: <span>{req.status}</span></p>
                  <p>Date: {req.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Activity;
