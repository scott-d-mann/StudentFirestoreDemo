import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth, db } from '../firebaseConfig';


type Student = {
  id: string;
  name: string;
  studentNumber: string;
  email?: string;
  course?: string;
};

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Listen for students only if logged in
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'students'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const studentList = snapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
            name: data.name ?? '',
            studentNumber: data.studentNumber ?? '',
            email: data.email ?? '',
            course: data.course ?? '',
          };
        });
        setStudents(studentList);
      },
      (error) => {
        console.error('Error loading students:', error);
        Alert.alert('Error', 'Could not load students from Firestore.');
      }
    );
    return () => unsubscribe();
  }, [user]);
  // Auth handlers
  const handleRegister = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      Alert.alert('Validation', 'Email and password are required.');
      return;
    }
    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error: any) {
      Alert.alert('Registration Error', error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      Alert.alert('Validation', 'Email and password are required.');
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Logout Error', error.message);
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setName('');
    setStudentNumber('');
    setEmail('');
    setCourse('');
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name ?? '');
    setStudentNumber(student.studentNumber ?? '');
    setEmail(student.email ?? '');
    setCourse(student.course ?? '');
    setModalVisible(true);
  };

  const saveStudent = async () => {
    if (!name.trim() || !studentNumber.trim()) {
      Alert.alert('Validation', 'Name and student number are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      studentNumber: studentNumber.trim(),
      email: email.trim(),
      course: course.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingStudent) {
        const studentRef = doc(db, 'students', editingStudent.id);
        await updateDoc(studentRef, payload);
      } else {
        await addDoc(collection(db, 'students'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('Error', 'Could not save student.');
    }
  };

  const confirmDeleteStudent = (student: Student) => {
    Alert.alert(
      'Delete Student',
      `Delete ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'students', student.id));
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Error', 'Could not delete student.');
            }
          },
        },
      ]
    );
  };

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.card}>
      <Text style={styles.studentName}>{item.name}</Text>
      <Text style={styles.detail}>Student No: {item.studentNumber}</Text>
      <Text style={styles.detail}>Email: {item.email || '-'}</Text>
      <Text style={styles.detail}>Course: {item.course || '-'}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => confirmDeleteStudent(item)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user) {
    // Show login/register form
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Student Manager (Firestore)</Text>
          <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            {authMode === 'login' ? 'Login' : 'Register'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={authEmail}
            onChangeText={setAuthEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={authPassword}
            onChangeText={setAuthPassword}
            secureTextEntry
          />
          <View style={styles.row}>
            {authMode === 'login' ? (
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleLogin}
                disabled={authLoading}
              >
                <Text style={styles.buttonText}>{authLoading ? 'Logging in...' : 'Login'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleRegister}
                disabled={authLoading}
              >
                <Text style={styles.buttonText}>{authLoading ? 'Registering...' : 'Register'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              disabled={authLoading}
            >
              <Text style={styles.buttonText}>
                {authMode === 'login' ? 'Switch to Register' : 'Switch to Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main app UI if logged in
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Student Manager (Firestore)</Text>
        <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right' }}>
          Welcome, {user.email}
        </Text>
        <TouchableOpacity style={[styles.button, styles.cancelButton, { alignSelf: 'flex-end', marginBottom: 12 }]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.buttonText}>Add Student</Text>
        </TouchableOpacity>

        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderStudent}
          contentContainerStyle={
            students.length === 0 ? styles.emptyListContainer : styles.listContainer
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students yet. Add one.</Text>
          }
        />

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder="Student Number"
                value={studentNumber}
                onChangeText={setStudentNumber}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Course"
                value={course}
                onChangeText={setCourse}
              />

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={saveStudent}
                >
                  <Text style={styles.buttonText}>
                    {editingStudent ? 'Update' : 'Save'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 32,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  detail: {
    fontSize: 16,
    color: '#444',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#fbbf24',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
});

