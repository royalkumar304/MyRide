import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { VehicleCategory, FuelType, TransmissionType, Vehicle } from '../../types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { addHostVehicle, createHostVehicleThunk } from '../../store/slices/hostSlice';
import { setVehicles } from '../../store/slices/vehicleSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'AddVehicleWizard'>;

export const AddVehicleWizardScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { vehicles } = useAppSelector((state) => state.vehicles);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Step 1: Category
  const [category, setCategory] = useState<VehicleCategory>('car');

  // Step 2: Details
  const [brand, setBrand] = useState('Maruti Suzuki');
  const [model, setModel] = useState('Swift');
  const [variant, setVariant] = useState('ZXi');
  const [year, setYear] = useState('2023');
  const [regNumber, setRegNumber] = useState('UP 32 MN 7712');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [transmission, setTransmission] = useState<TransmissionType>('Manual');
  const [seatingCapacity, setSeatingCapacity] = useState('5');

  // Step 3: Pricing
  const [pricePerDay, setPricePerDay] = useState('1299');
  const [pricePerHour, setPricePerHour] = useState('140');
  const [securityDeposit, setSecurityDeposit] = useState('2000');
  const [deliveryFee, setDeliveryFee] = useState('200');

  // Step 4: Photos checklist
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80',
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80',
  ]);

  // Step 5: Documents
  const [rcUploaded, setRcUploaded] = useState(true);
  const [insuranceUploaded, setInsuranceUploaded] = useState(true);
  const [pucUploaded, setPucUploaded] = useState(true);

  // Step 6: Availability
  const [pickupHours, setPickupHours] = useState('08:00 AM - 09:00 PM');

  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep((prev) => (prev + 1) as any);
    } else {
      handleSubmitListing();
    }
  };

  const handleSubmitListing = async () => {
    // 1. Form Validation
    const cleanReg = (regNumber || '').trim().toUpperCase();
    if (!cleanReg || cleanReg.length < 6) {
      Alert.alert('Validation Error', 'Please enter a valid vehicle registration number (e.g. UP 32 AB 1234).');
      setCurrentStep(2);
      return;
    }

    const cleanDailyRate = parseInt(pricePerDay, 10);
    if (isNaN(cleanDailyRate) || cleanDailyRate < 100) {
      Alert.alert('Validation Error', 'Please set a valid daily rental price of at least ₹100.');
      setCurrentStep(3);
      return;
    }

    const cleanDeposit = parseInt(securityDeposit, 10);
    if (isNaN(cleanDeposit) || cleanDeposit < 0) {
      Alert.alert('Validation Error', 'Please specify a valid security deposit.');
      setCurrentStep(3);
      return;
    }

    const backendType: 'BIKE' | 'SCOOTER' | 'CAR' | 'SUV' | 'EV' =
      category === 'bike' ? 'BIKE' : category === 'suv' ? 'SUV' : category === 'ev' ? 'EV' : 'CAR';

    const validImages = photos && photos.length > 0
      ? photos
      : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80'];

    const vehiclePayload = {
      type: backendType,
      brand: brand.trim() || 'Hyundai',
      model: model.trim() || 'i20',
      variant: variant?.trim() || 'Sportz',
      year: parseInt(year, 10) || 2023,
      registrationNumber: cleanReg,
      fuelType: (fuelType as any) || 'Petrol',
      transmission: (transmission as any) || 'Manual',
      seats: parseInt(seatingCapacity, 10) || 5,
      dailyRate: cleanDailyRate,
      securityDeposit: cleanDeposit,
      deliveryFee: parseInt(deliveryFee, 10) || 150,
      city: user?.city || 'Lucknow',
      area: 'Gomti Nagar',
      images: validImages,
      features: ['Air Conditioning', 'Power Steering', 'Bluetooth Audio', 'Fastag', 'Clean Sanitized'],
    };

    setLoading(true);
    try {
      // 2. Dispatch to backend POST /host/vehicles -> backend validation -> MongoDB
      const createdVehicle = await dispatch(createHostVehicleThunk(vehiclePayload)).unwrap();

      // 3. Update vehicles catalog in Redux
      dispatch(setVehicles([createdVehicle, ...vehicles]));

      Alert.alert(
        'Listing Submitted! 🎉',
        'Your vehicle has been successfully recorded in the backend database and submitted for admin document verification.',
        [
          {
            text: 'Go to Dashboard',
            onPress: () => navigation.replace('HostMain'),
          },
        ]
      );
    } catch (err: any) {
      console.warn('[AddVehicleWizard] Backend vehicle creation failed:', err);
      Alert.alert(
        'Listing Submission Failed',
        typeof err === 'string' ? err : (err?.message || 'Failed to submit vehicle listing to server. Please verify fields and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={`List Vehicle (Step ${currentStep}/7)`}
        onBack={() => {
          if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as any);
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Type */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.stepTitle}>Step 1: Vehicle Type</Text>
            <Text style={styles.stepSub}>Select the category that best describes your vehicle.</Text>

            {(['car', 'bike', 'suv', 'ev'] as VehicleCategory[]).map((cat) => (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setCategory(cat)}
                style={[styles.catCard, category === cat && styles.catCardActive]}
              >
                <Ionicons
                  name={
                    cat === 'bike'
                      ? 'bicycle'
                      : cat === 'ev'
                      ? 'flash'
                      : cat === 'suv'
                      ? 'car-sport'
                      : 'car'
                  }
                  size={26}
                  color={category === cat ? colors.primary : colors.muted}
                />
                <View style={{ marginLeft: 14 }}>
                  <Text style={[styles.catTitle, category === cat && styles.catTitleActive]}>
                    {cat.toUpperCase()}
                  </Text>
                  <Text style={styles.catDesc}>
                    {cat === 'bike'
                      ? 'Scooters and motorcycles (12% commission)'
                      : cat === 'ev'
                      ? 'Electric vehicles with zero emissions (10% commission)'
                      : 'Self-drive personal mobility (15% commission)'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 2: Details */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.stepTitle}>Step 2: Vehicle Specifications</Text>
            <Text style={styles.stepSub}>Enter accurate registration and model details.</Text>

            <Input label="Brand" value={brand} onChangeText={setBrand} placeholder="e.g. Maruti, Honda" />
            <Input label="Model" value={model} onChangeText={setModel} placeholder="e.g. Swift, City" />
            <Input label="Variant" value={variant} onChangeText={setVariant} placeholder="e.g. ZXi, VXi" />
            <Input label="Year of Manufacture" value={year} onChangeText={setYear} keyboardType="numeric" />
            <Input label="Registration Number (Plate)" value={regNumber} onChangeText={setRegNumber} />

            <Text style={styles.label}>Fuel Type</Text>
            <View style={styles.pillsRow}>
              {(['Petrol', 'Diesel', 'Electric', 'CNG'] as FuelType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFuelType(f)}
                  style={[styles.pill, fuelType === f && styles.pillActive]}
                >
                  <Text style={[styles.pillText, fuelType === f && styles.pillTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Transmission</Text>
            <View style={styles.pillsRow}>
              {(['Manual', 'Automatic'] as TransmissionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTransmission(t)}
                  style={[styles.pill, transmission === t && styles.pillActive]}
                >
                  <Text style={[styles.pillText, transmission === t && styles.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Seating Capacity"
              value={seatingCapacity}
              onChangeText={setSeatingCapacity}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* STEP 3: Pricing */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.stepTitle}>Step 3: Rental Pricing</Text>
            <Text style={styles.stepSub}>Set competitive pricing for your city.</Text>

            <Input
              label="Price per Day (₹)"
              value={pricePerDay}
              onChangeText={setPricePerDay}
              keyboardType="numeric"
              prefixText="₹"
            />

            <Input
              label="Price per Hour (Optional ₹)"
              value={pricePerHour}
              onChangeText={setPricePerHour}
              keyboardType="numeric"
              prefixText="₹"
            />

            <Input
              label="Refundable Security Deposit (₹)"
              value={securityDeposit}
              onChangeText={setSecurityDeposit}
              keyboardType="numeric"
              prefixText="₹"
            />

            <Input
              label="Doorstep Delivery Fee (Optional ₹)"
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              keyboardType="numeric"
              prefixText="₹"
            />
          </View>
        )}

        {/* STEP 4: Photos */}
        {currentStep === 4 && (
          <View>
            <Text style={styles.stepTitle}>Step 4: Vehicle Photos</Text>
            <Text style={styles.stepSub}>
              Upload 7 mandatory angles: Front, Back, Left, Right, Interior, Dashboard, Odometer.
            </Text>

            <View style={styles.photosGrid}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoBox}>
                  <Image source={{ uri }} style={styles.uploadedPhoto} />
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setPhotos([
                    ...photos,
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
                  ]);
                }}
                style={styles.addPhotoBtn}
              >
                <Ionicons name="camera" size={28} color={colors.primary} />
                <Text style={styles.addPhotoBtnText}>+ Add Angle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: Documents */}
        {currentStep === 5 && (
          <View>
            <Text style={styles.stepTitle}>Step 5: Document Uploads</Text>
            <Text style={styles.stepSub}>Government & RTO compliance verification.</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRcUploaded(!rcUploaded)}
              style={styles.docRow}
            >
              <Ionicons
                name={rcUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={24}
                color={rcUploaded ? colors.success : colors.primary}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.docTitle}>Registration Certificate (RC)</Text>
                <Text style={styles.docSub}>{rcUploaded ? 'Uploaded (Verified format)' : 'Tap to upload'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setInsuranceUploaded(!insuranceUploaded)}
              style={styles.docRow}
            >
              <Ionicons
                name={insuranceUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={24}
                color={insuranceUploaded ? colors.success : colors.primary}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.docTitle}>Valid Commercial/Comprehensive Insurance</Text>
                <Text style={styles.docSub}>{insuranceUploaded ? 'Uploaded' : 'Tap to upload'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPucUploaded(!pucUploaded)}
              style={styles.docRow}
            >
              <Ionicons
                name={pucUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={24}
                color={pucUploaded ? colors.success : colors.primary}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.docTitle}>Pollution Under Control (PUC) Certificate</Text>
                <Text style={styles.docSub}>{pucUploaded ? 'Uploaded' : 'Tap to upload'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 6: Availability */}
        {currentStep === 6 && (
          <View>
            <Text style={styles.stepTitle}>Step 6: Availability & Timings</Text>
            <Text style={styles.stepSub}>Set the days and hours customers can pick up the vehicle.</Text>

            <Input
              label="Pickup & Handover Operating Hours"
              value={pickupHours}
              onChangeText={setPickupHours}
            />

            <View style={styles.availNotice}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.availNoticeText}>
                Your vehicle will be active 7 days a week by default. You can block specific dates anytime from your host calendar.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 7: Preview */}
        {currentStep === 7 && (
          <View>
            <Text style={styles.stepTitle}>Step 7: Preview Listing</Text>
            <Text style={styles.stepSub}>Review all details before sending to verification.</Text>

            <View style={styles.previewCard}>
              <Image source={{ uri: photos[0] }} style={styles.previewImage} />
              <View style={styles.previewDetails}>
                <Text style={styles.previewName}>{brand} {model} {variant}</Text>
                <Text style={styles.previewPlate}>{regNumber} • {year}</Text>
                <Text style={styles.previewRate}>₹{pricePerDay}/day • Deposit: ₹{securityDeposit}</Text>
                <Text style={styles.previewSpecs}>
                  {transmission} • {fuelType} • {seatingCapacity} Seats
                </Text>
              </View>
            </View>

            <View style={styles.commissionExplainer}>
              <Text style={styles.explainerTitle}>Commission Transparency</Text>
              <Text style={styles.explainerBody}>
                You will receive 85% of all rental fares directly into your linked bank account. MyRide retains 15% platform commission to cover customer acquisition, verified KYC, insurance support, and 24/7 RSA.
              </Text>
            </View>
          </View>
        )}

        <Button
          title={currentStep === 7 ? 'Submit for Verification' : 'Continue to Next Step'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          loading={loading}
          style={styles.actionBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  stepSub: {
    ...typography.caption,
    color: colors.body,
    marginTop: 4,
    marginBottom: 16,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  catCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '40',
  },
  catTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  catTitleActive: {
    color: colors.primaryDark,
  },
  catDesc: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
    maxWidth: 260,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.darkMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: colors.darkMuted,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.primary,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoBox: {
    width: 100,
    height: 85,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: 10,
    marginBottom: 10,
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
  },
  addPhotoBtn: {
    width: 100,
    height: 85,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  addPhotoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  docTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  docSub: {
    fontSize: 11,
    color: colors.body,
    marginTop: 2,
  },
  availNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 14,
    borderRadius: borderRadius.md,
    marginTop: 10,
  },
  availNoticeText: {
    ...typography.body,
    color: colors.primaryDark,
    marginLeft: 10,
    flex: 1,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 160,
  },
  previewDetails: {
    padding: 14,
  },
  previewName: {
    ...typography.h3,
    color: colors.dark,
  },
  previewPlate: {
    fontSize: 12,
    color: colors.darkMuted,
    marginTop: 2,
  },
  previewRate: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
  },
  previewSpecs: {
    ...typography.caption,
    color: colors.body,
    marginTop: 4,
  },
  commissionExplainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  explainerTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 6,
  },
  explainerBody: {
    ...typography.caption,
    color: colors.body,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 10,
  },
});

export default AddVehicleWizardScreen;
