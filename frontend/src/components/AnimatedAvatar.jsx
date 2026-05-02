import React, { Component, useState, useEffect } from "react";
import LottieModule from "lottie-react";

// Safe Lottie import
const Lottie = LottieModule.default ? LottieModule.default : LottieModule;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Lottie Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div style={{ fontSize: '10px', color: 'red' }}>Error</div>;
    return this.props.children;
  }
}

export default function AnimatedAvatar({ state }) {
  const [animData, setAnimData] = useState(null);

  useEffect(() => {
    // Try to load the user's doraemon.json, but gracefully handle if it's broken or missing
    import('../assets/doraemon.json')
      .then(module => {
        const data = module.default || module;
        // Check if it's a valid Lottie JSON (must have layers)
        if (data && data.layers && data.layers.length > 0) {
          setAnimData(data);
        }
      })
      .catch(() => console.log('No valid doraemon.json found, using CSS fallback orb.'));
  }, []);

  // Strict sizing for the centered premium look
  const containerStyle = {
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(16px)",
    border: "2px solid rgba(255, 255, 255, 0.9)",
    overflow: "hidden",
    margin: "0 auto",
    position: "relative",
    zIndex: 10
  };

  if (state === "listening") {
    containerStyle.boxShadow = "0 0 40px rgba(59, 130, 246, 0.6)";
    containerStyle.borderColor = "#3b82f6";
    containerStyle.transform = "scale(1.05)";
  } else if (state === "speaking") {
    containerStyle.boxShadow = "0 0 50px rgba(139, 92, 246, 0.5)";
    containerStyle.borderColor = "#8b5cf6";
    containerStyle.transform = "scale(1.1) translateY(-4px)";
  } else if (state === "thinking") {
    containerStyle.boxShadow = "0 0 30px rgba(245, 158, 11, 0.4)";
    containerStyle.borderColor = "#fbbf24";
  } else {
    // Idle float
    containerStyle.boxShadow = "0 10px 30px rgba(0,0,0,0.05)";
    containerStyle.animation = "float 4s ease-in-out infinite";
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>
      <div style={containerStyle} className="avatar-anim">
        <ErrorBoundary>
          {animData ? (
            <Lottie 
              animationData={animData} 
              loop={true} 
              style={{ width: "100%", height: "100%", opacity: state === 'thinking' ? 0.7 : 1 }}
            />
          ) : (
            // Beautiful CSS fallback orb if JSON is missing
            <div style={{
              width: "100%", height: "100%",
              background: state === 'listening' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 
                          state === 'speaking'  ? 'linear-gradient(135deg, #8b5cf6, #c084fc)' :
                          state === 'thinking'  ? 'linear-gradient(135deg, #fbbf24, #fcd34d)' :
                                                  'linear-gradient(135deg, #93c5fd, #bfdbfe)',
              borderRadius: "50%",
              boxShadow: "inset 0 0 30px rgba(255,255,255,0.7)",
              transition: "all 0.5s ease"
            }} />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
