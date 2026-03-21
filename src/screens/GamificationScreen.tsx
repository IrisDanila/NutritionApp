import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTheme} from '../theme/ThemeContext';
import {
  gamificationService,
  GamificationData,
  Quest,
} from '../services/gamificationService';

const GamificationScreen = () => {
  const {colors} = useTheme();
  const [gamData, setGamData] = useState<GamificationData | null>(null);
  const [xpProgress, setXpProgress] = useState({current: 0, required: 100, percentage: 0});

  useFocusEffect(
    React.useCallback(() => {
      loadGamificationData();
    }, []),
  );

  const loadGamificationData = async () => {
    await gamificationService.checkAndRefreshQuests();
    const data = await gamificationService.getGamificationData();
    setGamData(data);

    const progress = gamificationService.getXPProgress(data.xp, data.level);
    setXpProgress(progress);

    // Check for achievements
    await gamificationService.checkAchievements(data);
  };

  const handleRefreshQuests = () => {
    Alert.alert(
      'Weekly Quests',
      'Quests refresh automatically every Monday. Complete active quests to earn bonus XP!',
      [{text: 'Got it'}],
    );
  };

  if (!gamData) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Text style={[styles.loadingText, {color: colors.text}]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>
          Track your journey and unlock rewards
        </Text>
      </View>

      {/* Level Card */}
      <View style={[styles.levelCard, {backgroundColor: colors.card}]}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>LV</Text>
          <Text style={styles.levelNumber}>{gamData.level}</Text>
        </View>
        <View style={styles.levelInfo}>
          <View style={styles.levelHeader}>
            <Text style={[styles.levelTitle, {color: colors.text}]}>
              Level {gamData.level}
            </Text>
            <Text style={[styles.xpText, {color: colors.mutedText}]}>
              {xpProgress.current} / {xpProgress.required} XP
            </Text>
          </View>
          <View style={[styles.progressBarContainer, {backgroundColor: colors.surface}]}>
            <View
              style={[
                styles.progressBarFill,
                {backgroundColor: colors.primary, width: `${xpProgress.percentage}%`},
              ]}
            />
          </View>
          <Text style={[styles.nextLevelText, {color: colors.mutedText}]}>
            {xpProgress.required - xpProgress.current} XP to next level
          </Text>
        </View>
      </View>

      {/* Streak Card */}
      <View style={[styles.streakCard, {backgroundColor: colors.card}]}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakInfo}>
            <Text style={[styles.streakNumber, {color: colors.primary}]}>
              {gamData.streakData.currentStreak}
            </Text>
            <Text style={[styles.streakLabel, {color: colors.text}]}>Day Streak</Text>
          </View>
        </View>
        <View style={styles.streakStats}>
          <View style={styles.streakStat}>
            <Text style={[styles.streakStatLabel, {color: colors.mutedText}]}>
              Longest
            </Text>
            <Text style={[styles.streakStatValue, {color: colors.text}]}>
              {gamData.streakData.longestStreak}
            </Text>
          </View>
          <View style={styles.streakStat}>
            <Text style={[styles.streakStatLabel, {color: colors.mutedText}]}>
              Free Passes
            </Text>
            <Text style={[styles.streakStatValue, {color: colors.text}]}>
              {gamData.streakData.forgivenessPasses}
            </Text>
          </View>
        </View>
        <Text style={[styles.streakNote, {color: colors.mutedText}]}>
          💡 You get 1 free pass per week if you miss a day!
        </Text>
      </View>

      {/* Weekly Quests */}
      <View style={[styles.questsCard, {backgroundColor: colors.card}]}>
        <View style={styles.questsHeader}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            Weekly Quests
          </Text>
          <TouchableOpacity onPress={handleRefreshQuests}>
            <Text style={[styles.infoButton, {color: colors.primary}]}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        {gamData.activeQuests.length === 0 ? (
          <Text style={[styles.emptyText, {color: colors.mutedText}]}>
            No active quests. They refresh every Monday!
          </Text>
        ) : (
          gamData.activeQuests.map(quest => (
            <QuestItem key={quest.id} quest={quest} colors={colors} />
          ))
        )}
      </View>

      {/* Achievements */}
      {gamData.achievements.length > 0 && (
        <View style={[styles.achievementsCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            Achievements
          </Text>
          <View style={styles.achievementsList}>
            {gamData.achievements.slice(0, 6).map(achievement => (
              <View key={achievement.id} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[styles.achievementName, {color: colors.text}]}>
                  {achievement.name}
                </Text>
                <Text style={[styles.achievementDesc, {color: colors.mutedText}]}>
                  {achievement.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stats Summary */}
      <View style={[styles.statsCard, {backgroundColor: colors.card}]}>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.primary}]}>
              {gamData.xp}
            </Text>
            <Text style={[styles.statLabel, {color: colors.mutedText}]}>
              Total XP
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.primary}]}>
              {gamData.completedQuests.length}
            </Text>
            <Text style={[styles.statLabel, {color: colors.mutedText}]}>
              Quests Done
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.primary}]}>
              {gamData.achievements.length}
            </Text>
            <Text style={[styles.statLabel, {color: colors.mutedText}]}>
              Achievements
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Quest Item Component
const QuestItem = ({quest, colors}: {quest: Quest; colors: any}) => {
  const progressPercentage = (quest.current / quest.target) * 100;

  return (
    <View style={[styles.questItem, quest.completed && styles.questItemCompleted]}>
      <View style={styles.questHeader}>
        <Text style={[styles.questName, {color: colors.text}]}>
          {quest.completed ? '✅ ' : ''}{quest.name}
        </Text>
        <View style={[styles.xpBadge, {backgroundColor: colors.surface}]}>
          <Text style={[styles.xpBadgeText, {color: colors.primary}]}>
            +{quest.xpReward} XP
          </Text>
        </View>
      </View>
      <Text style={[styles.questDesc, {color: colors.mutedText}]}>
        {quest.description}
      </Text>
      <View style={styles.questProgress}>
        <View style={[styles.questProgressBar, {backgroundColor: colors.surface}]}>
          <View
            style={[
              styles.questProgressFill,
              {
                backgroundColor: quest.completed ? '#4CAF50' : colors.primary,
                width: `${Math.min(progressPercentage, 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.questProgressText, {color: colors.mutedText}]}>
          {quest.current} / {quest.target}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  levelCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  levelNumber: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  levelInfo: {
    flex: 1,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpText: {
    fontSize: 12,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 11,
  },
  streakCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  streakStat: {
    alignItems: 'center',
  },
  streakStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  streakStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  streakNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  questsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoButton: {
    fontSize: 20,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  questItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  questItemCompleted: {
    opacity: 0.7,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  questDesc: {
    fontSize: 13,
    marginBottom: 10,
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questProgressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  achievementsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementsList: {
    marginTop: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  achievementName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  achievementDesc: {
    fontSize: 11,
    marginLeft: 44,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default GamificationScreen;
