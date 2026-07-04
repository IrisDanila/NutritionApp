import React, {useEffect, useState} from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Pressable,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {classifyFood, Prediction} from '../services/onnx/foodModel';
import {isModelBundled, FOOD_MODEL_ASSET} from '../services/onnx/modelManager';
import {searchFoods, FoodItem} from '../services/usda';
import {RootStackParamList} from '../navigation/types';
import {MealType} from '../store/types';
import {useAppStore} from '../store/useAppStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function mealForNow(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export const FoodRecognitionScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const aiEnabled = useAppStore(s => s.settings.enableAIScanner);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState<boolean | null>(null);

  useEffect(() => {
    isModelBundled(FOOD_MODEL_ASSET).then(setModelReady);
  }, []);

  const pick = async (from: 'camera' | 'library') => {
    setError(null);

    // CAMERA is declared in the manifest, so Android requires it granted at
    // runtime before launchCamera will work.
    if (from === 'camera') {
      const granted = await ensureCameraPermission();
      if (!granted) {
        setError(
          'Camera permission is needed to scan food. Enable it for NutriLife in Settings → Apps.',
        );
        return;
      }
    }

    const opts = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.85 as const,
    };
    const res =
      from === 'camera'
        ? await launchCamera(opts)
        : await launchImageLibrary(opts);
    if (res.didCancel) return;
    if (res.errorCode) {
      setError(res.errorMessage || 'Could not open the camera/gallery.');
      return;
    }
    const a = res.assets?.[0];
    if (!a?.base64) {
      setError('No image data returned.');
      return;
    }
    setAsset(a);
    setPredictions([]);
    analyze(a.base64);
  };

  const analyze = async (base64: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const preds = await classifyFood(base64, 5);
      setPredictions(preds);
    } catch (e: any) {
      setError(
        'Could not run the model. Make sure the food model is bundled in assets. ' +
          (e?.message ?? ''),
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const choose = async (p: Prediction) => {
    setFetchingId(p.index);
    setError(null);
    try {
      const results = await searchFoods(p.query, 5);
      const item: FoodItem =
        results[0] ?? syntheticItem(p.name);
      navigation.navigate('FoodDetail', {
        item,
        meal: mealForNow(),
        fromScan: true,
        confidence: p.probability,
        presetGrams: p.portionGrams,
      });
    } catch (e: any) {
      // Even if USDA fails, let the user log a best-effort estimate.
      navigation.navigate('FoodDetail', {
        item: syntheticItem(p.name),
        meal: mealForNow(),
        fromScan: true,
        confidence: p.probability,
        presetGrams: p.portionGrams,
      });
    } finally {
      setFetchingId(null);
    }
  };

  return (
    <Screen scroll>
      <Txt variant="h1">AI Food Scanner</Txt>
      <Txt tone="muted" style={{marginTop: 4, marginBottom: spacing.lg}}>
        Point your camera at a dish — recognition runs fully on-device.
      </Txt>

      {!aiEnabled ? (
        <Card>
          <EmptyState
            icon="camera-off"
            title="Scanner disabled"
            subtitle="Enable the AI scanner in Settings to use on-device food recognition."
          />
        </Card>
      ) : (
        <>
          <Card padded={false} style={{overflow: 'hidden'}}>
            <View
              style={{
                height: 240,
                backgroundColor: theme.bgSunken,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {asset?.uri ? (
                <Image
                  source={{uri: asset.uri}}
                  style={{width: '100%', height: '100%'}}
                  resizeMode="cover"
                />
              ) : (
                <View style={{alignItems: 'center'}}>
                  <Icon name="image-filter-center-focus" size={48} color={theme.textFaint} />
                  <Txt tone="faint" style={{marginTop: spacing.sm}}>
                    No image selected
                  </Txt>
                </View>
              )}
              {analyzing ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.overlay,
                  }}>
                  <ActivityIndicator color="#fff" size="large" />
                  <Txt color="#fff" style={{marginTop: spacing.sm}}>
                    Analyzing…
                  </Txt>
                </View>
              ) : null}
            </View>
            <View style={{flexDirection: 'row', gap: spacing.md, padding: spacing.lg}}>
              <Button
                title="Camera"
                icon="camera"
                onPress={() => pick('camera')}
                style={{flex: 1}}
              />
              <Button
                title="Gallery"
                icon="image-multiple"
                variant="secondary"
                onPress={() => pick('library')}
                style={{flex: 1}}
              />
            </View>
          </Card>

          {modelReady === false ? (
            <Card flat style={{marginTop: spacing.lg, backgroundColor: theme.accentSoft, borderColor: 'transparent'}}>
              <Txt variant="label" color={theme.accent}>
                MODEL NOT FOUND
              </Txt>
              <Txt style={{marginTop: 4}}>
                Run <Txt variant="mono">node scripts/copy-models.js</Txt> before
                building so the food model ships in the APK.
              </Txt>
            </Card>
          ) : null}

          {error ? (
            <Card style={{marginTop: spacing.lg, borderColor: theme.danger}}>
              <Txt tone="danger">{error}</Txt>
            </Card>
          ) : null}

          {predictions.length > 0 ? (
            <View style={{marginTop: spacing.xl}}>
              <Txt variant="h2" style={{marginBottom: spacing.md}}>
                What I see
              </Txt>
              {predictions.map((p, i) => (
                <Card
                  key={p.index}
                  style={{marginBottom: spacing.md}}
                  onPress={() => choose(p)}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        backgroundColor: i === 0 ? theme.primary : theme.bgSunken,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: spacing.md,
                      }}>
                      <Txt
                        variant="label"
                        color={i === 0 ? theme.textOnPrimary : theme.textMuted}>
                        {i + 1}
                      </Txt>
                    </View>
                    <View style={{flex: 1}}>
                      <Txt variant="h3">{p.name}</Txt>
                      <View
                        style={{
                          height: 6,
                          borderRadius: radius.pill,
                          backgroundColor: theme.bgSunken,
                          marginTop: 6,
                          overflow: 'hidden',
                        }}>
                        <View
                          style={{
                            width: `${Math.round(p.probability * 100)}%`,
                            height: '100%',
                            backgroundColor: theme.primary,
                          }}
                        />
                      </View>
                    </View>
                    <View style={{alignItems: 'flex-end', marginLeft: spacing.md}}>
                      <Txt variant="h3" tone="primary">
                        {Math.round(p.probability * 100)}%
                      </Txt>
                      {fetchingId === p.index ? (
                        <ActivityIndicator color={theme.primary} size="small" />
                      ) : (
                        <Icon name="chevron-right" size={20} color={theme.textFaint} />
                      )}
                    </View>
                  </View>
                </Card>
              ))}
              <Txt tone="faint" variant="caption" center style={{marginTop: spacing.sm}}>
                Tap a result to fetch its nutrition and log it.
              </Txt>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
};

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const already = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (already) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera access',
        message: 'NutriLife uses your camera to recognise food on your plate.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    // If permanently denied, send the user to the app settings.
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Linking.openSettings();
    }
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

function syntheticItem(name: string): FoodItem {
  // Rough generic estimate if USDA has no match (per 100 g).
  return {
    fdcId: -1,
    name,
    calories: 200,
    carbs: 20,
    protein: 8,
    fat: 9,
    dataType: 'estimate',
  };
}

export default FoodRecognitionScreen;
