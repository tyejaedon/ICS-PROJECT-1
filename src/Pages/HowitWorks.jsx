const stepsData = [
    {
      image: "/collection.jpg", // Replace with your actual image path
      title: "🗑️ Trash Point Collection",
      description: "Mark and manage designated trash collection spots within your neighborhood. Keep areas tidy and make pickups more efficient."
    },
    {
      image: "/community.jpg",
      title: "🤝 Community Building",
      description: "Encourage neighbors to join together in maintaining a cleaner, greener community through shared responsibilities and teamwork."
    },
    {
      image: "/leader.avif",
      title: "🧭 Community Leader",
      description: "Empower local leaders to oversee cleanup efforts, communicate schedules, and coordinate with collection teams."
    },
    {
      image: "/sorting.jpeg",
      title: "♻️ Waste Sorting",
      description: "Educate residents on separating recyclable, organic, and hazardous waste to improve environmental impact and disposal efficiency."
    },
    {
      image: "/map.png",
      title: "📍 Geo-location",
      description: "Use built-in GPS tracking to locate trash hotspots and submit real-time reports to ensure timely response and follow-up."
    },
    {
      image: "accountability.jpg",
      title: "📊 Accountability",
      description: "Monitor and evaluate cleanup activities, ensuring teams remain transparent, reliable, and community-focused."
    },
    {
      image: "/stats.png",
      title: "📈 Statistical Report",
      description: "View live data dashboards showcasing cleanup frequency, community participation, and waste reduction trends."
    }
  ];
  import HowItWorks from "../Components/work";
  const HowItWorksPage=() =>{
    return (
        <section className="how-it-works" id="how-it-works">
          
            <div className="how-it-works-header">
                <h2>How It Works</h2>
                <p>Our platform is designed to make community cleanup efforts easy and effective. Here's how it works:</p>
            </div>
            <HowItWorks steps={stepsData} />

        </section>
      );
  }
    export default HowItWorksPage;
  