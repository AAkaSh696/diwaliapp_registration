
import React, { useEffect, useRef, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
    SafeAreaView,
    ScrollView
} from "react-native";

import {
    Camera,
    useCameraDevice,
    useCameraPermission
} from "react-native-vision-camera";

import {
    useBarcodeScannerOutput
} from "react-native-vision-camera-barcode-scanner";


function QrScanner() {

    const device = useCameraDevice("back");

    const {
        hasPermission,
        requestPermission
    } = useCameraPermission();

    const [scanned, setScanned] = useState(false);
    const [scannedValue, setScannedValue] = useState(null);
    const [student, setStudent] = useState(null);

    const scannedRef = useRef(false);


    // =====================================================
    // CAMERA PERMISSION
    // =====================================================

    useEffect(() => {

        if (!hasPermission) {
            requestPermission();
        }

    }, [hasPermission, requestPermission]);


    // =====================================================
    // HANDLE QR
    // =====================================================

    const handleQRCode = (value) => {

        if (scannedRef.current) {
            return;
        }

        if (!value) {
            return;
        }

        scannedRef.current = true;

        try {

            console.log("QR RAW VALUE:", value);

            const studentData = JSON.parse(value);

            console.log(
                "PARSED STUDENT:",
                studentData
            );


            if (
                !studentData ||
                typeof studentData !== "object"
            ) {
                throw new Error("Invalid QR data");
            }


            if (
                !studentData.Name &&
                !studentData.RollNO &&
                !studentData.Refernceid
            ) {
                throw new Error(
                    "Student information not found"
                );
            }


            setScannedValue(value);

            setStudent(studentData);

            setScanned(true);

        } catch (error) {

            console.log(
                "QR parsing error:",
                error
            );

            scannedRef.current = false;

            setScanned(false);

            setScannedValue(null);

            setStudent(null);

            Alert.alert(
                "Invalid Student QR",
                "This QR code does not contain valid student information."
            );

        }

    };


    // =====================================================
    // BARCODE SCANNER
    // =====================================================

    const barcodeOutput = useBarcodeScannerOutput({

        barcodeFormats: ["qr-code"],

        onBarcodeScanned: (barcodes) => {

            if (
                !barcodes ||
                barcodes.length === 0
            ) {
                return;
            }


            const barcode = barcodes[0];


            console.log(
                "Barcode object:",
                barcode
            );


            const value =
                barcode?.value ??
                barcode?.rawValue ??
                barcode?.displayValue;


            if (!value) {
                return;
            }


            handleQRCode(value);

        },


        onError: (error) => {

            console.warn(
                "Barcode scanner error:",
                error
            );

        }

    });


    // =====================================================
    // SCAN AGAIN
    // =====================================================

    const scanAgain = () => {

        scannedRef.current = false;

        setScanned(false);

        setScannedValue(null);

        setStudent(null);

    };


    // =====================================================
    // MASK AADHAAR
    // =====================================================

    const maskAadhar = (value) => {

        if (!value) {
            return "N/A";
        }

        const stringValue = String(value);

        if (stringValue.length < 4) {
            return "****";
        }

        return `XXXX XXXX ${stringValue.slice(-4)}`;

    };


    // =====================================================
    // PERMISSION SCREEN
    // =====================================================

    if (!hasPermission) {

        return (

            <SafeAreaView style={styles.safeArea}>

                <StatusBar barStyle="dark-content" />

                <View style={styles.permissionContainer}>

                    <View style={styles.permissionIcon}>
                        <Text style={styles.permissionIconText}>
                            📷
                        </Text>
                    </View>


                    <Text style={styles.permissionTitle}>
                        Camera Permission
                    </Text>


                    <Text style={styles.permissionDescription}>
                        Camera access is required to scan
                        student QR codes.
                    </Text>


                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={requestPermission}
                    >

                        <Text style={styles.primaryButtonText}>
                            Allow Camera
                        </Text>

                    </TouchableOpacity>

                </View>

            </SafeAreaView>

        );

    }


    // =====================================================
    // CAMERA LOADING
    // =====================================================

    if (!device) {

        return (

            <SafeAreaView style={styles.safeArea}>

                <View style={styles.loadingContainer}>

                    <ActivityIndicator size="large" />

                    <Text style={styles.loadingTitle}>
                        Starting camera...
                    </Text>

                    <Text style={styles.loadingDescription}>
                        Please wait
                    </Text>

                </View>

            </SafeAreaView>

        );

    }


    // =====================================================
    // MAIN PAGE
    // =====================================================

    return (

        <SafeAreaView style={styles.safeArea}>

            <StatusBar barStyle="dark-content" />


            <View style={styles.container}>

                {/* =================================================
                    HEADER
                ================================================= */}

                <View style={styles.header}>

                    <View>

                        <Text style={styles.headerTitle}>
                            QR Scanner
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            {student
                                ? "Student information"
                                : "Scan student ID"}
                        </Text>

                    </View>


                    <View style={styles.headerIcon}>

                        <Text style={styles.headerIconText}>
                            ⌗
                        </Text>

                    </View>

                </View>


                {/* =================================================
                    BEFORE SCANNING
                ================================================= */}

                {!student ? (

                    <View style={styles.content}>

                        <View style={styles.instruction}>

                            <Text style={styles.instructionTitle}>
                                Scan Student QR
                            </Text>

                            <Text style={styles.instructionText}>
                                Position the QR code inside the frame below
                            </Text>

                        </View>


                        {/* CAMERA */}

                        <View style={styles.scannerWrapper}>

                            <Camera
                                style={styles.camera}
                                device={device}
                                isActive={!scanned}
                                outputs={[barcodeOutput]}
                            />


                            {/* CAMERA OVERLAY */}

                            <View
                                pointerEvents="none"
                                style={styles.scannerOverlay}
                            >

                                <View style={styles.scanFrame}>

                                    <View
                                        style={[
                                            styles.corner,
                                            styles.topLeft
                                        ]}
                                    />

                                    <View
                                        style={[
                                            styles.corner,
                                            styles.topRight
                                        ]}
                                    />

                                    <View
                                        style={[
                                            styles.corner,
                                            styles.bottomLeft
                                        ]}
                                    />

                                    <View
                                        style={[
                                            styles.corner,
                                            styles.bottomRight
                                        ]}
                                    />


                                    {!scanned && (
                                        <View
                                            style={styles.scanLine}
                                        />
                                    )}

                                </View>


                                <Text style={styles.scanInstruction}>
                                    Place QR code inside the frame
                                </Text>

                            </View>

                        </View>


                        {/* TIP */}

                        <View style={styles.tipContainer}>

                            <Text style={styles.tipIcon}>
                                💡
                            </Text>


                            <View style={styles.tipContent}>

                                <Text style={styles.tipTitle}>
                                    Scanning Tip
                                </Text>

                                <Text style={styles.tipText}>
                                    Keep the QR code clearly visible
                                    and avoid glare.
                                </Text>

                            </View>

                        </View>

                    </View>

                ) : (

                    /* =================================================
                       AFTER SCANNING
                    ================================================= */

                    <ScrollView
                        style={styles.formScroll}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={
                            styles.formContainer
                        }
                    >

                        {/* SUCCESS HEADER */}

                        <View style={styles.successContainer}>

                            <View style={styles.successIcon}>

                                <Text style={styles.successIconText}>
                                    ✓
                                </Text>

                            </View>


                            <View>

                                <Text style={styles.successTitle}>
                                    Student Found
                                </Text>

                                <Text style={styles.successSubtitle}>
                                    QR code scanned successfully
                                </Text>

                            </View>

                        </View>


                        {/* =================================================
                            STUDENT FORM
                        ================================================= */}

                        <View style={styles.formCard}>

                            <Text style={styles.formTitle}>
                                Student Information
                            </Text>

                            <Text style={styles.formSubtitle}>
                                Details decoded from the QR code
                            </Text>


                            {/* NAME */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Full Name
                                </Text>

                                <View style={styles.inputBox}>

                                    <Text style={styles.inputText}>
                                        {student?.Name || "N/A"}
                                    </Text>

                                </View>

                            </View>


                            {/* ROLL NUMBER */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Roll Number
                                </Text>

                                <View style={styles.inputBox}>

                                    <Text style={styles.inputText}>
                                        {student?.RollNO || "N/A"}
                                    </Text>

                                </View>

                            </View>


                            {/* BRANCH */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Branch
                                </Text>

                                <View style={styles.inputBox}>

                                    <Text style={styles.inputText}>
                                        {student?.branch || "N/A"}
                                    </Text>

                                </View>

                            </View>


                            {/* BATCH */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Batch
                                </Text>

                                <View style={styles.inputBox}>

                                    <Text style={styles.inputText}>
                                        {student?.batch || "N/A"}
                                    </Text>

                                </View>

                            </View>


                            {/* MOBILE */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Mobile Number
                                </Text>

                                <View style={styles.inputBox}>

                                    <Text style={styles.inputText}>
                                        {student?.MobileNo || "N/A"}
                                    </Text>

                                </View>

                            </View>


                            {/* AADHAAR */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Aadhaar Number
                                </Text>

                                <View style={styles.inputBox}>

                                    <Text style={styles.inputText}>
                                        {maskAadhar(
                                            student?.Aadhar
                                        )}
                                    </Text>

                                </View>

                            </View>


                            {/* REFERENCE ID */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Reference ID
                                </Text>

                                <View style={styles.inputBox}>

                                    <Text
                                        style={styles.smallInputText}
                                        numberOfLines={1}
                                    >
                                        {student?.Refernceid ||
                                            "N/A"}
                                    </Text>

                                </View>

                            </View>


                            {/* VERIFICATION */}

                            <View style={styles.field}>

                                <Text style={styles.fieldLabel}>
                                    Verification Status
                                </Text>


                                <View
                                    style={
                                        student?.verified
                                            ? styles.verifiedBox
                                            : styles.notVerifiedBox
                                    }
                                >

                                    <Text
                                        style={
                                            student?.verified
                                                ? styles.verifiedText
                                                : styles.notVerifiedText
                                        }
                                    >

                                        {student?.verified
                                            ? "✓ Student Verified"
                                            : "⚠ Student Not Verified"}

                                    </Text>

                                </View>

                            </View>

                        </View>


                        {/* =================================================
                            DOCUMENTS
                        ================================================= */}

                        <View style={styles.documentsCard}>

                            <Text style={styles.formTitle}>
                                Documents
                            </Text>

                            <Text style={styles.formSubtitle}>
                                Uploaded document references
                            </Text>


                            {/* PROFILE IMAGE */}

                            <View style={styles.documentRow}>

                                <View>

                                    <Text style={styles.documentTitle}>
                                        Profile Photo
                                    </Text>

                                    <Text
                                        style={styles.documentUrl}
                                        numberOfLines={1}
                                    >
                                        {student?.url || "Not available"}
                                    </Text>

                                </View>

                            </View>


                            {/* AADHAAR IMAGE */}

                            <View style={styles.documentRow}>

                                <View>

                                    <Text style={styles.documentTitle}>
                                        Aadhaar Document
                                    </Text>

                                    <Text
                                        style={styles.documentUrl}
                                        numberOfLines={1}
                                    >
                                        {student?.urlAadhar ||
                                            "Not available"}
                                    </Text>

                                </View>

                            </View>

                        </View>


                        {/* =================================================
                            QR RAW DATA
                        ================================================= */}

                        {scannedValue && (

                            <View style={styles.qrDataCard}>

                                <Text style={styles.formTitle}>
                                    QR Data
                                </Text>

                                <Text
                                    style={styles.qrDataText}
                                    numberOfLines={5}
                                >
                                    {scannedValue}
                                </Text>

                            </View>

                        )}


                        {/* =================================================
                            SCAN AGAIN
                        ================================================= */}

                        <TouchableOpacity
                            style={styles.scanAgainButton}
                            onPress={scanAgain}
                        >

                            <Text style={styles.scanAgainIcon}>
                                ↻
                            </Text>

                            <Text style={styles.scanAgainText}>
                                Scan Another Student
                            </Text>

                        </TouchableOpacity>

                    </ScrollView>

                )}

            </View>

        </SafeAreaView>

    );

}


export default QrScanner;


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: "#FFF8F0"
    },

    container: {
        flex: 1,
        backgroundColor: "#FFF8F0"
    },


    // ========================================================
    // HEADER
    // ========================================================

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 15
    },

    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#292929"
    },

    headerSubtitle: {
        fontSize: 13,
        color: "#888",
        marginTop: 3
    },

    headerIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: "#F3E8E1",
        justifyContent: "center",
        alignItems: "center"
    },

    headerIconText: {
        fontSize: 27,
        color: "#B64216",
        fontWeight: "700"
    },


    // ========================================================
    // CAMERA CONTENT
    // ========================================================

    content: {
        flex: 1,
        paddingHorizontal: 20
    },

    instruction: {
        marginTop: 5,
        marginBottom: 16
    },

    instructionTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#292929"
    },

    instructionText: {
        fontSize: 13,
        color: "#777",
        marginTop: 5,
        lineHeight: 19
    },


    // ========================================================
    // CAMERA
    // ========================================================

    scannerWrapper: {
        width: "100%",
        height: 350,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "#111",

        elevation: 5,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 4
        },

        shadowOpacity: 0.15,

        shadowRadius: 8
    },

    camera: {
        flex: 1
    },

    scannerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        justifyContent: "center",
        alignItems: "center"
    },

    scanFrame: {
        width: 230,
        height: 230,
        position: "relative"
    },

    corner: {
        position: "absolute",
        width: 35,
        height: 35,
        borderColor: "#FFFFFF"
    },

    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 10
    },

    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 10
    },

    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 10
    },

    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 10
    },

    scanLine: {
        position: "absolute",
        left: 8,
        right: 8,
        top: "50%",
        height: 2,
        backgroundColor: "#FFFFFF"
    },

    scanInstruction: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 22,
        textAlign: "center"
    },


    // ========================================================
    // TIP
    // ========================================================

    tipContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 14,
        marginTop: 16
    },

    tipIcon: {
        fontSize: 22,
        marginRight: 12
    },

    tipContent: {
        flex: 1
    },

    tipTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#333"
    },

    tipText: {
        fontSize: 12,
        color: "#888",
        marginTop: 3,
        lineHeight: 17
    },


    // ========================================================
    // FORM
    // ========================================================

    formScroll: {
        flex: 1
    },

    formContainer: {
        paddingHorizontal: 20,
        paddingBottom: 35
    },

    successContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F7EC",
        borderRadius: 16,
        padding: 15,
        marginBottom: 15
    },

    successIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 13
    },

    successIconText: {
        fontSize: 26,
        fontWeight: "800",
        color: "#218838"
    },

    successTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#218838"
    },

    successSubtitle: {
        fontSize: 12,
        color: "#6A8B70",
        marginTop: 3
    },


    // ========================================================
    // FORM CARD
    // ========================================================

    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        elevation: 3,

        shadowColor: "#000",

        shadowOffset: {
            width: 0,
            height: 3
        },

        shadowOpacity: 0.07,

        shadowRadius: 8
    },

    formTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#292929"
    },

    formSubtitle: {
        fontSize: 12,
        color: "#888",
        marginTop: 4,
        marginBottom: 18
    },

    field: {
        marginBottom: 15
    },

    fieldLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#666",
        marginBottom: 7
    },

    inputBox: {
        minHeight: 48,
        borderRadius: 11,
        backgroundColor: "#F8F6F4",
        borderWidth: 1,
        borderColor: "#EDE8E4",
        justifyContent: "center",
        paddingHorizontal: 13
    },

    inputText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#292929"
    },

    smallInputText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#555"
    },


    // ========================================================
    // VERIFICATION
    // ========================================================

    verifiedBox: {
        minHeight: 48,
        borderRadius: 11,
        backgroundColor: "#E8F7EC",
        justifyContent: "center",
        paddingHorizontal: 13
    },

    verifiedText: {
        color: "#218838",
        fontSize: 14,
        fontWeight: "800"
    },

    notVerifiedBox: {
        minHeight: 48,
        borderRadius: 11,
        backgroundColor: "#FFF0E6",
        justifyContent: "center",
        paddingHorizontal: 13
    },

    notVerifiedText: {
        color: "#B64216",
        fontSize: 14,
        fontWeight: "800"
    },


    // ========================================================
    // DOCUMENTS
    // ========================================================

    documentsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginTop: 15,

        elevation: 2
    },

    documentRow: {
        paddingVertical: 13,
        borderTopWidth: 1,
        borderTopColor: "#F0ECE9"
    },

    documentTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#333"
    },

    documentUrl: {
        fontSize: 11,
        color: "#999",
        marginTop: 5
    },


    // ========================================================
    // QR RAW DATA
    // ========================================================

    qrDataCard: {
        backgroundColor: "#F8F5F2",
        borderRadius: 16,
        padding: 15,
        marginTop: 15
    },

    qrDataText: {
        fontSize: 10,
        color: "#888",
        lineHeight: 16
    },


    // ========================================================
    // SCAN AGAIN
    // ========================================================

    scanAgainButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: "#B64216",
        marginTop: 17,

        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },

    scanAgainIcon: {
        color: "#FFFFFF",
        fontSize: 22,
        marginRight: 8
    },

    scanAgainText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800"
    },


    // ========================================================
    // PERMISSION
    // ========================================================

    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 35
    },

    permissionIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F3E8E1",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20
    },

    permissionIconText: {
        fontSize: 35
    },

    permissionTitle: {
        fontSize: 23,
        fontWeight: "800",
        color: "#292929"
    },

    permissionDescription: {
        fontSize: 14,
        color: "#777",
        textAlign: "center",
        lineHeight: 21,
        marginTop: 8,
        marginBottom: 20
    },

    primaryButton: {
        backgroundColor: "#B64216",
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 11
    },

    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800"
    },


    // ========================================================
    // LOADING
    // ========================================================

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    loadingTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#444",
        marginTop: 14
    },

    loadingDescription: {
        fontSize: 13,
        color: "#888",
        marginTop: 4
    }

});


