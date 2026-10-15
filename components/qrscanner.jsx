
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  Linking,
  Platform,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

import { useBarcodeScannerOutput } from "react-native-vision-camera-barcode-scanner";

const BASE_URL = "";
const VERIFY_URL = `${BASE_URL}/admin/status`;
const TOKEN_KEY = "adminToken";

/*
|--------------------------------------------------------------------------
| Cross-platform alerts
|--------------------------------------------------------------------------
*/

const showMessage = (title, message) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

/*
|--------------------------------------------------------------------------
| URL normalization
|--------------------------------------------------------------------------
*/

const cleanImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  let input = value.trim();

  const markdownImageMatch = input.match(
    /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/
  );

  if (markdownImageMatch) {
    input = markdownImageMatch[1];
  } else {
    const markdownLinkMatch = input.match(
      /\]\((https?:\/\/[^)\s]+)\)/
    );

    if (markdownLinkMatch) {
      input = markdownLinkMatch[1];
    } else {
      const plainUrlMatch = input.match(
        /https?:\/\/[^\s\])"'<>]+/
      );

      if (!plainUrlMatch) {
        return "";
      }

      input = plainUrlMatch[0];
    }
  }

  input = input.replace(/[.,;]+$/, "");

  try {
    const parsed = new URL(input);

    if (
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ) {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
};

const getFirstValidImageUrl = (...values) => {
  for (const value of values) {
    const url = cleanImageUrl(value);

    if (url) {
      return url;
    }
  }

  return "";
};

const getStudentReference = (data) =>
  data?.Referenceid ??
  data?.Refernceid ??
  data?.referenceId ??
  null;

const getProfileUrl = (student) =>
  getFirstValidImageUrl(
    student?.url,
    student?.profileImage,
    student?.profilePhoto,
    student?.photo,
    student?.imageUrl,
    student?.profileUrl,
    student?.photoUrl
  );

const getAadharUrl = (student) =>
  getFirstValidImageUrl(
    student?.urlAadhar,
    student?.aadharImage,
    student?.aadharPhoto,
    student?.aadharUrl,
    student?.aadhaarImage,
    student?.aadhaarPhoto
  );

/*
|--------------------------------------------------------------------------
| Main QR scanner
|--------------------------------------------------------------------------
*/

export default function QrScanner() {
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();

  const [student, setStudent] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [loadingAadhar, setLoadingAadhar] = useState(false);

  const [profilePhotoError, setProfilePhotoError] = useState(false);
  const [aadharPhotoError, setAadharPhotoError] = useState(false);

  const scannedRef = useRef(false);
  const verifyInFlightRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Camera permission
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  /*
  |--------------------------------------------------------------------------
  | Handle scanned QR code
  |--------------------------------------------------------------------------
  */

  const handleBarcodeScanned = useCallback((barcodes) => {
    if (scannedRef.current || !barcodes?.length) {
      return;
    }

    const rawValue = barcodes[0]?.rawValue;

    if (!rawValue) {
      return;
    }

    scannedRef.current = true;
    setScanning(false);

    try {
      const data = JSON.parse(rawValue);

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error("Invalid student data.");
      }

      const normalizedStudent = {
        ...data,
        Referenceid: getStudentReference(data),
      };

      console.log("Scanned student:", normalizedStudent);

      console.log("Profile URL:", getProfileUrl(normalizedStudent));
      console.log("Aadhaar URL:", getAadharUrl(normalizedStudent));

      setStudent(normalizedStudent);

      setLoadingPhoto(Boolean(getProfileUrl(normalizedStudent)));
      setLoadingAadhar(Boolean(getAadharUrl(normalizedStudent)));

      setProfilePhotoError(false);
      setAadharPhotoError(false);
    } catch (error) {
      console.error("QR parsing error:", error);

      scannedRef.current = false;
      setScanning(true);

      showMessage(
        "Invalid QR Code",
        "The QR code must contain valid student JSON data."
      );
    }
  }, []);

  const barcodeOutput = useBarcodeScannerOutput({
    barcodeFormats: ["qr-code"],
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error) => {
      console.log("Barcode scanner error:", error);
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Reset scanner
  |--------------------------------------------------------------------------
  */

  const resetScanner = () => {
    if (verifyInFlightRef.current) {
      showMessage(
        "Please Wait",
        "Student verification is still in progress."
      );
      return;
    }

    scannedRef.current = false;

    setStudent(null);
    setScanning(true);

    setLoadingPhoto(false);
    setLoadingAadhar(false);

    setProfilePhotoError(false);
    setAadharPhotoError(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Open image/document
  |--------------------------------------------------------------------------
  */

  const openDocument = async (url) => {
    const cleanedUrl = cleanImageUrl(url);

    if (!cleanedUrl) {
      showMessage(
        "Invalid URL",
        "This document does not have a valid URL."
      );
      return;
    }

    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.open(cleanedUrl, "_blank", "noopener,noreferrer");
        }
        return;
      }

      const supported = await Linking.canOpenURL(cleanedUrl);

      if (!supported) {
        showMessage(
          "Unable to Open",
          "Your device cannot open this document URL."
        );
        return;
      }

      await Linking.openURL(cleanedUrl);
    } catch (error) {
      console.error("Open document error:", error);

      showMessage("Error", "Could not open the document.");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Verify student with admin token
  |--------------------------------------------------------------------------
  |
  | Sends the token in:
  | 1. Authorization: Bearer <token>
  | 2. JSON body: { token, RollNo }
  |
  | The backend must validate the token and authorize the admin.
  */

  const verifyStudent = async () => {
    if (verifyInFlightRef.current) {
      return;
    }

    if (!student?.RollNO) {
      showMessage(
        "Missing Roll Number",
        "The scanned QR code does not contain the student's roll number."
      );
      return;
    }

    verifyInFlightRef.current = true;
    setVerifying(true);

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (!token) {
        showMessage(
          "Login Required",
          "Admin token was not found. Please log in again."
        );
        return;
      }

      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token,
          RollNo: String(student.RollNO),
        }),
      });

      const result = await response.json().catch(() => ({}));

      console.log(
        "Student verification response:",
        response.status,
        result
      );

      /*
       * Handle an already-verified student.
       * Your backend uses HTTP 409 for this case.
       */
      if (response.status === 409) {
        const existingStudent =
          result.data?.student ||
          result.student ||
          result.data ||
          {};

        setStudent((current) => ({
          ...current,
          ...existingStudent,
          verified: true,
        }));

        showMessage(
          "Already Verified",
          result.msg ||
            result.message ||
            "This student has already been verified."
        );

        return;
      }

      if (!response.ok || result.success === false) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Admin authentication failed. Please log in again and check your admin permissions."
          );
        }

        throw new Error(
          result.msg ||
            result.message ||
            result.error ||
            `Verification failed (${response.status}).`
        );
      }

      const updatedStudent =
        result.data?.student ||
        result.student ||
        result.data ||
        {};

      setStudent((current) => ({
        ...current,
        ...updatedStudent,
        verified: updatedStudent.verified ?? true,
        verifiedBy:
          updatedStudent.verifiedBy ?? current.verifiedBy,
        verifiedAt:
          updatedStudent.verifiedAt ??
          current.verifiedAt ??
          new Date().toISOString(),
      }));

      showMessage(
        "Success",
        result.msg ||
          result.message ||
          "Student verified successfully."
      );
    } catch (error) {
      console.error("Verification error:", error);

      showMessage(
        "Verification Failed",
        error.message ||
          "Unable to connect to the verification server."
      );
    } finally {
      verifyInFlightRef.current = false;
      setVerifying(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Current image URLs
  |--------------------------------------------------------------------------
  */

  const profilePhotoUrl = getProfileUrl(student);
  const aadharPhotoUrl = getAadharUrl(student);

  /*
  |--------------------------------------------------------------------------
  | Camera permission screen
  |--------------------------------------------------------------------------
  */

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFF8F0"
        />

        <Text style={styles.permissionTitle}>
          Camera Permission Required
        </Text>

        <Text style={styles.permissionText}>
          Allow camera access to scan student QR codes.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>
            Allow Camera
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Camera initialization
  |--------------------------------------------------------------------------
  */

  if (!device && scanning && !student) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#B64216" />

        <Text style={styles.permissionText}>
          Initializing camera...
        </Text>
      </SafeAreaView>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main screen
  |--------------------------------------------------------------------------
  */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFF8F0"
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Student Verification
        </Text>

        <Text style={styles.headerSubtitle}>
          Scan a student's QR code to view their details.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {scanning && !student && device ? (
          <View style={styles.scannerCard}>
            <View style={styles.cameraContainer}>
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={scanning}
                outputs={[barcodeOutput]}
              />

              <View
                pointerEvents="none"
                style={styles.scanOverlay}
              >
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
            </View>

            <Text style={styles.scanTitle}>
              Scan Student QR
            </Text>

            <Text style={styles.scanSubtitle}>
              Place the student's QR code inside the frame.
            </Text>
          </View>
        ) : null}

        {student ? (
          <>
            {/* Student header */}

            <View style={styles.studentHeader}>
              {profilePhotoUrl && !profilePhotoError ? (
                <Image
                  key={profilePhotoUrl}
                  source={{ uri: profilePhotoUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setProfilePhotoError(true)}
                />
              ) : (
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>
                    {(student.Name || "S")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.studentHeaderText}>
                <Text style={styles.studentName}>
                  {student.Name || "Student"}
                </Text>

                <Text style={styles.studentRoll}>
                  Roll No: {student.RollNO || "Not available"}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  student.verified
                    ? styles.verifiedBadge
                    : styles.pendingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    student.verified
                      ? styles.verifiedText
                      : styles.pendingText,
                  ]}
                >
                  {student.verified ? "Verified" : "Pending"}
                </Text>
              </View>
            </View>

            {/* Student details */}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Student Details
              </Text>

              <InfoField label="Full Name" value={student.Name} />

              <InfoField
                label="Reference ID"
                value={student.Referenceid}
              />

              <InfoField
                label="Roll Number"
                value={student.RollNO}
              />

              <InfoField label="Batch" value={student.batch} />

              <InfoField label="Branch" value={student.branch} />

              <InfoField
                label="Mobile Number"
                value={student.MobileNo}
              />

              <InfoField
                label="Email"
                value={student.email}
              />
            </View>

            {/* Profile photo */}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Profile Photo
              </Text>

              <Text style={styles.cardSubtitle}>
                Student's uploaded profile photograph.
              </Text>

              {profilePhotoUrl && !profilePhotoError ? (
                <>
                  <View style={styles.imageContainer}>
                    {loadingPhoto ? (
                      <ActivityIndicator
                        style={styles.imageLoader}
                        size="large"
                        color="#B64216"
                      />
                    ) : null}

                    <Image
                      key={profilePhotoUrl}
                      source={{ uri: profilePhotoUrl }}
                      style={styles.documentImage}
                      resizeMode="contain"
                      onLoadStart={() => setLoadingPhoto(true)}
                      onLoad={() => {
                        setLoadingPhoto(false);
                        setProfilePhotoError(false);
                      }}
                      onError={() => {
                        setLoadingPhoto(false);
                        setProfilePhotoError(true);
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => openDocument(profilePhotoUrl)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Open Profile Photo
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <EmptyDocument
                  title="Profile Photo Unavailable"
                  message={
                    profilePhotoUrl
                      ? "The image could not be loaded. Check the URL and server access."
                      : "No profile image URL was found in the scanned QR data."
                  }
                />
              )}

              {profilePhotoUrl ? (
                <Text style={styles.debugUrl}>
                  Image URL: {profilePhotoUrl}
                </Text>
              ) : null}
            </View>

            {/* Aadhaar document */}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Aadhaar Document
              </Text>

              <Text style={styles.cardSubtitle}>
                Student's uploaded Aadhaar photograph.
              </Text>

              {aadharPhotoUrl && !aadharPhotoError ? (
                <>
                  <View style={styles.imageContainer}>
                    {loadingAadhar ? (
                      <ActivityIndicator
                        style={styles.imageLoader}
                        size="large"
                        color="#B64216"
                      />
                    ) : null}

                    <Image
                      key={aadharPhotoUrl}
                      source={{ uri: aadharPhotoUrl }}
                      style={styles.documentImage}
                      resizeMode="contain"
                      onLoadStart={() => setLoadingAadhar(true)}
                      onLoad={() => {
                        setLoadingAadhar(false);
                        setAadharPhotoError(false);
                      }}
                      onError={() => {
                        setLoadingAadhar(false);
                        setAadharPhotoError(true);
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => openDocument(aadharPhotoUrl)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Open Aadhaar Image
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <EmptyDocument
                  title="Aadhaar Image Unavailable"
                  message={
                    aadharPhotoUrl
                      ? "The Aadhaar image could not be loaded."
                      : "No Aadhaar image URL was found in the scanned QR data."
                  }
                />
              )}
            </View>

            {/* Verification */}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Verification
              </Text>

              <Text style={styles.cardSubtitle}>
                Review the student's details and documents before
                approving the record.
              </Text>

              {student.verified ? (
                <View style={styles.alreadyVerified}>
                  <Text style={styles.alreadyVerifiedText}>
                    This student is already verified.
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    verifying && styles.disabledButton,
                  ]}
                  onPress={verifyStudent}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Verify Student
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.resetButton,
                verifying && styles.disabledButton,
              ]}
              onPress={resetScanner}
              disabled={verifying}
            >
              <Text style={styles.resetButtonText}>
                Scan Another Student
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/*
|--------------------------------------------------------------------------
| Reusable components
|--------------------------------------------------------------------------
*/

function InfoField({ label, value }) {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>
        {value === null ||
        value === undefined ||
        String(value).trim() === ""
          ? "Not available"
          : String(value)}
      </Text>
    </View>
  );
}

function EmptyDocument({ title, message }) {
  return (
    <View style={styles.emptyDocument}>
      <Text style={styles.emptyIcon}>▧</Text>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },

  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F0",
    padding: 24,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#3D241A",
  },

  headerSubtitle: {
    color: "#856C60",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
  },

  scannerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    elevation: 3,
  },

  cameraContainer: {
    height: 300,
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#241B18",
  },

  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  scanFrame: {
    width: 220,
    height: 220,
    position: "relative",
  },

  corner: {
    width: 35,
    height: 35,
    position: "absolute",
    borderColor: "#FFFFFF",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },

  scanTitle: {
    color: "#3D241A",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 18,
  },

  scanSubtitle: {
    color: "#856C60",
    fontSize: 13,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 5,
  },

  studentHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },

  studentAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F8E1D5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F8E1D5",
    marginRight: 12,
  },

  avatarText: {
    color: "#B64216",
    fontSize: 23,
    fontWeight: "800",
  },

  studentHeaderText: {
    flex: 1,
  },

  studentName: {
    color: "#3D241A",
    fontSize: 17,
    fontWeight: "800",
  },

  studentRoll: {
    color: "#856C60",
    fontSize: 12,
    marginTop: 5,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  verifiedBadge: {
    backgroundColor: "#DDF5E5",
  },

  pendingBadge: {
    backgroundColor: "#FFF0D4",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  verifiedText: {
    color: "#187343",
  },

  pendingText: {
    color: "#98600B",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 16,
    elevation: 2,
  },

  cardTitle: {
    color: "#3D241A",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 7,
  },

  cardSubtitle: {
    color: "#856C60",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },

  infoField: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1E7DF",
  },

  infoLabel: {
    color: "#8A766A",
    fontSize: 12,
    marginBottom: 5,
  },

  infoValue: {
    color: "#3D241A",
    fontSize: 15,
    fontWeight: "600",
  },

  imageContainer: {
    minHeight: 190,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#F7F1EC",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  documentImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#F7F1EC",
  },

  imageLoader: {
    position: "absolute",
    zIndex: 2,
  },

  emptyDocument: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#E9DCD2",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FCF8F4",
  },

  emptyIcon: {
    fontSize: 35,
    color: "#B64216",
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 14,
    color: "#3D241A",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: "#856C60",
    textAlign: "center",
    lineHeight: 19,
  },

  debugUrl: {
    fontSize: 11,
    color: "#8A766A",
    marginTop: 12,
    lineHeight: 17,
  },

  primaryButton: {
    minHeight: 50,
    backgroundColor: "#B64216",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B64216",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 12,
  },

  secondaryButtonText: {
    color: "#B64216",
    fontWeight: "700",
    fontSize: 14,
  },

  alreadyVerified: {
    backgroundColor: "#E5F6E9",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },

  alreadyVerifiedText: {
    color: "#187343",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  disabledButton: {
    opacity: 0.65,
  },

  resetButton: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#B64216",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  resetButtonText: {
    color: "#B64216",
    fontSize: 15,
    fontWeight: "800",
  },

  permissionTitle: {
    color: "#3D241A",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  permissionText: {
    color: "#856C60",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 18,
    marginTop: 10,
  },
});
