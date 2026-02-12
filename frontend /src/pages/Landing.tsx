import React from "react";
import verticleLogo from "../assets/verticle-logo.png";

export default function LandingPage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <img
          src={verticleLogo}
          alt="SAIPIENS vertical logo"
          style={styles.logo}
        />

        <h1 style={styles.h1}>
          Unlock deeper learning
          <br />
          with <span style={styles.green}>SAIPIENS</span>.
        </h1>

        <button style={styles.cta} type="button">
          Get started today!
        </button>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#ffffff",
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
    color: "#7ED321", // tweak to match your exact brand green
  },
  cta: {
    border: "none",
    background: "transparent",
    color: "#7ED321",
    fontSize: 20,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
};
