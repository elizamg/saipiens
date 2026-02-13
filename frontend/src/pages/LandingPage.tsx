import React from "react";
import { useNavigate } from "react-router-dom";
import verticleLogo from "../assets/verticle-logo.png";
import Button from "../components/ui/Button";
import TintedImage from "../components/ui/TintedImage";
import { PRIMARY, WHITE } from "../theme/colors";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <TintedImage
          src={verticleLogo}
          color={PRIMARY}
          alt="SAIPIENS vertical logo"
          width={220}
          style={styles.logo}
        />

        <h1 style={styles.h1}>
          Unlock deeper learning
          <br />
          with <span style={styles.green}>SAIPIENS</span>.
        </h1>

        <Button
          variant="primary"
          onClick={() => navigate("/signup")}
          style={{ padding: "16px 48px", fontSize: 18 }}
        >
          Get Started
        </Button>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: WHITE,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px 16px",
    boxSizing: "border-box",
  },
  container: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 28,
  },
  logo: {
    width: 220,
    height: "auto",
    objectFit: "contain",
  },
  h1: {
    margin: 0,
    fontSize: "clamp(36px, 5vw, 64px)",
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0B0B0B",
  },
  green: {
    color: PRIMARY,
  },
};
