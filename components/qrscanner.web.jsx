
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const scannerId = "diwalih​​aat-qr-reader";

export default function QrScanner() {
  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  const [student, setStudent] = useState(null);
  const [scannedValue, setScannedValue] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  const handleQRCode = (value) => {
    if (processingRef.current || !value) return;

    processingRef.current = true;

    try {
      const data = JSON.parse(value);

      if (
        !data ||
        typeof data !== "object" ||
        (!data.Name && !data.RollNO && !data.Refernceid)
      ) {
        throw new Error("Student information not found.");
      }

      setStudent(data);
      setScannedValue(value);
      setError("");

      scannerRef.current?.stop().catch(() => {});
    } catch {
      processingRef.current = false;
      setError(
        "Invalid Student QR. Please scan a QR code containing valid student information."
      );
    }
  };

  const startScanner = async () => {
    setError("");
    setStarting(true);
    processingRef.current = false;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        handleQRCode,
        () => {}
      );
    } catch (err) {
      console.error("Camera start failed:", err);
      setError(
        "Unable to access the camera. Allow camera permission and open this site using HTTPS or localhost."
      );
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  const scanAgain = async () => {
    setStudent(null);
    setScannedValue(null);
    setError("");
    await startScanner();
  };

  const maskAadhar = (value) => {
    if (!value) return "N/A";
    const digits = String(value).replace(/\D/g, "");
    return digits.length >= 4
      ? `XXXX-XXXX-${digits.slice(-4)}`
      : "XXXX-XXXX-XXXX";
  };

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#FFF8F0",
      padding: "24px 16px 40px",
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif",
      color: "#292929",
    },
    container: {
      width: "100%",
      maxWidth: 700,
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    title: { fontSize: 26, fontWeight: 800, margin: 0 },
    subtitle: { color: "#888", fontSize: 13, marginTop: 5 },
    icon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      background: "#F3E8E1",
      color: "#B64216",
      display: "grid",
      placeItems: "center",
      fontSize: 27,
    },
    card: {
      background: "#fff",
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      boxShadow: "0 3px 14px rgba(0,0,0,0.05)",
    },
    sectionTitle: { fontSize: 19, fontWeight: 800, margin: "0 0 8px" },
    muted: { color: "#777", fontSize: 13, lineHeight: 1.6 },
    scanner: {
      width: "100%",
      maxWidth: 500,
      margin: "20px auto",
      overflow: "hidden",
      borderRadius: 18,
      background: "#111",
    },
    field: { marginTop: 15 },
    label: {
      display: "block",
      color: "#666",
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 7,
    },
    value: {
      padding: 13,
      borderRadius: 10,
      background: "#F8F6F4",
      border: "1px solid #EDE8E4",
      fontSize: 14,
      overflowWrap: "anywhere",
    },
    button: {
      width: "100%",
      border: 0,
      borderRadius: 12,
      background: "#B64216",
      color: "#fff",
      padding: "15px 18px",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      marginTop: 8,
    },
    error: {
      padding: 12,
      borderRadius: 10,
      background: "#FFF0E6",
      color: "#B64216",
      fontSize: 13,
      lineHeight: 1.5,
      marginTop: 12,
    },
  };

  const field = (label, value) => (
    <div style={styles.field} key={label}>
      <label style={styles.label}>{label}</label>
      <div style={styles.value}>{value || "N/A"}</div>
    </div>
  );

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>QR Scanner</h1>
            <div style={styles.subtitle}>
              Scan and verify student information
            </div>
          </div>
          <div style={styles.icon}>⌗</div>
        </header>

        {!student ? (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Scan Student QR</h2>
            <p style={styles.muted}>
              Allow camera access and position the student QR code inside
              the scanning area.
            </p>

            <div id={scannerId} style={styles.scanner} />

            {starting && (
              <p style={styles.muted}>Starting camera…</p>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <p style={styles.muted}>
              Tip: Keep the QR code clearly visible and avoid glare.
            </p>

            {!starting && error && (
              <button style={styles.button} onClick={startScanner}>
                Try Camera Again
              </button>
            )}
          </section>
        ) : (
          <>
            <section
              style={{
                ...styles.card,
                background: "#E8F7EC",
              }}
            >
              <h2 style={{ margin: "0 0 6px", color: "#218838" }}>
                ✓ Student Found
              </h2>
              <span style={{ fontSize: 13, color: "#52795B" }}>
                QR code scanned successfully
              </span>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Student Information</h2>
              <p style={styles.muted}>Details decoded from the QR code</p>

              {field("Full Name", student.Name)}
              {field("Roll Number", student.RollNO)}
              {field("Branch", student.branch)}
              {field("Batch", student.batch)}
              {field("Mobile Number", student.MobileNo)}
              {field("Aadhaar Number", maskAadhar(student.Aadhar))}
              {field("Reference ID", student.Refernceid)}

              <div style={styles.field}>
                <label style={styles.label}>Verification Status</label>
                <div
                  style={{
                    ...styles.value,
                    background: student.verified ? "#E8F7EC" : "#FFF0E6",
                    color: student.verified ? "#218838" : "#B64216",
                    fontWeight: 800,
                  }}
                >
                  {student.verified
                    ? "✓ Student Verified"
                    : "⚠ Student Not Verified"}
                </div>
              </div>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Documents</h2>
              {field("Profile Photo URL", student.url)}
              {field("Aadhaar Document URL", student.urlAadhar)}
            </section>

            {scannedValue && (
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>QR Data</h2>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontSize: 12,
                    color: "#777",
                  }}
                >
                  {scannedValue}
                </pre>
              </section>
            )}

            <button style={styles.button} onClick={scanAgain}>
              ↻ Scan Another Student
            </button>
          </>
        )}
      </div>
    </main>
  );
}