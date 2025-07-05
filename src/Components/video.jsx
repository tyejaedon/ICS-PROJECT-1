import React, { useEffect, useRef, useState } from "react";

const Video = ({ video }) => {
 





  return (
    <video
      className="video-player"
      autoPlay
    loop
      muted
      playsInline
     
    >
      <source src={video.url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default Video;
