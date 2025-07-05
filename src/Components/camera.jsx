import React, { useEffect, useRef } from 'react';


const WebcamViewer = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const getWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    };
    getWebcam();

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
   const imageData = canvas.toDataURL('image/jpeg', 0.6);


    stopCamera();
    onCapture(imageData);
  };

  const cancelHandler = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <video ref={videoRef} autoPlay playsInline width="100%" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="modal-buttons">
          <button onClick={takePhoto}>Capture</button>
          <button onClick={cancelHandler}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
export default WebcamViewer;