import React from 'react';
import SocialProof from '../Components/SocialProof';
import Video from '../Components/video';
import vdata from '../assets/home-video.mp4'
import Services from '../Components/services';



const HomePage = () => {
    const videoData = {
        title: 'Waste Management Solutions',
        description: 'Connecting communities with waste management solutions.',
        url: '/home-video.mp4'
        
    };
    return (
        <div className="home-container">

            <section className="home-main">


                <div className="home-main-content">

                    <Video video={videoData} />

                    <div>
                        <h1 className="home-title">Connecting Communities with Waste Management Solutions</h1>
</div>
<div className='home-text-wrapper'>

                        <p className="home-subtitle">Join us in making waste management easier and more efficient.</p>
                        <p className="home-description">
                            Easily report waste disposal needs and connect with waste management companies in your area.
                            Together, we can make our community cleaner and greener!
                        </p>
                        <button className="home-get-started">Get Started</button>
                    </div>
                </div>


            </section>
     
                <Services />
          
        </div>
    );
};

export default HomePage;
