import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const scannerId = "diwalih-aat-qr-reader";

const BASE_URL = "";
const VERIFY_URL = `${BASE_URL}/admin/status`;
const TOKEN_KEY = "adminToken";

export default function QrScanner() {
  const scannerRef = useRef(null);
  const mountedRef = useRef(false);
  const processingRef = useRef(false);
  const verifyInFlightRef = useRef(false);

  const [student, setStudent] = useState(null);
  const [scannedValue, setScannedValue] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);

  const [verification, setVerification] = useState({
    status: "idle",
    message: "",
  });

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
      gap: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: 800,
      margin: 0,
    },
    subtitle: {
      color: "#888",
      fontSize: 13,
      marginTop: 5,
    },
    icon: {
      width: 45,
      height: 45,
      minWidth: 45,
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
      overflow: "hidden",
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: 800,
      margin: "0 0 8px",
    },
    muted: {
      color: "#777",
      fontSize: 13,
      lineHeight: 1.6,
    },
    scanner: {
      width: "100%",
      maxWidth: 500,
      minHeight: 280,
      margin: "20px auto",
      overflow: "hidden",
      borderRadius: 18,
      background: "#111",
    },
    field: {
      marginTop: 15,
    },
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
      wordBreak: "break-word",
    },
    button: {
      width: "100%",
      boxSizing: "border-box",
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
    secondaryButton: {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid #E5D8D0",
      borderRadius: 12,
      background: "#fff",
      color: "#B64216",
      padding: "14px 18px",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      marginTop: 10,
    },
    disabledButton: {
      opacity: 0.55,
      cursor: "not-allowed",
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
    success: {
      padding: 13,
      borderRadius: 10,
      background: "#E8F7EC",
      color: "#218838",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1.5,
      marginTop: 12,
    },
    pending: {
      padding: 13,
      borderRadius: 10,
      background: "#FFF5E8",
      color: "#B64216",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1.5,
      marginTop: 12,
    },
    already: {
      padding: 13,
      borderRadius: 10,
      background: "#E8F0FE",
      color: "#2457A7",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1.5,
      marginTop: 12,
    },
  };

  const field = (label, value) => (
    <div style={styles.field} key={label}>
      <label style={styles.label}>{label}</label>
      <div style={styles.value}>
        {value === undefined ||
        value === null ||
        String(value).trim() === ""
          ? "N/A"
          : String(value)}
      </div>
    </div>
  );

  const maskAadhar = (value) => {
    if (!value) return "N/A";

    const digits = String(value).replace(/\D/g, "");

    return digits.length >= 4
      ? `XXXX-XXXX-${digits.slice(-4)}`
      : "XXXX-XXXX-XXXX";
  };

  // ------------------------------------------------------------
  // STOP SCANNER
  // ------------------------------------------------------------

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch (err) {
        console.warn("Could not stop scanner:", err);
      }
    }
  }, []);

  // ------------------------------------------------------------
  // VERIFY STUDENT
  // This function is called ONLY when the admin clicks the button.
  // ------------------------------------------------------------

  const verifyStudent = useCallback(async () => {
    if (!student || verifyInFlightRef.current) return;

    if (
      verification.status === "success" ||
      verification.status === "already"
    ) {
      return;
    }

    verifyInFlightRef.current = true;

    setVerification({
      status: "verifying",
      message: "Sending verification request to the server...",
    });
    setError("");

    try {
      const token = window.localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error(
          "Admin session not found. Please log in again."
        );
      }

      const body = {
        token,
        RollNo: student.RollNO
          ? String(student.RollNO)
          : student.RollNo
          ? String(student.RollNo)
          : "",
        email: student.email || "",
        MobileNo: student.MobileNo || "",
        Name: student.Name || "",
        branch: student.branch || "",
        batch: student.batch || "",
        url: student.url || "",
        urlAadhar: student.urlAadhar || "",
      };

      if (!body.RollNo && !body.email && !body.MobileNo) {
        throw new Error(
          "The QR code must contain a roll number, email, or mobile number."
        );
      }

      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => ({}));

      if (!mountedRef.current) return;

      console.log(
        "STUDENT VERIFICATION:",
        response.status,
        result
      );

      if (response.ok) {
        setStudent((current) => ({
          ...current,
          ...(result.data || {}),
          verified: true,
        }));

        setVerification({
          status: "success",
          message: result.msg || "Student verified successfully.",
        });
      } else if (response.status === 409) {
        setStudent((current) => ({
          ...current,
          ...(result.data || {}),
          verified: true,
        }));

        setVerification({
          status: "already",
          message: result.msg || "Student has already been verified.",
        });
      } else {
        setVerification({
          status: "error",
          message:
            result.msg ||
            result.message ||
            `Verification failed (${response.status}).`,
        });
      }
    } catch (err) {
      console.error("Verification error:", err);

      if (mountedRef.current) {
        setVerification({
          status: "error",
          message:
            err.message ||
            "Could not connect to the verification server.",
        });
      }
    } finally {
      verifyInFlightRef.current = false;
    }
  }, [student, verification.status]);

  // ------------------------------------------------------------
  // PROCESS QR
  // Scanning only reads and displays the QR data.
  // It does NOT call the verification API.
  // ------------------------------------------------------------

  const handleQRCode = useCallback(
    async (value) => {
      if (processingRef.current || !value) return;

      processingRef.current = true;

      try {
        const data = JSON.parse(value);

        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data)
        ) {
          throw new Error("Invalid QR data.");
        }

        const referenceId =
          data.Referenceid ?? data.Refernceid ?? "";

        if (!data.RollNO && !data.RollNo && !data.email && !data.MobileNo) {
          throw new Error(
            "This QR has no roll number, email, or mobile number."
          );
        }

        if (!mountedRef.current) return;

        setStudent({
          ...data,
          Referenceid: referenceId,
        });

        setScannedValue(value);
        setError("");

        setVerification({
          status: data.verified ? "already" : "idle",
          message: data.verified
            ? "This QR indicates the student may already be verified. Confirm the current status with the server."
            : "Review the student's details and documents before verifying.",
        });

        // Stop the camera, but DO NOT verify the student here.
        await stopScanner();
      } catch (err) {
        console.error("QR scan error:", err);

        if (mountedRef.current) {
          setError(
            err instanceof SyntaxError
              ? "Invalid Student QR. The QR code must contain valid JSON."
              : err.message || "Unable to process this student QR."
          );
        }

        processingRef.current = false;
      }
    },
    [stopScanner]
  );

  // ------------------------------------------------------------
  // START CAMERA
  // ------------------------------------------------------------

  const startScanner = useCallback(async () => {
    if (!mountedRef.current) return;

    setError("");
    setStarting(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      if (!mountedRef.current) return;

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1,
        },
        (decodedText) => {
          void handleQRCode(decodedText);
        },
        () => {
          // Ignore normal scan misses.
        }
      );
    } catch (err) {
      console.error("Camera start failed:", err);

      if (mountedRef.current) {
        setError(
          "Unable to access the camera. Allow camera permission and open this site using HTTPS or localhost."
        );
      }
    } finally {
      if (mountedRef.current) {
        setStarting(false);
      }
    }
  }, [handleQRCode]);

  // ------------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;
    void startScanner();

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [startScanner]);

  // ------------------------------------------------------------
  // SCAN ANOTHER STUDENT
  // ------------------------------------------------------------

  const scanAgain = async () => {
    if (verifyInFlightRef.current) {
      setError("Please wait for verification to finish.");
      return;
    }

    await stopScanner();

    processingRef.current = false;

    setStudent(null);
    setScannedValue("");
    setError("");

    setVerification({
      status: "idle",
      message: "",
    });

    await startScanner();
  };

  // ------------------------------------------------------------
  // PAGE UI
  // ------------------------------------------------------------

  const verificationStyle =
    verification.status === "success"
      ? styles.success
      : verification.status === "already"
      ? styles.already
      : verification.status === "verifying"
      ? styles.pending
      : verification.status === "error"
      ? styles.error
      : styles.pending;

  const isFinalStatus =
    verification.status === "success" ||
    verification.status === "already";

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>QR Scanner</h1>
            <div style={styles.subtitle}>
              Review student details before admin verification
            </div>
          </div>

          <div style={styles.icon}>⌗</div>
        </header>

        {!student ? (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Scan Student QR</h2>

            <p style={styles.muted}>
              Allow camera access and position the student's QR
              code inside the scanning area.
            </p>

            <div id={scannerId} style={styles.scanner} />

            {starting && (
              <p style={styles.muted}>Starting camera...</p>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <p style={styles.muted}>
              Scanning displays the student's information only.
              Verification happens after you click the button on
              the next screen.
            </p>

            {!starting && error && (
              <button
                type="button"
                style={styles.button}
                onClick={() => void startScanner()}
              >
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
              <h2
                style={{
                  margin: "0 0 6px",
                  color: "#218838",
                }}
              >
                ✓ Student QR Scanned
              </h2>

              <span style={{ fontSize: 13, color: "#52795B" }}>
                Details loaded. Please review before verification.
              </span>
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                Admin Verification
              </h2>

              <div style={verificationStyle} role="status">
                {verification.status === "idle" &&
                  "Review the student details and documents below. No verification request has been sent yet."}

                {verification.status === "verifying" &&
                  `⏳ ${verification.message}`}

                {verification.status === "success" &&
                  `✓ ${verification.message}`}

                {verification.status === "already" &&
                  `ℹ ${verification.message}`}

                {verification.status === "error" &&
                  `⚠ ${verification.message}`}
              </div>

              {!isFinalStatus && (
                <>
                  <button
                    type="button"
                    style={{
                      ...styles.button,
                      ...(verification.status === "verifying"
                        ? styles.disabledButton
                        : {}),
                    }}
                    onClick={() => void verifyStudent()}
                    disabled={
                      verification.status === "verifying" ||
                      verifyInFlightRef.current
                    }
                  >
                    {verification.status === "verifying"
                      ? "Verifying Student..."
                      : verification.status === "error"
                      ? "Retry Verification"
                      : "✓ Verify Student"}
                  </button>

                  <p style={styles.muted}>
                    Clicking this button sends the verification
                    request to the backend.
                  </p>
                </>
              )}

              {isFinalStatus && (
                <div style={styles.success}>
                  Verification has been processed by the server.
                </div>
              )}
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                Student Information
              </h2>

              <p style={styles.muted}>
                Check these details before approving the student.
              </p>

              {field("Full Name", student.Name)}
              {field(
                "Roll Number",
                student.RollNO ?? student.RollNo
              )}
              {field("Email", student.email)}
              {field("Branch", student.branch)}
              {field("Batch", student.batch)}
              {field("Mobile Number", student.MobileNo)}
              {field(
                "Aadhaar Number",
                maskAadhar(student.Aadhar ?? student.AadharNo)
              )}
              {field("Reference ID", student.Referenceid)}
            </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Documents</h2>

              {student.url ? (
                <div style={styles.field}>
                  <label style={styles.label}>
                    Profile Photo
                  </label>

                  <img
                    src={student.url}
                    alt="Student profile"
                    style={{
                      display: "block",
                      width: 140,
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 12,
                      marginTop: 8,
                      background: "#F8F6F4",
                    }}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                field("Profile Photo", "Not provided")
              )}

              {student.urlAadhar ? (
                <div style={styles.field}>
                  <label style={styles.label}>
                    Aadhaar Document
                  </label>

                  <a
                    href={student.urlAadhar}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      color: "#B64216",
                      overflowWrap: "anywhere",
                      marginTop: 4,
                    }}
                  >
                    Open Aadhaar document
                  </a>
                </div>
              ) : (
                field("Aadhaar Document", "Not provided")
              )}
            </section>

            {scannedValue && (
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>QR Data</h2>

                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    fontSize: 12,
                    color: "#777",
                  }}
                >
                  {scannedValue}
                </pre>
              </section>
            )}

            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                ...(verification.status === "verifying"
                  ? styles.disabledButton
                  : {}),
              }}
              onClick={() => void scanAgain()}
              disabled={verification.status === "verifying"}
            >
              ↻ Scan Another Student
            </button>
          </>
        )}
      </div>
    </main>
  );
}