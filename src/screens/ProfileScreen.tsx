import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {storageService, UserProfile} from '../services/storageService';

const ProfileScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState({
    totalCalories: 0,
    avgCalories: 0,
    totalWater: 0,
    totalSteps: 0,
    activeDays: 0,
  });

  useEffect(() => {
    loadProfile();
    calculateWeeklyStats();
  }, []);

  const loadProfile = async () => {
    const userProfile = await storageService.getUserProfile();
    setProfile(userProfile);
    setEditedProfile(userProfile);
  };

  const calculateWeeklyStats = async () => {
    const stats = {
      totalCalories: 0,
      avgCalories: 0,
      totalWater: 0,
      totalSteps: 0,
      activeDays: 0,
    };

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dailyData = await storageService.getDailyData(dateStr);

      if (dailyData.meals.length > 0 || dailyData.activities.length > 0) {
        stats.activeDays++;
      }

      const dayCalories = dailyData.meals.reduce((total, meal) => {
        return (
          total + meal.items.reduce((sum, item) => sum + item.calories, 0)
        );
      }, 0);

      stats.totalCalories += dayCalories;
      stats.totalWater += dailyData.waterIntake;
      stats.totalSteps += dailyData.steps;
    }

    stats.avgCalories = stats.activeDays > 0 ? stats.totalCalories / stats.activeDays : 0;
    setWeeklyStats(stats);
  };

  const handleSave = async () => {
    if (editedProfile) {
      await storageService.saveUserProfile(editedProfile);
      setProfile(editedProfile);
      setEditMode(false);
    }
  };

  const getBMI = () => {
    if (!profile) return '0';
    const heightInMeters = profile.height / 100;
    return (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = () => {
    const bmi = parseFloat(getBMI());
    if (bmi < 18.5) return {text: 'Underweight', color: '#FFA726'};
    if (bmi < 25) return {text: 'Normal', color: '#4CAF50'};
    if (bmi < 30) return {text: 'Overweight', color: '#FF9800'};
    return {text: 'Obese', color: '#F44336'};
  };

  const getGoalText = () => {
    if (!profile) return '';
    switch (profile.goal) {
      case 'lose':
        return 'Lose Weight';
      case 'maintain':
        return 'Maintain Weight';
      case 'gain':
        return 'Gain Weight';
      default:
        return '';
    }
  };

  if (!profile || !editedProfile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(true)}>
          <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getBMI()}</Text>
          <Text style={styles.statLabel}>BMI</Text>
          <Text style={[styles.statCategory, {color: getBMICategory().color}]}>
            {getBMICategory().text}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.weight}</Text>
          <Text style={styles.statLabel}>Weight (kg)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.height}</Text>
          <Text style={styles.statLabel}>Height (cm)</Text>
        </View>
      </View>

      {/* Goals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 My Goals</Text>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Current Goal</Text>
          <Text style={styles.goalValue}>{getGoalText()}</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Daily Calories</Text>
          <Text style={styles.goalValue}>{profile.targetCalories} cal</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Daily Water</Text>
          <Text style={styles.goalValue}>{profile.targetWater} ml</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Daily Steps</Text>
          <Text style={styles.goalValue}>{profile.targetSteps} steps</Text>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Weekly Progress</Text>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Active Days</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {width: `${(weeklyStats.activeDays / 7) * 100}%`},
              ]}
            />
          </View>
          <Text style={styles.progressValue}>
            {weeklyStats.activeDays} / 7 days
          </Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Average Calories</Text>
          <Text style={styles.progressValue}>
            {weeklyStats.avgCalories.toFixed(0)} cal/day
          </Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Total Water</Text>
          <Text style={styles.progressValue}>
            {(weeklyStats.totalWater / 1000).toFixed(1)} liters
          </Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Total Steps</Text>
          <Text style={styles.progressValue}>
            {weeklyStats.totalSteps.toLocaleString()} steps
          </Text>
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Personal Information</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Age</Text>
          <Text style={styles.infoValue}>{profile.age} years</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Weight</Text>
          <Text style={styles.infoValue}>{profile.weight} kg</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Height</Text>
          <Text style={styles.infoValue}>{profile.height} cm</Text>
        </View>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editMode}
        animationType="slide"
        onRequestClose={() => setEditMode(false)}>
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setEditMode(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.name}
              onChangeText={text =>
                setEditedProfile({...editedProfile, name: text})
              }
            />

            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.age.toString()}
              onChangeText={text =>
                setEditedProfile({...editedProfile, age: parseInt(text) || 0})
              }
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.weight.toString()}
              onChangeText={text =>
                setEditedProfile({
                  ...editedProfile,
                  weight: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.height.toString()}
              onChangeText={text =>
                setEditedProfile({
                  ...editedProfile,
                  height: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Goal</Text>
            <View style={styles.goalOptions}>
              {[
                {value: 'lose', label: 'Lose Weight'},
                {value: 'maintain', label: 'Maintain'},
                {value: 'gain', label: 'Gain Weight'},
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.goalOption,
                    editedProfile.goal === option.value &&
                      styles.goalOptionActive,
                  ]}
                  onPress={() =>
                    setEditedProfile({
                      ...editedProfile,
                      goal: option.value as 'lose' | 'maintain' | 'gain',
                    })
                  }>
                  <Text
                    style={[
                      styles.goalOptionText,
                      editedProfile.goal === option.value &&
                        styles.goalOptionTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Target Calories (cal/day)</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.targetCalories.toString()}
              onChangeText={text =>
                setEditedProfile({
                  ...editedProfile,
                  targetCalories: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Target Water (ml/day)</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.targetWater.toString()}
              onChangeText={text =>
                setEditedProfile({
                  ...editedProfile,
                  targetWater: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Target Steps (steps/day)</Text>
            <TextInput
              style={styles.input}
              value={editedProfile.targetSteps.toString()}
              onChangeText={text =>
                setEditedProfile({
                  ...editedProfile,
                  targetSteps: parseInt(text) || 0,
                })
              }
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statCategory: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressItem: {
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  goalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  goalOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  goalOptionText: {
    fontSize: 12,
    color: '#666',
  },
  goalOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
