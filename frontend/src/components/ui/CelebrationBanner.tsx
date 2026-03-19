import { useEffect, useState } from "react";
import { WHITE } from "../../theme/colors";

interface CelebrationBannerProps {
  unitTitle: string;
  show: boolean;
  onDismiss?: () => void;
}

export default function CelebrationBanner({ unitTitle, show, onDismiss }: CelebrationBannerProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setFading(false);
      const fadeTimer = setTimeout(() => setFading(true), 4000);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 5000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, onDismiss]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes celebration-slide {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { transform: translateY(4px); opacity: 1; }
          25% { transform: translateY(0); }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{
        background: "linear-gradient(135deg, #5c8f6a 0%, #8b7a9e 100%)",
        borderRadius: 12,
        padding: "16px 24px",
        marginBottom: 16,
        textAlign: "center",
        animation: "celebration-slide 0.6s ease-out",
        opacity: fading ? 0 : 1,
        transition: "opacity 1s ease-out",
      }}>
        <p style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: WHITE,
        }}>
          🎉 You completed {unitTitle}! Amazing work! 🎉
        </p>
      </div>
    </>
  );
}
