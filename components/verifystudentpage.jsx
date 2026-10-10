
import React, { useCallback, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// =====================================================
// SAME BACKEND FOR ANDROID AND WEB
// =====================================================

const BASE_URL = "http://10.162.135.224:5001";

export default function VerifyStudents({ navigation }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [verifyingStudentId, setVerifyingStudentId] =
    useState(null);

  const [visibleImages, setVisibleImages] = useState({});
  const [failedImages, setFailedImages] = useState({});

  // Cross-platform confirmation dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ===================================================
  // SHOW MESSAGE
  // ===================================================

  const showMessage = (title, message) => {
    Alert.alert(title, message);
  };

  // ===================================================
  // SESSION EXPIRED
  // ===================================================

  const handleSessionExpired = () => {
    showMessage(
      "Session Expired",
      "Please login again."
    );

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }]
    });
  };

  // ===================================================
  // FETCH UNVERIFIED STUDENTS
  // ===================================================

  const fetchStudents = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const token = await AsyncStorage.getItem(
          "adminToken"
        );

        if (!token) {
          handleSessionExpired();
          return;
        }

        const response = await fetch(
          `${BASE_URL}/admin/getverificationdata`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.msg || "Unable to fetch students"
          );
        }

        const studentData = Array.isArray(result?.data)
          ? result.data
          : [];

        setStudents(studentData);
        setFailedImages({});
      } catch (error) {
        console.log("Fetch students error:", error);

        showMessage(
          "Error",
          error?.message || "Unable to fetch students"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigation]
  );

  // ===================================================
  // FETCH WHEN SCREEN GETS FOCUS
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      fetchStudents(true);
    }, [fetchStudents])
  );

  // ===================================================
  // PULL TO REFRESH
  // ===================================================

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents(false);
  };

  // ===================================================
  // TOGGLE DOCUMENTS
  // ===================================================

  const toggleImages = (studentId) => {
    setVisibleImages((previous) => ({
      ...previous,
      [studentId]: !previous[studentId]
    }));
  };

  // ===================================================
  // OPEN VERIFICATION DIALOG
  // ===================================================

  const confirmVerification = (student) => {
    setSelectedStudent(student);
    setDialogVisible(true);
  };

  // ===================================================
  // VERIFY STUDENT
  // ===================================================

  const verifyStudent = async (student) => {
    if (!student?._id) {
      showMessage(
        "Error",
        "Student ID is missing."
      );
      return;
    }

    if (verifyingStudentId !== null) {
      return;
    }

    const studentId = String(student._id);

    setDialogVisible(false);
    setVerifyingStudentId(studentId);

    try {
      const token = await AsyncStorage.getItem(
        "adminToken"
      );

      if (!token) {
        handleSessionExpired();
        return;
      }

      const response = await fetch(
        `${BASE_URL}/admin/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token: token,
            studentId: student._id,

            RollNo: student.RollNO || null,
            email: student.email || null,
            MobileNo: student.MobileNo || null,
            Name: student.Name || null,
            branch: student.branch || null,
            batch: student.batch || null,

            url: student.url || null,
            urlAadhar: student.urlAadhar || null
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.msg || "Unable to verify student"
        );
      }

      showMessage(
        "Success",
        `${student.Name || "Student"} verified successfully.`
      );

      await fetchStudents(false);
    } catch (error) {
      console.log("Verify student error:", error);

      showMessage(
        "Error",
        error?.message || "Unable to verify student"
      );
    } finally {
      setVerifyingStudentId(null);
    }
  };

  // ===================================================
  // SEARCH STUDENTS
  // ===================================================

  const searchValue = search.toLowerCase().trim();

  const filteredStudents = students.filter((student) => {
    if (!searchValue) {
      return true;
    }

    const fields = [
      student?.Name,
      student?.RollNO,
      student?.MobileNo,
      student?.email,
      student?.batch,
      student?.branch
    ];

    return fields.some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(searchValue)
    );
  });

  // ===================================================
  // IMAGE ERROR HANDLING
  // ===================================================

  const handleImageError = (studentId, imageType) => {
    setFailedImages((previous) => ({
      ...previous,
      [`${studentId}-${imageType}`]: true
    }));
  };

  // ===================================================
  // RENDER STUDENT CARD
  // ===================================================

  const renderStudent = ({ item }) => {
    const studentId = String(item?._id || "");

    const isVerifying =
      verifyingStudentId === studentId;

    const imagesVisible =
      visibleImages[studentId] === true;

    const isOutsider =
      String(item?.batch || "").toLowerCase() ===
      "outsider";

    const photoFailed =
      failedImages[`${studentId}-photo`] === true;

    const aadhaarFailed =
      failedImages[`${studentId}-aadhaar`] === true;

    return (
      <View style={styles.card}>
        {/* STUDENT INFORMATION */}

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {item?.Name || "Unknown Student"}
          </Text>

          {!isOutsider && (
            <>
              <Text style={styles.detail}>
                Roll No: {item?.RollNO || "N/A"}
              </Text>

              <Text style={styles.detail}>
                Branch: {item?.branch || "N/A"}
              </Text>
            </>
          )}

          <Text style={styles.detail}>
            Batch: {item?.batch || "N/A"}
          </Text>

          {isOutsider && (
            <View style={styles.outsiderBadge}>
              <Text style={styles.outsiderText}>
                OUTSIDER
              </Text>
            </View>
          )}

          <Text style={styles.detail}>
            Mobile: {item?.MobileNo || "N/A"}
          </Text>

          <Text style={styles.detail}>
            Email: {item?.email || "N/A"}
          </Text>

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              ⚠ Unverified
            </Text>
          </View>
        </View>

        {/* DOCUMENT BUTTON */}

        <TouchableOpacity
          style={styles.documentButton}
          onPress={() => toggleImages(studentId)}
          activeOpacity={0.8}
        >
          <Text style={styles.documentButtonText}>
            {imagesVisible
              ? "Hide Documents"
              : "View Documents"}
          </Text>
        </TouchableOpacity>

        {/* DOCUMENT IMAGES */}

        {imagesVisible && (
          <View style={styles.imageSection}>
            <Text style={styles.imageTitle}>
              Student Photo
            </Text>

            {item?.url && !photoFailed ? (
              <Image
                source={{ uri: item.url }}
                style={styles.studentImage}
                resizeMode="cover"
                onError={() =>
                  handleImageError(studentId, "photo")
                }
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>
                  {item?.url
                    ? "Unable to load student photo"
                    : "No student photo available"}
                </Text>
              </View>
            )}

            <Text style={styles.imageTitle}>
              Aadhaar Document
            </Text>

            {item?.urlAadhar && !aadhaarFailed ? (
              <Image
                source={{ uri: item.urlAadhar }}
                style={styles.aadharImage}
                resizeMode="contain"
                onError={() =>
                  handleImageError(studentId, "aadhaar")
                }
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>
                  {item?.urlAadhar
                    ? "Unable to load Aadhaar document"
                    : "No Aadhaar image available"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* VERIFY BUTTON */}

        <TouchableOpacity
          style={[
            styles.verifyButton,
            isVerifying && styles.disabledButton
          ]}
          disabled={isVerifying}
          onPress={() => confirmVerification(item)}
          activeOpacity={0.8}
        >
          {isVerifying ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.verifyText}>
              Verify Student
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ===================================================
  // INITIAL LOADING
  // ===================================================

  if (loading && students.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#B64216"
        />

        <Text style={styles.loadingText}>
          Loading students...
        </Text>
      </View>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            Verify Students
          </Text>

          <Text style={styles.subtitle}>
            {students.length} unverified{" "}
            {students.length === 1 ? "student" : "students"}
          </Text>
        </View>

        <TouchableOpacity
  style={styles.backButton}
  onPress={() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("adminhome");
    }
  }}
  activeOpacity={0.7}
>
  <Text style={styles.backText}>← Back</Text>
</TouchableOpacity>
      </View>

      {/* SEARCH */}

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, roll no, mobile, email, batch or branch"
        placeholderTextColor="#999999"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* STUDENT LIST */}

      <FlatList
        data={filteredStudents}
        keyExtractor={(item, index) =>
          String(item?._id || `student-${index}`)
        }
        renderItem={renderStudent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B64216"
            colors={["#B64216"]}
          />
        }
        contentContainerStyle={
          filteredStudents.length === 0
            ? styles.emptyContainer
            : styles.listContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>
              {search ? "🔎" : "✅"}
            </Text>

            <Text style={styles.emptyTitle}>
              {search
                ? "No matching students"
                : "No unverified students"}
            </Text>

            <Text style={styles.emptySubtitle}>
              {search
                ? "Try a different search term."
                : "All students are currently verified."}
            </Text>
          </View>
        }
      />

      {/* CROSS-PLATFORM CONFIRMATION MODAL */}

      <Modal
        visible={dialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Verify Student
            </Text>

            <Text style={styles.modalMessage}>
              Are you sure you want to verify{" "}
              {selectedStudent?.Name || "this student"}?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setDialogVisible(false);
                  setSelectedStudent(null);
                }}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  const student = selectedStudent;
                  setSelectedStudent(null);

                  if (student) {
                    verifyStudent(student);
                  } else {
                    setDialogVisible(false);
                  }
                }}
              >
                <Text style={styles.confirmText}>
                  Verify
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 20,
    paddingTop: 20
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center"
  },

  loadingText: {
    marginTop: 10,
    color: "#777777",
    fontSize: 14
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  headerContent: {
    flex: 1,
    marginRight: 10
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#292929"
  },

  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4
  },

  backButton: {
    padding: 8
  },

  backText: {
    color: "#B64216",
    fontSize: 14,
    fontWeight: "700"
  },

  searchInput: {
    minHeight: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#292929",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#F0E6DE",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },

  listContainer: {
    paddingBottom: 30
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center"
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 13,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },

  studentInfo: {
    marginBottom: 15
  },

  studentName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#292929",
    marginBottom: 8
  },

  detail: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 4
  },

  outsiderBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EDE7F6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 7
  },

  outsiderText: {
    color: "#6A1B9A",
    fontSize: 11,
    fontWeight: "800"
  },

  statusContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1DD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8
  },

  statusText: {
    color: "#C47700",
    fontSize: 12,
    fontWeight: "700"
  },

  documentButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#F3E8E1",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12
  },

  documentButtonText: {
    color: "#B64216",
    fontSize: 14,
    fontWeight: "800"
  },

  imageSection: {
    marginBottom: 15
  },

  imageTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#292929",
    marginBottom: 8,
    marginTop: 5
  },

  studentImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    marginBottom: 15
  },

  aadharImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    marginBottom: 5
  },

  noImage: {
    minHeight: 100,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginBottom: 15
  },

  noImageText: {
    color: "#888888",
    fontSize: 13,
    textAlign: "center"
  },

  verifyButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#B64216",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10
  },

  disabledButton: {
    opacity: 0.65
  },

  verifyText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
  },

  emptyView: {
    alignItems: "center",
    paddingHorizontal: 20
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 12
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#292929",
    textAlign: "center"
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 6,
    textAlign: "center"
  },

  // CONFIRMATION MODAL

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    elevation: 8
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#292929",
    marginBottom: 12
  },

  modalMessage: {
    fontSize: 15,
    color: "#666666",
    lineHeight: 23,
    marginBottom: 24
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10
  },

  cancelButton: {
    minHeight: 42,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F2F2F2"
  },

  cancelText: {
    color: "#555555",
    fontSize: 14,
    fontWeight: "700"
  },

  confirmButton: {
    minHeight: 42,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#B64216"
  },

  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
  }
});
